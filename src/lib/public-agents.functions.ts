import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type PublicAgent = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  property_count: number;
};

export type PublicAgentDetail = PublicAgent & {
  phone: string | null;
  email: string | null;
};

export type PublicAgentProperty = {
  id: string;
  slug: string;
  title: string;
  location: string;
  address: string;
  type: string;
  status: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  image: string | null;
};

export const listPublicAgents = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ agents: PublicAgent[] }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: roles, error: rErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "agent");
    if (rErr) throw new Error(rErr.message);
    const ids = (roles ?? []).map((r) => r.user_id);
    if (!ids.length) return { agents: [] };

    const { data: profiles, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, username, avatar_url")
      .in("id", ids);
    if (pErr) throw new Error(pErr.message);

    const { data: props, error: cErr } = await supabaseAdmin
      .from("properties")
      .select("created_by, assigned_agent_id")
      .or(
        `assigned_agent_id.in.(${ids.join(",")}),created_by.in.(${ids.join(",")})`,
      )
      .eq("listing_status", "approved");
    if (cErr) throw new Error(cErr.message);

    const counts = new Map<string, number>();
    for (const p of props ?? []) {
      // Count toward assigned agent if set, otherwise creator
      const ownerId = p.assigned_agent_id ?? p.created_by;
      if (!ownerId) continue;
      counts.set(ownerId, (counts.get(ownerId) ?? 0) + 1);
    }

    const agents: PublicAgent[] = (profiles ?? [])
      .map((p) => ({
        id: p.id,
        full_name: p.full_name,
        username: p.username,
        avatar_url: p.avatar_url,
        property_count: counts.get(p.id) ?? 0,
      }))
      .sort((a, b) => b.property_count - a.property_count);

    return { agents };
  },
);

export const getPublicAgent = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }): Promise<{ agent: PublicAgentDetail | null; properties: PublicAgentProperty[] }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: role } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("user_id", data.id)
      .eq("role", "agent")
      .maybeSingle();
    if (!role) return { agent: null, properties: [] };

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, username, avatar_url, phone, email")
      .eq("id", data.id)
      .maybeSingle();
    if (!profile) return { agent: null, properties: [] };

    const { data: props, error: pErr } = await supabaseAdmin
      .from("properties")
      .select("id, slug, title, location, address, type, status, price, bedrooms, bathrooms, sqft, image")
      .eq("created_by", data.id)
      .eq("listing_status", "approved")
      .order("created_at", { ascending: false });
    if (pErr) throw new Error(pErr.message);

    return {
      agent: {
        id: profile.id,
        full_name: profile.full_name,
        username: profile.username,
        avatar_url: profile.avatar_url,
        phone: profile.phone,
        email: profile.email,
        property_count: props?.length ?? 0,
      },
      properties: (props ?? []) as PublicAgentProperty[],
    };
  });
