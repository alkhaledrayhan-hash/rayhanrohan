ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_posts_featured ON public.posts (is_featured) WHERE is_featured = true;