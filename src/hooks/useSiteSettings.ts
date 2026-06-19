import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SiteSettings = {
  site_title: string;
  site_tagline: string;
  admin_email: string;
  auth_bg_color: string;
  auth_bg_image_url: string;
};

const DEFAULTS: SiteSettings = {
  site_title: "Ayesha Maison Qatar",
  site_tagline: "Premium Living",
  admin_email: "",
  auth_bg_color: "#1a0a0f",
  auth_bg_image_url: "",
};

export function useSiteSettings() {
  const { data } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("key, value");
      if (error) throw error;
      const map: Record<string, string> = {};
      (data || []).forEach((r: any) => { map[r.key] = r.value || ""; });
      return {
        site_title: map.site_title || DEFAULTS.site_title,
        site_tagline: map.site_tagline || DEFAULTS.site_tagline,
        admin_email: map.admin_email || DEFAULTS.admin_email,
        auth_bg_color: map.auth_bg_color || DEFAULTS.auth_bg_color,
        auth_bg_image_url: map.auth_bg_image_url || DEFAULTS.auth_bg_image_url,
      } as SiteSettings;
    },
    staleTime: 60_000,
  });
  return data || DEFAULTS;
}
