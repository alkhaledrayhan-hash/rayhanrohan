import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SiteSettings = {
  site_title: string;
  site_tagline: string;
  site_url: string;
  site_logo_url: string;
  admin_email: string;
  site_timezone: string;
  date_format: string;
  time_format: string;
  week_starts_on: string;
  auth_bg_color: string;
  auth_bg_image_url: string;
  auth_heading: string;
  auth_subheading: string;
  auth_signin_heading: string;
  auth_signup_heading: string;
  footer_about: string;
  footer_center_eyebrow: string;
  footer_center_title: string;
  footer_center_subtitle: string;
  footer_contact_heading: string;
  footer_address: string;
  footer_phone: string;
  footer_email: string;
  footer_badge_text: string;
  footer_copyright: string;
  footer_show_plane: string;

};

const DEFAULTS: SiteSettings = {
  site_title: "Ayesha Maison Qatar",
  site_tagline: "Premium Living",
  site_url: "",
  site_logo_url: "",
  admin_email: "",
  site_timezone: "Asia/Qatar",
  date_format: "MMMM d, yyyy",
  time_format: "h:mm a",
  week_starts_on: "monday",
  auth_bg_color: "#1a0a0f",
  auth_bg_image_url: "",
  auth_heading: "",
  auth_subheading: "",
  auth_signin_heading: "Welcome back",
  auth_signup_heading: "Create your account",
  footer_about:
    "A curated portfolio of premium residences across Doha, The Pearl, Lusail, West Bay and Al Waab — tailored for the discerning resident.",
  footer_center_eyebrow: "Doha → World",
  footer_center_title: "From Qatar, with intent.",
  footer_center_subtitle: "25.2854° N · 51.5310° E",
  footer_contact_heading: "Contact",
  footer_address: "West Bay, Doha — Qatar",
  footer_phone: "+974 4000 0000",
  footer_email: "hello@maisonqatar.qa",
  footer_badge_text: "Licensed real estate brokerage · Qatar",
  footer_copyright: "© {year} {title}. All rights reserved.",
  footer_show_plane: "true",
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
