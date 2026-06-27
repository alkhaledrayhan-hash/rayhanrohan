-- Demo seed data for self-hosted Supabase deployment
-- Run AFTER `supabase db push` (schema/policies must exist).
-- Safe to re-run: uses ON CONFLICT DO NOTHING where possible.
BEGIN;

-- site_settings: 30 rows
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('admin_email','hello@maisonqatar.qa','2026-06-25T19:36:29.809011+00:00') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('auth_bg_color','','2026-06-25T19:36:29.809011+00:00') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('auth_bg_image_url','','2026-06-25T19:36:29.809011+00:00') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('auth_heading','','2026-06-25T19:36:29.809011+00:00') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('auth_signin_heading','','2026-06-25T19:36:29.809011+00:00') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('auth_signup_heading','','2026-06-25T19:36:29.809011+00:00') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('auth_subheading','','2026-06-25T19:36:29.809011+00:00') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('date_format','','2026-06-25T19:36:29.809011+00:00') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('footer_about','A curated portfolio of premium residences across Doha, The Pearl, Lusail, West Bay and Al Waab — tailored for the discerning resident.','2026-06-27T05:19:12.438453+00:00') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('footer_address','West Bay, Doha — Qatar','2026-06-27T05:19:12.438453+00:00') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('footer_badge_text','Licensed real estate brokerage · Qatar','2026-06-27T05:19:12.438453+00:00') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('footer_center_eyebrow','Doha → World','2026-06-27T05:19:12.438453+00:00') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('footer_center_subtitle','25.2854° N · 51.5310° E','2026-06-27T05:19:12.438453+00:00') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('footer_center_title','From Qatar, with intent.','2026-06-27T05:19:12.438453+00:00') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('footer_contact_heading','Contact','2026-06-27T05:19:12.438453+00:00') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('footer_copyright','© {year} {title}. All rights reserved.','2026-06-27T05:19:12.438453+00:00') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('footer_email','hello@maisonqatar.qa','2026-06-27T05:19:12.438453+00:00') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('footer_menu_json','[{"heading":"Explore","items":[{"label":"Home","to":"/"},{"label":"Properties","to":"/properties"},{"label":"Special Offers","to":"/offers"},{"label":"Our Agents","to":"/agents"}]},{"heading":"Company","items":[{"label":"About Us","to":"/about"},{"label":"News & Blog","to":"/news"},{"label":"Contact","to":"/contact"}]},{"heading":"Property Types","items":[{"label":"For Rent","to":"/properties"},{"label":"For Sale","to":"/properties"},{"label":"Apartments","to":"/properties"},{"label":"Villas","to":"/properties"}]}]','2026-06-27T05:06:16.102514+00:00') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('footer_phone','+974 4000 0000','2026-06-27T05:19:12.438453+00:00') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('header_cta_json','{"label":"Browse Listings","to":"/properties","search":{"status":"rent"},"enabled":true}','2026-06-27T05:06:16.102514+00:00') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('header_menu_json','[{"label":"Home","to":"/"},{"label":"Properties","to":"/properties","search":{"status":"all"},"children":[{"label":"For Rent","to":"/properties","search":{"status":"rent"}},{"label":"For Sale","to":"/properties","search":{"status":"sale"}},{"label":"Special Offers","to":"/offers"},{"label":"Our Agents","to":"/agents"}]},{"label":"News & Blog","to":"/news"},{"label":"About","to":"/about"},{"label":"Contact","to":"/contact"}]','2026-06-27T05:06:16.102514+00:00') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('site_currency','','2026-06-25T19:36:29.809011+00:00') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('site_language','','2026-06-25T19:36:29.809011+00:00') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('site_logo_url','','2026-06-25T19:36:29.809011+00:00') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('site_tagline','Discover your next home in Doha','2026-06-25T19:36:29.809011+00:00') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('site_timezone','Asia/Qatar','2026-06-25T19:36:29.809011+00:00') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('site_title','Ayesha Maison Qatar','2026-06-25T19:36:29.809011+00:00') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('site_url','https://rayhanrohan.vercel.app','2026-06-25T19:36:29.809011+00:00') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('time_format','','2026-06-25T19:36:29.809011+00:00') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('week_starts_on','','2026-06-25T19:36:29.809011+00:00') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('ticker_json','{"enabled":true,"speed":35,"scrollThreshold":3,"items":[{"title":"New launch: Lusail Marina Sky Apartments","link":"/properties"},{"title":"Limited offer: 10% off Pearl rentals","link":"/offers"},{"title":"Q2 yields hit record highs across West Bay","link":"/news/rental-yields-q2"},{"title":"Katara Hills launches signature villa collection","link":"/news/katara-hills-launch"}]}','2026-06-27T05:06:16.102514+00:00') ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;

-- post_categories: 7 rows
INSERT INTO public.post_categories (id,name,slug,description,created_at,updated_at) VALUES ('0e52c311-d183-4a49-8ebc-1f62965a5e07','Market Insights','market-insights','Qatar real estate market analysis','2026-06-19T18:12:35.862351+00:00','2026-06-19T18:12:35.862351+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.post_categories (id,name,slug,description,created_at,updated_at) VALUES ('d4da0c0f-0dc4-48fe-afbe-c4ca67ba1705','Lifestyle','lifestyle','Living in Qatar — neighbourhoods, dining, culture','2026-06-19T18:12:35.862351+00:00','2026-06-19T18:12:35.862351+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.post_categories (id,name,slug,description,created_at,updated_at) VALUES ('4091b8c8-7294-4602-9be6-b1509a17912f','Investment','investment','Buy-to-let, ROI, foreign ownership','2026-06-19T18:12:35.862351+00:00','2026-06-19T18:12:35.862351+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.post_categories (id,name,slug,description,created_at,updated_at) VALUES ('58d7bbe9-9911-476e-b1eb-dbdcb6166b6c','Company News','company-news','Ayesha Maison updates and announcements','2026-06-19T18:12:35.862351+00:00','2026-06-19T18:12:35.862351+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.post_categories (id,name,slug,description,created_at,updated_at) VALUES ('09588321-0142-4507-b309-60c65ba11cd9','Buyer Guides','buyer-guides','Practical guides for buyers and investors.','2026-06-19T18:23:44.633709+00:00','2026-06-19T18:23:44.633709+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.post_categories (id,name,slug,description,created_at,updated_at) VALUES ('45d15c50-eaa0-4811-a887-a6e3664b2ff3','Design','design-trends','Interior design trends and staging notes.','2026-06-19T18:23:44.633709+00:00','2026-06-19T18:23:44.633709+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.post_categories (id,name,slug,description,created_at,updated_at) VALUES ('7914e976-4f2c-42a8-b871-0df6698ebfcf','Policy','policy','Regulation, freehold and government updates.','2026-06-19T18:23:44.633709+00:00','2026-06-19T18:23:44.633709+00:00') ON CONFLICT DO NOTHING;

-- post_tags: 15 rows
INSERT INTO public.post_tags (id,name,slug,created_at) VALUES ('8d8ed885-f2af-4140-96ed-198c7c2ca4ae','West Bay','west-bay','2026-06-19T18:12:35.862351+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.post_tags (id,name,slug,created_at) VALUES ('63c92a0c-cff4-4261-86d9-5d87ef54db38','Pearl','pearl','2026-06-19T18:12:35.862351+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.post_tags (id,name,slug,created_at) VALUES ('f9fa5004-bbcd-4074-873f-434d090cc35c','Lusail','lusail','2026-06-19T18:12:35.862351+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.post_tags (id,name,slug,created_at) VALUES ('66be6e4e-0103-480e-8c97-76c2c94ab2d5','Apartment','apartment','2026-06-19T18:12:35.862351+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.post_tags (id,name,slug,created_at) VALUES ('db7a48a6-ecc9-4dc2-bb57-7d484fd2bd6a','Villa','villa','2026-06-19T18:12:35.862351+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.post_tags (id,name,slug,created_at) VALUES ('d97154e9-129f-42b8-9e9d-6f5b429c7d08','Rental','rental','2026-06-19T18:12:35.862351+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.post_tags (id,name,slug,created_at) VALUES ('e313697d-f84b-4a27-b47e-3daa843c5d9b','Sale','sale','2026-06-19T18:12:35.862351+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.post_tags (id,name,slug,created_at) VALUES ('670aa65e-85d0-4637-a1a6-ff2f50ab1a18','Market','market','2026-06-19T18:23:44.633709+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.post_tags (id,name,slug,created_at) VALUES ('6f6d2042-2e67-49c1-9162-dee07f2347e8','Guide','guide','2026-06-19T18:23:44.633709+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.post_tags (id,name,slug,created_at) VALUES ('c5fa81d3-785e-435a-aeb9-df6e6c057eba','Data','data','2026-06-19T18:23:44.633709+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.post_tags (id,name,slug,created_at) VALUES ('47d10d73-e5ce-414f-8755-9ae458f1b6fb','Design','design','2026-06-19T18:23:44.633709+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.post_tags (id,name,slug,created_at) VALUES ('b9c84722-d906-413e-8e74-76ca6b3f4a92','Policy','policy','2026-06-19T18:23:44.633709+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.post_tags (id,name,slug,created_at) VALUES ('660c896b-f982-4cde-9649-2fefb4a94b40','Advice','advice','2026-06-19T18:23:44.633709+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.post_tags (id,name,slug,created_at) VALUES ('1735e056-da77-4cec-b3c5-079cd0fad14c','Launch','launch','2026-06-19T18:23:44.633709+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.post_tags (id,name,slug,created_at) VALUES ('73b95ea8-f151-4812-a1a5-557babbe228e','Selling','selling','2026-06-19T18:23:44.633709+00:00') ON CONFLICT DO NOTHING;

-- posts: 8 rows
INSERT INTO public.posts (id,slug,title,excerpt,content,cover_image,category_id,type,status,published_at,author_id,created_at,updated_at,is_featured) VALUES ('928612d9-5a19-41ba-b795-6f5f4680e343','buying-guide-pearl','A buyer''s guide to The Pearl: districts, freehold rules & value','From Porto Arabia to Qanat Quartier, here''s how each district compares on lifestyle, yields and resale potential.','The Pearl-Qatar remains the country''s most recognised freehold address — and for good reason. Eleven distinct districts, each with its own architectural language, give buyers an unusually wide spread of price points and lifestyles within a single master plan.

Porto Arabia anchors the island with marina-front towers, the broadest rental pool, and the most liquid resale market. Qanat Quartier, with its Venetian-inspired townhouses and pastel facades, attracts long-term residents who prize quiet streets over skyline views.

Freehold rules across The Pearl are unusually clear: any nationality may purchase, and ownership confers residency for the buyer and immediate family. Service charges vary meaningfully between districts — a detail many first-time buyers underweight.

Our shortlist for value in 2026 leans toward the smaller marina-view units in Porto Arabia and the back-canal townhouses in Qanat Quartier — both segments where rental demand consistently outpaces supply.','/src/assets/prop-1.jpg',(SELECT id FROM public.post_categories WHERE slug = 'buyer-guides'),'blog','published','2026-06-10T00:00:00+00:00',NULL,'2026-06-19T18:23:44.633709+00:00','2026-06-19T18:23:44.633709+00:00',FALSE) ON CONFLICT DO NOTHING;
INSERT INTO public.posts (id,slug,title,excerpt,content,cover_image,category_id,type,status,published_at,author_id,created_at,updated_at,is_featured) VALUES ('3a1b53ec-24e6-4bd5-9013-4fc73de1b08c','rental-yields-q2','Q2 2026 rental yields: West Bay edges past Lusail','Our quarterly index shows West Bay apartments delivering 6.4% gross yields, outpacing Lusail for the first time since 2024.','West Bay reclaimed the top spot in MaisonQatar''s quarterly yield index this quarter, with average gross yields of 6.4% across one- and two-bedroom apartments — a 40 basis-point lead over Lusail.

The shift is driven by two forces: corporate tenant demand near the diplomatic and financial cluster, and softer asking rents on a handful of newer Lusail towers still in lease-up.

Investors evaluating the two markets should weigh more than yield. Capital values in Lusail are still appreciating faster on a 12-month basis, and the long-term pipeline of amenities favours the newer city.

We expect the yield gap to narrow again in Q3 as Lusail occupancy ticks up — but for income-focused buyers, West Bay remains the more efficient entry point this summer.','/src/assets/prop-4.jpg',(SELECT id FROM public.post_categories WHERE slug = 'market-insights'),'news','published','2026-06-06T00:00:00+00:00',NULL,'2026-06-19T18:23:44.633709+00:00','2026-06-19T18:23:44.633709+00:00',FALSE) ON CONFLICT DO NOTHING;
INSERT INTO public.posts (id,slug,title,excerpt,content,cover_image,category_id,type,status,published_at,author_id,created_at,updated_at,is_featured) VALUES ('f762a99a-3757-456e-90dd-02983c190085','interior-trends-2026','Five interior trends defining Doha''s premium residences this year','Warm minimalism, travertine accents, and biophilic layouts are reshaping how Doha lives indoors.','After a decade of glossy white kitchens and chrome-heavy lobbies, Doha''s premium interiors are settling into something quieter. Warm minimalism — driven by oak millwork, plaster walls, and muted earth palettes — leads the brief on most of our 2026 staging projects.

Travertine is the material of the year. We''re seeing it on bathroom slabs, fluted vanities, and even kitchen islands. Buyers respond to its softness against the harder Gulf light.

Biophilic layouts — rooms organised around a central planted court or double-height window wall — are quietly reshaping floor plates in The Pearl and Lusail. The result reads less hotel, more home.

Lighting is doing more work than ever. Layered warm-LED schemes (2700K and below) at multiple heights are now standard in the residences that show best at viewings.','/src/assets/prop-5.jpg',(SELECT id FROM public.post_categories WHERE slug = 'design-trends'),'blog','published','2026-05-30T00:00:00+00:00',NULL,'2026-06-19T18:23:44.633709+00:00','2026-06-19T18:23:44.633709+00:00',FALSE) ON CONFLICT DO NOTHING;
INSERT INTO public.posts (id,slug,title,excerpt,content,cover_image,category_id,type,status,published_at,author_id,created_at,updated_at,is_featured) VALUES ('54b2ab20-4b81-499a-b6a6-ada1c2d731b4','freehold-expansion','Government expands freehold zones for foreign investors','Two new districts have been added to the list of areas where non-Qataris can purchase freehold residential property.','A cabinet decision published this week adds two further districts to the country''s freehold map for non-Qatari buyers, bringing the total to eleven designated zones.

The newly opened districts are positioned around emerging mixed-use corridors and are expected to attract both end-users and yield-focused investors over the next 12-18 months.

Existing freehold residency benefits — including renewable residency for the owner and dependents — extend to the new zones under the same conditions.

We expect early pricing in the new districts to settle 8-12% below comparable stock in The Pearl, with room for compression as infrastructure matures.','/src/assets/prop-2.jpg',(SELECT id FROM public.post_categories WHERE slug = 'policy'),'news','published','2026-05-22T00:00:00+00:00',NULL,'2026-06-19T18:23:44.633709+00:00','2026-06-19T18:23:44.633709+00:00',FALSE) ON CONFLICT DO NOTHING;
INSERT INTO public.posts (id,slug,title,excerpt,content,cover_image,category_id,type,status,published_at,author_id,created_at,updated_at,is_featured) VALUES ('2ef4def6-2ed1-4a40-8ac8-f8f5b47ceff6','first-time-buyer','First-time buyer in Doha? Here''s what to budget beyond the price','Transfer fees, agency commissions, service charges and snagging — the real cost of ownership, unpacked.','The headline price on a property is rarely the all-in number. For first-time buyers in Doha, a realistic budget should add 4-6% on top of the asking price to cover transfer, legal, and onboarding costs.

Service charges deserve more attention than they usually get. On premium towers, expect QAR 18-32 per square metre per year — a figure that materially affects net yield on rental units.

Snagging is the most under-budgeted line for off-plan buyers. We recommend setting aside 0.5-1% of the unit price for a professional snagging pass and the remediation it surfaces.

Finally: factor in furnishing. A move-in-ready three-bedroom in The Pearl typically takes QAR 250k-450k to outfit to a standard that matches the address.','/src/assets/prop-6.jpg',(SELECT id FROM public.post_categories WHERE slug = 'buyer-guides'),'blog','published','2026-05-18T00:00:00+00:00',NULL,'2026-06-19T18:23:44.633709+00:00','2026-06-19T18:23:44.633709+00:00',FALSE) ON CONFLICT DO NOTHING;
INSERT INTO public.posts (id,slug,title,excerpt,content,cover_image,category_id,type,status,published_at,author_id,created_at,updated_at,is_featured) VALUES ('09309048-529c-41b5-9394-c04630b35d7a','katara-hills-launch','Katara Hills launches its second residential phase','Twelve hillside villas and a clubhouse arrive in Q4, with prices starting from QAR 9.5M.','Katara Hills'' second phase brings twelve hillside villas to market, alongside a private members'' clubhouse and a landscaped wadi walk linking the development to the wider cultural quarter.

Plot sizes range from 720 to 1,150 square metres, with five-bedroom configurations leading the launch. Prices begin at QAR 9.5M for the lower-tier villas and rise above QAR 16M for the wadi-facing plots.

The developer has confirmed that the clubhouse will operate on a residents-only basis, with concierge, spa, and a 25-metre lap pool included in the service-charge package.

Handover is targeted for Q4 2026. MaisonQatar holds preferred-broker status for the launch.','/src/assets/prop-7.jpg',(SELECT id FROM public.post_categories WHERE slug = 'market-insights'),'news','published','2026-05-12T00:00:00+00:00',NULL,'2026-06-19T18:23:44.633709+00:00','2026-06-19T18:23:44.633709+00:00',FALSE) ON CONFLICT DO NOTHING;
INSERT INTO public.posts (id,slug,title,excerpt,content,cover_image,category_id,type,status,published_at,author_id,created_at,updated_at,is_featured) VALUES ('e16306a5-30ee-4ab0-86e9-faffdc7ab59a','staging-for-sale','Staging your villa for sale: the small moves that lift offers 8%','Lighting, scent, and curated negative space — practical staging notes from our top-performing listings.','Across our 2025-26 sale listings, professionally staged villas closed an average of 7.9% above comparable unstaged stock — and typically 18 days faster.

The single biggest lever is light. Replacing cool-white bulbs with warm 2700K LEDs across the principal rooms transformed how buyers responded to the space at evening viewings.

Scent matters more than most sellers admit. A single neutral diffuser per floor — cedar or fig, never floral — sets the tone without crossing into showroom territory.

Finally: edit ruthlessly. Removing 30-40% of the furniture and personal items from the principal living spaces lets the architecture do the selling. The villa always shows bigger than the listing photos suggest.','/src/assets/prop-2.jpg',(SELECT id FROM public.post_categories WHERE slug = 'design-trends'),'blog','published','2026-05-04T00:00:00+00:00',NULL,'2026-06-19T18:23:44.633709+00:00','2026-06-19T18:23:44.633709+00:00',FALSE) ON CONFLICT DO NOTHING;
INSERT INTO public.posts (id,slug,title,excerpt,content,cover_image,category_id,type,status,published_at,author_id,created_at,updated_at,is_featured) VALUES ('a888b429-60cb-4de0-bb30-4ca8c39ad658','lusail-skyline-2026','Lusail skyline reaches new heights as four towers near completion','Qatar''s flagship master-planned city welcomes four new mixed-use towers, expanding premium inventory in West Lusail.','','/src/assets/prop-3.jpg',(SELECT id FROM public.post_categories WHERE slug = 'market-insights'),'news','published','2026-06-14T00:00:00+00:00',NULL,'2026-06-19T18:23:44.633709+00:00','2026-06-20T18:04:39.480378+00:00',FALSE) ON CONFLICT DO NOTHING;

-- post_tag_links: 8 rows
INSERT INTO public.post_tag_links (post_id, tag_id)
SELECT p.id, t.id FROM public.posts p CROSS JOIN public.post_tags t
WHERE p.slug = 'buying-guide-pearl' AND t.slug = 'guide'
ON CONFLICT DO NOTHING;
INSERT INTO public.post_tag_links (post_id, tag_id)
SELECT p.id, t.id FROM public.posts p CROSS JOIN public.post_tags t
WHERE p.slug = 'rental-yields-q2' AND t.slug = 'data'
ON CONFLICT DO NOTHING;
INSERT INTO public.post_tag_links (post_id, tag_id)
SELECT p.id, t.id FROM public.posts p CROSS JOIN public.post_tags t
WHERE p.slug = 'interior-trends-2026' AND t.slug = 'design'
ON CONFLICT DO NOTHING;
INSERT INTO public.post_tag_links (post_id, tag_id)
SELECT p.id, t.id FROM public.posts p CROSS JOIN public.post_tags t
WHERE p.slug = 'freehold-expansion' AND t.slug = 'policy'
ON CONFLICT DO NOTHING;
INSERT INTO public.post_tag_links (post_id, tag_id)
SELECT p.id, t.id FROM public.posts p CROSS JOIN public.post_tags t
WHERE p.slug = 'first-time-buyer' AND t.slug = 'advice'
ON CONFLICT DO NOTHING;
INSERT INTO public.post_tag_links (post_id, tag_id)
SELECT p.id, t.id FROM public.posts p CROSS JOIN public.post_tags t
WHERE p.slug = 'katara-hills-launch' AND t.slug = 'launch'
ON CONFLICT DO NOTHING;
INSERT INTO public.post_tag_links (post_id, tag_id)
SELECT p.id, t.id FROM public.posts p CROSS JOIN public.post_tags t
WHERE p.slug = 'staging-for-sale' AND t.slug = 'selling'
ON CONFLICT DO NOTHING;
INSERT INTO public.post_tag_links (post_id, tag_id)
SELECT p.id, t.id FROM public.posts p CROSS JOIN public.post_tags t
WHERE p.slug = 'lusail-skyline-2026' AND t.slug = 'market'
ON CONFLICT DO NOTHING;

-- properties: 20 approved demo listings, including 5 active offers
INSERT INTO public.properties (
  slug,title,location,address,type,status,price,bedrooms,bathrooms,rooms,sqft,year_built,image,gallery,description,features,verified,listing_status,is_offer,offer_discount,offer_tag,offer_ends
) VALUES
('pearl-marina-residence','Pearl Marina Residence','The Pearl','Porto Arabia Tower 18','Apartment','rent',18500,2,3,4,1650,2021,'/src/assets/prop-1.jpg','["/src/assets/prop-1.jpg","/src/assets/prop-2.jpg","/src/assets/prop-3.jpg","/src/assets/prop-4.jpg","/src/assets/prop-5.jpg"]'::jsonb,'A bright marina-facing residence with generous living space, balcony views and serviced tower amenities.','["Marina view","Balcony","Gym","Pool","Concierge"]'::jsonb,TRUE,'approved',TRUE,10,'Pearl Deal','2026-12-31'),
('lusail-skyline-penthouse','Lusail Skyline Penthouse','Lusail','Marina District','Penthouse','sale',7200000,4,5,7,4200,2024,'/src/assets/prop-3.jpg','["/src/assets/prop-3.jpg","/src/assets/prop-4.jpg","/src/assets/prop-5.jpg","/src/assets/prop-6.jpg","/src/assets/prop-7.jpg"]'::jsonb,'A full-floor penthouse overlooking Lusail Marina with private lift access and refined entertaining zones.','["Sea view","Private lift","Maid room","Smart home","Two parking spaces"]'::jsonb,TRUE,'approved',TRUE,7,'Launch Offer','2026-11-30'),
('west-bay-executive-suite','West Bay Executive Suite','West Bay','Diplomatic Street','Apartment','rent',14500,1,2,3,1050,2020,'/src/assets/prop-4.jpg','["/src/assets/prop-4.jpg","/src/assets/prop-5.jpg","/src/assets/prop-6.jpg","/src/assets/prop-7.jpg","/src/assets/prop-1.jpg"]'::jsonb,'A furnished executive apartment minutes from Doha business towers, hotels and waterfront dining.','["Furnished","City view","Housekeeping option","Gym","Covered parking"]'::jsonb,TRUE,'approved',FALSE,0,NULL,NULL),
('al-waab-family-villa','Al Waab Family Villa','Al Waab','Near Aspire Zone','Villa','rent',32000,5,6,9,6100,2018,'/src/assets/prop-2.jpg','["/src/assets/prop-2.jpg","/src/assets/prop-1.jpg","/src/assets/prop-3.jpg","/src/assets/prop-6.jpg","/src/assets/prop-7.jpg"]'::jsonb,'A private family villa with landscaped garden, driver room and easy access to Aspire and Villaggio.','["Private garden","Driver room","Maid room","Outdoor majlis","Covered parking"]'::jsonb,TRUE,'approved',TRUE,12,'Family Offer','2026-10-15'),
('doha-corniche-studio','Doha Corniche Studio','Doha','Corniche Road','Studio','rent',6800,0,1,1,520,2019,'/src/assets/prop-7.jpg','["/src/assets/prop-7.jpg","/src/assets/prop-6.jpg","/src/assets/prop-5.jpg","/src/assets/prop-4.jpg","/src/assets/prop-3.jpg"]'::jsonb,'A compact city studio ideal for professionals wanting quick access to the Corniche and metro links.','["Furnished","City view","Security","Shared gym","Metro access"]'::jsonb,FALSE,'approved',FALSE,0,NULL,NULL),
('pearl-qanat-townhouse','Pearl Qanat Townhouse','The Pearl','Qanat Quartier','Townhouse','sale',5100000,3,4,6,2850,2017,'/src/assets/prop-5.jpg','["/src/assets/prop-5.jpg","/src/assets/prop-1.jpg","/src/assets/prop-2.jpg","/src/assets/prop-3.jpg","/src/assets/prop-4.jpg"]'::jsonb,'A canal-side townhouse with pastel facades, direct promenade access and a peaceful residential feel.','["Canal view","Terrace","Beach access","Maid room","Private parking"]'::jsonb,TRUE,'approved',FALSE,0,NULL,NULL),
('lusail-marina-apartment','Lusail Marina Apartment','Lusail','Fox Hills Avenue','Apartment','rent',12000,2,2,4,1380,2023,'/src/assets/prop-6.jpg','["/src/assets/prop-6.jpg","/src/assets/prop-3.jpg","/src/assets/prop-4.jpg","/src/assets/prop-7.jpg","/src/assets/prop-1.jpg"]'::jsonb,'A modern two-bedroom apartment with smart layout and fast access to Lusail Boulevard.','["Balcony","Gym","Pool","Kids area","Covered parking"]'::jsonb,TRUE,'approved',FALSE,0,NULL,NULL),
('west-bay-lagoon-villa','West Bay Lagoon Villa','West Bay','West Bay Lagoon','Villa','sale',9800000,6,7,10,7800,2016,'/src/assets/prop-2.jpg','["/src/assets/prop-2.jpg","/src/assets/prop-4.jpg","/src/assets/prop-5.jpg","/src/assets/prop-6.jpg","/src/assets/prop-1.jpg"]'::jsonb,'A substantial lagoon villa with generous reception rooms, staff quarters and a resort-style pool deck.','["Private pool","Lagoon access","Majlis","Staff quarters","Large garden"]'::jsonb,TRUE,'approved',TRUE,6,'Villa Offer','2026-12-20'),
('doha-msheireb-loft','Msheireb Design Loft','Doha','Msheireb Downtown','Apartment','sale',3650000,2,3,4,1720,2022,'/src/assets/prop-7.jpg','["/src/assets/prop-7.jpg","/src/assets/prop-1.jpg","/src/assets/prop-5.jpg","/src/assets/prop-6.jpg","/src/assets/prop-4.jpg"]'::jsonb,'A design-led city loft in walkable Msheireb with heritage views and premium community facilities.','["Walkable district","High ceilings","Smart home","Gym","Valet option"]'::jsonb,TRUE,'approved',FALSE,0,NULL,NULL),
('al-waab-garden-townhouse','Al Waab Garden Townhouse','Al Waab','Al Waab Street','Townhouse','rent',21000,4,4,7,3600,2019,'/src/assets/prop-5.jpg','["/src/assets/prop-5.jpg","/src/assets/prop-2.jpg","/src/assets/prop-1.jpg","/src/assets/prop-6.jpg","/src/assets/prop-3.jpg"]'::jsonb,'A well-planned townhouse with family garden, bright bedrooms and convenient school access.','["Garden","Maid room","Storage","Covered parking","Family compound"]'::jsonb,FALSE,'approved',FALSE,0,NULL,NULL),
('pearl-viva-bahriya-3br','Viva Bahriya Beachfront 3BR','The Pearl','Viva Bahriya','Apartment','rent',22500,3,4,6,2450,2020,'/src/assets/prop-1.jpg','["/src/assets/prop-1.jpg","/src/assets/prop-6.jpg","/src/assets/prop-7.jpg","/src/assets/prop-2.jpg","/src/assets/prop-4.jpg"]'::jsonb,'A beachfront apartment with wide balcony, open-plan living and direct access to resort amenities.','["Beach access","Sea view","Balcony","Pool","Concierge"]'::jsonb,TRUE,'approved',TRUE,8,'Beach Offer','2026-09-30'),
('lusail-boulevard-studio','Lusail Boulevard Studio','Lusail','Lusail Boulevard','Studio','rent',6200,0,1,1,480,2024,'/src/assets/prop-3.jpg','["/src/assets/prop-3.jpg","/src/assets/prop-7.jpg","/src/assets/prop-4.jpg","/src/assets/prop-5.jpg","/src/assets/prop-6.jpg"]'::jsonb,'A new studio apartment close to cafes, tram stops and the growing Lusail lifestyle district.','["New building","Balcony","Tram access","Gym","Security"]'::jsonb,FALSE,'approved',FALSE,0,NULL,NULL),
('west-bay-corporate-2br','West Bay Corporate 2BR','West Bay','Conference Centre Street','Apartment','rent',16000,2,3,4,1520,2021,'/src/assets/prop-4.jpg','["/src/assets/prop-4.jpg","/src/assets/prop-1.jpg","/src/assets/prop-7.jpg","/src/assets/prop-3.jpg","/src/assets/prop-2.jpg"]'::jsonb,'A corporate-ready two bedroom with hotel-style services and excellent access to business hubs.','["Furnished","City view","Housekeeping","Gym","Business lounge"]'::jsonb,TRUE,'approved',FALSE,0,NULL,NULL),
('doha-old-airport-apartment','Doha Central Apartment','Doha','Old Airport Road','Apartment','sale',1450000,2,2,4,1180,2018,'/src/assets/prop-6.jpg','["/src/assets/prop-6.jpg","/src/assets/prop-2.jpg","/src/assets/prop-3.jpg","/src/assets/prop-4.jpg","/src/assets/prop-5.jpg"]'::jsonb,'A practical central apartment with strong rental appeal and easy routes across Doha.','["Covered parking","Security","Balcony","Near metro","Good yield"]'::jsonb,FALSE,'approved',FALSE,0,NULL,NULL),
('al-waab-compound-villa','Al Waab Compound Villa','Al Waab','Family Compound 24','Villa','rent',28500,4,5,8,5200,2020,'/src/assets/prop-2.jpg','["/src/assets/prop-2.jpg","/src/assets/prop-5.jpg","/src/assets/prop-7.jpg","/src/assets/prop-1.jpg","/src/assets/prop-4.jpg"]'::jsonb,'A compound villa with shared clubhouse, pool, gym and family-friendly outdoor spaces.','["Compound pool","Clubhouse","Maid room","Garden","Play area"]'::jsonb,TRUE,'approved',FALSE,0,NULL,NULL),
('pearl-porto-1br','Porto Arabia 1BR','The Pearl','Porto Arabia','Apartment','sale',1900000,1,2,3,980,2019,'/src/assets/prop-1.jpg','["/src/assets/prop-1.jpg","/src/assets/prop-3.jpg","/src/assets/prop-5.jpg","/src/assets/prop-7.jpg","/src/assets/prop-6.jpg"]'::jsonb,'A liquid one-bedroom investment unit in a prime marina tower with proven rental demand.','["Marina view","Balcony","Gym","Pool","Investment unit"]'::jsonb,TRUE,'approved',FALSE,0,NULL,NULL),
('lusail-waterfront-villa','Lusail Waterfront Villa','Lusail','Waterfront District','Villa','sale',11200000,5,6,9,6900,2025,'/src/assets/prop-3.jpg','["/src/assets/prop-3.jpg","/src/assets/prop-2.jpg","/src/assets/prop-4.jpg","/src/assets/prop-6.jpg","/src/assets/prop-1.jpg"]'::jsonb,'A statement waterfront villa with contemporary architecture and exceptional outdoor entertaining areas.','["Waterfront","Private pool","Elevator","Smart home","Show kitchen"]'::jsonb,TRUE,'approved',FALSE,0,NULL,NULL),
('west-bay-serviced-studio','West Bay Serviced Studio','West Bay','Onaiza District','Studio','rent',7900,0,1,1,610,2021,'/src/assets/prop-4.jpg','["/src/assets/prop-4.jpg","/src/assets/prop-7.jpg","/src/assets/prop-6.jpg","/src/assets/prop-5.jpg","/src/assets/prop-1.jpg"]'::jsonb,'A serviced studio with utilities package options and quick access to diplomatic area offices.','["Serviced","Utilities option","Gym","Pool","Reception"]'::jsonb,FALSE,'approved',FALSE,0,NULL,NULL),
('doha-family-apartment','Doha Family Apartment','Doha','Najma','Apartment','rent',9500,3,3,5,1680,2017,'/src/assets/prop-7.jpg','["/src/assets/prop-7.jpg","/src/assets/prop-5.jpg","/src/assets/prop-4.jpg","/src/assets/prop-2.jpg","/src/assets/prop-3.jpg"]'::jsonb,'A spacious family apartment with practical room sizes and convenient access to schools and supermarkets.','["Family layout","Balcony","Covered parking","Security","Storage"]'::jsonb,FALSE,'approved',FALSE,0,NULL,NULL),
('al-waab-modern-penthouse','Al Waab Modern Penthouse','Al Waab','Aspire View','Penthouse','sale',5900000,4,5,7,3900,2023,'/src/assets/prop-5.jpg','["/src/assets/prop-5.jpg","/src/assets/prop-6.jpg","/src/assets/prop-1.jpg","/src/assets/prop-2.jpg","/src/assets/prop-7.jpg"]'::jsonb,'A rare penthouse with private terrace, skyline outlook and quick access to Aspire Zone.','["Private terrace","Aspire view","Maid room","Smart home","Two parking spaces"]'::jsonb,TRUE,'approved',FALSE,0,NULL,NULL)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  location = EXCLUDED.location,
  address = EXCLUDED.address,
  type = EXCLUDED.type,
  status = EXCLUDED.status,
  price = EXCLUDED.price,
  bedrooms = EXCLUDED.bedrooms,
  bathrooms = EXCLUDED.bathrooms,
  rooms = EXCLUDED.rooms,
  sqft = EXCLUDED.sqft,
  year_built = EXCLUDED.year_built,
  image = EXCLUDED.image,
  gallery = EXCLUDED.gallery,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  verified = EXCLUDED.verified,
  listing_status = EXCLUDED.listing_status,
  is_offer = EXCLUDED.is_offer,
  offer_discount = EXCLUDED.offer_discount,
  offer_tag = EXCLUDED.offer_tag,
  offer_ends = EXCLUDED.offer_ends;

-- page_sections: 6 rows
INSERT INTO public.page_sections (id,page_slug,section_key,label,content,sort_order,created_at,updated_at) VALUES ('056a2a9e-8278-4386-a5da-904ba813e501','home','news_ticker','News Ticker','{"items": ["New launch: Lusail Marina Sky Apartments", "Limited offer: 10% off Pearl rentals", "Now selling: Waterfront villas in Lusail"]}'::jsonb,2,'2026-06-17T21:01:34.562958+00:00','2026-06-17T21:01:34.562958+00:00') ON CONFLICT (page_slug, section_key) DO UPDATE SET label = EXCLUDED.label, content = EXCLUDED.content, sort_order = EXCLUDED.sort_order, updated_at = EXCLUDED.updated_at;
INSERT INTO public.page_sections (id,page_slug,section_key,label,content,sort_order,created_at,updated_at) VALUES ('902803a7-c57c-431e-b6c7-d3df1072c019','home','trust','Trust Strip','{"items": [{"body": "Qatar-registered with verified listings only.", "title": "Licensed brokerage"}, {"body": "Every residence is personally inspected.", "title": "Hand-curated portfolio"}, {"body": "Book on WhatsApp or schedule in one tap.", "title": "Frictionless viewings"}]}'::jsonb,3,'2026-06-17T21:01:34.562958+00:00','2026-06-17T21:01:34.562958+00:00') ON CONFLICT (page_slug, section_key) DO UPDATE SET label = EXCLUDED.label, content = EXCLUDED.content, sort_order = EXCLUDED.sort_order, updated_at = EXCLUDED.updated_at;
INSERT INTO public.page_sections (id,page_slug,section_key,label,content,sort_order,created_at,updated_at) VALUES ('15ff8103-f785-449e-bb08-785a1708d5a8','home','featured','Featured Section Heading','{"title": "A portfolio worthy of the address", "eyebrow": "Featured residences", "link_href": "/properties", "link_label": "View all listings"}'::jsonb,4,'2026-06-17T21:01:34.562958+00:00','2026-06-17T21:01:34.562958+00:00') ON CONFLICT (page_slug, section_key) DO UPDATE SET label = EXCLUDED.label, content = EXCLUDED.content, sort_order = EXCLUDED.sort_order, updated_at = EXCLUDED.updated_at;
INSERT INTO public.page_sections (id,page_slug,section_key,label,content,sort_order,created_at,updated_at) VALUES ('7615f11d-3943-41eb-9ae2-eadb8944fb0f','home','locations','Locations Section Heading','{"title": "Live in Qatar''s most coveted neighbourhoods", "eyebrow": "Premium Qatar locations"}'::jsonb,5,'2026-06-17T21:01:34.562958+00:00','2026-06-17T21:01:34.562958+00:00') ON CONFLICT (page_slug, section_key) DO UPDATE SET label = EXCLUDED.label, content = EXCLUDED.content, sort_order = EXCLUDED.sort_order, updated_at = EXCLUDED.updated_at;
INSERT INTO public.page_sections (id,page_slug,section_key,label,content,sort_order,created_at,updated_at) VALUES ('d36c2308-bfd6-44d1-ae38-cffb7fa832d5','home','contact','Contact Section','{"email": "hello@ayeshamaison.qa", "phone": "+974 0000 0000", "title": "Speak with a Qatar property specialist", "address": "Doha, Qatar", "eyebrow": "Get in touch"}'::jsonb,6,'2026-06-17T21:01:34.562958+00:00','2026-06-17T21:01:34.562958+00:00') ON CONFLICT (page_slug, section_key) DO UPDATE SET label = EXCLUDED.label, content = EXCLUDED.content, sort_order = EXCLUDED.sort_order, updated_at = EXCLUDED.updated_at;
INSERT INTO public.page_sections (id,page_slug,section_key,label,content,sort_order,created_at,updated_at) VALUES ('f1ea8071-8923-463d-815f-05f0a9ccbbed','home','hero','Hero','{"style": {"align": "left", "cta_bg": "#7a1325", "cta_text": "#ffffff", "overlay_to": "#000000", "title_size": "xl", "title_color": "#ffffff", "overlay_from": "#000000", "eyebrow_color": "#d4af37", "subtitle_color": "#e5e7eb", "overlay_opacity": 55}, "title": "Find your address in Qatar''s most coveted neighbourhoods", "eyebrow": "Premium Qatar Real Estate", "cta_link": "/properties", "subtitle": "Handpicked apartments, villas and penthouses for rent or sale across Doha, The Pearl, Lusail, West Bay and Al Waab.", "cta_label": "Browse residences"}'::jsonb,1,'2026-06-17T21:01:34.562958+00:00','2026-06-17T23:07:07.001789+00:00') ON CONFLICT (page_slug, section_key) DO UPDATE SET label = EXCLUDED.label, content = EXCLUDED.content, sort_order = EXCLUDED.sort_order, updated_at = EXCLUDED.updated_at;

COMMIT;