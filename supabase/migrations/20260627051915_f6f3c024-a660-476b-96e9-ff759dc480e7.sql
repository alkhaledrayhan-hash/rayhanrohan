INSERT INTO public.site_settings (key, value) VALUES
  ('footer_about', 'A curated portfolio of premium residences across Doha, The Pearl, Lusail, West Bay and Al Waab — tailored for the discerning resident.'),
  ('footer_center_eyebrow', 'Doha → World'),
  ('footer_center_title', 'From Qatar, with intent.'),
  ('footer_center_subtitle', '25.2854° N · 51.5310° E'),
  ('footer_contact_heading', 'Contact'),
  ('footer_address', 'West Bay, Doha — Qatar'),
  ('footer_phone', '+974 4000 0000'),
  ('footer_email', 'hello@maisonqatar.qa'),
  ('footer_badge_text', 'Licensed real estate brokerage · Qatar'),
  ('footer_copyright', '© {year} {title}. All rights reserved.')
ON CONFLICT (key) DO NOTHING;