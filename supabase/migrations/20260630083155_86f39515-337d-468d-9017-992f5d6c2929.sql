
ALTER TABLE public.popups
  ADD COLUMN IF NOT EXISTS secondary_cta_label text,
  ADD COLUMN IF NOT EXISTS secondary_cta_url text,
  ADD COLUMN IF NOT EXISTS collect_email boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email_placeholder text,
  ADD COLUMN IF NOT EXISTS trigger_type text NOT NULL DEFAULT 'time',
  ADD COLUMN IF NOT EXISTS scroll_threshold integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS device_target text NOT NULL DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS visitor_target text NOT NULL DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS animation text NOT NULL DEFAULT 'fade',
  ADD COLUMN IF NOT EXISTS overlay_color text DEFAULT '#000000',
  ADD COLUMN IF NOT EXISTS overlay_opacity integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS overlay_blur integer NOT NULL DEFAULT 4,
  ADD COLUMN IF NOT EXISTS border_radius integer NOT NULL DEFAULT 16,
  ADD COLUMN IF NOT EXISTS shadow text NOT NULL DEFAULT 'xl',
  ADD COLUMN IF NOT EXISTS font_family text,
  ADD COLUMN IF NOT EXISTS title_size integer NOT NULL DEFAULT 24,
  ADD COLUMN IF NOT EXISTS body_size integer NOT NULL DEFAULT 14,
  ADD COLUMN IF NOT EXISTS variant_b jsonb,
  ADD COLUMN IF NOT EXISTS ab_split integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.popup_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  popup_id uuid NOT NULL REFERENCES public.popups(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  variant text NOT NULL DEFAULT 'a',
  session_id text,
  meta jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.popup_events TO anon;
GRANT SELECT, INSERT, DELETE ON public.popup_events TO authenticated;
GRANT ALL ON public.popup_events TO service_role;

ALTER TABLE public.popup_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can log popup events" ON public.popup_events;
CREATE POLICY "Anyone can log popup events" ON public.popup_events
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can read popup events" ON public.popup_events;
CREATE POLICY "Admins can read popup events" ON public.popup_events
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can delete popup events" ON public.popup_events;
CREATE POLICY "Admins can delete popup events" ON public.popup_events
  FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS popup_events_popup_idx ON public.popup_events(popup_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS popup_events_type_idx ON public.popup_events(event_type);
