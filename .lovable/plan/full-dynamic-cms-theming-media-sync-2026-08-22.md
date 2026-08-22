# Full Dynamic CMS + Theming + Media Sync

A large multi-part request. Breaking into phases so you can review/approve before I build.

## Phase 1 — Theme color on form fields
- Replace remaining blue browser hover/select on `<select><option>`, autofill, checkbox/radio, focus rings with site theme tokens (`--primary`, `--gold`).
- Apply globally in `src/styles.css` (accent-color, ::selection, :focus-visible, autofill, native option highlight via `color-scheme`).

## Phase 2 — Media & Hero slider backend sync
- **Hero slider images**: Currently HeroEditor stores image paths but the slider on homepage may use seeded imports. Resolve uploaded URLs from `media` bucket + bundled fallbacks (mirror `resolvePropertyImage` pattern). Allow admin to pick/upload any image.
- **Media library**: `MediaPanel` should list every file in `media` bucket + asset folder. Fix listing query (recursive, include subfolders) and show all assets used across site.

## Phase 3 — Reorder homepage section tabs + rename
- Pages → Home tab list: drag-reorderable (or up/down buttons). Order persists to `page_sections.sort_order`.
- Frontend home page renders sections in that order (read from DB sort_order).
- Rename "Contact (homepage)" tab → **Contact**; "Locations" heading tab → **Locations**.
- Default order: Hero, Ticker, Trust, Featured, Offers, Locations, **Contact**, Partners (Contact moved above Partners as requested).

## Phase 4 — Properties page fully dynamic
New admin section: **Pages → Properties** with inner tabs:
- **All / Hero** — hero background image, eyebrow, title, subtitle (like HeroEditor pattern)
- **For Rent** — separate hero content
- **For Sale** — separate hero content
- **Layout** — columns per row (1/2/3/4), card style (`grid` | `ticket`); ticket layout = horizontal card (image left, info right) with improved design
- **Filters** — sticky sidebar on desktop; mobile/tab → floating "Refine search" button opens bottom-sheet/popup
- **Pagination** — toggle: Pagination vs Infinite-load, page size

## Phase 5 — Offers page dynamic (same structure as Properties)
Inner tabs: Hero, Layout, Pagination. Reuses ticket/grid card variants.

## Phase 6 — Agents page dynamic
Inner tabs: Hero, Layout (columns, card style), Pagination/Load-more.

## Phase 7 — News & Blog page dynamic
- Pages → News inner tabs: **All / News tab / Blog tab** hero content, Layout (cols, card style), Pagination/Load-more (per tab).

## Phase 8 — About page dynamic
Inner tabs for each section: Hero, Story, Mission, Stats, Team CTA, etc. JSON-driven editors mirroring HeroEditor.

## Phase 9 — Contact page hero + sections dynamic
- Hero (image, eyebrow, title, subtitle) — currently only channel/subject/info editor exists.
- Reuse the same pattern as home.

## Admin UX pattern
Every page in `PagesManager` gets a **nested tab strip** (Hero / Layout / Filters / Pagination / etc.) just like Home has section tabs — consistent management.

## Technical notes
- New table `page_layouts (page_slug, key, value jsonb)` OR extend `page_sections` for non-home pages by inserting rows with `page_slug='properties'`, `section_key='hero'|'layout'|'pagination'` etc. Will use the latter — no schema change beyond seeding rows + GRANTs already in place.
- Migration: seed `page_sections` rows for properties/offers/agents/news/about/contact inner sections.
- New shared components: `DynamicHero`, `PropertyTicketCard`, `MobileFiltersSheet`, `LoadMorePagination`.
- Hook: `usePageLayout(slug)` returns layout config.

## Scope check
This is ~8-10 hours of build work across ~25 files + 1 migration. I'll ship it in the phases above in order so you can review along the way.

**Confirm and I'll start with Phase 1 + 2 + 3 in the first batch** (quick wins), then Phase 4 (Properties — biggest), then the rest.
