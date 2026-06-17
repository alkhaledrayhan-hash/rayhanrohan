import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SectionMap = Record<string, any>;

export function usePageSections(pageSlug: string) {
  return useQuery({
    queryKey: ["home-sections", pageSlug],
    queryFn: async (): Promise<SectionMap> => {
      const { data, error } = await supabase
        .from("page_sections")
        .select("section_key, content")
        .eq("page_slug", pageSlug);
      if (error) throw error;
      const map: SectionMap = {};
      for (const row of data ?? []) map[row.section_key] = row.content;
      return map;
    },
    staleTime: 60_000,
  });
}
