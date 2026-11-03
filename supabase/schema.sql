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
language sql stable as $$ select lower(coalesce(auth.jwt() ->> 'email', '')) $$;

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
values ('wutao.wen@googlemail.com', '2', 'lead')
on conflict (email) do update set role = 'lead';
