
-- Popups table for site-wide popup maker
CREATE TABLE public.popups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  template text NOT NULL DEFAULT 'promotional',
  title text,
  subtitle text,
  body text,
  image_url text,
  cta_label text,
  cta_url text,
  -- targeting: 'all' (entire site) | 'route' (specific path) | 'prefix' (path prefix)
  target_type text NOT NULL DEFAULT 'all',
  target_value text,
  -- behavior
  delay_seconds int NOT NULL DEFAULT 2,
  frequency text NOT NULL DEFAULT 'session', -- 'always' | 'session' | 'once'
  position text NOT NULL DEFAULT 'center', -- 'center' | 'bottom-right' | 'top'
  bg_color text,
  text_color text,
  accent_color text,
  start_at timestamptz,
  end_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  priority int NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.popups TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.popups TO authenticated;
GRANT ALL ON public.popups TO service_role;

ALTER TABLE public.popups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active popups"
  ON public.popups FOR SELECT
  USING (
    is_active = true
    AND (start_at IS NULL OR start_at <= now())
    AND (end_at IS NULL OR end_at >= now())
  );

CREATE POLICY "Admins can read all popups"
  ON public.popups FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert popups"
  ON public.popups FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update popups"
  ON public.popups FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete popups"
  ON public.popups FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER popups_touch_updated_at
  BEFORE UPDATE ON public.popups
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX popups_active_idx ON public.popups (is_active, priority DESC);
CREATE INDEX popups_target_idx ON public.popups (target_type, target_value);
