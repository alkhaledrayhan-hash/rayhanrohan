import { createContact } from "@/lib/bookings.functions";

export type LeadInput = {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  source?: string;
};

export async function submitLead(input: LeadInput) {
  const name = input.name.trim();
  const email = input.email.trim();
  const message = input.message.trim();
  const subject = (input.subject || "General enquiry").trim();
  const phone = (input.phone || "").trim();
  if (!name || !email || !message) {
    throw new Error("Please fill in your name, email and message.");
  }
  // Route through server function so admin (with service role) writes the lead
  // — anonymous clients cannot read back the inserted row under RLS.
  const res = await createContact({ data: { name, email, phone, subject, message } });
  return { id: res.id };
}
