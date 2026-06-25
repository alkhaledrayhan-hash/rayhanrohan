import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Role = "admin" | "agent" | "user";

const roleEnum = z.enum(["admin", "agent", "user"]);

const usernameSchema = z
  .string()
  .trim()
  .regex(/^[a-zA-Z0-9_]{3,30}$/, "Username must be 3-30 chars, letters/numbers/_");

const createSchema = z.object({
  full_name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
  phone: z.string().trim().max(40).optional().default(""),
  username: usernameSchema,
  role: roleEnum,
});

const updateSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().trim().min(1).max(100),
  phone: z.string().trim().max(40).optional().default(""),
  username: usernameSchema,
  role: roleEnum,
});


async function assertAdmin(context: any) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!isAdmin) throw new Error("Forbidden");
}

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profiles, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email, phone, username, avatar_url, created_at")
      .order("created_at", { ascending: false });
    if (pErr) throw new Error(pErr.message);

    const { data: roleRows, error: rErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role");
    if (rErr) throw new Error(rErr.message);

    const map = new Map<string, Role[]>();
    for (const r of roleRows ?? []) {
      const arr = map.get(r.user_id) ?? [];
      arr.push(r.role as Role);
      map.set(r.user_id, arr);
    }

    const users = (profiles ?? []).map((p) => {
      const roles = map.get(p.id) ?? [];
      const primary: Role = roles.includes("admin")
        ? "admin"
        : roles.includes("agent")
        ? "agent"
        : "user";
      return { ...p, roles, role: primary };
    });

    return { users };
  });

export const createUser = createServerFn({ method: "POST" })
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
        username: data.username || null,
      },
    });
    if (createErr || !created.user) throw new Error(createErr?.message || "Failed to create user");

    const newId = created.user.id;

    await supabaseAdmin.from("profiles").update({
      full_name: data.full_name,
      phone: data.phone || null,
      avatar_url: null,
      username: data.username || null,
    }).eq("id", newId);

    await supabaseAdmin.from("user_roles").delete().eq("user_id", newId);
    const { error: roleErr } = await supabaseAdmin.from("user_roles").insert({
      user_id: newId,
      role: data.role,
    });
    if (roleErr) throw new Error(roleErr.message);

    return { ok: true, id: newId };
  });

export const updateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => updateSchema.parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { error } = await supabaseAdmin.from("profiles").update({
      full_name: data.full_name,
      phone: data.phone || null,
      username: data.username || null,
    }).eq("id", data.id);
    if (error) throw new Error(error.message);

    // Replace role (single primary role)
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.id);
    const { error: roleErr } = await supabaseAdmin.from("user_roles").insert({
      user_id: data.id,
      role: data.role,
    });
    if (roleErr) throw new Error(roleErr.message);

    return { ok: true };
  });

export const deleteUser = createServerFn({ method: "POST" })
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

export const setUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), password: z.string().min(8).max(72) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.id, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
