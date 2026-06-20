
-- 1) Bookings: restrict anon inserts so they can't impersonate users
DROP POLICY IF EXISTS "Anyone can create a booking" ON public.bookings;

CREATE POLICY "Anon can create unattributed booking"
  ON public.bookings
  FOR INSERT
  TO anon
  WITH CHECK (customer_user_id IS NULL AND created_by IS NULL);

CREATE POLICY "Authenticated can create own booking"
  ON public.bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (customer_user_id IS NULL OR customer_user_id = auth.uid())
    AND (created_by IS NULL OR created_by = auth.uid())
  );

-- 2) Media: agents can only read files inside their own folder
DROP POLICY IF EXISTS "Media: agents can read" ON storage.objects;

CREATE POLICY "Media: agents can read own"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'media'
    AND has_role(auth.uid(), 'agent'::app_role)
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
