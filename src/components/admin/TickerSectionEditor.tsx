import { useEffect, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Palette, Plus, Save, Settings2, Trash2, Type } from "lucide-react";
import {
  DEFAULT_TICKER_CONFIG,
  DEFAULT_TICKER_STYLE,
  type TickerConfig,
  type TickerStyle,
} from "@/hooks/useTickerConfig";

export function TickerSectionEditor() {
  const qc = useQueryClient();
  const [value, setValue] = useState<TickerConfig>(DEFAULT_TICKER_CONFIG);

  const { data } = useQuery({
    queryKey: ["site-settings", "ticker_json", "edit"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "ticker_json")
        .maybeSingle();
      if (error) throw error;
      return data?.value || "";
    },
  });

  useEffect(() => {
    if (!data) return;
    try {
      const t = JSON.parse(data);
      setValue({
        ...DEFAULT_TICKER_CONFIG,
        ...t,
        items: Array.isArray(t?.items) ? t.items : [],
        style: { ...DEFAULT_TICKER_STYLE, ...(t?.style || {}) },
      });
    } catch { /* keep defaults */ }
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("site_settings")
        .upsert([{ key: "ticker_json", value: JSON.stringify(value) }], { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("News ticker saved");
      qc.invalidateQueries({ queryKey: ["site-settings", "ticker_json"] });
      qc.invalidateQueries({ queryKey: ["site-settings", "ticker_json", "edit"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const set = <K extends keyof TickerConfig>(k: K, v: TickerConfig[K]) =>
    setValue((c) => ({ ...c, [k]: v }));
  const setStyle = <K extends keyof TickerStyle>(k: K, v: TickerStyle[K]) =>
    setValue((c) => ({ ...c, style: { ...DEFAULT_TICKER_STYLE, ...(c.style || {}), [k]: v } }));

  const updateItem = (i: number, patch: Partial<{ title: string; link: string }>) => {
    const items = [...value.items];
    items[i] = { ...items[i], ...patch };
    set("items", items);
  };
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.items.length) return;
    const items = [...value.items];
    [items[i], items[j]] = [items[j], items[i]];
    set("items", items);
  };
  const remove = (i: number) => set("items", value.items.filter((_, idx) => idx !== i));
  const add = () => set("items", [...value.items, { title: "", link: "" }]);

  const speed = Number(value.speed) || 40;
  const threshold = Number(value.scrollThreshold) || 3;
  const willScroll = value.items.filter((i) => i?.title?.trim()).length > threshold;
  const st = value.style;

  return (
    <div className="space-y-5">
      {/* Live preview */}
      <div
        className="overflow-hidden rounded-2xl border border-border"
        style={{
          background: `linear-gradient(90deg, ${st.bg_from} 0%, ${st.bg_to} 100%)`,
          color: st.text_color,
          marginTop: `${Math.min(st.margin_top, 24)}px`,
          marginBottom: `${Math.min(st.margin_bottom, 24)}px`,
        }}
      >
        <div className="flex items-stretch">
          {st.show_label && (
            <div
              className="flex items-center gap-2"
              style={{
                background: st.label_bg,
                paddingTop: `${st.padding_y}px`,
                paddingBottom: `${st.padding_y}px`,
                paddingLeft: `${Math.max(12, st.padding_x * 0.75)}px`,
                paddingRight: `${Math.max(12, st.padding_x * 0.75)}px`,
              }}
            >
              <span
                className="grid h-7 w-7 place-items-center rounded-full text-[10px] font-bold"
                style={{ background: `${st.accent_color}33`, color: st.accent_color }}
              >
                N
              </span>
              <span
                className="text-[11px] font-semibold uppercase tracking-[0.25em]"
                style={{ color: st.accent_color }}
              >
                {st.label_text || "Latest news"}
              </span>
            </div>
          )}
          <div
            className="flex flex-wrap items-center"
            style={{
              gap: `${st.item_gap}px`,
              paddingTop: `${st.padding_y}px`,
              paddingBottom: `${st.padding_y}px`,
              paddingLeft: `${st.padding_x}px`,
              paddingRight: `${st.padding_x}px`,
            }}
          >
            {["Sample headline one", "Sample headline two"].map((t, i) => (
              <span
                key={i}
                className={`flex items-center gap-3 ${st.text_size === "lg" ? "text-base" : st.text_size === "sm" ? "text-sm" : "text-[15px]"}`}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: `${st.accent_color}b3` }} />
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Settings */}
      <Panel icon={Settings2} title="Behaviour">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={value.enabled}
            onChange={(e) => set("enabled", e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          Show news ticker on the website
        </label>
        <Field label="Content source">
          <div className="flex gap-1 rounded-lg bg-muted p-1 text-xs">
            {(["manual", "random"] as const).map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => set("source", s)}
                className={`flex-1 rounded-md px-3 py-1.5 capitalize ${(value.source || "manual") === s ? "bg-white shadow-sm" : "text-muted-foreground"}`}
              >
                {s === "manual" ? "Manual items" : "Random news"}
              </button>
            ))}
          </div>
        </Field>
        {value.source === "random" && (
          <Field label={`Random news count — ${value.randomCount || 8}`}>
            <input
              type="range" min={1} max={20} value={value.randomCount || 8}
              onChange={(e) => set("randomCount", Number(e.target.value))}
              className="w-full accent-primary"
            />
          </Field>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={`Scroll speed — ${speed}s / loop ${speed <= 20 ? "(fast)" : speed >= 60 ? "(slow)" : "(normal)"}`}>
            <input
              type="range" min={10} max={120} step={5} value={speed}
              onChange={(e) => set("speed", Number(e.target.value))}
              className="w-full accent-primary"
            />
          </Field>
          <Field label="Scroll only when more than">
            <div className="flex items-center gap-2">
              <input
                type="number" min={1} max={20} value={threshold}
                onChange={(e) => set("scrollThreshold", Math.max(1, Number(e.target.value) || 1))}
                className={inputCls + " w-24"}
              />
              <span className="text-xs text-muted-foreground">items</span>
            </div>
          </Field>
        </div>
        <p className="text-xs text-muted-foreground">
          {value.source === "random"
            ? "Random news mode: pulls random published news posts. Manual items below are ignored."
            : willScroll
              ? `Ticker will scroll because there are more than ${threshold} items.`
              : `Ticker will display statically — add more than ${threshold} items to enable scrolling.`}
          {value.source !== "random" && value.items.length === 0 && " When empty, the latest published news posts are used automatically."}
        </p>
      </Panel>

      {/* Style & colors */}
      <Panel icon={Palette} title="Style & colors">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <ColorField label="Background from" value={st.bg_from} onChange={(v) => setStyle("bg_from", v)} />
          <ColorField label="Background to" value={st.bg_to} onChange={(v) => setStyle("bg_to", v)} />
          <ColorField label="Text" value={st.text_color} onChange={(v) => setStyle("text_color", v)} />
          <ColorField label="Accent" value={st.accent_color} onChange={(v) => setStyle("accent_color", v)} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Label text">
            <input className={inputCls} value={st.label_text} onChange={(e) => setStyle("label_text", e.target.value)} />
          </Field>
          <Field label="Show label">
            <div className="flex gap-1 rounded-lg bg-muted p-1 text-xs">
              {[true, false].map((b) => (
                <button
                  type="button"
                  key={String(b)}
                  onClick={() => setStyle("show_label", b)}
                  className={`flex-1 rounded-md px-3 py-1.5 ${st.show_label === b ? "bg-white shadow-sm" : "text-muted-foreground"}`}
                >
                  {b ? "Visible" : "Hidden"}
                </button>
              ))}
            </div>
          </Field>
        </div>
        <Field label="Text size">
          <div className="flex gap-1 rounded-lg bg-muted p-1 text-xs">
            {(["sm", "base", "lg"] as const).map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setStyle("text_size", s)}
                className={`flex-1 rounded-md px-3 py-1.5 capitalize ${st.text_size === s ? "bg-white shadow-sm" : "text-muted-foreground"}`}
              >
                {s}
              </button>
            ))}
          </div>
        </Field>
      </Panel>

      {/* Spacing */}
      <Panel icon={Type} title="Padding & margin">
        <div className="grid gap-4 sm:grid-cols-2">
          <RangeField label="Padding (vertical)" value={st.padding_y} min={0} max={48} onChange={(v) => setStyle("padding_y", v)} unit="px" />
          <RangeField label="Padding (horizontal)" value={st.padding_x} min={0} max={80} onChange={(v) => setStyle("padding_x", v)} unit="px" />
          <RangeField label="Margin top" value={st.margin_top} min={0} max={120} onChange={(v) => setStyle("margin_top", v)} unit="px" />
          <RangeField label="Margin bottom" value={st.margin_bottom} min={0} max={120} onChange={(v) => setStyle("margin_bottom", v)} unit="px" />
          <RangeField label="Gap between items" value={st.item_gap} min={8} max={120} onChange={(v) => setStyle("item_gap", v)} unit="px" />
        </div>
      </Panel>

      {/* Items */}
      {value.source !== "random" && (
        <Panel icon={Plus} title="Ticker items">
          <div className="space-y-2">
            {value.items.map((item, i) => (
              <div key={i} className="grid gap-2 rounded-lg border border-border/60 bg-white p-2.5 sm:grid-cols-[1fr_1fr_auto]">
                <Field label="Title">
                  <input className={inputCls} value={item.title} onChange={(e) => updateItem(i, { title: e.target.value })} placeholder="Breaking headline" />
                </Field>
                <Field label="Link (optional)">
                  <input className={inputCls} value={item.link || ""} onChange={(e) => updateItem(i, { link: e.target.value })} placeholder="/news/slug or https://…" />
                </Field>
                <div className="flex items-end justify-end gap-1 sm:flex-col sm:items-stretch">
                  <IconBtn onClick={() => move(i, -1)} label="Move up"><ArrowUp className="h-3.5 w-3.5" /></IconBtn>
                  <IconBtn onClick={() => move(i, 1)} label="Move down"><ArrowDown className="h-3.5 w-3.5" /></IconBtn>
                  <IconBtn onClick={() => remove(i)} label="Remove" danger><Trash2 className="h-3.5 w-3.5" /></IconBtn>
                </div>
              </div>
            ))}
            <button
              type="button" onClick={add}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Plus className="h-4 w-4" /> Add ticker item
            </button>
          </div>
        </Panel>
      )}

      <div className="flex justify-end border-t border-border pt-4">
        <button
          type="button"
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          <Save className="h-4 w-4" /> {save.isPending ? "Saving…" : "Save ticker"}
        </button>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function RangeField({ label, value, min, max, onChange, unit = "" }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void; unit?: string }) {
  return (
    <Field label={`${label} — ${value}${unit}`}>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-primary" />
    </Field>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Field label={label}>
      <ThemedColorInput value={value} onChange={onChange} />
    </Field>
  );
}

function Panel({ icon: Icon, title, children }: { icon: typeof Type; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 rounded-2xl border border-border bg-white p-5">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4 text-primary" /> {title}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function IconBtn({ onClick, label, children, danger }: { onClick: () => void; label: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <button
      type="button" onClick={onClick} aria-label={label}
      className={`grid h-8 w-8 place-items-center rounded-md border ${danger ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100" : "border-input bg-background hover:bg-muted"}`}
    >
      {children}
    </button>
  );
}
