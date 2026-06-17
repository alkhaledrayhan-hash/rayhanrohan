
DO $$
DECLARE
  agents JSONB := '[
    {"email":"sarah.johnson@demo-urbanhub.com","full_name":"Sarah Johnson","username":"sarahj","phone":"+1 202 555 0142","avatar":"https://i.pravatar.cc/300?img=47"},
    {"email":"david.miller@demo-urbanhub.com","full_name":"David Miller","username":"davidm","phone":"+1 202 555 0177","avatar":"https://i.pravatar.cc/300?img=12"},
    {"email":"aisha.rahman@demo-urbanhub.com","full_name":"Aisha Rahman","username":"aishar","phone":"+880 171 555 0199","avatar":"https://i.pravatar.cc/300?img=32"},
    {"email":"carlos.mendez@demo-urbanhub.com","full_name":"Carlos Mendez","username":"carlosm","phone":"+34 600 555 0220","avatar":"https://i.pravatar.cc/300?img=15"},
    {"email":"emily.chen@demo-urbanhub.com","full_name":"Emily Chen","username":"emilyc","phone":"+44 20 5555 0166","avatar":"https://i.pravatar.cc/300?img=49"}
  ]'::jsonb;
  a JSONB;
  new_id UUID;
BEGIN
  FOR a IN SELECT * FROM jsonb_array_elements(agents) LOOP
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = a->>'email') THEN
      CONTINUE;
    END IF;
    new_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', new_id, 'authenticated', 'authenticated',
      a->>'email', crypt('Agent@12345', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', a->>'full_name', 'username', a->>'username'),
      now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), new_id,
      jsonb_build_object('sub', new_id::text, 'email', a->>'email', 'email_verified', true),
      'email', new_id::text, now(), now(), now());

    -- handle_new_user trigger created profile + user role; update to agent + details
    UPDATE public.profiles SET
      full_name = a->>'full_name',
      username = a->>'username',
      phone = a->>'phone',
      avatar_url = a->>'avatar'
    WHERE id = new_id;
    DELETE FROM public.user_roles WHERE user_id = new_id;
    INSERT INTO public.user_roles (user_id, role) VALUES (new_id, 'agent');
  END LOOP;
END $$;
