import { useEffect, useState } from "react";
import { ThemedSelect } from "@/components/ui/themed-select";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from "lucide-react";
import { MENU_ICON_KEYS } from "@/lib/menu-icons";

export type TrustItem = { title: string; body: string; icon?: string };
export type TrustConfig = {
  items: TrustItem[];
  scroll: { enabled: boolean; speed: number; threshold: number };
};

const DEFAULT_TRUST: TrustConfig = {
  items: [
    { title: "Licensed brokerage", body: "Qatar-registered with verified listings only.", icon: "shield" },
    { title: "Hand-curated portfolio", body: "Every residence is personally inspected.", icon: "sparkles" },
    { title: "Frictionless viewings", body: "Book on WhatsApp or schedule in one tap.", icon: "keyround" },
  ],
  scroll: { enabled: true, speed: 35, threshold: 3 },
};

export function normalizeTrust(raw: any): TrustConfig {
  if (!raw) return DEFAULT_TRUST;
  const items = Array.isArray(raw.items) ? raw.items : [];
  const scroll = raw.scroll && typeof raw.scroll === "object" ? raw.scroll : {};
  return {
    items: items.map((i: any) => ({ title: i?.title || "", body: i?.body || "", icon: i?.icon || undefined })),
    scroll: {
      enabled: scroll.enabled !== false,
      speed: Number(scroll.speed) > 0 ? Number(scroll.speed) : 35,
      threshold: Number(scroll.threshold) > 0 ? Number(scroll.threshold) : 3,
    },
  };
}

export function TrustSectionEditor({ sectionId, initial }: { sectionId: string; initial: any }) {
  const qc = useQueryClient();
  const [value, setValue] = useState<TrustConfig>(normalizeTrust(initial));

  useEffect(() => { setValue(normalizeTrust(initial)); }, [sectionId]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("page_sections").update({ content: value }).eq("id", sectionId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Trust strip saved");
      qc.invalidateQueries({ queryKey: ["page-sections"] });
      qc.invalidateQueries({ queryKey: ["home-sections"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const setItem = (i: number, patch: Partial<TrustItem>) => {
    const items = [...value.items];
    items[i] = { ...items[i], ...patch };
    setValue({ ...value, items });
  };
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.items.length) return;
    const items = [...value.items];
    [items[i], items[j]] = [items[j], items[i]];
    setValue({ ...value, items });
  };
  const remove = (i: number) => setValue({ ...value, items: value.items.filter((_, idx) => idx !== i) });
  const add = () => setValue({ ...value, items: [...value.items, { title: "New trust point", body: "", icon: "star" }] });
  const setScroll = (patch: Partial<TrustConfig["scroll"]>) => setValue({ ...value, scroll: { ...value.scroll, ...patch } });

  const willScroll = value.scroll.enabled && value.items.length > value.scroll.threshold;

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox" checked={value.scroll.enabled}
            onChange={(v: string) => setScroll({ enabled: e.target.checked })}
            className="h-4 w-4 rounded border-input"
          />
          Enable horizontal scrolling when there are many items
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Scroll speed</span>
              <span className="text-foreground">{value.scroll.speed}s / loop</span>
            </span>
            <input
              type="range" min={10} max={120} step={5} value={value.scroll.speed}
              onChange={(v: string) => setScroll({ speed: Number(v) })}
              className="w-full accent-primary"
            />
          </label>
          <label className="block space-y-1">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Scroll only when more than
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number" min={1} max={20} value={value.scroll.threshold}
                onChange={(v: string) => setScroll({ threshold: Math.max(1, Number(v) || 1) })}
                className="w-20 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <span className="text-xs text-muted-foreground">items (default 3)</span>
            </div>
          </label>
        </div>
        <p className="text-xs text-muted-foreground">
          {willScroll ? `Trust strip will auto-scroll because there are more than ${value.scroll.threshold} items.` : `Trust strip displays statically — add more than ${value.scroll.threshold} items to enable scrolling.`}
        </p>
      </div>

      <div className="space-y-2">
        {value.items.map((item, i) => (
          <div key={i} className="grid gap-2 rounded-lg border border-border/60 bg-white p-2.5 sm:grid-cols-[140px_1fr_1fr_auto]">
            <Field label="Icon">
              <ThemedSelect
                value={item.icon || ""}
                onChange={(v: string) => setItem(i, { icon: v || undefined })}
                className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
              >
                <option value="">Auto</option>
                {MENU_ICON_KEYS.map((k) => <option key={k} value={k}>{k}</option>)}
              </ThemedSelect>
            </Field>
            <Field label="Title">
              <input value={item.title} onChange={(v: string) => setItem(i, { title: v })}
                className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm" />
            </Field>
            <Field label="Body">
              <input value={item.body} onChange={(v: string) => setItem(i, { body: v })}
                className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm" />
            </Field>
            <div className="flex items-end justify-end gap-1 sm:flex-col sm:items-stretch">
              <IconBtn onClick={() => move(i, -1)} label="Up"><ArrowUp className="h-3.5 w-3.5" /></IconBtn>
              <IconBtn onClick={() => move(i, 1)} label="Down"><ArrowDown className="h-3.5 w-3.5" /></IconBtn>
              <IconBtn onClick={() => remove(i)} label="Remove" danger><Trash2 className="h-3.5 w-3.5" /></IconBtn>
            </div>
          </div>
        ))}
        <button type="button" onClick={add}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground">
          <Plus className="h-4 w-4" /> Add trust item
        </button>
      </div>

      <div className="flex justify-end border-t border-border pt-4">
        <button type="button" onClick={() => save.mutate()} disabled={save.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60">
          <Save className="h-4 w-4" /> {save.isPending ? "Saving…" : "Save trust strip"}
        </button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
function IconBtn({ onClick, label, children, danger }: { onClick: () => void; label: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <button type="button" onClick={onClick} aria-label={label}
      className={`grid h-8 w-8 place-items-center rounded-md border ${danger ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100" : "border-input bg-background hover:bg-muted"}`}>
      {children}
    </button>
  );
}
