
DO $$
DECLARE
  r RECORD;
  base TEXT;
  candidate TEXT;
  n INT;
BEGIN
  FOR r IN SELECT id, email FROM public.profiles WHERE username IS NULL OR username = '' LOOP
    base := lower(regexp_replace(COALESCE(split_part(r.email, '@', 1), 'user'), '[^a-zA-Z0-9_]', '', 'g'));
    IF base IS NULL OR length(base) < 3 THEN
      base := 'user' || substr(replace(r.id::text, '-', ''), 1, 6);
    END IF;
    base := substr(base, 1, 24);
    candidate := base;
    n := 0;
    WHILE EXISTS (SELECT 1 FROM public.profiles WHERE lower(username) = lower(candidate)) LOOP
      n := n + 1;
      candidate := substr(base, 1, 24) || n::text;
    END LOOP;
    UPDATE public.profiles SET username = candidate WHERE id = r.id;
  END LOOP;
END $$;

ALTER TABLE public.profiles ALTER COLUMN username SET NOT NULL;

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_username_key;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_key ON public.profiles (lower(username));

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_username_format_chk;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_username_format_chk
  CHECK (username ~ '^[a-zA-Z0-9_]{3,30}$');
