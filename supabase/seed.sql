-- Demo seed data for self-hosted Supabase deployment
-- Run AFTER `supabase db push` (schema/policies must exist).
-- Safe to re-run: uses ON CONFLICT DO NOTHING where possible.
BEGIN;

-- site_settings: 30 rows
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('admin_email','hello@maisonqatar.qa','2026-06-25T19:36:29.809011+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('auth_bg_color','','2026-06-25T19:36:29.809011+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('auth_bg_image_url','','2026-06-25T19:36:29.809011+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('auth_heading','','2026-06-25T19:36:29.809011+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('auth_signin_heading','','2026-06-25T19:36:29.809011+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('auth_signup_heading','','2026-06-25T19:36:29.809011+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('auth_subheading','','2026-06-25T19:36:29.809011+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('date_format','','2026-06-25T19:36:29.809011+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('footer_about','A curated portfolio of premium residences across Doha, The Pearl, Lusail, West Bay and Al Waab — tailored for the discerning resident.','2026-06-27T05:19:12.438453+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('footer_address','West Bay, Doha — Qatar','2026-06-27T05:19:12.438453+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('footer_badge_text','Licensed real estate brokerage · Qatar','2026-06-27T05:19:12.438453+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('footer_center_eyebrow','Doha → World','2026-06-27T05:19:12.438453+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('footer_center_subtitle','25.2854° N · 51.5310° E','2026-06-27T05:19:12.438453+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('footer_center_title','From Qatar, with intent.','2026-06-27T05:19:12.438453+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('footer_contact_heading','Contact','2026-06-27T05:19:12.438453+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('footer_copyright','© {year} {title}. All rights reserved.','2026-06-27T05:19:12.438453+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('footer_email','hello@maisonqatar.qa','2026-06-27T05:19:12.438453+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('footer_menu_json','[]','2026-06-27T05:06:16.102514+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('footer_phone','+974 4000 0000','2026-06-27T05:19:12.438453+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('header_cta_json','{"label":"Browse Listings","to":"/properties","search":{"status":"rent"},"enabled":true}','2026-06-27T05:06:16.102514+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('header_menu_json','[{"label":"Home","to":"/"},{"label":"About","to":"/about"},{"label":"Properties","to":"/properties","search":{"status":"all"},"children":[{"label":"Agents","to":"/agents"}]},{"label":"Offers","to":"/offers"},{"label":"News","to":"/news"},{"label":"Contact","to":"/contact"}]','2026-06-27T05:06:16.102514+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('site_currency','','2026-06-25T19:36:29.809011+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('site_language','','2026-06-25T19:36:29.809011+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('site_logo_url','','2026-06-25T19:36:29.809011+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('site_tagline','Discover your next home in Doha','2026-06-25T19:36:29.809011+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('site_timezone','Asia/Qatar','2026-06-25T19:36:29.809011+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('site_title','Ayesha Maison Qatar','2026-06-25T19:36:29.809011+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('site_url','https://rayhanrohan.vercel.app','2026-06-25T19:36:29.809011+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('time_format','','2026-06-25T19:36:29.809011+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.site_settings (key,value,updated_at) VALUES ('week_starts_on','','2026-06-25T19:36:29.809011+00:00') ON CONFLICT DO NOTHING;

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

Our shortlist for value in 2026 leans toward the smaller marina-view units in Porto Arabia and the back-canal townhouses in Qanat Quartier — both segments where rental demand consistently outpaces supply.','/src/assets/prop-1.jpg','09588321-0142-4507-b309-60c65ba11cd9','blog','published','2026-06-10T00:00:00+00:00',NULL,'2026-06-19T18:23:44.633709+00:00','2026-06-19T18:23:44.633709+00:00',FALSE) ON CONFLICT DO NOTHING;
INSERT INTO public.posts (id,slug,title,excerpt,content,cover_image,category_id,type,status,published_at,author_id,created_at,updated_at,is_featured) VALUES ('3a1b53ec-24e6-4bd5-9013-4fc73de1b08c','rental-yields-q2','Q2 2026 rental yields: West Bay edges past Lusail','Our quarterly index shows West Bay apartments delivering 6.4% gross yields, outpacing Lusail for the first time since 2024.','West Bay reclaimed the top spot in MaisonQatar''s quarterly yield index this quarter, with average gross yields of 6.4% across one- and two-bedroom apartments — a 40 basis-point lead over Lusail.

The shift is driven by two forces: corporate tenant demand near the diplomatic and financial cluster, and softer asking rents on a handful of newer Lusail towers still in lease-up.

Investors evaluating the two markets should weigh more than yield. Capital values in Lusail are still appreciating faster on a 12-month basis, and the long-term pipeline of amenities favours the newer city.

We expect the yield gap to narrow again in Q3 as Lusail occupancy ticks up — but for income-focused buyers, West Bay remains the more efficient entry point this summer.','/src/assets/prop-4.jpg','0e52c311-d183-4a49-8ebc-1f62965a5e07','news','published','2026-06-06T00:00:00+00:00',NULL,'2026-06-19T18:23:44.633709+00:00','2026-06-19T18:23:44.633709+00:00',FALSE) ON CONFLICT DO NOTHING;
INSERT INTO public.posts (id,slug,title,excerpt,content,cover_image,category_id,type,status,published_at,author_id,created_at,updated_at,is_featured) VALUES ('f762a99a-3757-456e-90dd-02983c190085','interior-trends-2026','Five interior trends defining Doha''s premium residences this year','Warm minimalism, travertine accents, and biophilic layouts are reshaping how Doha lives indoors.','After a decade of glossy white kitchens and chrome-heavy lobbies, Doha''s premium interiors are settling into something quieter. Warm minimalism — driven by oak millwork, plaster walls, and muted earth palettes — leads the brief on most of our 2026 staging projects.

Travertine is the material of the year. We''re seeing it on bathroom slabs, fluted vanities, and even kitchen islands. Buyers respond to its softness against the harder Gulf light.

Biophilic layouts — rooms organised around a central planted court or double-height window wall — are quietly reshaping floor plates in The Pearl and Lusail. The result reads less hotel, more home.

Lighting is doing more work than ever. Layered warm-LED schemes (2700K and below) at multiple heights are now standard in the residences that show best at viewings.','/src/assets/prop-5.jpg','45d15c50-eaa0-4811-a887-a6e3664b2ff3','blog','published','2026-05-30T00:00:00+00:00',NULL,'2026-06-19T18:23:44.633709+00:00','2026-06-19T18:23:44.633709+00:00',FALSE) ON CONFLICT DO NOTHING;
INSERT INTO public.posts (id,slug,title,excerpt,content,cover_image,category_id,type,status,published_at,author_id,created_at,updated_at,is_featured) VALUES ('54b2ab20-4b81-499a-b6a6-ada1c2d731b4','freehold-expansion','Government expands freehold zones for foreign investors','Two new districts have been added to the list of areas where non-Qataris can purchase freehold residential property.','A cabinet decision published this week adds two further districts to the country''s freehold map for non-Qatari buyers, bringing the total to eleven designated zones.

The newly opened districts are positioned around emerging mixed-use corridors and are expected to attract both end-users and yield-focused investors over the next 12-18 months.

Existing freehold residency benefits — including renewable residency for the owner and dependents — extend to the new zones under the same conditions.

We expect early pricing in the new districts to settle 8-12% below comparable stock in The Pearl, with room for compression as infrastructure matures.','/src/assets/prop-2.jpg','7914e976-4f2c-42a8-b871-0df6698ebfcf','news','published','2026-05-22T00:00:00+00:00',NULL,'2026-06-19T18:23:44.633709+00:00','2026-06-19T18:23:44.633709+00:00',FALSE) ON CONFLICT DO NOTHING;
INSERT INTO public.posts (id,slug,title,excerpt,content,cover_image,category_id,type,status,published_at,author_id,created_at,updated_at,is_featured) VALUES ('2ef4def6-2ed1-4a40-8ac8-f8f5b47ceff6','first-time-buyer','First-time buyer in Doha? Here''s what to budget beyond the price','Transfer fees, agency commissions, service charges and snagging — the real cost of ownership, unpacked.','The headline price on a property is rarely the all-in number. For first-time buyers in Doha, a realistic budget should add 4-6% on top of the asking price to cover transfer, legal, and onboarding costs.

Service charges deserve more attention than they usually get. On premium towers, expect QAR 18-32 per square metre per year — a figure that materially affects net yield on rental units.

Snagging is the most under-budgeted line for off-plan buyers. We recommend setting aside 0.5-1% of the unit price for a professional snagging pass and the remediation it surfaces.

Finally: factor in furnishing. A move-in-ready three-bedroom in The Pearl typically takes QAR 250k-450k to outfit to a standard that matches the address.','/src/assets/prop-6.jpg','09588321-0142-4507-b309-60c65ba11cd9','blog','published','2026-05-18T00:00:00+00:00',NULL,'2026-06-19T18:23:44.633709+00:00','2026-06-19T18:23:44.633709+00:00',FALSE) ON CONFLICT DO NOTHING;
INSERT INTO public.posts (id,slug,title,excerpt,content,cover_image,category_id,type,status,published_at,author_id,created_at,updated_at,is_featured) VALUES ('09309048-529c-41b5-9394-c04630b35d7a','katara-hills-launch','Katara Hills launches its second residential phase','Twelve hillside villas and a clubhouse arrive in Q4, with prices starting from QAR 9.5M.','Katara Hills'' second phase brings twelve hillside villas to market, alongside a private members'' clubhouse and a landscaped wadi walk linking the development to the wider cultural quarter.

Plot sizes range from 720 to 1,150 square metres, with five-bedroom configurations leading the launch. Prices begin at QAR 9.5M for the lower-tier villas and rise above QAR 16M for the wadi-facing plots.

The developer has confirmed that the clubhouse will operate on a residents-only basis, with concierge, spa, and a 25-metre lap pool included in the service-charge package.

Handover is targeted for Q4 2026. MaisonQatar holds preferred-broker status for the launch.','/src/assets/prop-7.jpg','0e52c311-d183-4a49-8ebc-1f62965a5e07','news','published','2026-05-12T00:00:00+00:00',NULL,'2026-06-19T18:23:44.633709+00:00','2026-06-19T18:23:44.633709+00:00',FALSE) ON CONFLICT DO NOTHING;
INSERT INTO public.posts (id,slug,title,excerpt,content,cover_image,category_id,type,status,published_at,author_id,created_at,updated_at,is_featured) VALUES ('e16306a5-30ee-4ab0-86e9-faffdc7ab59a','staging-for-sale','Staging your villa for sale: the small moves that lift offers 8%','Lighting, scent, and curated negative space — practical staging notes from our top-performing listings.','Across our 2025-26 sale listings, professionally staged villas closed an average of 7.9% above comparable unstaged stock — and typically 18 days faster.

The single biggest lever is light. Replacing cool-white bulbs with warm 2700K LEDs across the principal rooms transformed how buyers responded to the space at evening viewings.

Scent matters more than most sellers admit. A single neutral diffuser per floor — cedar or fig, never floral — sets the tone without crossing into showroom territory.

Finally: edit ruthlessly. Removing 30-40% of the furniture and personal items from the principal living spaces lets the architecture do the selling. The villa always shows bigger than the listing photos suggest.','/src/assets/prop-2.jpg','45d15c50-eaa0-4811-a887-a6e3664b2ff3','blog','published','2026-05-04T00:00:00+00:00',NULL,'2026-06-19T18:23:44.633709+00:00','2026-06-19T18:23:44.633709+00:00',FALSE) ON CONFLICT DO NOTHING;
INSERT INTO public.posts (id,slug,title,excerpt,content,cover_image,category_id,type,status,published_at,author_id,created_at,updated_at,is_featured) VALUES ('a888b429-60cb-4de0-bb30-4ca8c39ad658','lusail-skyline-2026','Lusail skyline reaches new heights as four towers near completion','Qatar''s flagship master-planned city welcomes four new mixed-use towers, expanding premium inventory in West Lusail.','','/src/assets/prop-3.jpg','0e52c311-d183-4a49-8ebc-1f62965a5e07','news','published','2026-06-14T00:00:00+00:00',NULL,'2026-06-19T18:23:44.633709+00:00','2026-06-20T18:04:39.480378+00:00',FALSE) ON CONFLICT DO NOTHING;

-- post_tag_links: 8 rows
INSERT INTO public.post_tag_links (post_id,tag_id) VALUES ('928612d9-5a19-41ba-b795-6f5f4680e343','6f6d2042-2e67-49c1-9162-dee07f2347e8') ON CONFLICT DO NOTHING;
INSERT INTO public.post_tag_links (post_id,tag_id) VALUES ('3a1b53ec-24e6-4bd5-9013-4fc73de1b08c','c5fa81d3-785e-435a-aeb9-df6e6c057eba') ON CONFLICT DO NOTHING;
INSERT INTO public.post_tag_links (post_id,tag_id) VALUES ('f762a99a-3757-456e-90dd-02983c190085','47d10d73-e5ce-414f-8755-9ae458f1b6fb') ON CONFLICT DO NOTHING;
INSERT INTO public.post_tag_links (post_id,tag_id) VALUES ('54b2ab20-4b81-499a-b6a6-ada1c2d731b4','b9c84722-d906-413e-8e74-76ca6b3f4a92') ON CONFLICT DO NOTHING;
INSERT INTO public.post_tag_links (post_id,tag_id) VALUES ('2ef4def6-2ed1-4a40-8ac8-f8f5b47ceff6','660c896b-f982-4cde-9649-2fefb4a94b40') ON CONFLICT DO NOTHING;
INSERT INTO public.post_tag_links (post_id,tag_id) VALUES ('09309048-529c-41b5-9394-c04630b35d7a','1735e056-da77-4cec-b3c5-079cd0fad14c') ON CONFLICT DO NOTHING;
INSERT INTO public.post_tag_links (post_id,tag_id) VALUES ('e16306a5-30ee-4ab0-86e9-faffdc7ab59a','73b95ea8-f151-4812-a1a5-557babbe228e') ON CONFLICT DO NOTHING;
INSERT INTO public.post_tag_links (post_id,tag_id) VALUES ('a888b429-60cb-4de0-bb30-4ca8c39ad658','670aa65e-85d0-4637-a1a6-ff2f50ab1a18') ON CONFLICT DO NOTHING;

-- page_sections: 6 rows
INSERT INTO public.page_sections (id,page_slug,section_key,label,content,sort_order,created_at,updated_at) VALUES ('056a2a9e-8278-4386-a5da-904ba813e501','home','news_ticker','News Ticker','{"items": ["New launch: Lusail Marina Sky Apartments", "Limited offer: 10% off Pearl rentals", "Now selling: Waterfront villas in Lusail"]}'::jsonb,2,'2026-06-17T21:01:34.562958+00:00','2026-06-17T21:01:34.562958+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.page_sections (id,page_slug,section_key,label,content,sort_order,created_at,updated_at) VALUES ('902803a7-c57c-431e-b6c7-d3df1072c019','home','trust','Trust Strip','{"items": [{"body": "Qatar-registered with verified listings only.", "title": "Licensed brokerage"}, {"body": "Every residence is personally inspected.", "title": "Hand-curated portfolio"}, {"body": "Book on WhatsApp or schedule in one tap.", "title": "Frictionless viewings"}]}'::jsonb,3,'2026-06-17T21:01:34.562958+00:00','2026-06-17T21:01:34.562958+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.page_sections (id,page_slug,section_key,label,content,sort_order,created_at,updated_at) VALUES ('15ff8103-f785-449e-bb08-785a1708d5a8','home','featured','Featured Section Heading','{"title": "A portfolio worthy of the address", "eyebrow": "Featured residences", "link_href": "/properties", "link_label": "View all listings"}'::jsonb,4,'2026-06-17T21:01:34.562958+00:00','2026-06-17T21:01:34.562958+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.page_sections (id,page_slug,section_key,label,content,sort_order,created_at,updated_at) VALUES ('7615f11d-3943-41eb-9ae2-eadb8944fb0f','home','locations','Locations Section Heading','{"title": "Live in Qatar''s most coveted neighbourhoods", "eyebrow": "Premium Qatar locations"}'::jsonb,5,'2026-06-17T21:01:34.562958+00:00','2026-06-17T21:01:34.562958+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.page_sections (id,page_slug,section_key,label,content,sort_order,created_at,updated_at) VALUES ('d36c2308-bfd6-44d1-ae38-cffb7fa832d5','home','contact','Contact Section','{"email": "hello@ayeshamaison.qa", "phone": "+974 0000 0000", "title": "Speak with a Qatar property specialist", "address": "Doha, Qatar", "eyebrow": "Get in touch"}'::jsonb,6,'2026-06-17T21:01:34.562958+00:00','2026-06-17T21:01:34.562958+00:00') ON CONFLICT DO NOTHING;
INSERT INTO public.page_sections (id,page_slug,section_key,label,content,sort_order,created_at,updated_at) VALUES ('f1ea8071-8923-463d-815f-05f0a9ccbbed','home','hero','Hero','{"style": {"align": "left", "cta_bg": "#7a1325", "cta_text": "#ffffff", "overlay_to": "#000000", "title_size": "xl", "title_color": "#ffffff", "overlay_from": "#000000", "eyebrow_color": "#d4af37", "subtitle_color": "#e5e7eb", "overlay_opacity": 55}, "title": "Find your address in Qatar''s most coveted neighbourhoods", "eyebrow": "Premium Qatar Real Estate", "cta_link": "/properties", "subtitle": "Handpicked apartments, villas and penthouses for rent or sale across Doha, The Pearl, Lusail, West Bay and Al Waab.", "cta_label": "Browse residences"}'::jsonb,1,'2026-06-17T21:01:34.562958+00:00','2026-06-17T23:07:07.001789+00:00') ON CONFLICT DO NOTHING;

COMMIT;