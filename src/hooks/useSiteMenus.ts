import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type HeaderSubItem = { label: string; to: string; search?: Record<string, string>; icon?: string };
export type HeaderMenuItem = {
  label: string;
  to: string;
  search?: Record<string, string>;
  icon?: string;
  children?: HeaderSubItem[];
};

export type FooterMenuGroup = {
  heading: string;
  items: { label: string; to: string }[];
};

export type HeaderCta = {
  label: string;
  to: string;
  search?: Record<string, string>;
  enabled: boolean;
};

export const DEFAULT_HEADER_CTA: HeaderCta = {
  label: "Browse Listings",
  to: "/properties",
  search: { status: "rent" },
  enabled: true,
};

export const DEFAULT_HEADER_MENU: HeaderMenuItem[] = [
  { label: "Home", to: "/" },
  { label: "Properties", to: "/properties", search: { status: "all" } },
  { label: "For Rent", to: "/properties", search: { status: "rent" } },
  { label: "For Sale", to: "/properties", search: { status: "sale" } },
  { label: "Special Offers", to: "/offers" },
  { label: "Our Agents", to: "/agents" },
  { label: "News", to: "/news" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
];


export const DEFAULT_FOOTER_MENU: FooterMenuGroup[] = [
  {
    heading: "Explore",
    items: [
      { label: "Home", to: "/" },
      { label: "Properties", to: "/properties" },
      { label: "Special Offers", to: "/offers" },
      { label: "Our Agents", to: "/agents" },
    ],
  },
  {
    heading: "Company",
    items: [
      { label: "About Us", to: "/about" },
      { label: "News & Blog", to: "/news" },
      { label: "Contact", to: "/contact" },
    ],
  },
];

function safeParse<T>(raw: string, fallback: T): T {
  if (!raw) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed && (Array.isArray(parsed) || typeof parsed === "object") ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
}

export function useSiteMenus() {
  const { data } = useQuery({
    queryKey: ["site-menus"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["header_menu_json", "footer_menu_json", "header_cta_json"]);
      if (error) throw error;
      const map: Record<string, string> = {};
      (data || []).forEach((r: any) => { map[r.key] = r.value || ""; });
      return {
        header: safeParse<HeaderMenuItem[]>(map.header_menu_json, DEFAULT_HEADER_MENU),
        footer: safeParse<FooterMenuGroup[]>(map.footer_menu_json, DEFAULT_FOOTER_MENU),
        cta: safeParse<HeaderCta>(map.header_cta_json, DEFAULT_HEADER_CTA),
      };
    },
    staleTime: 60_000,
  });
  return data || { header: DEFAULT_HEADER_MENU, footer: DEFAULT_FOOTER_MENU, cta: DEFAULT_HEADER_CTA };
}

