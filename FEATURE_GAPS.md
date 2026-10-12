# Healthnestt vs Healthline: what is still missing

Checked against healthline.com's home page, main menu and footer on 2026-10-12. Status: **Have** = built and live, **Partial** = exists but thinner than Healthline's, **Missing** = not built.
Priority follows `HEALTHNESTT_PLAN.md` (P1 launch, P2 after launch, P3 later). "Needs you" means it depends on people, money or legal review, not code.

## What Healthline has, and where we stand

| Healthline feature | Us | Notes |
|---|---|---|
| Home: top story, trending, topic list | Have | Different layout on purpose. |
| Health Conditions menu and A-Z | Have | Healthline links ~20 conditions in the menu; ours is a full A-Z page plus hubs. |
| Wellness topic hubs (Fitness, Nutrition, Skin care...) | Have | Categories are admin-managed. Content is the gap, not code. |
| Article page: author, dates, contents, sources, related, share | Have | |
| "Medically reviewed by" badge | Missing (P3) | Deliberately out of v1. The `reviewer` field already exists in the database. |
| Reader accounts, sign up / log in, profile button | **Have (new)** | Header buttons, profile menu, `/account`. No email verification or password reset yet. |
| Save articles / bookmarks | **Have (new)** | Save button on every article, list on `/account`. Reading history not built. |
| Newsletters (they have many) | Partial | One list, double opt-in. No sending of newsletters yet, no topic choices. |
| Search | Partial | Basic match. No suggestions, no "did you mean", no filters beyond topic. |
| Calculators: Calorie, Macronutrient, Sleep, A1C Explorer | Have | BMI, calorie, water, macronutrient, sleep and A1C are built. |
| Pill Identifier | Missing (P3) | Needs a licensed drug-image database. |
| Prescription medications / drug directory A-Z | Missing (P2) | Large, needs reviewed content per drug. |
| Symptom pages | Missing (P2) | |
| Recipes hub (400+, diet filters) | Missing (P2) | Needs a recipe data model and content. |
| Product reviews, at-home testing | Missing (P3) | Needs affiliate disclosures and ad labelling first. |
| Video library | Have | YouTube click-to-play inside articles, plus a /videos page. One video per article; no uploads. |
| Daily Dose Lessons / featured programs | Missing (P3) | Email-course style. Builds on newsletters. |
| Health news section | Partial | "Health News" category exists and is in the header. Needs real sourced news items from writers. |
| FindCare (find a doctor) | Missing (P3) | Needs a doctor directory, large effort. |
| Bezzy communities / forums | Missing (P3) | Needs moderation tooling first. |
| Comments | Missing (P2) | Needs moderation in admin. |
| Sitemap, content integrity, editorial pages | Have | Editorial policy, advertising, privacy, terms, disclaimer, contact. Text is draft. |
| Ads and sponsored labels | Missing (P3) | |
| Languages other than English | Missing (P3) | Hindi first. |
| Site-wide AI assistant | Missing (P3) | |

## Gaps in our own build (not on Healthline's list, but needed)

| Item | Status |
|---|---|
| Email verification and password reset for readers (staff have no reset either) | Missing |
| Real email delivery (Resend account) | Needs you |
| Image storage: Vercel Blob store connected, image resizing | Needs you / Missing |
| Shared rate limiting (current limiter is per server instance, weak on Vercel) | Missing |
| Article editor autosave | Missing |
| Admin: homepage featured slots, newsletter export and broadcast, analytics charts | Partial |
| Admin: payments to freelancers, audit log, re-review reminders, comment moderation | Missing (P2) |
| Backups, error monitoring (Sentry) | Missing |
| Accessibility audit, Lighthouse pass, mobile and cross-browser pass | Missing |
| Security headers, formal security review | Missing |
| 30-50 real sourced articles, reviewed policy text, change seeded accounts and sample articles | Needs you |

## Suggested order

1. Close launch blockers: connect Blob storage, email provider, rotate the exposed secrets, replace sample content.
2. Reader trust basics: password reset and email verification (needs email delivery first).
3. Cheap, visible wins: filling the News category and adding videos to articles.
4. Growth: search suggestions, newsletter sending with topic choices, comments with moderation.
5. Big content builds, each its own project: drug directory, symptom pages, recipes.
