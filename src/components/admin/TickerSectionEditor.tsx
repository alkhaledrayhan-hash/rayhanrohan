import { useEffect, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from "lucide-react";
import { DEFAULT_TICKER_CONFIG, type TickerConfig } from "@/hooks/useTickerConfig";

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

  const set = <K extends keyof TickerConfig>(k: K, v: TickerConfig[K]) => setValue({ ...value, [k]: v });
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

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={value.enabled}
            onChange={(e) => set("enabled", e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          Show news ticker on the website
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Scroll speed</span>
              <span className="text-foreground">{speed}s / loop {speed <= 20 ? "(fast)" : speed >= 60 ? "(slow)" : "(normal)"}</span>
            </span>
            <input
              type="range" min={10} max={120} step={5} value={speed}
              onChange={(e) => set("speed", Number(e.target.value))}
              className="w-full accent-primary"
            />
          </label>
          <label className="block space-y-1">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Scroll only when more than
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number" min={1} max={20} value={threshold}
                onChange={(e) => set("scrollThreshold", Math.max(1, Number(e.target.value) || 1))}
                className="w-20 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <span className="text-xs text-muted-foreground">items</span>
            </div>
          </label>
        </div>
        <p className="text-xs text-muted-foreground">
          {willScroll
            ? `Ticker will scroll because there are more than ${threshold} items.`
            : `Ticker will display statically — add more than ${threshold} items to enable scrolling.`}
          {value.items.length === 0 && " When empty, the latest published news posts are used automatically."}
        </p>
      </div>

      <div className="space-y-2">
        {value.items.map((item, i) => (
          <div key={i} className="grid gap-2 rounded-lg border border-border/60 bg-white p-2.5 sm:grid-cols-[1fr_1fr_auto]">
            <LabeledInput label="Title" value={item.title} onChange={(v) => updateItem(i, { title: v })} placeholder="Breaking headline" />
            <LabeledInput label="Link (optional)" value={item.link || ""} onChange={(v) => updateItem(i, { link: v })} placeholder="/news/slug or https://…" />
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

function LabeledInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block space-y-1">
      <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </label>
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
