ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS is_offer boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS offer_discount integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS offer_tag text,
  ADD COLUMN IF NOT EXISTS offer_ends text;

CREATE INDEX IF NOT EXISTS properties_is_offer_idx ON public.properties (is_offer) WHERE is_offer = true;