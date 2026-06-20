ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS assigned_agent_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_properties_assigned_agent ON public.properties (assigned_agent_id);