import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type TickerItem = { title: string; link?: string };
export type TickerConfig = {
  enabled: boolean;
  /** Seconds per full scroll loop. Lower = faster. */
  speed: number;
  /** Minimum number of items before scrolling activates. */
  scrollThreshold: number;
  items: TickerItem[];
};

export const DEFAULT_TICKER_CONFIG: TickerConfig = {
  enabled: true,
  speed: 40,
  scrollThreshold: 3,
  items: [],
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
        } as TickerConfig;
      } catch {
        return DEFAULT_TICKER_CONFIG;
      }
    },
    staleTime: 60_000,
  });
  return data || DEFAULT_TICKER_CONFIG;
}
