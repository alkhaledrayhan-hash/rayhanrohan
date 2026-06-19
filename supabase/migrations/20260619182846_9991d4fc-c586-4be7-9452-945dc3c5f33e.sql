
DO $$
DECLARE
  v_admin uuid := gen_random_uuid();
  v_agent1 uuid := gen_random_uuid();
  v_agent2 uuid := gen_random_uuid();
  v_user1 uuid := gen_random_uuid();
  v_user2 uuid := gen_random_uuid();
  v_user3 uuid := gen_random_uuid();
  v_user4 uuid := gen_random_uuid();
BEGIN
  -- Skip entirely if demo users already exist
  IF EXISTS (SELECT 1 FROM auth.users WHERE email LIKE '%@ayesha-demo.test') THEN
    RETURN;
  END IF;

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) VALUES
    ('00000000-0000-0000-0000-000000000000', v_admin, 'authenticated', 'authenticated',
     'sara.admin@ayesha-demo.test', extensions.crypt('Demo1234!', extensions.gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}', '{"full_name":"Sara Admin"}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', v_agent1, 'authenticated', 'authenticated',
     'omar.agent@ayesha-demo.test', extensions.crypt('Demo1234!', extensions.gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}', '{"full_name":"Omar Khalil"}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', v_agent2, 'authenticated', 'authenticated',
     'layla.agent@ayesha-demo.test', extensions.crypt('Demo1234!', extensions.gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}', '{"full_name":"Layla Hassan"}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', v_user1, 'authenticated', 'authenticated',
     'ahmed.customer@ayesha-demo.test', extensions.crypt('Demo1234!', extensions.gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}', '{"full_name":"Ahmed Al-Mansoori"}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', v_user2, 'authenticated', 'authenticated',
     'fatima.customer@ayesha-demo.test', extensions.crypt('Demo1234!', extensions.gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}', '{"full_name":"Fatima Al-Thani"}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', v_user3, 'authenticated', 'authenticated',
     'yousef.customer@ayesha-demo.test', extensions.crypt('Demo1234!', extensions.gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}', '{"full_name":"Yousef Rahman"}', now(), now(), '', '', '', ''),
    ('00000000-0000-0000-0000-000000000000', v_user4, 'authenticated', 'authenticated',
     'maryam.customer@ayesha-demo.test', extensions.crypt('Demo1234!', extensions.gen_salt('bf')), now(),
     '{"provider":"email","providers":["email"]}', '{"full_name":"Maryam Saleh"}', now(), now(), '', '', '', '');

  -- Ensure profiles exist (trigger should create them; fill in case it didn't)
  INSERT INTO public.profiles (id, email, full_name, phone)
  VALUES
    (v_admin,  'sara.admin@ayesha-demo.test',     'Sara Admin',         '+974 5500 1001'),
    (v_agent1, 'omar.agent@ayesha-demo.test',     'Omar Khalil',        '+974 5500 1002'),
    (v_agent2, 'layla.agent@ayesha-demo.test',    'Layla Hassan',       '+974 5500 1003'),
    (v_user1,  'ahmed.customer@ayesha-demo.test', 'Ahmed Al-Mansoori',  '+974 5500 2001'),
    (v_user2,  'fatima.customer@ayesha-demo.test','Fatima Al-Thani',    '+974 5500 2002'),
    (v_user3,  'yousef.customer@ayesha-demo.test','Yousef Rahman',      '+974 5500 2003'),
    (v_user4,  'maryam.customer@ayesha-demo.test','Maryam Saleh',       '+974 5500 2004')
  ON CONFLICT (id) DO UPDATE SET phone = EXCLUDED.phone;

  -- Roles: override defaults
  DELETE FROM public.user_roles WHERE user_id IN (v_admin, v_agent1, v_agent2);
  INSERT INTO public.user_roles (user_id, role) VALUES
    (v_admin,  'admin'::public.app_role),
    (v_agent1, 'agent'::public.app_role),
    (v_agent2, 'agent'::public.app_role);

  -- Make sure customers have 'user' role
  INSERT INTO public.user_roles (user_id, role) VALUES
    (v_user1, 'user'::public.app_role),
    (v_user2, 'user'::public.app_role),
    (v_user3, 'user'::public.app_role),
    (v_user4, 'user'::public.app_role)
  ON CONFLICT DO NOTHING;
END $$;
