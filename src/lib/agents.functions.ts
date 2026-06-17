import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const schema = z.object({
  full_name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).optional().default(""),
  username: z.string().trim().regex(/^[a-zA-Z0-9_]{3,30}$/).optional().or(z.literal("")),
  password: z.string().min(8).max(72),
  gender: z.string().max(20).optional().default(""),
  city: z.string().max(80).optional().default(""),
  country: z.string().max(80).optional().default(""),
  address: z.string().max(500).optional().default(""),
  avatar_url: z.string().url().max(500).optional().or(z.literal("")),
});

export const createAgent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => schema.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: {
        full_name: data.full_name,
        username: data.username || null,
      },
    });
    if (createErr || !created.user) throw new Error(createErr?.message || "Failed to create user");

    const newId = created.user.id;

    // Profile may already exist via handle_new_user trigger; upsert extras
    await supabaseAdmin.from("profiles").update({
      full_name: data.full_name,
      phone: data.phone || null,
      avatar_url: data.avatar_url || null,
      username: data.username || null,
    }).eq("id", newId);

    // Replace default 'user' role with 'agent'
    await supabaseAdmin.from("user_roles").delete().eq("user_id", newId);
    const { error: roleErr } = await supabaseAdmin.from("user_roles").insert({
      user_id: newId,
      role: "agent",
    });
    if (roleErr) throw new Error(roleErr.message);

    return { ok: true, id: newId };
  });
