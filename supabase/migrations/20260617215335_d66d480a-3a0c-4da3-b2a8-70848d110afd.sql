
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  requested text;
  assigned_role public.app_role;
begin
  insert into public.profiles (id, email, full_name, username)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'username', '')
  )
  on conflict (id) do nothing;

  requested := lower(coalesce(new.raw_user_meta_data->>'role', 'user'));
  assigned_role := case
    when requested = 'agent' then 'agent'::public.app_role
    else 'user'::public.app_role
  end;

  insert into public.user_roles (user_id, role)
  values (new.id, assigned_role)
  on conflict do nothing;

  return new;
end;
$function$;
