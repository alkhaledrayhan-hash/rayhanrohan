
-- conversations
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  assigned_agent_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  subject text,
  status text NOT NULL DEFAULT 'open',
  access_token uuid NOT NULL DEFAULT gen_random_uuid(),
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_conversations_email ON public.conversations(customer_email);
CREATE INDEX idx_conversations_agent ON public.conversations(assigned_agent_id);
CREATE INDEX idx_conversations_property ON public.conversations(property_id);
CREATE INDEX idx_conversations_last_msg ON public.conversations(last_message_at DESC);

GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT INSERT ON public.conversations TO anon;
GRANT ALL ON public.conversations TO service_role;

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create a conversation"
  ON public.conversations FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all conversations"
  ON public.conversations FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Assigned agent can view conversations"
  ON public.conversations FOR SELECT
  TO authenticated
  USING (assigned_agent_id = auth.uid());

CREATE POLICY "Customers can view own conversations"
  ON public.conversations FOR SELECT
  TO authenticated
  USING (customer_user_id = auth.uid());

CREATE POLICY "Admins can update conversations"
  ON public.conversations FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Assigned agent can update conversations"
  ON public.conversations FOR UPDATE
  TO authenticated
  USING (assigned_agent_id = auth.uid());

CREATE TRIGGER trg_conversations_updated_at
  BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- messages
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_role text NOT NULL CHECK (sender_role IN ('customer','agent','admin')),
  sender_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_name text,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_messages_conv ON public.messages(conversation_id, created_at);

GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT INSERT ON public.messages TO anon;
GRANT ALL ON public.messages TO service_role;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read all messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Agent reads messages on assigned convos"
  ON public.messages FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id AND c.assigned_agent_id = auth.uid()
  ));

CREATE POLICY "Customer reads own messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id AND c.customer_user_id = auth.uid()
  ));

CREATE POLICY "Admins insert messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND sender_role = 'admin');

CREATE POLICY "Agent inserts messages on assigned convos"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_role = 'agent' AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id AND c.assigned_agent_id = auth.uid()
  ));

CREATE POLICY "Customer inserts messages on own convos"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_role = 'customer' AND EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id AND c.customer_user_id = auth.uid()
  ));

-- bump conversation last_message_at on new message
CREATE OR REPLACE FUNCTION public.bump_conversation_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.conversations
    SET last_message_at = now(), updated_at = now()
    WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_bump_conversation_on_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.bump_conversation_on_message();

-- realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
