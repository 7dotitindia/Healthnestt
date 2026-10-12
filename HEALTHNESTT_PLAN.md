# Healthnestt: Feature List and Implementation Plan

**Brand:** Healthnestt
**Type:** Editorial health publication for India, broad health topics
**Publishing model:** Freelancers write and submit. Admin reviews and publishes. Readers only read.
**Scope note:** No doctor roles and no "medically reviewed" badge in v1. The data model keeps a nullable `reviewer` field so the badge can be added later.

Priority legend: **P1** = launch (MVP), **P2** = after launch, **P3** = later.

---

## Part 1: Feature List

### A. Public site (readers)

| # | Feature | Priority |
|---|---|---|
| 1 | Home page: featured, trending, latest, category blocks | P1 |
| 2 | Category pages with pagination | P1 |
| 3 | Condition hubs (A-Z index, hub page plus linked articles) | P1 |
| 4 | Article page: author, dates, table of contents, sources, related articles, share buttons | P1 |
| 5 | Search with suggestions and filters | P1 |
| 6 | Health calculators: BMI, calorie, water intake | P1 |
| 7 | Newsletter signup | P1 |
| 8 | Static and legal pages: About, Editorial Policy, Advertising Policy, Privacy, Terms, Disclaimer, Contact | P1 |
| 9 | Cookie consent banner | P1 |
| 10 | Author pages (freelancer bio and their articles) | P1 |
| 11 | Responsive, mobile-first design with dark-mode-ready tokens | P1 |
| 12 | Reader accounts: signup and login | P2 |
| 13 | Bookmarks and reading history | P2 |
| 14 | Comments with moderation | P2 |
| 15 | Drug database (A-Z, one page per drug) | P2 |
| 16 | Symptom pages | P2 |
| 17 | Recipe hub with diet filters | P2 |
| 18 | More calculators (sleep, ovulation, A1C) | P2 |
| 19 | Product reviews with affiliate links | P3 |
| 20 | Video embeds | P2 |
| 21 | Hindi and regional languages | P3 |
| 22 | AI assistant grounded in your articles | P3 |
| 23 | Find a Doctor directory | P3 |
| 24 | Community per condition | P3 |

### B. Freelancer dashboard

| # | Feature | Priority |
|---|---|---|
| 25 | Login (accounts created by admin) | P1 |
| 26 | My articles list with status | P1 |
| 27 | Rich-text editor with autosave | P1 |
| 28 | Required fields: category, tags, excerpt, cover image, **sources** | P1 |
| 29 | Submit for review | P1 |
| 30 | Feedback inbox (admin notes, changes requested) | P1 |
| 31 | Earnings view (articles approved, amount owed and paid) | P2 |
| 32 | Topic assignments and pitches | P2 |

### C. Admin dashboard

| # | Feature | Priority |
|---|---|---|
| 33 | Admin login (secure) | P1 |
| 34 | Review queue (submitted articles) | P1 |
| 35 | Approve, request changes (with note), publish, unpublish, archive | P1 |
| 36 | Write and publish own articles | P1 |
| 37 | Create and manage freelancer accounts | P1 |
| 38 | Manage categories, tags, conditions | P1 |
| 39 | Edit homepage featured and trending slots | P1 |
| 40 | SEO fields per article (title, meta, slug, canonical) | P1 |
| 41 | Media library | P1 |
| 42 | Newsletter subscriber list and export | P1 |
| 43 | Basic analytics (views, top articles) | P1 |
| 44 | Payment tracking for freelancers | P2 |
| 45 | Re-review reminders (6-12 months) | P2 |
| 46 | Comment moderation | P2 |
| 47 | Ad and affiliate management, "Sponsored" labeling | P3 |
| 48 | Audit log (who changed what) | P2 |

### D. Platform and technical

| # | Feature | Priority |
|---|---|---|
| 49 | Role-based access control (Reader / Freelancer / Admin) | P1 |
| 50 | Article status workflow (draft, submitted, changes requested, approved, published, archived) | P1 |
| 51 | SEO: schema markup, sitemap, robots, canonicals, OpenGraph | P1 |
| 52 | Performance: image optimization, caching, CDN | P1 |
| 53 | Email: welcome, submission and approval notifications | P1 |
| 54 | Security: hashed passwords, rate limiting, CSRF/XSS protection, validated input | P1 |
| 55 | Backups and error monitoring | P1 |
| 56 | Accessibility (WCAG basics) | P1 |
| 57 | Optional `reviewer` field in the data model (unused for now) | P1 |

---

## Part 2: Implementation Plan

### 1. Goals and success criteria

- **Launch goal:** a live site with 30-50 reviewed articles, a working freelancer to admin workflow, and SEO set up correctly.
- **Success measures:** Lighthouse score above 90, all articles with sources, review-to-publish turnaround under 3 days, organic traffic growing month over month.

### 2. Tech stack

| Layer | Choice |
|---|---|
| Frontend and server | Next.js + Tailwind |
| Database | Postgres (Neon or Supabase) + Prisma |
| Auth | Email and password, role-based, secure cookie sessions |
| Editor | TipTap rich-text |
| Search | Meilisearch |
| Images | Cloudinary or S3 |
| Email | Resend or Brevo |
| Hosting | Vercel |
| Monitoring | Sentry and Vercel analytics |

### 3. Data model summary

Entities: User, Article, Category, Tag, Condition, ReviewNote, Bookmark, Comment, NewsletterSubscriber, PaymentRecord, AuditLog. Later: Drug, Recipe.

Article carries: `status`, `author`, `sources`, `publishedAt`, `lastReviewedAt`, SEO fields, and a nullable `reviewer`.

**Article status flow:**

```
draft -> submitted -> changes_requested -> (back to submitted)
                   -> approved -> published -> archived
```

### 4. Permissions matrix

| Action | Reader | Freelancer | Admin |
|---|---|---|---|
| Read published articles | Yes | Yes | Yes |
| Create and edit own drafts | No | Yes | Yes |
| Submit for review | No | Yes | Yes |
| Approve or request changes | No | No | Yes |
| Publish or unpublish | No | No | Yes |
| Create users | No | No | Yes |
| Edit published articles | No | No | Yes |

### 5. Phased delivery

#### Phase 0: Foundation (Week 1-2)

- Finalize brand (Healthnestt), logo, colors, typography.
- Wireframes for home, category, article, search, dashboards.
- Write policies: editorial, sourcing, freelancer style guide, disclaimer.
- Finalize about 10 categories and a topic list of 50+.
- Recruit 2-4 freelancers.

#### Phase 1: MVP (Week 3-8)

| Week | Build |
|---|---|
| 3 | Project setup, design system, database schema, auth and roles |
| 4 | Article template, category and home pages, static pages |
| 5 | Freelancer dashboard and editor, submission flow |
| 6 | Admin dashboard: review queue, publish workflow, users, categories |
| 7 | Search, calculators, newsletter, email notifications, SEO (schema, sitemap) |
| 8 | Testing, performance, security pass, deployment, seed content upload |

Parallel track: freelancers write 30-50 articles from week 3 onward.

#### Phase 2: Engagement (Week 9-14)

Reader accounts, bookmarks, comments and moderation, drug database, recipes, extra calculators, freelancer payments, re-review reminders, audit log.

#### Phase 3: Revenue (Week 15-22)

Ads, affiliate links in product reviews, sponsored labeling, A/B tests, topic-cluster expansion.

#### Phase 4: Advanced (Week 23+)

Grounded AI assistant, Find a Doctor, Hindi and regional languages, community, optional medical-reviewer badge.

### 6. Content operations (runs alongside the build)

1. Keyword research per topic, with a brief for each article.
2. Freelancer brief template: topic, keywords, length, tone, required sources.
3. Source rules: only reputable sources (WHO, ICMR, NIH, peer-reviewed journals), with citations in each article.
4. Admin checklist before publishing: accuracy, sources, no diagnostic or dosage claims, SEO fields, disclaimer.
5. Publishing cadence: 3-5 articles per week after launch.

**Suggested launch categories:** Diabetes, Heart Health, Mental Health, Women's Health, Nutrition, Fitness, Skin and Hair, Sleep, Child Health, Ayurveda and Home Remedies.

### 7. SEO plan

- Server-rendered pages, clean URLs (`/conditions/diabetes`, `/articles/slug`).
- `Article` schema, sitemap, robots, OpenGraph.
- Topic clusters with internal linking.
- Submit the site to Google Search Console from day one.

### 8. Security and compliance

- Hashed passwords, rate-limited login, input validation, sanitized rich text.
- Admin-only publish enforced on the server, not just hidden in the UI.
- India DPDP Act: privacy policy, consent for newsletter and cookies, minimal data collection.
- No collection of personal health data in v1.

### 9. Testing and launch checklist

- [ ] Role and permission tests (a freelancer must never be able to publish)
- [ ] Workflow tests for each status transition
- [ ] Mobile and cross-browser checks, accessibility check
- [ ] Lighthouse, SEO audit, load test
- [ ] Backups verified, monitoring on, 404 and error pages ready
- [ ] 30-50 articles live, legal pages live, sitemap submitted

### 10. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Inaccurate medical content | Mandatory sources and admin review, no diagnostic claims |
| Slow content production | Recruit freelancers early, build a topic backlog |
| Low rankings without medical badge | Strong sourcing and editorial policy, add reviewers in Phase 4 |
| Scope creep | Hold P2 and P3 until after launch |
| Freelancer quality varies | Style guide, feedback loop, track approval rates |

### 11. Rough budget areas

Domain and hosting, managed database, email service, image storage, freelancer payments (largest ongoing cost), design assets, and optional SEO tools. Free tiers cover most infrastructure at launch.

---

## Next steps

1. Phase 0 deliverables: wireframes, design system, content-model spec.
2. Recruit freelancers and finalize the topic backlog.
3. Begin Phase 1 build once Phase 0 is signed off.
