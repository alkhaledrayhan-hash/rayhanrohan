import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { DEMO_PROPERTIES } from "./demo-properties";

export const resetDemoProperties = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin, error: roleErr } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (roleErr) throw new Error("Role check failed");
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const slugs = DEMO_PROPERTIES.map((p) => p.slug);

    // Find existing demo property ids
    const { data: existing } = await supabaseAdmin
      .from("properties")
      .select("id")
      .in("slug", slugs);
    const ids = (existing ?? []).map((r: any) => r.id);

    // Remove dependent rows so the delete doesn't get blocked by FKs
    if (ids.length) {
      await supabaseAdmin.from("bookings").delete().in("property_id", ids);
      await supabaseAdmin.from("leads").delete().in("property_id", ids);
      await supabaseAdmin.from("conversations").delete().in("property_id", ids);
      await supabaseAdmin.from("properties").delete().in("id", ids);
    }

    // Re-seed fresh demo rows
    const rows = DEMO_PROPERTIES.map((p) => ({ ...p }));
    const { error: insErr, count } = await supabaseAdmin
      .from("properties")
      .insert(rows, { count: "exact" });
    if (insErr) throw new Error(insErr.message);

    return { ok: true, deleted: ids.length, inserted: count ?? rows.length };
  });
