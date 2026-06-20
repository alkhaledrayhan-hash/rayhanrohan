
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS agent_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS property_title text;

CREATE INDEX IF NOT EXISTS idx_leads_agent_id ON public.leads(agent_id);
CREATE INDEX IF NOT EXISTS idx_leads_property_id ON public.leads(property_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);

-- Allow agents to see leads assigned to them (admins already have full access via existing policy)
DROP POLICY IF EXISTS "Agents can view their leads" ON public.leads;
CREATE POLICY "Agents can view their leads"
  ON public.leads FOR SELECT
  TO authenticated
  USING (agent_id = auth.uid());
