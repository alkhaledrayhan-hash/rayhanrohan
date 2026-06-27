-- 1. Shift existing home sections so the offer block can sit at sort_order 5
update public.page_sections set sort_order = 8 where page_slug = 'home' and section_key = 'partners';
update public.page_sections set sort_order = 7 where page_slug = 'home' and section_key = 'contact';
update public.page_sections set sort_order = 6 where page_slug = 'home' and section_key = 'locations';

-- 2. Insert the new offer section if missing
insert into public.page_sections (page_slug, section_key, label, content, sort_order)
select 'home', 'offer', 'Special Offers', jsonb_build_object(
  'eyebrow', 'Limited-time offers',
  'title', 'Exclusive residences, exceptional value',
  'description', 'A short list of premium residences available at preferential pricing this season — reserved for early enquiries only.',
  'cta_label', 'See all offers',
  'cta_href', '/offers',
  'mode', 'random',
  'limit', 6,
  'only_special', true,
  'propertyIds', '[]'::jsonb
), 5
where not exists (
  select 1 from public.page_sections where page_slug='home' and section_key='offer'
);

-- 3. Seed theme settings defaults (idempotent)
insert into public.site_settings (key, value)
values
  ('theme_colors', '{"primary":"oklch(0.38 0.13 18)","primary_foreground":"oklch(0.98 0.005 80)","gold":"oklch(0.74 0.12 85)","gold_foreground":"oklch(0.2 0.02 60)","background":"oklch(1 0 0)","foreground":"oklch(0.18 0.01 60)","secondary":"oklch(0.97 0.005 80)","muted":"oklch(0.96 0.005 80)","accent":"oklch(0.96 0.02 85)","border":"oklch(0.92 0.005 80)"}'),
  ('theme_typography', '{"font_size_base":16,"font_size_sm":14,"font_size_lg":18,"font_size_xl":20,"font_size_2xl":24,"radius":8,"display_font":"Cormorant Garamond","body_font":"Inter"}')
on conflict (key) do nothing;