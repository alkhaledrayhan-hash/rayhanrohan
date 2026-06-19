-- Fix: prevent anonymous users from attributing a conversation to any user
DROP POLICY IF EXISTS "Anyone can create a conversation" ON public.conversations;

CREATE POLICY "Anon can create unattributed conversation"
  ON public.conversations
  FOR INSERT
  TO anon
  WITH CHECK (customer_user_id IS NULL);

CREATE POLICY "Authenticated can create own conversation"
  ON public.conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (customer_user_id IS NULL OR customer_user_id = auth.uid());

-- Fix: remove conversations/messages from Realtime publication.
-- The app does not subscribe to Realtime; this eliminates the broadcast surface
-- so authenticated users cannot subscribe to other customers' live updates.
ALTER PUBLICATION supabase_realtime DROP TABLE public.messages;
ALTER PUBLICATION supabase_realtime DROP TABLE public.conversations;