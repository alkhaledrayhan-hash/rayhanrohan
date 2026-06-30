
ALTER TABLE public.popups
  ADD COLUMN IF NOT EXISTS gradient_from text,
  ADD COLUMN IF NOT EXISTS gradient_to text,
  ADD COLUMN IF NOT EXISTS gradient_angle integer NOT NULL DEFAULT 135,
  ADD COLUMN IF NOT EXISTS glass_blur integer NOT NULL DEFAULT 20,
  ADD COLUMN IF NOT EXISTS glass_tint integer NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS glass_border integer NOT NULL DEFAULT 25;
