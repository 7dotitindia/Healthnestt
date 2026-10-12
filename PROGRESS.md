# Healthnestt: Progress Tracker

Last updated: 2026-10-12. Legend: [x] done, [~] partly done, [ ] not started.
Code lives in `healthnest/`. Feature numbers refer to `HEALTHNESTT_PLAN.md`.

## Phase 0: Foundation

- [x] Plan, feature list, roadmap (`HEALTHNESTT_PLAN.md`)
- [x] Wireframes, 14 screens (`wireframes/`)
- [x] Design system (`design-system/`)
- [x] Content-model spec (`CONTENT_MODEL_SPEC.md`)
- [ ] Recruit freelancers (you)
- [ ] Final policy text, legally reviewed (you)
- [ ] Final topic list and keyword research (you / SEO)

## Phase 1: MVP

### Public site
| # | Feature | Status |
|---|---|---|
| 1 | Home page | [x] |
| 2 | Category pages with pagination | [x] |
| 3 | Condition A-Z and hub pages | [x] |
| 4 | Article page (author, dates, TOC, sources, related, disclaimer) | [x] |
| 4b | Share buttons on articles | [x] WhatsApp, X, email, copy link |
| 5 | Search | [~] basic database match, no suggestions or filters |
| 6 | Calculators: BMI, calorie, water | [x] |
| 7 | Newsletter signup | [x] double opt-in with confirmation email (log mode until a provider is connected) |
| 8 | Static and legal pages | [~] pages exist, text is draft |
| 9 | Cookie notice | [x] informational (no tracking cookies are used) |
| 10 | Author pages | [x] |
| 11 | Responsive design with a light/dark toggle | [x] |

### Freelancer dashboard
| # | Feature | Status |
|---|---|---|
| 25 | Login (admin-created accounts) | [x] |
| 26 | My articles with status | [x] |
| 27 | Rich-text editor | [~] works, no autosave |
| 28 | Required fields incl. sources | [x] |
| 29 | Submit for review | [x] |
| 30 | Feedback from admin | [x] shown on article page and list |
| - | Cover image upload | [x] local disk, tested |

### Admin dashboard
| # | Feature | Status |
|---|---|---|
| 33 | Admin login | [x] |
| 34 | Review queue | [x] |
| 35 | Approve, request changes, publish, unpublish, archive | [x] |
| 36 | Write and publish own articles | [x] |
| 37 | Create and deactivate freelancers | [x] |
| 38 | Manage categories and conditions | [x] tested; tags are created from the editor |
| 39 | Home page featured slots | [~] "feature" checkbox only |
| 40 | SEO fields per article | [x] |
| 41 | Media library | [x] list, used/unused, delete unused |
| 42 | Newsletter subscriber list | [~] list and status only, no export, no broadcast sending |
| 43 | Basic analytics | [~] view counting works; no charts yet |

### Platform
| # | Feature | Status |
|---|---|---|
| 49 | Role-based access control | [x] tested |
| 50 | Article status workflow | [x] tested |
| 51 | SEO: schema, sitemap, robots, canonicals, OpenGraph | [x] |
| 52 | Performance: image optimization, CDN | [ ] |
| 53 | Email notifications | [x] log mode works; real sending needs a Resend account |
| 54 | Security basics | [~] see below |
| 55 | Backups and error monitoring | [ ] |
| 56 | Accessibility basics | [~] built in, not audited |
| 57 | Reserved `reviewer` field | [x] |

Security detail: password hashing, signed httpOnly session, server-side role checks, HTML sanitizing, in-memory rate limiting are done. Still to do: shared rate limiting, password reset, security headers, a formal review.

### Phase 1 testing and launch
- [x] Lint clean, production build passes
- [x] Browser-tested: validation, freelancer blocked from admin, publish path
- [x] Automated tests: 464 passing (unit + real server actions on a throwaway test database)
- [ ] Mobile and cross-browser pass, accessibility audit, Lighthouse
- [ ] Deployment: Postgres, secrets, hosting
- [ ] 30-50 real articles
- [ ] Replace seeded accounts and sample articles

## Done: image upload (local disk)

- Staff-only upload endpoint: JPEG, PNG, WebP up to 4 MB (Vercel rejects larger requests). Real file type is read from the file's first bytes, so a script renamed to .jpg is rejected. Files get random names.
- Stored in healthnest/uploads/ (git-ignored) and served through a route that only accepts the random file pattern.
- Editor: cover image uploader with preview, plus an Image button in the body toolbar (alt text required).
- Article HTML may only contain images from our own uploads. External images are stripped on save.
- Admin media library at /admin/media; only unused images can be deleted.
- Tested: logged-out, fake image, SVG, empty, oversize, path traversal, cover save, external image stripping, delete rules.
- Before launch: move storage to Cloudinary or S3 (change src/lib/storage.js only), and add image resizing.

## Done: category and condition management

- Admin screens at `/admin/categories` and `/admin/conditions`: add, edit, activate or deactivate, delete.
- Category slugs become root URLs, so reserved route names and static-page slugs (like `about`) are rejected, and duplicates are blocked.
- A slug is locked once a category or condition has articles, so live URLs do not change.
- Items in use cannot be deleted (server-checked); deactivate them instead. A deactivated category's page and menu link disappear while its articles stay live.
- Header and sitemap update immediately.
- Not re-tested after this change: a freelancer opening these admin screens (same admin gate as before).

## Done: automated tests

- Run with `npm test` (inside `healthnest/`). 373 tests, about 20 seconds.
- Unit: every status transition for every role (208 cases), edit/view rules, submit/publish validation, slugs, HTML sanitizer, image type detection, rate limiter.
- Integration: the real server actions against `prisma/test.db` (rebuilt each run; the dev database is never touched): article save/submit/review/publish, login and lock-out, user management, session guards (deactivated accounts), categories and conditions, image upload and serving, media delete, newsletter.
- Found and fixed while writing them: the review panel offered an approved-to-changes-requested step the rules do not allow.
- Not covered: page rendering and the browser editor (checked by hand), real cookie signing, email.
- Not done: a check that deliberately breaks a rule to prove a test fails. It was attempted and blocked, so it is left for you to run if you want it.

## Done: frontend polish

- Home: hero with search and popular topics, featured article plus numbered trending list, colour-coded topic tiles, latest, tools, a trust strip, newsletter band.
- Sticky header, mobile menu, and a phone-only bottom bar (Home, Topics, Tools, Search).
- Article page: summary line, author line with dates, share buttons, sticky sidebar with contents, newsletter and tools, author card, related articles. Contents panel moves inline on phones.
- Cards show a per-category colour when an article has no cover image. Category pages have a header band with condition chips.
- Fuller footer, cookie notice, error page, polished empty states.
- View counting: counts once per visitor per article per 30 minutes, ignores crawlers, published articles only. Feeds the admin Most viewed list.
- Checked: no sideways scrolling on any public page at 375px, correct navigation at phone and desktop widths, 404s still real 404s.
- Not checked: screenshots (the browser pane was hidden), so colours and spacing have not been looked at by eye. Please look at it yourself.
- Dropped on purpose: a loading skeleton, because it made missing pages return status 200 instead of 404.

## Done: redesign to look less generic (second pass)

- Rebuilt the public look using the ibelick/ui-skills and emilkowalski/skills rules. Rules are written down in `healthnest/DESIGN.md`.
- Removed: gradient hero, pill chips, coloured topic tiles, card hover-lift, placeholder image boxes, initials avatars, marketing trust strip, glass header.
- Now: flat editorial layout (top story, latest list, headlines per topic, topic index), text-first article rows with a small image only when one exists, one accent colour, hairline borders, tabular numbers, balanced headings.
- Motion: colour and press feedback only, 200ms or less, hover effects only on real pointers.
- Added: real site icon, theme colour, Twitter card tags, one canonical URL per page.
- Worst-case pass (long unbroken text, 320px, right-to-left) found and fixed four real bugs: no side margins on phones, long category names widening the page, section headings that would not wrap, and an off-screen skip link widening right-to-left pages.
- Checked by eye: home and article at desktop width, home at phone width in dark mode. Not checked by eye: category, search, tools, conditions and the staff dashboards after the restyle.

## Done: premium redesign (third pass)

- Asked for: no generic AI look, premium icons and colours, shadcn/ui, Three.js and GSAP. Rules are in `healthnest/DESIGN.md`.
- New palette (warm paper, petrol, saffron) and fonts (Newsreader + Manrope). shadcn/ui tokens and components (Button, Input, Badge, Card, Separator, Sheet) written into the project.
- lucide icons for topics, tools, navigation and share buttons. Mobile menu is a proper dialog.
- Home hero with a Three.js heartbeat scene (own lazy-loaded chunk, pauses off-screen, still frame for reduced motion or weak devices).
- GSAP: scroll reveals, article reading bar, 3D parallax and fade-in.
- Not installed (by decision): the pasted `npx skills add` and `/plugin marketplace` commands, and `git clone` of pinkforest/threejs-playground (that URL returns 404). The GSAP skill files were read directly instead.
- Checked: console, hero visible without waiting for JS, reveals complete, phone layout has no overlap or sideways scroll, menu opens and closes with a real click and Escape.
- Not done: category, search, tools, conditions and dashboard pages were not restyled with the new components (they pick up the new colours and fonts, but still use the older plain styles). Paid icon sets were not used (not available without a licence); lucide is free.
- Cost: the 3D library is about 180 KB gzipped, loaded only on the home page.

## Done: remaining pages restyled + bento grid (fourth pass)

- Studied Healthline's hub, condition and article page structure and borrowed the patterns (not the look). Bento grid added (`src/components/Bento.js`).
- Restyled: home topic index (bento), category hubs (sub-navigation, bento featured block, a section per condition), condition hubs (on-this-page bar, Discover more tiles), Conditions A-Z (letter jump bar), tools list and tool pages (bento plus How it works), search (topic filters, topic tiles when empty), author pages, About and policy pages (side navigation), 404 and error pages, and a Discover more bento at the end of articles.
- Found and fixed: search treated % and _ as wildcards (`%%` returned everything). Not injection, but fixed and tested.
- Tests: 390 passing (8 new for category counts, condition counts, topic-filtered search, wildcard handling and page order).
- Checked: all 13 restyled pages return the right status and fit at 320px with worst-case text and right-to-left; zero layout shift on the category hub; bento packs without holes at 4 and 2 columns; dark theme looked at on the tools page.
- Not checked by eye: phone width of the new bento pages and the dark theme of the category and condition hubs (measured, not looked at).
- Not restyled: the staff dashboards and login page.

## Done: reference-design theme (fifth pass)

- Rebuilt the look from a screenshot supplied by the owner (a clinic-style site). Colours were sampled from the image: white page, #EFEFEF bands, #E6E5F5 lavender, #181818 headings, indigo #514DBC. Plus Jakarta Sans throughout.
- New: floating nav pill, eyebrow labels, pill + round-arrow call to action, hero collage (3D heartbeat tile, article tile, stat tile), grey band of service-style topic cards, 'Why choose us' panel with floating tags, bento topic index.
- The reference's photos, logo and copy were not used. Without photos the collage uses real site content.
- Inner pages (categories, conditions, tools, search, authors, articles, About) take the new colours, font, radii and components automatically.
- Bugs found and fixed: a hidden byte-order mark that broke the stylesheet; the desktop nav leaking onto phones; the desktop Search button hidden by rule order.
- Checked: 12 pages fit at 320px (normal, worst-case text, right-to-left); phone view of the home page and a category hub looked at; desktop hero and panel measured (no overlaps). 390 tests, lint and build pass.
- Not looked at by eye: the desktop screens at full size (the preview shrinks wide pages), the dark theme in the new design, and the article page in the new fonts.
- Still the older look: staff login and dashboards (they take the new colours and font only).

## Done: light/dark toggle

- Toggle button in the nav pill (sun/moon). Saved in the browser; follows the system setting until the visitor chooses. Set before first paint, so no flash. Also updates the phone browser's address-bar colour.
- Dark tokens moved from a media query to a data-theme attribute so a manual choice can override the system.
- 7 new tests for the theme logic, including running the real boot script against a pretend browser.
- Checked: toggling both ways, saved choice survives navigation and beats a light system setting, dark theme looked at on a phone.
- Not checked: a real device or real browser with a dark system setting and no saved choice (the logic is tested and the default path was checked with the system on light only); the toggle with JavaScript disabled (the site then stays light).

## Done: staff login and dashboards restyled

- New staff shell (top bar, icon sidebar, tab strip on phones) with the current page highlighted; public header/footer hidden in the staff area.
- Sign-in page redesigned: show/hide password, keeps the email after an error, clears the password, and posts the form (so credentials never reach the URL).
- Admin dashboard: icon stat cards, 'all caught up' empty state, cleaner most-viewed list. Empty states on the other pages. Rounded tables, inputs, cards and badges in the new theme.
- Bugs fixed on the way: the article editor overflowed phones (fixed grid); table words broke mid-word; the sign-in form wiped the email after a failed attempt.
- 20 new tests (nav highlight, which routes are staff). 417 passing.
- Checked: all admin and writer pages return 200, fit at 320px (normal, worst-case text, right-to-left) and show the right highlighted link; a writer is still blocked from /admin; sign-in, error and sign-out flows; phone views of the admin dashboard, sign-in and writer editor (dark).
- Not checked by eye: desktop dashboards at full size beyond one table view, the review panel and categories forms visually, the sign-in page in dark mode.

## Done: email

- Works with no account: log mode saves every email to Admin, then Emails (preview, plain text and clickable links). Real sending through Resend is three settings in .env (see the README).
- Newsletter: double opt-in. Sign up, get a confirmation email, open the link, press Confirm. One-click unsubscribe page. Links last 7 days.
- Staff emails: admins are told when a writer submits; the writer is told about requested changes, approval and first publication.
- Safeguards: at most 3 confirmation emails an hour per address and none within 10 minutes of the last; the form gives the same answer whether or not an address is on the list; confirm and unsubscribe need a button press; everything a person typed is escaped in emails; subject lines cannot be used for header injection; a failed send never blocks the site; the Send test email button only mails the admin's own address and is rate-limited.
- 47 new tests (sender in both modes with a faked network, templates, the full newsletter flow, notifications). 464 passing.
- Checked in the browser: sign up, found the email in the admin log, followed its link, pressed Confirm, subscriber shown as confirmed; test-email button.
- Not done: real delivery (needs your Resend account and a verified domain), the newsletter broadcast itself, and an unsubscribe link inside a broadcast.
- Not checked: how the email looks in real mail apps (Gmail, Outlook); only the browser preview was viewed, and not by eye.

## Done: reader accounts and saved articles (2026-10-12)

- Public sign up (`/signup`), sign in (`/login`, also accepts staff, who go straight to their dashboard), and `/account` with a name editor, saved articles and sign out. Staff sign in at `/staff/login` still refuses readers.
- Header: Log in and Sign up buttons for visitors, a round profile button with a menu (account, saved articles, dashboard for staff, sign out) once signed in. Both appear in the phone menu too.
- Save button on every article; a signed-out visitor is sent to sign in and returned to the article. Only published articles can be saved; unpublished ones drop out of the list.
- Rules: new accounts are always `reader`, password 8+ characters with a letter and a number, 5 sign-ups per hour per connection, sign-in lockout as for staff, return address must be a path on this site.
- Database: new `Bookmark` table (applied by `prisma db push` on the next deploy).
- Tests: 36 new, 500 passing. The test suite now builds its own SQLite copy of the Postgres schema (`tests/globalSetup.js`), so `npm test` works again with no database setup.
- Not done: email verification, password reset, changing email or password, reading history. The new pages were compiled and unit-tested but not yet looked at in a browser.
- Gap list against healthline.com: `FEATURE_GAPS.md`.

## Done: three more calculators and a News category (2026-10-12)

- Macronutrient (calories from goal, then grams of carbs, protein and fat for three splits; calorie floor of 1,200 women / 1,500 men), Sleep (bedtime from wake-up time or the reverse, in 90-minute cycles), A1C (A1C to average glucose and back, mg/dL or mmol/L, with the cut-off band and a not-a-diagnosis note that mentions anaemia and haemoglobin variants).
- All calculator maths now lives in `src/lib/calculators.js` and is unit-tested (42 tests); the BMI, calorie and water results are unchanged.
- News: a "Health News" category (`/news`), linked first in the header. No sample news was invented, so it is empty until a writer publishes sourced items.
- Live database updated by re-running the seed (safe to repeat; it does not change existing accounts or articles).
- 542 tests passing.

## Done: video embeds (2026-10-12)

- Writers and admins can paste a YouTube link in the article editor ("Video" field). Only the 11-character video id is stored; anything that is not a single YouTube video (other sites, look-alike hosts, playlists, channels, scripts, custom ports, embedded passwords) is refused with a message and nothing is saved.
- Article page: click-to-play video under the cover image. Nothing is requested from YouTube until the reader presses play, then it plays from youtube-nocookie.com in a sandboxed frame. A line under the video says YouTube learns of the visit once it is played, and links to YouTube.
- New `/videos` page lists published articles that have a video (12 per page), linked from the footer and phone menu and included in the sitemap. Article rows show a Video tag.
- Videos live inside articles, so each one keeps its sources, author and review. Embeds written into the article body are still stripped by the sanitizer.
- Database: new nullable `videoId` column on articles (added by `prisma db push` on deploy).
- 596 tests passing (54 new for video).
- Not done: Vimeo or uploaded video, several videos per article, video structured data for search engines, a thumbnail (skipped on purpose, it would contact YouTube on page load).

## Suggested next steps
1. Email (newsletter confirmation, submit/approve notifications). Needs an email provider account from you.
3. (done) Automated tests.
## Later phases
- Phase 2: reader accounts, bookmarks, comments, drug database, recipes, freelancer payments, re-review reminders, audit log.
- Phase 3: ads, affiliate links, sponsored labeling.
- Phase 4: AI assistant, Find a Doctor, Hindi, community, reviewer badge.







