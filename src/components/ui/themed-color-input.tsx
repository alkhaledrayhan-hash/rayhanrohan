import { useMemo } from "react";
import { useThemeTokens, DEFAULT_COLORS, type ThemeColors } from "@/hooks/useThemeTokens";
import { cn } from "@/lib/utils";

/** Convert any CSS color string (oklch/hsl/named/hex) to sRGB hex via canvas. */
function toHex(value: string): string {
  if (!value) return "#000000";
  const v = value.trim();
  if (/^#[0-9a-f]{6}$/i.test(v)) return v.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(v)) {
    return ("#" + v.slice(1).split("").map((c) => c + c).join("")).toLowerCase();
  }
  if (typeof document === "undefined") return "#000000";
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "#000000";
    ctx.fillStyle = "#000000";
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return "#" + [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("");
  } catch {
    return "#000000";
  }
}

const SUGGESTION_KEYS: Array<{ key: keyof ThemeColors; label: string }> = [
  { key: "primary", label: "Primary" },
  { key: "gold", label: "Gold" },
  { key: "accent", label: "Accent" },
  { key: "foreground", label: "Foreground" },
  { key: "background", label: "Background" },
  { key: "muted", label: "Muted" },
  { key: "secondary", label: "Secondary" },
  { key: "border", label: "Border" },
];

const NEUTRAL_PRESETS: Array<{ hex: string; label: string }> = [
  { hex: "#000000", label: "Black" },
  { hex: "#ffffff", label: "White" },
];

export interface ThemedColorInputProps {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  /** When true, suggestion swatches apply as hex (default). When false, applies the raw CSS value (e.g. oklch). */
  asHex?: boolean;
}

export function ThemedColorInput({
  value,
  onChange,
  className,
  asHex = true,
}: ThemedColorInputProps) {
  const { data } = useThemeTokens();
  const colors = { ...DEFAULT_COLORS, ...(data?.colors ?? {}) };

  const swatches = useMemo(() => {
    return SUGGESTION_KEYS.map(({ key, label }) => {
      const raw = colors[key] || "";
      return { key, label, raw, hex: toHex(raw) };
    }).filter((s) => s.raw);
  }, [colors]);

  const hex = toHex(value || "#000000");

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2 rounded-md border border-input bg-background p-1.5">
        <input
          type="color"
          value={hex}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent"
          aria-label="Pick a color"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-xs outline-none"
          placeholder="#hex"
          spellCheck={false}
        />
      </div>
      <div>
        <div className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
          Theme colors
        </div>
        <div className="flex flex-wrap gap-1.5">
          {swatches.map((s) => (
            <button
              key={s.key}
              type="button"
              title={s.label}
              onClick={() => onChange(asHex ? s.hex : s.raw)}
              className={cn(
                "h-6 w-6 rounded border border-border transition hover:scale-110 hover:ring-2 hover:ring-primary/40",
                hex.toLowerCase() === s.hex.toLowerCase() && "ring-2 ring-primary",
              )}
              style={{ background: s.raw }}
            />
          ))}
          {NEUTRAL_PRESETS.map((p) => (
            <button
              key={p.hex}
              type="button"
              title={p.label}
              onClick={() => onChange(p.hex)}
              className={cn(
                "h-6 w-6 rounded border border-border transition hover:scale-110 hover:ring-2 hover:ring-primary/40",
                hex.toLowerCase() === p.hex && "ring-2 ring-primary",
              )}
              style={{ background: p.hex }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default ThemedColorInput;
