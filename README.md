# NPF Annotator

A web app for coding news and policy texts with the NPF (Narrative Policy Framework) codebook, built for the ChinaSpektrum project. Coders select a passage and pick a category; the coding sheet fills itself from what they mark. The app compares coders, computes intercoder reliability (Krippendorff's α), supports qualitative analysis, and exports everything in the column layout of the project's Results sheet.

It runs in any browser and on phones, and can be added to the home screen like an app.

## Using it

| Who | What |
|---|---|
| Coders | Open the link, enter your email, tap the sign-in link (or type the code from the email). They see only the articles assigned to them and only their own codings. **Feedback** sends a message or bug report to the lead. |
| Project lead | **Progress**: who has coded what, feedback inbox, safety copies, automatic assignment. **Compare / Reliability / Analyse / Export**: lead only. **Team** and **Articles**: manage people and texts. |

**Step 1 is always the prescreening.** Coders answer three questions (topical relevance, characters, plot) above the text before they can mark anything. If the text is not relevant, or has neither characters nor a plot, they submit the prescreening and are done; the remaining columns stay empty in every export.

**Discussions:** while coding, a coder can flag a passage (or ask about the whole article) and tag the other coders of that article or the lead. Threads appear in everyone's *My work*. Only people assigned to the article and the lead can read them. Reliability can leave out articles that were discussed before all coders had submitted.

Coders never see each other's work; only the project lead can compare. The database enforces this, not just the screen. Articles that already have codings cannot be deleted, only archived.

**Safety copies:** the database copies all codings every night (kept 30 days) and makes a full copy including article texts every Sunday (last 6 kept). The lead can download any copy under *Progress*, and should also download a backup file now and then to keep outside Supabase.

## Setup (one time)

1. **Supabase** (done for project `npf-annotator`, Frankfurt): create a project, open *SQL Editor*, paste [`supabase/schema.sql`](supabase/schema.sql) and run it. The last line makes you the project lead; change the email there if needed.
2. **Supabase → Authentication → URL Configuration**: set *Site URL* to the GitHub Pages address (for example `https://wuwen6937.github.io/npf-annotator/`) and add the same address under *Redirect URLs*.
3. **Supabase → Authentication → Emails → Magic Link** (optional, recommended): add `{{ .Token }}` to the template, so the email also contains a code. This helps when someone opens the email on a different device from the one they're signing in on.
4. **Email sending** (recommended for a team): Supabase's built-in email service only sends a few emails per hour. Under *Authentication → Emails → SMTP Settings*, connect a free sender such as Brevo or Resend.
5. **`config.js`** (done): paste the project URL and the *anon public* key from *Project Settings → API*. The anon key is meant to be public; the database rules decide who can read and write what.
6. **GitHub → Settings → Pages**: *Deploy from a branch*, branch `main`, folder `/ (root)`.

Without `config.js` filled in, the app opens in practice mode, which saves to the current browser only.

## What is stored

| Table | Content |
|---|---|
| `members` | Team emails, coder numbers, roles |
| `articles` | Article ID, dataset (1 = CN, 2 = EN), URL, title, text, Ebene, assigned coders |
| `drafts` | Each coder's work in progress, private to that coder |
| `submissions` | Submitted codings. The database keeps the **first** submission unchangeable for reliability. |
| `submission_history` | Every submission ever made (audit trail) |
| `finals` | Consensus values the lead set after discussion |
| `feedback` | Bug reports, questions and ideas from the team (lead reads) |
| `backups` | Nightly and weekly safety copies (lead reads) |

## Methods notes

- α is nominal for all variables and interval for the number of characters. Thresholds follow Krippendorff (2004): ≥ .800 reliable, .667–.799 tentative.
- 95% intervals are computed by bootstrapping articles (1,000 resamples).
- Characters are matched across coders by name or by overlapping text marks. Review the matches in *Compare* before reporting character-level figures.
