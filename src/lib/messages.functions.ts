import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().trim().min(1, "Name required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  property_id: z.string().uuid().nullable().optional(),
  agent_id: z.string().uuid().nullable().optional(),
  subject: z.string().trim().max(200).optional().nullable(),
  body: z.string().trim().min(1, "Message required").max(4000),
});

const tokenSchema = z.object({
  id: z.string().uuid(),
  token: z.string().uuid(),
});

const replyGuestSchema = tokenSchema.extend({
  body: z.string().trim().min(1).max(4000),
});

export const createConversation = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => createSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let assignedAgentId: string | null = data.agent_id ?? null;
    if (!assignedAgentId && data.property_id) {
      const { data: prop } = await supabaseAdmin
        .from("properties")
        .select("assigned_agent_id, created_by")
        .eq("id", data.property_id)
        .maybeSingle();
      assignedAgentId =
        (prop?.assigned_agent_id as string | null) ?? (prop?.created_by as string | null) ?? null;
    }

    const { data: conv, error: convErr } = await supabaseAdmin
      .from("conversations")
      .insert({
        customer_name: data.name,
        customer_email: data.email,
        property_id: data.property_id ?? null,
        assigned_agent_id: assignedAgentId,
        subject: data.subject ?? null,
      })
      .select("id, access_token")
      .single();
    if (convErr || !conv) throw new Error(convErr?.message || "Failed to create conversation");

    const { error: msgErr } = await supabaseAdmin.from("messages").insert({
      conversation_id: conv.id,
      sender_role: "customer",
      sender_name: data.name,
      body: data.body,
    });
    if (msgErr) throw new Error(msgErr.message);

    return { id: conv.id as string, token: conv.access_token as string };
  });

export const fetchGuestThread = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => tokenSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: conv, error } = await supabaseAdmin
      .from("conversations")
      .select(
        "id, customer_name, customer_email, subject, status, property_id, access_token, last_message_at, created_at",
      )
      .eq("id", data.id)
      .maybeSingle();
    if (error || !conv) throw new Error("Conversation not found");
    if ((conv.access_token as string) !== data.token) throw new Error("Invalid access token");

    const { data: messages } = await supabaseAdmin
      .from("messages")
      .select("id, sender_role, sender_name, body, created_at")
      .eq("conversation_id", data.id)
      .order("created_at", { ascending: true });

    let propertyTitle: string | null = null;
    if (conv.property_id) {
      const { data: p } = await supabaseAdmin
        .from("properties")
        .select("title")
        .eq("id", conv.property_id)
        .maybeSingle();
      propertyTitle = (p?.title as string | null) ?? null;
    }

    const { access_token, ...rest } = conv;
    void access_token;
    return {
      conversation: { ...rest, property_title: propertyTitle },
      messages: messages ?? [],
    };
  });

export const replyAsGuest = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => replyGuestSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: conv } = await supabaseAdmin
      .from("conversations")
      .select("id, access_token, customer_name, status")
      .eq("id", data.id)
      .maybeSingle();
    if (!conv) throw new Error("Conversation not found");
    if ((conv.access_token as string) !== data.token) throw new Error("Invalid access token");
    if (conv.status === "closed") throw new Error("This conversation is closed");

    const { error } = await supabaseAdmin.from("messages").insert({
      conversation_id: data.id,
      sender_role: "customer",
      sender_name: conv.customer_name as string,
      body: data.body,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
