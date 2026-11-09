-- NPF Annotator · Supabase schema
-- Run once in Supabase → SQL Editor. Safe to run again (idempotent).
-- Blind coding is enforced here, in the database: a coder can read other
-- coders' submissions for an article only after submitting their own.

-- ---------------------------------------------------------------- tables
create table if not exists public.members (
  email      text primary key check (email = lower(email)),
  coder      text,
  role       text not null default 'coder' check (role in ('lead', 'coder')),
  user_id    uuid unique references auth.users(id) on delete set null,
  added_at   timestamptz not null default now()
);

create table if not exists public.articles (
  key        text primary key,
  id         text not null,
  dataset    text not null default '2',
  url        text not null default '',
  title      text not null default '',
  body       text not null,
  ebene      text not null default '',
  coders     text[] not null default '{}',
  sort       bigint not null default 0,
  added_at   timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.drafts (
  user_id     uuid not null references auth.users(id) on delete cascade,
  article_key text not null references public.articles(key) on delete cascade,
  data        jsonb not null,
  updated_at  timestamptz not null default now(),
  primary key (user_id, article_key)
);

create table if not exists public.submissions (
  user_id            uuid not null references auth.users(id) on delete cascade,
  article_key        text not null references public.articles(key) on delete cascade,
  coder              text,
  data               jsonb not null,
  first_data         jsonb,
  submitted_at       timestamptz not null default now(),
  first_submitted_at timestamptz not null default now(),
  revisions          int not null default 0,
  primary key (user_id, article_key)
);

-- every submission ever made, for the audit trail
create table if not exists public.submission_history (
  id           bigserial primary key,
  user_id      uuid,
  article_key  text,
  coder        text,
  data         jsonb,
  submitted_at timestamptz not null default now()
);

create table if not exists public.finals (
  article_key text primary key references public.articles(key) on delete cascade,
  data        jsonb not null default '{}'::jsonb,
  updated_by  uuid,
  updated_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------- helpers
create or replace function public.current_email() returns text
language sql stable set search_path = public as $$ select lower(coalesce(auth.jwt() ->> 'email', '')) $$;

create or replace function public.is_member() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from members where email = current_email())
$$;

create or replace function public.is_lead() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from members where email = current_email() and role = 'lead')
$$;

create or replace function public.has_submitted(k text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from submissions where article_key = k and user_id = auth.uid())
$$;

-- links the signed-in account to its team entry and returns it (null fields = not on the team)
create or replace function public.claim_membership() returns public.members
language plpgsql security definer set search_path = public as $$
declare m members;
begin
  if auth.uid() is null then return null; end if;
  update members set user_id = auth.uid() where email = current_email() returning * into m;
  return m;
end $$;

-- submissions: server sets coder, timestamps, first submission and revision count
create or replace function public.submissions_before() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null then
    new.user_id := auth.uid();
    new.coder := (select coder from members where user_id = auth.uid());
  end if;
  new.submitted_at := now();
  if tg_op = 'INSERT' then
    new.first_data := new.data;
    new.first_submitted_at := now();
    new.revisions := 0;
  else
    new.first_data := old.first_data;
    new.first_submitted_at := old.first_submitted_at;
    new.revisions := old.revisions + 1;
  end if;
  return new;
end $$;

create or replace function public.submissions_after() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into submission_history (user_id, article_key, coder, data, submitted_at)
  values (new.user_id, new.article_key, new.coder, new.data, new.submitted_at);
  return null;
end $$;

drop trigger if exists submissions_before on public.submissions;
create trigger submissions_before before insert or update on public.submissions
  for each row execute function public.submissions_before();
drop trigger if exists submissions_after on public.submissions;
create trigger submissions_after after insert or update on public.submissions
  for each row execute function public.submissions_after();

-- ---------------------------------------------------------------- row level security
alter table public.members            enable row level security;
alter table public.articles           enable row level security;
alter table public.drafts             enable row level security;
alter table public.submissions        enable row level security;
alter table public.submission_history enable row level security;
alter table public.finals             enable row level security;

drop policy if exists members_read  on public.members;
drop policy if exists members_write on public.members;
create policy members_read  on public.members for select to authenticated using (is_member());
create policy members_write on public.members for all    to authenticated using (is_lead()) with check (is_lead());

drop policy if exists articles_read  on public.articles;
drop policy if exists articles_write on public.articles;
create policy articles_read  on public.articles for select to authenticated using (is_member());
create policy articles_write on public.articles for all    to authenticated using (is_lead()) with check (is_lead());

drop policy if exists drafts_own on public.drafts;
create policy drafts_own on public.drafts for all to authenticated
  using (user_id = auth.uid() and is_member()) with check (user_id = auth.uid() and is_member());

drop policy if exists subs_read   on public.submissions;
drop policy if exists subs_insert on public.submissions;
drop policy if exists subs_update on public.submissions;
drop policy if exists subs_delete on public.submissions;
create policy subs_read on public.submissions for select to authenticated
  using (is_member() and (user_id = auth.uid() or is_lead() or has_submitted(article_key)));
create policy subs_insert on public.submissions for insert to authenticated
  with check (user_id = auth.uid() and is_member());
create policy subs_update on public.submissions for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy subs_delete on public.submissions for delete to authenticated using (is_lead());

drop policy if exists history_read on public.submission_history;
create policy history_read on public.submission_history for select to authenticated
  using (user_id = auth.uid() or is_lead());

drop policy if exists finals_read  on public.finals;
drop policy if exists finals_write on public.finals;
create policy finals_read  on public.finals for select to authenticated using (is_member());
create policy finals_write on public.finals for all    to authenticated using (is_lead()) with check (is_lead());

revoke all on public.members, public.articles, public.drafts, public.submissions, public.submission_history, public.finals from anon;
revoke execute on function public.claim_membership() from anon;

-- ---------------------------------------------------------------- live updates
do $$
declare t text;
begin
  foreach t in array array['articles', 'submissions', 'finals', 'members'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------- first project lead
-- Replace the email if you sign in with a different address. Add everyone else in the app (Team).
insert into public.members (email, coder, role)
values ('wen@uni-trier.de', '2', 'lead')
on conflict (email) do update set role = 'lead';

-- ---------------------------------------------------------------- hardening (applied 2026-11-03)
revoke execute on function public.claim_membership(), public.has_submitted(text), public.is_lead(), public.is_member(), public.current_email(), public.submissions_before(), public.submissions_after() from public, anon;
revoke execute on function public.submissions_before(), public.submissions_after() from authenticated;
grant execute on function public.claim_membership(), public.has_submitted(text), public.is_lead(), public.is_member(), public.current_email() to authenticated;

create index if not exists drafts_article_key_idx on public.drafts(article_key);
create index if not exists submissions_article_key_idx on public.submissions(article_key);

-- one policy per action, auth calls evaluated once per query
drop policy if exists members_write on public.members;   drop policy if exists members_read on public.members;
drop policy if exists members_insert on public.members;  drop policy if exists members_update on public.members;  drop policy if exists members_delete on public.members;
create policy members_read   on public.members for select to authenticated using ((select is_member()));
create policy members_insert on public.members for insert to authenticated with check ((select is_lead()));
create policy members_update on public.members for update to authenticated using ((select is_lead())) with check ((select is_lead()));
create policy members_delete on public.members for delete to authenticated using ((select is_lead()));

drop policy if exists articles_write on public.articles;   drop policy if exists articles_read on public.articles;
drop policy if exists articles_insert on public.articles;  drop policy if exists articles_update on public.articles;  drop policy if exists articles_delete on public.articles;
create policy articles_read   on public.articles for select to authenticated using ((select is_member()));
create policy articles_insert on public.articles for insert to authenticated with check ((select is_lead()));
create policy articles_update on public.articles for update to authenticated using ((select is_lead())) with check ((select is_lead()));
create policy articles_delete on public.articles for delete to authenticated using ((select is_lead()));

drop policy if exists finals_write on public.finals;   drop policy if exists finals_read on public.finals;
drop policy if exists finals_insert on public.finals;  drop policy if exists finals_update on public.finals;  drop policy if exists finals_delete on public.finals;
create policy finals_read   on public.finals for select to authenticated using ((select is_member()));
create policy finals_insert on public.finals for insert to authenticated with check ((select is_lead()));
create policy finals_update on public.finals for update to authenticated using ((select is_lead())) with check ((select is_lead()));
create policy finals_delete on public.finals for delete to authenticated using ((select is_lead()));

drop policy if exists drafts_own on public.drafts;
create policy drafts_own on public.drafts for all to authenticated
  using (user_id = (select auth.uid()) and (select is_member())) with check (user_id = (select auth.uid()) and (select is_member()));

drop policy if exists subs_read on public.submissions;   drop policy if exists subs_insert on public.submissions;
drop policy if exists subs_update on public.submissions; drop policy if exists subs_delete on public.submissions;
create policy subs_read on public.submissions for select to authenticated
  using ((select is_member()) and (user_id = (select auth.uid()) or (select is_lead()) or has_submitted(article_key)));
create policy subs_insert on public.submissions for insert to authenticated with check (user_id = (select auth.uid()) and (select is_member()));
create policy subs_update on public.submissions for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy subs_delete on public.submissions for delete to authenticated using ((select is_lead()));

drop policy if exists history_read on public.submission_history;
create policy history_read on public.submission_history for select to authenticated using (user_id = (select auth.uid()) or (select is_lead()));

-- ================================================================ lead-only access, feedback, backups (2026-11-03)
-- coders see only their own work; comparison data is lead-only
drop policy if exists subs_read on public.submissions;
create policy subs_read on public.submissions for select to authenticated using (user_id = (select auth.uid()) or (select is_lead()));
drop policy if exists finals_read on public.finals;
create policy finals_read on public.finals for select to authenticated using ((select is_lead()));
drop policy if exists members_read on public.members;
create policy members_read on public.members for select to authenticated using (email = (select current_email()) or (select is_lead()));
revoke execute on function public.has_submitted(text) from authenticated;

-- codings can never disappear by deleting an article; archive instead
alter table public.articles add column if not exists archived boolean not null default false;
alter table public.submissions drop constraint if exists submissions_article_key_fkey;
alter table public.submissions add constraint submissions_article_key_fkey foreign key (article_key) references public.articles(key) on delete restrict;
alter table public.drafts drop constraint if exists drafts_article_key_fkey;
alter table public.drafts add constraint drafts_article_key_fkey foreign key (article_key) references public.articles(key) on delete restrict;

-- feedback and bug reports
create table if not exists public.feedback (
  id bigserial primary key, user_id uuid default auth.uid(), email text default public.current_email(), coder text,
  kind text not null default 'bug' check (kind in ('bug', 'idea', 'question')),
  message text not null check (length(message) between 1 and 5000),
  context jsonb not null default '{}'::jsonb, status text not null default 'open' check (status in ('open', 'done')),
  created_at timestamptz not null default now());
alter table public.feedback enable row level security;
drop policy if exists feedback_insert on public.feedback; drop policy if exists feedback_read on public.feedback;
drop policy if exists feedback_update on public.feedback; drop policy if exists feedback_delete on public.feedback;
create policy feedback_insert on public.feedback for insert to authenticated with check ((select is_member()) and user_id = (select auth.uid()));
create policy feedback_read on public.feedback for select to authenticated using (user_id = (select auth.uid()) or (select is_lead()));
create policy feedback_update on public.feedback for update to authenticated using ((select is_lead())) with check ((select is_lead()));
create policy feedback_delete on public.feedback for delete to authenticated using ((select is_lead()));
create index if not exists feedback_user_idx on public.feedback(user_id);
revoke all on public.feedback from anon;
create or replace function public.feedback_before() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null then new.user_id := auth.uid(); new.email := current_email(); new.coder := (select coder from members where user_id = auth.uid()); end if;
  return new;
end $$;
drop trigger if exists feedback_before on public.feedback;
create trigger feedback_before before insert on public.feedback for each row execute function public.feedback_before();
revoke execute on function public.feedback_before() from public, anon, authenticated;

-- work progress for the lead (status only, never the content of drafts)
create or replace function public.progress_overview()
returns table (user_id uuid, article_key text, status text, marks int, updated_at timestamptz)
language sql stable security definer set search_path = public as $$
  select d.user_id, d.article_key,
         case when s.user_id is not null and coalesce(d.data->>'status','') = 'submitted' then 'submitted'
              when s.user_id is not null then 'reopened' else 'draft' end,
         coalesce(jsonb_array_length(d.data->'anns'), 0), d.updated_at
  from drafts d left join submissions s on s.user_id = d.user_id and s.article_key = d.article_key
  where is_lead()
  union all
  select s.user_id, s.article_key, 'submitted', coalesce(jsonb_array_length(s.data->'anns'), 0), s.submitted_at
  from submissions s
  where is_lead() and not exists (select 1 from drafts d where d.user_id = s.user_id and d.article_key = s.article_key)
$$;
revoke execute on function public.progress_overview() from public, anon;
grant execute on function public.progress_overview() to authenticated;

-- bulk assignment (lead)
create or replace function public.set_assignments(assignments jsonb) returns int language plpgsql security definer set search_path = public as $$
declare n int;
begin
  if not is_lead() then raise exception 'Only the project lead can assign coders'; end if;
  update articles a set coders = array(select jsonb_array_elements_text(x.value)), updated_at = now() from jsonb_each(assignments) x where a.key = x.key;
  get diagnostics n = row_count; return n;
end $$;
revoke execute on function public.set_assignments(jsonb) from public, anon;
grant execute on function public.set_assignments(jsonb) to authenticated;

-- backups inside the database: nightly (codings, 30 days) and weekly (full incl. texts, last 6)
create table if not exists public.backups (id bigserial primary key, taken_at timestamptz not null default now(), kind text not null, bytes int, data jsonb not null);
alter table public.backups enable row level security;
drop policy if exists backups_read on public.backups;
create policy backups_read on public.backups for select to authenticated using ((select is_lead()));
revoke all on public.backups from anon;
create or replace function public.take_backup(full_copy boolean default false) returns bigint language plpgsql security definer set search_path = public as $$
declare d jsonb; new_id bigint;
begin
  if auth.uid() is not null and not is_lead() then raise exception 'Only the project lead can make backups'; end if;
  d := jsonb_build_object('taken_at', now(),
    'members', (select coalesce(jsonb_agg(to_jsonb(m)), '[]') from members m),
    'articles', (select coalesce(jsonb_agg(case when full_copy then to_jsonb(a) else to_jsonb(a) - 'body' end), '[]') from articles a),
    'submissions', (select coalesce(jsonb_agg(to_jsonb(s)), '[]') from submissions s),
    'drafts', (select coalesce(jsonb_agg(to_jsonb(x)), '[]') from drafts x),
    'finals', (select coalesce(jsonb_agg(to_jsonb(f)), '[]') from finals f),
    'feedback', (select coalesce(jsonb_agg(to_jsonb(b)), '[]') from feedback b));
  insert into backups (kind, bytes, data) values (case when full_copy then 'full' when auth.uid() is null then 'daily' else 'manual' end, octet_length(d::text), d) returning id into new_id;
  delete from backups where kind in ('daily', 'manual') and taken_at < now() - interval '30 days';
  delete from backups where kind = 'full' and id not in (select id from backups where kind = 'full' order by taken_at desc limit 6);
  return new_id;
end $$;
revoke execute on function public.take_backup(boolean) from public, anon;
grant execute on function public.take_backup(boolean) to authenticated;
create extension if not exists pg_cron;
select cron.unschedule(jobid) from cron.job where jobname in ('npf-daily-backup', 'npf-weekly-full-backup');
select cron.schedule('npf-daily-backup', '15 2 * * *', $$select public.take_backup(false)$$);
select cron.schedule('npf-weekly-full-backup', '45 2 * * 0', $$select public.take_backup(true)$$);
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'feedback') then
    alter publication supabase_realtime add table public.feedback;
  end if;
end $$;

-- ================================================================ article metadata (2026-11-03)
-- every extra column of an imported sheet (domain, author, publication date, …) is kept here
alter table public.articles add column if not exists meta jsonb not null default '{}'::jsonb;

-- ================================================================ due dates (2026-11-03)
alter table public.articles add column if not exists due date;

-- ================================================================ coders read only their assigned articles (2026-11-03)
create or replace function public.my_coder() returns text language sql stable security definer set search_path = public as $$
  select coder from members where email = current_email()
$$;
revoke execute on function public.my_coder() from public, anon;
grant execute on function public.my_coder() to authenticated;
drop policy if exists articles_read on public.articles;
create policy articles_read on public.articles for select to authenticated
  using ((select is_lead()) or ((select is_member()) and not archived and (select my_coder()) = any(coders)));

-- ================================================================ private settings, e.g. the codebook (2026-11-03)
-- the codebook text is not part of the public code; it lives here, readable by the lead only
create table if not exists public.app_config (key text primary key, value jsonb not null, updated_at timestamptz not null default now());
alter table public.app_config enable row level security;
drop policy if exists app_config_lead on public.app_config;
create policy app_config_lead on public.app_config for all to authenticated using ((select is_lead())) with check ((select is_lead()));
revoke all on public.app_config from anon;

-- ================================================================ codebook readable by the team (2026-11-04)
drop policy if exists app_config_lead on public.app_config;
drop policy if exists app_config_read on public.app_config;
drop policy if exists app_config_write on public.app_config;
create policy app_config_read on public.app_config for select to authenticated using ((select is_lead()) or ((select is_member()) and key = 'codebook'));
create policy app_config_write on public.app_config for all to authenticated using ((select is_lead())) with check ((select is_lead()));

-- ================================================================ discussions: flags and threads per article (2026-11-06)
-- see migration "discussion_threads": tables threads, thread_messages, thread_reads; functions can_see_article,
-- thread_visible, discuss_before, discuss_after_message; only coders assigned to an article (and the lead) can read or post.
create or replace function public.can_see_article(k text) returns boolean language sql stable security definer set search_path = public as $$
  select is_lead() or exists (select 1 from articles a where a.key = k and not a.archived and my_coder() = any(a.coders))
$$;
create table if not exists public.threads (id bigserial primary key, article_key text not null references public.articles(key) on delete restrict, created_by uuid default auth.uid(), coder text, s int, e int, quote text not null default '', status text not null default 'open' check (status in ('open','resolved')), mentions text[] not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now(), resolved_by uuid, resolved_at timestamptz);
create table if not exists public.thread_messages (id bigserial primary key, thread_id bigint not null references public.threads(id) on delete cascade, user_id uuid default auth.uid(), coder text, body text not null check (length(body) between 1 and 4000), mentions text[] not null default '{}', created_at timestamptz not null default now());
create table if not exists public.thread_reads (user_id uuid not null default auth.uid(), thread_id bigint not null references public.threads(id) on delete cascade, read_at timestamptz not null default now(), primary key (user_id, thread_id));
create or replace function public.thread_visible(t bigint) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from threads x where x.id = t and can_see_article(x.article_key))
$$;
alter table public.threads enable row level security; alter table public.thread_messages enable row level security; alter table public.thread_reads enable row level security;
drop policy if exists threads_read on public.threads; create policy threads_read on public.threads for select to authenticated using (can_see_article(article_key));
drop policy if exists threads_insert on public.threads; create policy threads_insert on public.threads for insert to authenticated with check (created_by = (select auth.uid()) and can_see_article(article_key));
drop policy if exists threads_update on public.threads; create policy threads_update on public.threads for update to authenticated using (can_see_article(article_key)) with check (can_see_article(article_key));
drop policy if exists threads_delete on public.threads; create policy threads_delete on public.threads for delete to authenticated using ((select is_lead()));
drop policy if exists msgs_read on public.thread_messages; create policy msgs_read on public.thread_messages for select to authenticated using (thread_visible(thread_id));
drop policy if exists msgs_insert on public.thread_messages; create policy msgs_insert on public.thread_messages for insert to authenticated with check (user_id = (select auth.uid()) and thread_visible(thread_id));
drop policy if exists msgs_delete on public.thread_messages; create policy msgs_delete on public.thread_messages for delete to authenticated using ((select is_lead()));
drop policy if exists reads_own on public.thread_reads; create policy reads_own on public.thread_reads for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()) and thread_visible(thread_id));
revoke all on public.threads, public.thread_messages, public.thread_reads from anon;

-- ================================================================ coders compare after everyone has submitted (2026-11-09)
-- A coder can see the other codings of an article only when every coder assigned to it has submitted.
-- What they see is each coder's FIRST submission (made blind), so nobody's later edits can prime anyone.
-- Other coders are anonymous ("Coder A", "Coder B"; the letters are shuffled per article) and their memos are left out.
-- Reliability is unaffected: it uses the first submissions, which the database never lets anyone change.

create or replace function public.compare_status()
returns table (article_key text, assigned int, submitted int, ready boolean)
language sql stable security definer set search_path = public as $$
  with mine as (
    select a.key, a.coders,
           (select count(distinct s.coder)::int from submissions s where s.article_key = a.key and s.coder = any(a.coders)) as n
    from articles a
    where not a.archived and my_coder() is not null and my_coder() = any(a.coders)
  )
  select m.key, cardinality(m.coders), m.n,
         cardinality(m.coders) >= 2 and m.n = cardinality(m.coders)
           and exists (select 1 from submissions s where s.article_key = m.key and s.user_id = auth.uid())
  from mine m
$$;

create or replace function public.peer_codings()
returns table (article_key text, slot text, mine boolean, data jsonb)
language sql stable security definer set search_path = public as $$
  with ready as (
    select c.article_key from compare_status() c where c.ready
  ), rows as (
    select s.article_key, s.user_id = auth.uid() as mine,
           coalesce(s.first_data, s.data) as d,
           row_number() over (partition by s.article_key, s.user_id = auth.uid() order by md5(s.user_id::text || ':' || s.article_key)) as n
    from submissions s
    join ready r on r.article_key = s.article_key
    join articles a on a.key = s.article_key
    where s.coder = any(a.coders)
  )
  select article_key,
         case when mine then 'You' else 'Coder ' || chr(64 + n::int) end,
         mine,
         case when mine then d else d - 'memo' - 'revisedAfterComparison' end
  from rows
  order by article_key, mine desc, n
$$;

revoke execute on function public.compare_status(), public.peer_codings() from public, anon;
grant execute on function public.compare_status(), public.peer_codings() to authenticated;
