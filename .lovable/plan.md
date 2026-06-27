## Plan

### 1. Offer section on Home (admin Pages → Home)

- Add a new `offer` row to `page_sections` for `page='home'`, placed at `sort_order` between Featured and Location (above Location).
- Schema for `config_json`:
  - `eyebrow`, `title`, `description`, `cta_label`, `cta_href`
  - `mode`: `manual` | `random`
  - `limit`: number (default 6) — used when `random`
  - `property_ids`: string[] — used when `manual`; admin can pick any property regardless of owner/agent (own + all agents).
  - `style`: padding, bg color, card style overrides (reuse existing style schema patterns).
- New `src/components/admin/OffersSectionEditor.tsx`:
  - Mode toggle.
  - Manual: searchable multi-select listing ALL properties (with `is_special_offer` flag visible); shows owner/agent name.
  - Random: select count + filter by "only special offers" toggle.
  - Live preview card grid.
- Register editor in `PagesManager.tsx` with a Tag/Percent icon; position the virtual ordering so it appears above Location.
- Frontend `src/routes/index.tsx`: render `OffersHomeSection` consuming the config. Fetch logic in `src/lib/home-offers.ts`:
  - manual → fetch the chosen ids
  - random → fetch shuffled set (optionally filtered to `is_special_offer=true`)
- Reuse existing `PropertyCard` with offer badge + countdown when offer fields are present.

### 2. Hero tab preview improvement

- Refactor preview area inside `HeroSectionEditor.tsx` to render the actual `Hero` component (or a faithful copy) at scaled-down width.
- Use the same slide markup: full-bleed image, dark gradient overlay, eyebrow/title/description/cta buttons, slide dots, and the integrated `HeroSearch` glass panel — exactly as on the live home.
- Add toggle: "Mobile / Desktop" preview frame sizes; auto-advance slides.
- Keep the slide list editor on the left; preview pinned on the right with sticky scroll.

### 3. Central Theme & Style settings tab

- New `site_settings` keys under namespace `theme_*`:
  - `theme_colors` JSON: primary, primary-foreground, secondary, accent, gold, background, foreground, muted, border (oklch or hex).
  - `theme_typography` JSON: `font_size_sm`, `font_size_base`, `font_size_lg`, `font_size_xl`, `font_size_2xl`, `radius`, `heading_weight`, `body_weight`, font family choices.
  - `theme_spacing` JSON: section padding scale.
- New `src/components/admin/ThemeEditor.tsx` (under Settings tab):
  - Color pickers (with reset-to-default).
  - Sliders + numeric px inputs for typography sizes.
  - Live preview chip (button, heading, body sample).
- New `src/hooks/useThemeTokens.ts` fetches theme settings and injects a `<style id="dynamic-theme">` into `__root.tsx` that overrides CSS vars on `:root` (`--primary`, `--font-size-base`, `--radius`, etc.).
- `src/styles.css`: add the missing tokens (`--font-size-sm/base/lg/xl/2xl`) and route Tailwind text classes via `@theme inline` so dynamic overrides actually apply.
- Per-section override: every existing section editor already accepts a `style` block (paddings/colors). Add a "Use theme defaults" checkbox per style field; when checked, omit the value and the frontend falls back to the central theme tokens. When unchecked, the section's own value wins.

### Technical notes

- DB: 1 migration adds the `offer` page_section row and any new `site_settings` keys with sensible defaults.
- No schema columns added — everything lives in JSON `config_json` / `site_settings.value`.
- Theme override is purely CSS-variable based, so no component refactor required; sections that already read CSS vars (`var(--primary)`, etc.) automatically update.
- For per-section "custom vs theme", editors get a small `<StyleField>` wrapper that toggles between "Theme default" and a custom value, writing `null` for default.

### Out of scope (will not change)

- Existing Featured / Location / Partners / Contact editors keep their current behavior; only their style-field wrappers get the new "Use theme default" toggle.
- No changes to property card markup beyond the existing offer badge/countdown.
