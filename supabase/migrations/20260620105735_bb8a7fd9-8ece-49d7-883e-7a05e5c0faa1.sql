
ALTER TABLE public.properties DROP CONSTRAINT IF EXISTS properties_assigned_agent_id_fkey;
ALTER TABLE public.properties ADD CONSTRAINT properties_assigned_agent_id_fkey
  FOREIGN KEY (assigned_agent_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_agent_id_fkey;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_agent_id_fkey
  FOREIGN KEY (agent_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_customer_user_id_fkey;
ALTER TABLE public.bookings ADD CONSTRAINT bookings_customer_user_id_fkey
  FOREIGN KEY (customer_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_agent_id_fkey;
ALTER TABLE public.leads ADD CONSTRAINT leads_agent_id_fkey
  FOREIGN KEY (agent_id) REFERENCES auth.users(id) ON DELETE SET NULL;

DROP POLICY IF EXISTS "Customers can view their own bookings" ON public.bookings;
CREATE POLICY "Customers can view their own bookings"
  ON public.bookings FOR SELECT
  TO authenticated
  USING (customer_user_id = auth.uid());
