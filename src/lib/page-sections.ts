import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SectionMap = Record<string, any>;

export function usePageSections(pageSlug: string) {
  return useQuery({
    queryKey: ["home-sections", pageSlug],
    queryFn: async (): Promise<SectionMap> => {
      const { data, error } = await supabase
        .from("page_sections")
        .select("section_key, content, is_hidden")
        .eq("page_slug", pageSlug);
      if (error) throw error;
      const map: SectionMap = {};
      for (const row of (data ?? []) as Array<{ section_key: string; content: any; is_hidden?: boolean }>) {
        if (row.is_hidden) continue;
        map[row.section_key] = row.content;
      }
      return map;
    },
    staleTime: 60_000,
  });
}

export function useHiddenSections(pageSlug: string) {
  return useQuery({
    queryKey: ["hidden-sections", pageSlug],
    queryFn: async (): Promise<Set<string>> => {
      const { data, error } = await supabase
        .from("page_sections")
        .select("section_key, is_hidden")
        .eq("page_slug", pageSlug);
      if (error) throw error;
      const set = new Set<string>();
      for (const row of (data ?? []) as Array<{ section_key: string; is_hidden?: boolean }>) {
        if (row.is_hidden) set.add(row.section_key);
      }
      return set;
    },
    staleTime: 60_000,
  });
}

export function useSectionOrder(pageSlug: string) {
  return useQuery({
    queryKey: ["section-order", pageSlug],
    queryFn: async (): Promise<Record<string, number>> => {
      const { data, error } = await supabase
        .from("page_sections")
        .select("section_key, sort_order")
        .eq("page_slug", pageSlug);
      if (error) throw error;
      const map: Record<string, number> = {};
      for (const row of (data ?? []) as Array<{ section_key: string; sort_order: number | null }>) {
        if (row.sort_order != null) map[row.section_key] = row.sort_order;
      }
      return map;
    },
    staleTime: 60_000,
  });
}
