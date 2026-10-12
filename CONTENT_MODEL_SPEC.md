# Healthnestt: Content Model Spec (Phase 0)

Version 0.1. This is a design document, not code. It defines the data, rules and content standards that Phase 1 will implement.

**Scope:** P1 (launch) entities are fully specified. P2 and P3 entities are listed briefly so P1 decisions do not block them.

---

## 1. Entity overview

```
User ──< Article >── Category
              │  └──< ArticleTag >── Tag
              │  └──< Source
              │  └──< ReviewNote
              └── Condition (optional hub link)

NewsletterSubscriber        MediaAsset        AuditLog (P2)
Bookmark, Comment (P2)      PaymentRecord (P2)      Drug, Recipe (P2)
```

| Entity | Phase | Purpose |
|---|---|---|
| User | P1 | Admin, freelancer, reader (reader accounts activate in P2) |
| Article | P1 | The core content item |
| Source | P1 | Citations attached to an article |
| Category | P1 | Top-level topics (about 10) |
| Condition | P1 | Condition hub pages, grouped under a category |
| Tag | P1 | Flexible secondary labels |
| ReviewNote | P1 | Admin feedback to freelancer |
| MediaAsset | P1 | Uploaded images |
| NewsletterSubscriber | P1 | Email list |
| Page | P1 | Static pages (About, Policies, Disclaimer) |
| Calculator | P1 | Registry of tools (BMI, calorie, water) |
| Bookmark, Comment | P2 | Reader engagement |
| PaymentRecord | P2 | Freelancer payments |
| AuditLog | P2 | Who changed what |
| Drug, Recipe | P2 | Databases |

---

## 2. Enumerations

**UserRole:** `admin`, `freelancer`, `reader`
**UserStatus:** `active`, `deactivated`
**ArticleStatus:** `draft`, `submitted`, `changes_requested`, `approved`, `published`, `archived`
**ContentType (search and display):** `article`, `condition`, `tool`, `page`
**PaymentStatus (P2):** `unpaid`, `paid`

---

## 3. Entities in detail

Notation: **R** = required, **O** = optional, **U** = unique, **FK** = foreign key.

### 3.1 User

| Field | Type | Rules |
|---|---|---|
| id | uuid | PK |
| name | string, 2-80 | R |
| email | string | R, U, lowercase, valid format |
| passwordHash | string | R for admin and freelancer, never returned by any API |
| role | UserRole | R, default `reader` |
| status | UserStatus | R, default `active` |
| bio | text, max 500 | O, shown on author page |
| photoUrl | string | O |
| slug | string | U, for `/authors/{slug}`, generated from name |
| createdAt, updatedAt | datetime | R |
| lastLoginAt | datetime | O |

Rules:
- Only admin can create freelancer and admin accounts. There is no public writer signup.
- A deactivated user cannot log in. Their published articles stay live and keep their byline.
- Only users with role `admin` or `freelancer` get an author page.

### 3.2 Article

| Field | Type | Rules |
|---|---|---|
| id | uuid | PK |
| title | string, 20-110 | R |
| slug | string | R, U, lowercase, hyphenated, max 80, locked after first publish |
| excerpt | string, 50-160 | R before submit |
| body | rich text (stored as sanitized HTML or JSON) | R before submit, min 600 words recommended |
| coverImageId | FK MediaAsset | R before submit |
| coverImageAlt | string, max 125 | R before submit |
| categoryId | FK Category | R before submit |
| conditionId | FK Condition | O |
| authorId | FK User | R |
| status | ArticleStatus | R, default `draft` |
| seoTitle | string, max 60 | O, falls back to title. Admin sets before publish |
| seoDescription | string, max 155 | O, falls back to excerpt |
| canonicalUrl | string | O |
| readingTimeMin | int | computed from body |
| isFeatured | boolean | default false, admin only |
| featuredRank | int | O, admin only, controls home page slot |
| submittedAt | datetime | O, set on each submission |
| publishedAt | datetime | O, set on first publish |
| lastReviewedAt | datetime | R on publish, drives the "Updated" date and re-review reminder |
| nextReviewDueAt | datetime | O, default publishedAt plus 12 months |
| reviewerId | FK User | **O, unused in v1** (reserved for the future "medically reviewed" badge) |
| viewCount | int | default 0 |
| createdAt, updatedAt | datetime | R |

Relations: many Tags, many Sources, many ReviewNotes.

### 3.3 Source

| Field | Type | Rules |
|---|---|---|
| id | uuid | PK |
| articleId | FK Article | R |
| title | string | R |
| publisher | string | R (for example WHO, ICMR, NIH, journal name) |
| url | string | R, valid https URL |
| publishedYear | int | O |
| position | int | R, display order |

Rule: an article needs **at least 1 source before it can be submitted**, and the admin checklist expects 3 or more for substantive health claims.

### 3.4 Category

| Field | Type | Rules |
|---|---|---|
| id | uuid | PK |
| name | string | R, U |
| slug | string | R, U |
| description | text, max 300 | R, shown on category page and used for SEO |
| iconKey | string | O |
| position | int | R, menu order |
| isActive | boolean | default true |

### 3.5 Condition

| Field | Type | Rules |
|---|---|---|
| id | uuid | PK |
| name | string | R, U (for example "Type 2 Diabetes") |
| slug | string | R, U |
| categoryId | FK Category | R |
| overview | rich text | R, the pinned intro on the hub page |
| isActive | boolean | default true |

The A-Z index page is generated from active Conditions.

### 3.6 Tag and ArticleTag

Tag: `id`, `name` (U), `slug` (U). ArticleTag joins Article and Tag. Max 5 tags per article.

### 3.7 ReviewNote

| Field | Type | Rules |
|---|---|---|
| id | uuid | PK |
| articleId | FK Article | R |
| adminId | FK User | R |
| type | `changes_requested`, `approved`, `comment` | R |
| message | text | R when type is `changes_requested` |
| createdAt | datetime | R |

Notes are append-only history, never edited or deleted. The freelancer sees them in their feedback inbox.

### 3.8 MediaAsset

`id`, `url`, `width`, `height`, `mimeType` (jpeg, png, webp), `sizeBytes` (max 5 MB), `altDefault`, `uploadedById`, `createdAt`.

### 3.9 NewsletterSubscriber

`id`, `email` (U), `status` (`pending`, `confirmed`, `unsubscribed`), `source` (page they signed up on), `consentAt`, `confirmedAt`, `unsubscribedAt`. Double opt-in is required (DPDP-friendly).

### 3.10 Page (static)

`id`, `title`, `slug` (U), `body`, `seoTitle`, `seoDescription`, `updatedAt`. Seeded with: About, Editorial Policy, Advertising Policy, Privacy Policy, Terms, Medical Disclaimer, Contact.

### 3.11 Calculator

`id`, `name`, `slug` (U), `description`, `type` (`bmi`, `calorie`, `water`), `relatedCategoryId`, `isActive`. The formulas live in code. This table drives listings, SEO and related-content links.

### 3.12 P2 entities (outline only)

- **Bookmark:** `userId`, `articleId`, `createdAt`. U on the pair.
- **Comment:** `id`, `articleId`, `userId`, `body`, `status` (`pending`, `approved`, `rejected`), `createdAt`.
- **PaymentRecord:** `id`, `freelancerId`, `articleId`, `amount`, `currency` (INR), `status`, `paidAt`.
- **AuditLog:** `id`, `actorId`, `action`, `entityType`, `entityId`, `before`, `after`, `createdAt`.
- **Drug / Recipe:** defined when Phase 2 starts.

---

## 4. Article workflow rules

### 4.1 Allowed transitions

| From | To | Who | Condition |
|---|---|---|---|
| (new) | `draft` | Freelancer, Admin | none |
| `draft` | `submitted` | Freelancer (own), Admin | submit validation passes (section 4.2) |
| `submitted` | `changes_requested` | Admin | a ReviewNote message is required |
| `changes_requested` | `submitted` | Freelancer (own), Admin | submit validation passes again |
| `submitted` | `approved` | Admin | none |
| `approved` | `published` | Admin | publish validation passes (section 4.3) |
| `submitted` | `published` | Admin | shortcut allowed, same validation as above |
| `published` | `archived` | Admin | none |
| `published` | `draft` | Admin | "unpublish", URL then returns 404 or a redirect |
| `archived` | `published` | Admin | none |

Any other transition is rejected by the server.

### 4.2 Submit validation (freelancer and admin)

- Title, excerpt, body, cover image with alt text, category all present.
- At least 1 Source with a valid https URL.
- Body contains no empty headings and no leftover template text.
- Max 5 tags.

### 4.3 Publish validation (admin only)

- Everything in 4.2.
- `seoTitle`, `seoDescription` and `slug` confirmed.
- Admin has ticked the publish checklist (section 6).
- `lastReviewedAt` set to now. `publishedAt` set only on the first publish.
- `nextReviewDueAt` set to 12 months ahead.

### 4.4 Editing rules

| Article status | Freelancer (author) can edit | Admin can edit |
|---|---|---|
| draft | Yes | Yes |
| submitted | No (locked while in review) | Yes |
| changes_requested | Yes | Yes |
| approved | No | Yes |
| published | No | Yes (updates `lastReviewedAt` only if admin marks it as a content review) |
| archived | No | Yes |

All of these are enforced on the server. Hiding a button in the UI is not enough.

### 4.5 Visibility

- Only `published` articles appear on the public site, in search, in the sitemap and in newsletters.
- A freelancer sees only their own articles. Admin sees all.

---

## 5. URLs, slugs and SEO

| Page | URL pattern |
|---|---|
| Home | `/` |
| Category | `/{category-slug}` (for example `/diabetes`) |
| Condition hub | `/conditions/{condition-slug}` |
| Conditions A-Z | `/conditions` |
| Article | `/articles/{article-slug}` |
| Author | `/authors/{author-slug}` |
| Tools | `/tools`, `/tools/{calculator-slug}` |
| Search | `/search?q=` |
| Static pages | `/about`, `/editorial-policy`, `/privacy`, `/terms`, `/disclaimer`, `/contact` |
| Staff login | `/staff/login` |
| Dashboards | `/freelancer/*`, `/admin/*` (not indexed) |

Slug rules: lowercase, hyphens, no stopword stuffing, no dates, max 80 characters, locked after first publish. If an admin must change one, the old URL gets a 301 redirect.

Every published article outputs: `<title>` from `seoTitle`, meta description, canonical URL, OpenGraph and Twitter tags, and `Article` JSON-LD (headline, author, datePublished, dateModified, image). `/freelancer/*`, `/admin/*` and `/staff/*` carry `noindex`.

---

## 6. Admin publish checklist (shown on the review page)

- [ ] Medical claims match the cited sources.
- [ ] Sources are reputable (WHO, ICMR, NIH, government bodies, peer-reviewed journals) and the links work.
- [ ] No diagnosis, no dosage instructions, no promise of cure.
- [ ] Safety guidance included where relevant ("when to see a doctor").
- [ ] Plain language, medical terms explained once.
- [ ] Images are licensed, with alt text.
- [ ] SEO title, description and slug set.
- [ ] Category and tags correct, internal links added to 2 or more related articles.
- [ ] Medical disclaimer is displayed (the template adds it automatically).

---

## 7. Launch taxonomy

### Categories (10)

| # | Category | Example conditions or subtopics |
|---|---|---|
| 1 | Diabetes | Type 2 diabetes, prediabetes, gestational diabetes, blood sugar |
| 2 | Heart Health | High blood pressure, cholesterol, heart attack signs |
| 3 | Mental Health | Anxiety, depression, stress, burnout |
| 4 | Women's Health | PCOS, periods, pregnancy, menopause |
| 5 | Nutrition | Indian diets, protein, vitamins, weight loss |
| 6 | Fitness | Walking, yoga, home workouts, back pain |
| 7 | Skin and Hair | Acne, hair fall, dandruff, sun care |
| 8 | Sleep | Insomnia, sleep hygiene, snoring |
| 9 | Child Health | Newborn care, fever, vaccines, child nutrition |
| 10 | Home Remedies and Ayurveda | Evidence-based looks at common home remedies |

### Launch tools (3)
BMI calculator, daily calorie calculator, water intake calculator.

### Seed topic backlog (first 40 articles, 4 per category)

| Category | Topics |
|---|---|
| Diabetes | What is prediabetes; Indian diet plan for diabetes; Early signs of type 2 diabetes; How to read an HbA1c result |
| Heart Health | Understanding blood pressure readings; Foods that help lower cholesterol; Warning signs of a heart attack; Salt and your heart |
| Mental Health | How to manage everyday anxiety; Signs of burnout; Simple breathing exercises for stress; Talking to someone about depression |
| Women's Health | PCOS explained; Irregular periods: causes; Healthy eating in pregnancy; Menopause: what to expect |
| Nutrition | Protein sources for vegetarians; Common vitamin deficiencies in India; Healthy breakfast ideas; Reading food labels |
| Fitness | Beginner walking plan; Yoga for back pain; 20-minute home workout; Warm-up and stretching basics |
| Skin and Hair | Causes of acne; Why hair fall happens; Sunscreen basics for Indian skin; Dandruff treatment options |
| Sleep | Sleep hygiene basics; Why you wake up at 3 a.m.; How much sleep adults need; Snoring: when to worry |
| Child Health | Newborn feeding basics; Managing a child's fever; India vaccination schedule overview; Healthy tiffin ideas |
| Home Remedies and Ayurveda | Does turmeric milk work; Ginger for cold and cough: what evidence says; Tulsi benefits and limits; Remedies to avoid |

---

## 8. Freelancer brief template

Each assignment gives the writer:

1. **Topic and working title**
2. **Target keyword** and 2 to 3 related keywords
3. **Audience** (for example "adult in India, no medical background")
4. **Length:** 900 to 1,500 words (guide)
5. **Required sections:** short answer up top, main explanation, practical steps, "When to see a doctor", sources
6. **Required sources:** minimum 3, from the approved list (WHO, ICMR, NIH, MoHFW, peer-reviewed journals)
7. **Do not:** diagnose, give dosages, recommend brands, make cure claims, copy text from other sites
8. **Deadline and rate**

Style: short paragraphs, active voice, explain medical terms once, use Indian examples where relevant (foods, units, healthcare context).

---

## 9. Search index (Meilisearch)

Indexed fields: `title`, `excerpt`, `body` (plain text), `categoryName`, `conditionName`, `tags`, `authorName`, `contentType`, `publishedAt`.
Filterable: `categorySlug`, `contentType`, `tags`.
Sortable: `publishedAt`, `viewCount`.
Typo tolerance on. Only `published` articles are indexed, and unpublishing removes them immediately.

---

## 10. Database indexes and integrity

- U: `User.email`, `User.slug`, `Article.slug`, `Category.slug`, `Condition.slug`, `Tag.slug`, `NewsletterSubscriber.email`.
- Index: `Article(status, publishedAt)`, `Article(categoryId, status)`, `Article(authorId, status)`, `Article(nextReviewDueAt)`.
- Deleting a User who has articles is blocked. Deactivate instead.
- Deleting a Category with articles is blocked. Mark inactive instead.
- Body HTML is sanitized on save (allowed tags only: headings, p, lists, links, blockquote, images, tables). Links in the body get `rel="noopener"`, and external links to non-source sites are flagged to admin.

---

## 11. Open decisions for Phase 1

| # | Question | Default if undecided |
|---|---|---|
| 1 | Store body as sanitized HTML or editor JSON? | Editor JSON, rendered to HTML on the server |
| 2 | Category URLs at root (`/diabetes`) or under `/topics/`? | Root, shorter and better for SEO |
| 3 | Image storage provider | Cloudinary |
| 4 | Hindi support timing | Phase 4, model keeps a `language` field ready to add |
| 5 | Medical reviewer badge | Phase 4, uses the reserved `reviewerId` |
