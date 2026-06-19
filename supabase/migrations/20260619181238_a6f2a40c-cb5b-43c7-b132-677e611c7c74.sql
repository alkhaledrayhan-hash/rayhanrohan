
-- ============= News & Blog system =============

-- Categories
CREATE TABLE public.post_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.post_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_categories TO authenticated;
GRANT ALL ON public.post_categories TO service_role;
ALTER TABLE public.post_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "post_categories_public_read" ON public.post_categories FOR SELECT USING (true);
CREATE POLICY "post_categories_admin_write" ON public.post_categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE TRIGGER post_categories_touch BEFORE UPDATE ON public.post_categories
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Tags
CREATE TABLE public.post_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.post_tags TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_tags TO authenticated;
GRANT ALL ON public.post_tags TO service_role;
ALTER TABLE public.post_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "post_tags_public_read" ON public.post_tags FOR SELECT USING (true);
CREATE POLICY "post_tags_admin_write" ON public.post_tags FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Posts
CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text,
  content text NOT NULL DEFAULT '',
  cover_image text,
  category_id uuid REFERENCES public.post_categories(id) ON DELETE SET NULL,
  type text NOT NULL DEFAULT 'blog', -- 'blog' | 'news'
  status text NOT NULL DEFAULT 'draft', -- 'draft' | 'published'
  published_at timestamptz,
  author_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts_public_read_published" ON public.posts FOR SELECT USING (status = 'published');
CREATE POLICY "posts_admin_read_all" ON public.posts FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "posts_admin_write" ON public.posts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE TRIGGER posts_touch BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX idx_posts_status_pub ON public.posts (status, published_at DESC);
CREATE INDEX idx_posts_category ON public.posts (category_id);
CREATE INDEX idx_posts_type ON public.posts (type);

-- Post <-> Tag links
CREATE TABLE public.post_tag_links (
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.post_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);
GRANT SELECT ON public.post_tag_links TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.post_tag_links TO authenticated;
GRANT ALL ON public.post_tag_links TO service_role;
ALTER TABLE public.post_tag_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "post_tag_links_public_read" ON public.post_tag_links FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id AND p.status = 'published')
);
CREATE POLICY "post_tag_links_admin_all" ON public.post_tag_links FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE INDEX idx_post_tag_links_tag ON public.post_tag_links (tag_id);

-- Seed a few helpful categories so the admin form has something on day one
INSERT INTO public.post_categories (name, slug, description) VALUES
  ('Market Insights', 'market-insights', 'Qatar real estate market analysis'),
  ('Lifestyle', 'lifestyle', 'Living in Qatar — neighbourhoods, dining, culture'),
  ('Investment', 'investment', 'Buy-to-let, ROI, foreign ownership'),
  ('Company News', 'company-news', 'Ayesha Maison updates and announcements')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.post_tags (name, slug) VALUES
  ('West Bay', 'west-bay'),
  ('Pearl', 'pearl'),
  ('Lusail', 'lusail'),
  ('Apartment', 'apartment'),
  ('Villa', 'villa'),
  ('Rental', 'rental'),
  ('Sale', 'sale')
ON CONFLICT (slug) DO NOTHING;
