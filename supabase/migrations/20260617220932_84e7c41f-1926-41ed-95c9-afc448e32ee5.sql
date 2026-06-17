
-- 1. Storage policies for agent-avatars (private bucket)
DROP POLICY IF EXISTS "agent_avatars_admin_all" ON storage.objects;
DROP POLICY IF EXISTS "agent_avatars_read" ON storage.objects;

CREATE POLICY "agent_avatars_admin_all"
  ON storage.objects FOR ALL
  TO authenticated
  USING (bucket_id = 'agent-avatars' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'agent-avatars' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "agent_avatars_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'agent-avatars');

-- 2. site_settings: hide sensitive keys from anon/public reads
DROP POLICY IF EXISTS "Anyone can read site settings" ON public.site_settings;

CREATE POLICY "Public can read non-sensitive settings"
  ON public.site_settings FOR SELECT
  TO anon
  USING (key NOT IN ('admin_email'));

CREATE POLICY "Authenticated can read all settings"
  ON public.site_settings FOR SELECT
  TO authenticated
  USING (true);

-- 3. user_roles: explicit admin-only write policies
CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. Lock down SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, PUBLIC;
-- has_role stays callable by authenticated (used by app code via RPC)
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
-- get_email_by_username must stay callable by anon (username login flow)
