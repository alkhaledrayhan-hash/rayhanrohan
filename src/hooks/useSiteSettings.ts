import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SiteSettings = {
  site_title: string;
  site_tagline: string;
  site_url: string;
  admin_email: string;
  site_timezone: string;
  date_format: string;
  time_format: string;
  week_starts_on: string;
  auth_bg_color: string;
  auth_bg_image_url: string;
};

const DEFAULTS: SiteSettings = {
  site_title: "Ayesha Maison Qatar",
  site_tagline: "Premium Living",
  site_url: "",
  admin_email: "",
  site_timezone: "Asia/Qatar",
  date_format: "MMMM d, yyyy",
  time_format: "h:mm a",
  week_starts_on: "monday",
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
      const out: SiteSettings = { ...DEFAULTS };
      (Object.keys(DEFAULTS) as (keyof SiteSettings)[]).forEach((k) => {
        if (map[k]) (out as any)[k] = map[k];
      });
      return out;
    },
    staleTime: 60_000,
  });
  return data || DEFAULTS;
}
