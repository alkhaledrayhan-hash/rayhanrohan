import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ThemeColors = {
  primary?: string;
  primary_foreground?: string;
  gold?: string;
  gold_foreground?: string;
  background?: string;
  foreground?: string;
  secondary?: string;
  muted?: string;
  accent?: string;
  border?: string;
  scrollbar?: string;
};

export type ThemeTypography = {
  font_size_base?: number;
  font_size_sm?: number;
  font_size_lg?: number;
  font_size_xl?: number;
  font_size_2xl?: number;
  radius?: number;
  display_font?: string;
  body_font?: string;
};

export const DEFAULT_COLORS: ThemeColors = {
  primary: "oklch(0.38 0.13 18)",
  primary_foreground: "oklch(0.98 0.005 80)",
  gold: "oklch(0.74 0.12 85)",
  gold_foreground: "oklch(0.2 0.02 60)",
  background: "oklch(1 0 0)",
  foreground: "oklch(0.18 0.01 60)",
  secondary: "oklch(0.97 0.005 80)",
  muted: "oklch(0.96 0.005 80)",
  accent: "oklch(0.96 0.02 85)",
  border: "oklch(0.92 0.005 80)",
  scrollbar: "#f97316",
};

export const DEFAULT_TYPOGRAPHY: ThemeTypography = {
  font_size_base: 16,
  font_size_sm: 14,
  font_size_lg: 18,
  font_size_xl: 20,
  font_size_2xl: 24,
  radius: 8,
  display_font: "Cormorant Garamond",
  body_font: "Inter",
};

export function useThemeTokens() {
  return useQuery({
    queryKey: ["theme-tokens"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["theme_colors", "theme_typography"]);
      if (error) throw error;
      let colors: ThemeColors = { ...DEFAULT_COLORS };
      let typo: ThemeTypography = { ...DEFAULT_TYPOGRAPHY };
      for (const row of data ?? []) {
        try {
          const v = JSON.parse(row.value || "{}");
          if (row.key === "theme_colors") colors = { ...colors, ...v };
          if (row.key === "theme_typography") typo = { ...typo, ...v };
        } catch {
          /* ignore */
        }
      }
      return { colors, typography: typo };
    },
    staleTime: 5 * 60_000,
  });
}

export function buildThemeCss(colors: ThemeColors, t: ThemeTypography): string {
  const c = { ...DEFAULT_COLORS, ...colors };
  const ty = { ...DEFAULT_TYPOGRAPHY, ...t };
  return `:root{
    --primary:${c.primary};
    --primary-foreground:${c.primary_foreground};
    --gold:${c.gold};
    --gold-foreground:${c.gold_foreground};
    --background:${c.background};
    --foreground:${c.foreground};
    --secondary:${c.secondary};
    --muted:${c.muted};
    --accent:${c.accent};
    --border:${c.border};
    --input:${c.border};
    --ring:${c.primary};
    --radius:${(ty.radius || 8) / 16}rem;
    --scrollbar-color:${c.scrollbar};
  }
  html{font-size:${ty.font_size_base}px}
  .text-sm{font-size:${ty.font_size_sm}px}
  .text-base{font-size:${ty.font_size_base}px}
  .text-lg{font-size:${ty.font_size_lg}px}
  .text-xl{font-size:${ty.font_size_xl}px}
  .text-2xl{font-size:${ty.font_size_2xl}px}
  `;
}

/** Inject the live theme CSS into a <style id="dynamic-theme"> tag. */
export function useApplyTheme() {
  const { data } = useThemeTokens();
  useEffect(() => {
    if (!data) return;
    if (typeof document === "undefined") return;
    const id = "dynamic-theme";
    let el = document.getElementById(id) as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement("style");
      el.id = id;
      document.head.appendChild(el);
    }
    el.textContent = buildThemeCss(data.colors, data.typography);
  }, [data]);
}
