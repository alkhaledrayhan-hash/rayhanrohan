import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const requestSchema = z.object({
  new_email: z.string().trim().email().max(255),
  reason: z.string().trim().max(500).optional().default(""),
});

const decideSchema = z.object({
  id: z.string().uuid(),
  admin_note: z.string().trim().max(500).optional().default(""),
});

async function assertAdmin(context: any) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!isAdmin) throw new Error("Forbidden");
}

export const requestEmailChange = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => requestSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId, claims } = context;
    const currentEmail = (claims?.email as string) || "";

    // Cancel any existing pending request from this user
    await supabase
      .from("email_change_requests")
      .update({ status: "rejected", admin_note: "Superseded by a new request" })
      .eq("user_id", userId)
      .eq("status", "pending");

    const { error } = await supabase.from("email_change_requests").insert({
      user_id: userId,
      current_email: currentEmail,
      new_email: data.new_email,
      reason: data.reason || null,
      status: "pending",
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMyEmailChangeRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("email_change_requests")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { requests: data ?? [] };
  });

export const listAllEmailChangeRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("email_change_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const userIds = Array.from(new Set((rows ?? []).map((r) => r.user_id)));
    let profileMap = new Map<string, any>();
    if (userIds.length) {
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("id, full_name, email")
        .in("id", userIds);
      profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
    }
    return {
      requests: (rows ?? []).map((r) => ({ ...r, profile: profileMap.get(r.user_id) ?? null })),
    };
  });

export const approveEmailChange = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => decideSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: req, error: fErr } = await supabaseAdmin
      .from("email_change_requests")
      .select("*")
      .eq("id", data.id)
      .maybeSingle();
    if (fErr) throw new Error(fErr.message);
    if (!req) throw new Error("Request not found");
    if (req.status !== "pending") throw new Error("Request is not pending");

    const { error: upErr } = await supabaseAdmin.auth.admin.updateUserById(req.user_id, {
      email: req.new_email,
      email_confirm: true,
    });
    if (upErr) throw new Error(upErr.message);

    await supabaseAdmin.from("profiles").update({ email: req.new_email }).eq("id", req.user_id);

    const { error: rErr } = await supabaseAdmin
      .from("email_change_requests")
      .update({
        status: "approved",
        admin_note: data.admin_note || null,
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (rErr) throw new Error(rErr.message);

    return { ok: true };
  });

export const rejectEmailChange = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => decideSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("email_change_requests")
      .update({
        status: "rejected",
        admin_note: data.admin_note || null,
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", data.id)
      .eq("status", "pending");
    if (error) throw new Error(error.message);
    return { ok: true };
  });
