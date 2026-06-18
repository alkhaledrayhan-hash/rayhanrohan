
-- 1. handle_new_user: ignore client-supplied role, always assign 'user'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id, email, full_name, username)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'username', '')
  )
  on conflict (id) do nothing;

  -- All self-signups become 'user'. Agent role must be granted by an admin.
  insert into public.user_roles (user_id, role)
  values (new.id, 'user'::public.app_role)
  on conflict do nothing;

  return new;
end;
$function$;

-- 2. site_settings: restrict authenticated read to non-sensitive keys
DROP POLICY IF EXISTS "Authenticated can read all settings" ON public.site_settings;
CREATE POLICY "Authenticated can read non-sensitive settings"
  ON public.site_settings FOR SELECT
  TO authenticated
  USING (key <> 'admin_email' OR has_role(auth.uid(), 'admin'::app_role));

-- 3. agent-avatars storage: only owner or admin can read
DROP POLICY IF EXISTS "agent_avatars_read" ON storage.objects;
CREATE POLICY "agent_avatars_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'agent-avatars'
    AND (owner = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role))
  );

-- 4. get_email_by_username: restrict to authenticated only
REVOKE EXECUTE ON FUNCTION public.get_email_by_username(text) FROM anon, PUBLIC;

-- 5. Lock down SECURITY DEFINER trigger functions (not callable directly)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM anon, authenticated, PUBLIC;

-- 6. has_role: keep callable by authenticated (needed by RLS via auth.uid()), revoke anon
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
