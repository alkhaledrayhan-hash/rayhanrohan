
CREATE INDEX IF NOT EXISTS idx_properties_approved_recent
  ON public.properties (created_at DESC)
  WHERE listing_status = 'approved';

CREATE INDEX IF NOT EXISTS idx_properties_created_by
  ON public.properties (created_by);

CREATE INDEX IF NOT EXISTS idx_bookings_customer_user
  ON public.bookings (customer_user_id);

CREATE INDEX IF NOT EXISTS idx_bookings_created_at
  ON public.bookings (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversations_created_at
  ON public.conversations (created_at DESC);

ANALYZE public.properties;
ANALYZE public.bookings;
ANALYZE public.conversations;
ANALYZE public.leads;
