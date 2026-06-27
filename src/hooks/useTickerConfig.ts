import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type TickerItem = { title: string; link?: string };

export type TickerStyle = {
  bg_from: string;
  bg_to: string;
  text_color: string;
  accent_color: string;
  label_text: string;
  label_bg: string;
  show_label: boolean;
  padding_y: number; // px
  padding_x: number; // px (inner content side padding)
  margin_top: number; // px
  margin_bottom: number; // px
  text_size: "sm" | "base" | "lg";
  item_gap: number; // px between items
};

export type TickerConfig = {
  enabled: boolean;
  source: "manual" | "random";
  randomCount: number;
  speed: number;
  scrollThreshold: number;
  items: TickerItem[];
  style: TickerStyle;
};

export const DEFAULT_TICKER_STYLE: TickerStyle = {
  bg_from: "#3d0f1d",
  bg_to: "#3d0f1d",
  text_color: "#ffffff",
  accent_color: "#d4af37",
  label_text: "Latest news",
  label_bg: "#ffffff14",
  show_label: true,
  padding_y: 12,
  padding_x: 16,
  margin_top: 0,
  margin_bottom: 0,
  text_size: "sm",
  item_gap: 40,
};

export const DEFAULT_TICKER_CONFIG: TickerConfig = {
  enabled: true,
  source: "manual",
  randomCount: 8,
  speed: 40,
  scrollThreshold: 3,
  items: [],
  style: DEFAULT_TICKER_STYLE,
};

export function useTickerConfig() {
  const { data } = useQuery({
    queryKey: ["site-settings", "ticker_json"],
    queryFn: async (): Promise<TickerConfig> => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "ticker_json")
        .maybeSingle();
      if (error) throw error;
      if (!data?.value) return DEFAULT_TICKER_CONFIG;
      try {
        const parsed = JSON.parse(data.value);
        return {
          ...DEFAULT_TICKER_CONFIG,
          ...parsed,
          items: Array.isArray(parsed?.items) ? parsed.items : [],
          style: { ...DEFAULT_TICKER_STYLE, ...(parsed?.style || {}) },
        } as TickerConfig;
      } catch {
        return DEFAULT_TICKER_CONFIG;
      }
    },
    staleTime: 60_000,
  });
  return data || DEFAULT_TICKER_CONFIG;
}
