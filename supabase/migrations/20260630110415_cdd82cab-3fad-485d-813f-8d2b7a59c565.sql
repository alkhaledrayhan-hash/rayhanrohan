CREATE POLICY "Customers can view bookings by email"
ON public.bookings FOR SELECT TO authenticated
USING (
  customer_email IS NOT NULL
  AND lower(customer_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);