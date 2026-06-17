import { createFileRoute } from "@tanstack/react-router";

const DEMO_AGENTS = [
  { full_name: "Sarah Johnson", email: "sarah.johnson@demo-urbanhub.com", username: "sarahj", phone: "+1 202 555 0142", avatar_url: "https://i.pravatar.cc/300?img=47" },
  { full_name: "David Miller",  email: "david.miller@demo-urbanhub.com",  username: "davidm", phone: "+1 202 555 0177", avatar_url: "https://i.pravatar.cc/300?img=12" },
  { full_name: "Aisha Rahman",  email: "aisha.rahman@demo-urbanhub.com",  username: "aishar", phone: "+880 171 555 0199", avatar_url: "https://i.pravatar.cc/300?img=32" },
  { full_name: "Carlos Mendez", email: "carlos.mendez@demo-urbanhub.com", username: "carlosm", phone: "+34 600 555 022", avatar_url: "https://i.pravatar.cc/300?img=15" },
  { full_name: "Emily Chen",    email: "emily.chen@demo-urbanhub.com",    username: "emilyc", phone: "+44 20 5555 0166", avatar_url: "https://i.pravatar.cc/300?img=49" },
];

export const Route = createFileRoute("/api/public/seed-demo-agents")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = new URL(request.url).searchParams.get("token");
        if (token !== "uh-seed-2026") return new Response("Forbidden", { status: 403 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const results: any[] = [];
        for (const a of DEMO_AGENTS) {
          const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
            email: a.email,
            password: "Agent@12345",
            email_confirm: true,
            user_metadata: { full_name: a.full_name, username: a.username },
          });
          if (error || !created.user) { results.push({ email: a.email, skipped: error?.message }); continue; }
          const id = created.user.id;
          await supabaseAdmin.from("profiles").update({
            full_name: a.full_name, phone: a.phone, username: a.username, avatar_url: a.avatar_url,
          }).eq("id", id);
          await supabaseAdmin.from("user_roles").delete().eq("user_id", id);
          await supabaseAdmin.from("user_roles").insert({ user_id: id, role: "agent" });
          results.push({ email: a.email, id });
        }
        return Response.json({ ok: true, results });
      },
    },
  },
});
