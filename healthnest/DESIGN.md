# Healthnestt design rules

The look follows a reference design supplied by the project owner (a clean clinic-style site): white page, light grey section bands,
one indigo, rounded white cards, pill buttons. Built on shadcn/ui, lucide icons, GSAP and Three.js. The reference's photos, logo and
copy are not used; the collage is built from real site content instead.

## Colour (sampled from the reference image)

| Token | Value | Used for |
|---|---|---|
| `--background` | `#FFFFFF` | page |
| `--secondary` | `#EFEFEF` | grey section bands, footer |
| `--nav-bg` | `#EFEFEE` | floating navigation pill |
| `--primary` | `#514DBC` | buttons, links, eyebrow labels, icon circles, the indigo tiles |
| `--lavender` / `--accent` | `#E6E5F5` | tinted image areas, icon backgrounds, soft panels |
| `--foreground` | `#181818` | headlines |
| `--muted-foreground` | `#666666` | body copy (the reference's grey, slightly darker so it passes contrast) |

Indigo averages three samples from the reference (`#5050BF`, `#4F4BB6`, `#534EC0`). Light and dark themes: a toggle in the nav pill switches them. The choice is saved in the browser; with no saved choice the site follows the system setting. A small script in the page head sets `data-theme` on the page before first paint (logic in `src/lib/theme.js`, tested), and the dark tokens live under `:root[data-theme="dark"]` in `globals.css`.
All tokens live in `src/app/globals.css` using shadcn/ui names.

## Type

- Plus Jakarta Sans for everything. Headlines are medium weight (500), body regular. One family, as in the reference.
- Small "eyebrow" labels: uppercase, bold, wide spacing, with a short line before them (`.eyebrow`).

## Shapes and components

- Floating grey navigation pill (logo left, links centre, outlined "Search" pill right). On phones, a "Menu" button opens a Radix dialog.
- Buttons are pills. The main call to action is a pill followed by a round arrow button (`CtaPair`).
- Cards are white with large radii (20px) and a soft shadow. Grey bands separate sections (`.band-grey`).
- Service-style cards: tinted image area, a round indigo icon overlapping it, title, text, "Read more".
- "Why choose us" panel: tinted panel, white pill tags, and a frosted white card with the call to action.
- Bento grid (`src/components/Bento.js`) for topic indexes, hubs, tools and "Discover more" blocks. Tones: default, soft grey, indigo, lavender.
- Icons are lucide, one line style. shadcn/ui source is in `src/components/ui`.

## Home page order

1. Hero: eyebrow, headline, text, call to action, search, topic links, and a collage (indigo tile with the 3D heartbeat, lavender article tile, grey stat tile).
2. Grey band: "Topics we cover" with three cards.
3. Latest articles.
4. "Why choose us" panel.
5. Grey band: all topics as a bento grid.
6. Tools and the weekly email.

## 3D and motion

- The 3D heartbeat (`HeroScene`) sits inside the indigo collage tile. Its colours come from `--scene-line` and `--scene-accent` set on the tile.
  Loaded only on the home page, pauses off-screen, capped pixel ratio, disposed on leave, still frame for reduced motion or weak devices, static line if WebGL is missing.
- GSAP is registered once in `src/lib/gsap.js` and always used through `useGSAP` with a scope. It drives scroll reveals, the article reading bar, the 3D parallax and fade-in.
- Only transform and opacity animate, at 200ms or less for interface feedback. Hover effects are limited to real pointers. Everything honours `prefers-reduced-motion`.
- The hero text entrance is plain CSS so the headline never waits for JavaScript.

## Staff area

- Own shell (`DashShell`): slim top bar (logo, role chip, View site, theme toggle, avatar, Sign out) and an icon sidebar that becomes a scrolling tab strip on phones. The public header, footer and notices are hidden on `/admin`, `/freelancer` and `/staff` (`ChromeGate`).
- The current sidebar link is chosen by `pickActive` (`src/lib/dashNav.js`, tested): longest matching path wins; Review queue and All articles are told apart by their `?status=` filter.
- Sign-in page: centred card, back-to-site link, theme toggle, show/hide password. Keeps the email after a failed attempt, clears and refocuses the password, and posts the form so credentials can never appear in the address bar.
- Shared pieces: `StatCard`, `.empty-state`, rounded tables (`table.t`) that keep whole words and scroll sideways inside `.table-scroll` if wide.

## Phones and worst cases

- Test at 320px, with long unbroken text, and right-to-left. No sideways scrolling.
- Respect `env(safe-area-inset-bottom)`, 16px inputs, 44px tap targets.

## Gotchas learned the hard way

- Never save `globals.css` with PowerShell's `Set-Content -Encoding utf8`: it adds a byte-order mark that stops Tailwind reading the first line.
- Unlayered CSS beats Tailwind utilities. If a Tailwind class like `hidden` seems ignored, a plain CSS rule is overriding it, and rule order decides.

## Checking a change

1. Look at 1280px and 390px, light and dark.
2. Paste very long unbroken text into titles and names; switch to right-to-left.
3. Check the console.
4. `npm test`, `npx eslint src tests`, `npm run build`.
