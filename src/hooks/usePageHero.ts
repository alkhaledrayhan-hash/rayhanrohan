import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PageHeroContent = {
  eyebrow?: string;
  title?: string;
  description?: string;
  image?: string;
  // Properties page only — per-status overrides
  eyebrow_rent?: string;
  eyebrow_sale?: string;
  eyebrow_all?: string;
  title_rent?: string;
  title_sale?: string;
  title_all?: string;
};

export function usePageHero(slug: string) {
  return useQuery({
    queryKey: ["page-hero", slug],
    staleTime: 60_000,
    queryFn: async (): Promise<PageHeroContent | null> => {
      const { data, error } = await supabase
        .from("page_sections")
        .select("content")
        .eq("page_slug", slug)
        .eq("section_key", "hero")
        .maybeSingle();
      if (error) return null;
      return (data?.content as PageHeroContent) ?? null;
    },
  });
}
