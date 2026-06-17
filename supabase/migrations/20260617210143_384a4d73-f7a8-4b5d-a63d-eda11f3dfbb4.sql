
-- listing approval status
create type public.listing_status as enum ('pending','approved','rejected');

-- ============ PROPERTIES ============
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  location text not null,
  address text not null,
  type text not null,
  status text not null check (status in ('rent','sale')),
  price numeric not null,
  bedrooms int not null default 0,
  bathrooms int not null default 0,
  rooms int not null default 0,
  sqft int not null default 0,
  year_built int,
  image text,
  gallery jsonb not null default '[]'::jsonb,
  description text,
  features jsonb not null default '[]'::jsonb,
  verified boolean not null default false,
  listing_status public.listing_status not null default 'pending',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on public.properties to anon;
grant select, insert, update, delete on public.properties to authenticated;
grant all on public.properties to service_role;

alter table public.properties enable row level security;

-- public can read only approved
create policy "Public can view approved properties"
  on public.properties for select
  to anon, authenticated
  using (listing_status = 'approved');

-- admins full access
create policy "Admins view all properties"
  on public.properties for select to authenticated
  using (public.has_role(auth.uid(),'admin'));
create policy "Admins insert properties"
  on public.properties for insert to authenticated
  with check (public.has_role(auth.uid(),'admin'));
create policy "Admins update properties"
  on public.properties for update to authenticated
  using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));
create policy "Admins delete properties"
  on public.properties for delete to authenticated
  using (public.has_role(auth.uid(),'admin'));

-- agents: own rows
create policy "Agents view own properties"
  on public.properties for select to authenticated
  using (public.has_role(auth.uid(),'agent') and created_by = auth.uid());
create policy "Agents insert pending properties"
  on public.properties for insert to authenticated
  with check (
    public.has_role(auth.uid(),'agent')
    and created_by = auth.uid()
    and listing_status = 'pending'
  );
create policy "Agents update own pending properties"
  on public.properties for update to authenticated
  using (
    public.has_role(auth.uid(),'agent')
    and created_by = auth.uid()
    and listing_status in ('pending','rejected')
  )
  with check (
    public.has_role(auth.uid(),'agent')
    and created_by = auth.uid()
    and listing_status in ('pending','rejected')
  );

create trigger properties_touch_updated_at
  before update on public.properties
  for each row execute function public.touch_updated_at();

-- ============ PAGE SECTIONS (CMS) ============
create table public.page_sections (
  id uuid primary key default gen_random_uuid(),
  page_slug text not null,
  section_key text not null,
  label text not null,
  content jsonb not null default '{}'::jsonb,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (page_slug, section_key)
);

grant select on public.page_sections to anon;
grant select, insert, update, delete on public.page_sections to authenticated;
grant all on public.page_sections to service_role;

alter table public.page_sections enable row level security;

create policy "Anyone can read page sections"
  on public.page_sections for select
  to anon, authenticated using (true);
create policy "Admins manage page sections"
  on public.page_sections for all to authenticated
  using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

create trigger page_sections_touch_updated_at
  before update on public.page_sections
  for each row execute function public.touch_updated_at();

-- Seed homepage sections
insert into public.page_sections (page_slug, section_key, label, content, sort_order) values
('home','hero','Hero',
  '{"eyebrow":"Premium Qatar Real Estate","title":"Find your address in Qatar''s most coveted neighbourhoods","subtitle":"Handpicked apartments, villas and penthouses for rent or sale across Doha, The Pearl, Lusail, West Bay and Al Waab.","cta_label":"Browse residences","cta_link":"/properties"}'::jsonb, 1),
('home','news_ticker','News Ticker',
  '{"items":["New launch: Lusail Marina Sky Apartments","Limited offer: 10% off Pearl rentals","Now selling: Waterfront villas in Lusail"]}'::jsonb, 2),
('home','trust','Trust Strip',
  '{"items":[{"title":"Licensed brokerage","body":"Qatar-registered with verified listings only."},{"title":"Hand-curated portfolio","body":"Every residence is personally inspected."},{"title":"Frictionless viewings","body":"Book on WhatsApp or schedule in one tap."}]}'::jsonb, 3),
('home','featured','Featured Section Heading',
  '{"eyebrow":"Featured residences","title":"A portfolio worthy of the address","link_label":"View all listings","link_href":"/properties"}'::jsonb, 4),
('home','locations','Locations Section Heading',
  '{"eyebrow":"Premium Qatar locations","title":"Live in Qatar''s most coveted neighbourhoods"}'::jsonb, 5),
('home','contact','Contact Section',
  '{"eyebrow":"Get in touch","title":"Speak with a Qatar property specialist","phone":"+974 0000 0000","email":"hello@ayeshamaison.qa","address":"Doha, Qatar"}'::jsonb, 6);
