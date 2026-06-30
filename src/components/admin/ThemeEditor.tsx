import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Palette, Type, RotateCcw, Save } from "lucide-react";
import {
  DEFAULT_COLORS,
  DEFAULT_TYPOGRAPHY,
  buildThemeCss,
  useThemeTokens,
  type ThemeColors,
  type ThemeTypography,
} from "@/hooks/useThemeTokens";

const COLOR_FIELDS: Array<{ key: keyof ThemeColors; label: string }> = [
  { key: "primary", label: "Primary" },
  { key: "primary_foreground", label: "Primary text" },
  { key: "gold", label: "Gold" },
  { key: "gold_foreground", label: "Gold text" },
  { key: "background", label: "Background" },
  { key: "foreground", label: "Foreground" },
  { key: "secondary", label: "Secondary" },
  { key: "muted", label: "Muted" },
  { key: "accent", label: "Accent" },
  { key: "border", label: "Border" },
  { key: "scrollbar", label: "Scrollbar" },
];

const SIZE_FIELDS: Array<{ key: keyof ThemeTypography; label: string; min: number; max: number }> = [
  { key: "font_size_sm", label: "Small (sm)", min: 10, max: 22 },
  { key: "font_size_base", label: "Base", min: 12, max: 24 },
  { key: "font_size_lg", label: "Large (lg)", min: 14, max: 28 },
  { key: "font_size_xl", label: "X-Large (xl)", min: 16, max: 36 },
  { key: "font_size_2xl", label: "2X-Large", min: 18, max: 48 },
];

export function ThemeEditor() {
  const qc = useQueryClient();
  const { data } = useThemeTokens();
  const [colors, setColors] = useState<ThemeColors>({ ...DEFAULT_COLORS });
  const [typo, setTypo] = useState<ThemeTypography>({ ...DEFAULT_TYPOGRAPHY });

  useEffect(() => {
    if (data) {
      setColors({ ...DEFAULT_COLORS, ...data.colors });
      setTypo({ ...DEFAULT_TYPOGRAPHY, ...data.typography });
    }
  }, [data]);

  // Live-apply edits site-wide by writing to the same <style id="dynamic-theme">
  // tag that useApplyTheme manages.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const id = "dynamic-theme";
    let el = document.getElementById(id) as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement("style");
      el.id = id;
      document.head.appendChild(el);
    }
    el.textContent = buildThemeCss(colors, typo);
  }, [colors, typo]);

  // On unmount, restore the saved theme.
  useEffect(() => {
    return () => {
      if (typeof document === "undefined") return;
      const el = document.getElementById("dynamic-theme") as HTMLStyleElement | null;
      if (el && data) el.textContent = buildThemeCss(data.colors, data.typography);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = useMutation({
    mutationFn: async () => {
      const rows = [
        { key: "theme_colors", value: JSON.stringify(colors) },
        { key: "theme_typography", value: JSON.stringify(typo) },
      ];
      const { error } = await supabase
        .from("site_settings")
        .upsert(rows, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Theme saved — applied site-wide");
      qc.invalidateQueries({ queryKey: ["theme-tokens"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Live preview CSS scoped to the preview box.
  const previewCss = buildThemeCss(colors, typo).replace(":root", "[data-theme-preview]");

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display text-lg font-semibold">Theme & Typography</h3>
        <p className="text-sm text-muted-foreground">
          Centrally controls colors, font sizes, and radius across the entire website. Individual
          sections that haven't set their own values inherit from here.
        </p>
      </div>

      {/* Colors */}
      <div className="rounded-2xl border border-border bg-white p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <Palette className="h-4 w-4 text-primary" /> Colors
          <button
            type="button"
            onClick={() => setColors({ ...DEFAULT_COLORS })}
            className="ml-auto inline-flex items-center gap-1 text-xs font-normal text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {COLOR_FIELDS.map((f) => (
            <ColorRow
              key={f.key}
              label={f.label}
              value={(colors[f.key] as string) || ""}
              onChange={(v) => setColors((c) => ({ ...c, [f.key]: v }))}
            />
          ))}
        </div>
        <p className="mt-3 text-[11px] text-muted-foreground">
          Values use CSS color functions (oklch, hsl, hex). Example: <code>oklch(0.38 0.13 18)</code> or <code>#7a1325</code>.
        </p>
      </div>

      {/* Typography */}
      <div className="rounded-2xl border border-border bg-white p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <Type className="h-4 w-4 text-primary" /> Typography & radius
          <button
            type="button"
            onClick={() => setTypo({ ...DEFAULT_TYPOGRAPHY })}
            className="ml-auto inline-flex items-center gap-1 text-xs font-normal text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SIZE_FIELDS.map((f) => (
            <label key={f.key} className="block space-y-1">
              <span className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span>{f.label}</span>
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono">
                  {(typo[f.key] as number) || 0}px
                </span>
              </span>
              <input
                type="range"
                min={f.min}
                max={f.max}
                value={(typo[f.key] as number) || 0}
                onChange={(e) =>
                  setTypo((t) => ({ ...t, [f.key]: Number(e.target.value) }))
                }
                className="w-full"
              />
            </label>
          ))}
          <label className="block space-y-1">
            <span className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>Corner radius</span>
              <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono">
                {typo.radius || 0}px
              </span>
            </span>
            <input
              type="range"
              min={0}
              max={24}
              value={typo.radius || 0}
              onChange={(e) => setTypo((t) => ({ ...t, radius: Number(e.target.value) }))}
              className="w-full"
            />
          </label>
        </div>
      </div>

      {/* Live preview */}
      <div className="rounded-2xl border border-border bg-white p-5">
        <p className="mb-3 text-sm font-semibold">Live preview</p>
        <style dangerouslySetInnerHTML={{ __html: previewCss }} />
        <div
          data-theme-preview
          className="space-y-4 rounded-xl border border-border p-6"
          style={{
            background: "var(--background)",
            color: "var(--foreground)",
          }}
        >
          <p className="text-sm" style={{ color: "var(--gold)" }}>
            EYEBROW LABEL
          </p>
          <h2 className="text-2xl font-semibold">A sample headline reads like this.</h2>
          <p className="text-base">
            Body text size flows from the central scale. Adjust sizes above and watch this preview
            update live.
          </p>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Smaller helper text uses the sm size — useful for captions and metadata.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <button
              className="px-5 py-2 text-sm font-medium"
              style={{
                background: "var(--primary)",
                color: "var(--primary-foreground)",
                borderRadius: "var(--radius)",
              }}
            >
              Primary button
            </button>
            <button
              className="px-5 py-2 text-sm font-medium"
              style={{
                background: "var(--gold)",
                color: "var(--gold-foreground)",
                borderRadius: "var(--radius)",
              }}
            >
              Gold accent
            </button>
            <button
              className="px-5 py-2 text-sm font-medium"
              style={{
                background: "transparent",
                color: "var(--foreground)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
              }}
            >
              Outline
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          <Save className="h-4 w-4" /> {save.isPending ? "Saving…" : "Save theme"}
        </button>
      </div>
    </div>
  );
}

function toHex(value: string): string {
  if (!value) return "#000000";
  if (/^#[0-9a-f]{6}$/i.test(value)) return value;
  if (/^#[0-9a-f]{3}$/i.test(value)) {
    return "#" + value.slice(1).split("").map((c) => c + c).join("");
  }
  if (typeof document === "undefined") return "#000000";
  // Use the browser to convert any CSS color (oklch/hsl/rgb/named) to rgb, then hex.
  const probe = document.createElement("div");
  probe.style.color = value;
  probe.style.display = "none";
  document.body.appendChild(probe);
  const rgb = getComputedStyle(probe).color;
  document.body.removeChild(probe);
  const m = rgb.match(/\d+(\.\d+)?/g);
  if (!m || m.length < 3) return "#000000";
  const [r, g, b] = m.slice(0, 3).map((n) => Math.max(0, Math.min(255, Math.round(parseFloat(n)))));
  return "#" + [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("");
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const hex = toHex(value);
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-input bg-background p-1.5">
        <span
          className="h-8 w-10 shrink-0 rounded border border-border"
          style={{ background: value }}
        />
        <input
          type="color"
          value={hex}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-8 cursor-pointer rounded border-0 bg-transparent"
          title="Pick a color"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-xs outline-none"
          placeholder="oklch(...) or #hex"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
