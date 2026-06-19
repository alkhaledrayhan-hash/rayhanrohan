
CREATE TABLE public.email_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_email text NOT NULL,
  new_email text NOT NULL,
  reason text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_note text,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_change_requests TO authenticated;
GRANT ALL ON public.email_change_requests TO service_role;

ALTER TABLE public.email_change_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own email change requests"
  ON public.email_change_requests FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users create own email change requests"
  ON public.email_change_requests FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins update email change requests"
  ON public.email_change_requests FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete email change requests"
  ON public.email_change_requests FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_email_change_requests_touch
  BEFORE UPDATE ON public.email_change_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_ecr_user ON public.email_change_requests(user_id);
CREATE INDEX idx_ecr_status ON public.email_change_requests(status);
