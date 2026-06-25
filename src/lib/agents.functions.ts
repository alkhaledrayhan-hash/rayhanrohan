import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Allow http(s) URL OR data: URL (for local file uploads stored inline)
const avatarSchema = z
  .string()
  .max(3_500_000)
  .refine((s) => s === "" || /^(https?:|data:image\/)/.test(s), "Invalid image")
  .optional()
  .or(z.literal(""));

const createSchema = z.object({
  full_name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).optional().default(""),
  username: z.string().trim().regex(/^[a-zA-Z0-9_]{3,30}$/, "Username must be 3-30 chars, letters/numbers/_"),
  password: z.string().min(8).max(72),
  gender: z.string().max(20).optional().default(""),
  city: z.string().max(80).optional().default(""),
  country: z.string().max(80).optional().default(""),
  address: z.string().max(500).optional().default(""),
  avatar_url: avatarSchema,
});

const updateSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().trim().min(1).max(100),
  phone: z.string().trim().max(40).optional().default(""),
  username: z.string().trim().regex(/^[a-zA-Z0-9_]{3,30}$/, "Username must be 3-30 chars, letters/numbers/_"),
  avatar_url: avatarSchema,
});

async function assertAdmin(context: any) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!isAdmin) throw new Error("Forbidden");
}

export const createAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => createSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        full_name: data.full_name,
        username: data.username,
      },
    });
    if (createErr || !created.user) throw new Error(createErr?.message || "Failed to create user");

    const newId = created.user.id;

    await supabaseAdmin.from("profiles").update({
      full_name: data.full_name,
      phone: data.phone || null,
      avatar_url: data.avatar_url || null,
      username: data.username,
    }).eq("id", newId);

    await supabaseAdmin.from("user_roles").delete().eq("user_id", newId);
    const { error: roleErr } = await supabaseAdmin.from("user_roles").insert({
      user_id: newId,
      role: "agent",
    });
    if (roleErr) throw new Error(roleErr.message);

    return { ok: true, id: newId };
  });

export const listAgents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: roles, error: rolesErr } = await supabaseAdmin
      .from("user_roles").select("user_id").eq("role", "agent");
    if (rolesErr) throw new Error(rolesErr.message);
    const ids = (roles ?? []).map((r) => r.user_id);
    if (!ids.length) return { agents: [] };
    const { data: profiles, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, phone, username, avatar_url, created_at")
      .in("id", ids)
      .order("created_at", { ascending: false });
    if (pErr) throw new Error(pErr.message);
    return { agents: profiles ?? [] };
  });

export const updateAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => updateSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("profiles").update({
      full_name: data.full_name,
      phone: data.phone || null,
      username: data.username,
      avatar_url: data.avatar_url || null,
    }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.id === context.userId) throw new Error("You cannot delete yourself.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
