import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PageLayoutMode = "pagination" | "loadmore";
export type PageCardStyle = "grid" | "ticket";

export type PageLayoutContent = {
  columns?: 1 | 2 | 3 | 4;
  cardStyle?: PageCardStyle;
  mode?: PageLayoutMode;
  pageSize?: number;
  loadMoreLabel?: string;
};

const DEFAULTS: Record<string, Required<PageLayoutContent>> = {
  properties: { columns: 3, cardStyle: "grid", mode: "pagination", pageSize: 9, loadMoreLabel: "Load more properties" },
  offers:     { columns: 3, cardStyle: "grid", mode: "pagination", pageSize: 9, loadMoreLabel: "Load more offers" },
  news:       { columns: 3, cardStyle: "grid", mode: "pagination", pageSize: 6, loadMoreLabel: "Load more articles" },
  agents:     { columns: 4, cardStyle: "grid", mode: "pagination", pageSize: 12, loadMoreLabel: "Load more agents" },
};

export function usePageLayout(slug: string): Required<PageLayoutContent> {
  const { data } = useQuery({
    queryKey: ["page-layout", slug],
    staleTime: 60_000,
    queryFn: async (): Promise<PageLayoutContent | null> => {
      const { data, error } = await supabase
        .from("page_sections")
        .select("content")
        .eq("page_slug", slug)
        .eq("section_key", "layout")
        .maybeSingle();
      if (error) return null;
      return (data?.content as PageLayoutContent) ?? null;
    },
  });
  const def = DEFAULTS[slug] ?? DEFAULTS.properties;
  return { ...def, ...(data || {}) };
}

export function columnsToGridClass(columns: number) {
  switch (columns) {
    case 1: return "grid-cols-1";
    case 2: return "grid-cols-1 sm:grid-cols-2";
    case 3: return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
    case 4: return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";
    default: return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
  }
}
