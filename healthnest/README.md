# Healthnestt

Editorial health publication for India. Freelancers write and submit, the admin reviews and publishes, readers read.

Planning documents live one folder up: `../HEALTHNESTT_PLAN.md`, `../CONTENT_MODEL_SPEC.md`, `../wireframes/`, `../design-system/`.

## Run locally

```bash
npm install
npx prisma db push      # creates prisma/dev.db (SQLite)
npm run db:seed         # staff accounts, categories, pages, calculators, 3 sample articles
npm run dev             # http://localhost:3000
```

Dev staff logins are defined at the top of `prisma/seed.js` (override with `SEED_*` env vars).
Staff sign in at `/staff/login`. Admins land on `/admin`, freelancers on `/freelancer`.

## Tests

```bash
npm test
```

Runs 464 tests in about 30 seconds against a throwaway database (`prisma/test.db`, rebuilt each run). Your development data is never touched.

## Email

The site sends four kinds of email: the newsletter confirmation (double opt-in), and staff notifications (a writer submits, changes requested / approved / published).

**Default: log mode.** Nothing leaves your machine. Every email is saved and shown at **Admin, then Emails**, with a preview and its links, so you can click through the whole flow exactly as a reader or writer would.

**To send real email (Resend):**

1. Create an account at resend.com and verify a sending domain you own.
2. Create an API key.
3. In `.env` set:
   ```
   EMAIL_PROVIDER="resend"
   RESEND_API_KEY="re_..."
   EMAIL_FROM="Healthnestt <hello@your-domain.com>"
   ```
4. Restart the site, open Admin, then Emails, and press "Send me a test email".

If `EMAIL_PROVIDER` is `resend` but the key is empty, the site keeps logging and the Emails page says so. A failed send never blocks signing up, submitting or publishing. It is recorded in the log with the reason.

Safeguards: a confirmation link works for 7 days; one address gets at most 3 confirmation emails an hour and none within 10 minutes of the last; confirming and unsubscribing need a button press (so mail scanners cannot do it by opening the link); everything typed by a person is escaped inside emails.

Not built yet: sending the weekly newsletter itself, and an unsubscribe link in it (the unsubscribe page already works for a subscriber's token).
## Stack

Next.js 16 (App Router), Tailwind v4, Prisma 6 + SQLite (dev), signed-cookie sessions (`jose`), `bcryptjs`, `zod`, `sanitize-html`.

## How it works

- **Roles:** `admin`, `freelancer`, `reader`. Checked on the server in `src/lib/auth.js` and in every server action.
- **Workflow:** `src/lib/workflow.js` is the single source of truth for status transitions and edit rules (draft, submitted, changes requested, approved, published, archived). Only an admin can publish.
- **Submit rules:** title, excerpt, body, cover image and alt text, category and at least one https source are required.
- **Publish rules:** also needs SEO title and description, and the admin must tick the checklist.
- **Article HTML** is sanitized on save (`src/lib/sanitize.js`).

## Not built yet (Phase 1 gaps)

- Image resizing and cloud storage (uploads are saved to local disk in `uploads/` for now)
- Search is a simple database `contains` match, not Meilisearch yet
- Admin password reset, edit-your-profile
- Rate limiting is in-memory (single process only)

## Before deploying

1. Switch `provider` in `prisma/schema.prisma` to `postgresql` and set `DATABASE_URL`.
2. Set a strong `SESSION_SECRET` (32+ chars) and the real `SITE_URL`.
3. Change or remove the seeded dev accounts.
4. Replace the draft policy pages (Privacy, Terms, Editorial, Advertising) with reviewed text.
5. Replace the 3 sample articles with real, sourced content.



## Deploying to Vercel (free tier)

1. Create a free Postgres database at neon.tech and copy its connection string.
2. Import the GitHub repo in Vercel and set **Root Directory** to `healthnest`.
3. Set **Build Command** to `prisma db push && next build`.
4. In the project's Storage tab, create a **Blob** store and connect it (adds `BLOB_READ_WRITE_TOKEN`; uploads then use Blob instead of local disk).
5. Add env vars: `DATABASE_URL`, `SESSION_SECRET`, `SITE_URL`, and optionally `EMAIL_PROVIDER`, `EMAIL_FROM`, `RESEND_API_KEY`.
6. After the first deploy, seed once from your machine: `DATABASE_URL=<neon url> npx prisma db seed` (then change the seeded accounts).

Local development now also needs a Postgres `DATABASE_URL` (use a Neon dev branch or local Postgres); the tests need one too.

### Supabase connection strings

- `DATABASE_URL` (runtime): transaction pooler, port 6543, ending `?pgbouncer=true&connection_limit=1`.
- `DIRECT_URL` (used by `prisma db push` and seeding): session pooler, port 5432.
- Local SQLite/Postgres without a pooler: set both to the same URL.
