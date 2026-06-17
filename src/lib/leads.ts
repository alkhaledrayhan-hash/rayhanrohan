import { supabase } from "@/integrations/supabase/client";

export type LeadInput = {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  source?: string;
};

export async function submitLead(input: LeadInput) {
  const payload = {
    name: input.name.trim(),
    email: input.email.trim(),
    phone: (input.phone || "").trim() || null,
    subject: (input.subject || "").trim() || null,
    message: input.message.trim(),
    source: input.source || "contact",
  };
  if (!payload.name || !payload.email || !payload.message) {
    throw new Error("Please fill in your name, email and message.");
  }
  const { data, error } = await supabase.from("leads").insert(payload).select("id").single();
  if (error) throw error;
  return data;
}
