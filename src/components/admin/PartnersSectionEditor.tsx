import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from "lucide-react";

export type PartnerItem = { name: string; logo_url: string; link?: string };
export type PartnersConfig = {
  eyebrow: string;
  title: string;
  subtitle: string;
  items: PartnerItem[];
  scroll: { enabled: boolean; speed: number };
};

const DEFAULT: PartnersConfig = {
  eyebrow: "Our partners",
  title: "Trusted by Qatar's most discerning brands",
  subtitle: "",
  items: [],
  scroll: { enabled: true, speed: 30 },
};

export function normalizePartners(raw: any): PartnersConfig {
  if (!raw) return DEFAULT;
  const items = Array.isArray(raw.items) ? raw.items : [];
  const scroll = raw.scroll && typeof raw.scroll === "object" ? raw.scroll : {};
  return {
    eyebrow: raw.eyebrow ?? DEFAULT.eyebrow,
    title: raw.title ?? DEFAULT.title,
    subtitle: raw.subtitle ?? "",
    items: items.map((i: any) => ({
      name: i?.name || "",
      logo_url: i?.logo_url || i?.src || "",
      link: i?.link || undefined,
    })),
    scroll: {
      enabled: scroll.enabled !== false,
      speed: Number(scroll.speed) > 0 ? Number(scroll.speed) : 30,
    },
  };
}

export function PartnersSectionEditor({ sectionId, initial }: { sectionId: string; initial: any }) {
  const qc = useQueryClient();
  const [value, setValue] = useState<PartnersConfig>(normalizePartners(initial));

  useEffect(() => { setValue(normalizePartners(initial)); }, [sectionId]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("page_sections").update({ content: value }).eq("id", sectionId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Partners saved");
      qc.invalidateQueries({ queryKey: ["page-sections"] });
      qc.invalidateQueries({ queryKey: ["home-sections"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const setItem = (i: number, patch: Partial<PartnerItem>) => {
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
  const add = () => setValue({ ...value, items: [...value.items, { name: "New partner", logo_url: "" }] });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-xl border border-border bg-muted/20 p-4 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Eyebrow</span>
          <input className="w-full rounded-md border border-input bg-white px-3 py-2" value={value.eyebrow} onChange={(e) => setValue({ ...value, eyebrow: e.target.value })} />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Title</span>
          <input className="w-full rounded-md border border-input bg-white px-3 py-2" value={value.title} onChange={(e) => setValue({ ...value, title: e.target.value })} />
        </label>
        <label className="sm:col-span-2 text-sm">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">Subtitle (optional)</span>
          <input className="w-full rounded-md border border-input bg-white px-3 py-2" value={value.subtitle} onChange={(e) => setValue({ ...value, subtitle: e.target.value })} />
        </label>
      </div>

      <div className="rounded-xl border border-border bg-muted/20 p-4">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={value.scroll.enabled} onChange={(e) => setValue({ ...value, scroll: { ...value.scroll, enabled: e.target.checked } })} />
            Auto-scroll marquee
          </label>
          <label className="flex items-center gap-2">
            Speed
            <input type="number" min={5} max={120} className="w-20 rounded-md border border-input bg-white px-2 py-1" value={value.scroll.speed} onChange={(e) => setValue({ ...value, scroll: { ...value.scroll, speed: Number(e.target.value) || 30 } })} />
            <span className="text-xs text-muted-foreground">(lower = faster)</span>
          </label>
        </div>
      </div>

      <div className="space-y-2">
        {value.items.map((item, i) => (
          <div key={i} className="grid items-center gap-2 rounded-xl border border-border bg-white p-3 sm:grid-cols-[80px_1fr_1fr_1fr_auto]">
            <div className="flex h-14 items-center justify-center rounded-md bg-[#6B1220] p-2">
              {item.logo_url ? <img src={item.logo_url} alt="" className="max-h-full max-w-full object-contain brightness-0 invert" /> : <span className="text-[10px] text-white/50">no logo</span>}
            </div>
            <input className="rounded-md border border-input px-2 py-1.5 text-sm" placeholder="Name" value={item.name} onChange={(e) => setItem(i, { name: e.target.value })} />
            <input className="rounded-md border border-input px-2 py-1.5 text-sm sm:col-span-2" placeholder="Logo URL (https://… or /uploads/…)" value={item.logo_url} onChange={(e) => setItem(i, { logo_url: e.target.value })} />
            <div className="flex items-center gap-1">
              <button onClick={() => move(i, -1)} className="rounded-md p-1.5 hover:bg-muted" aria-label="Move up"><ArrowUp className="h-4 w-4" /></button>
              <button onClick={() => move(i, 1)} className="rounded-md p-1.5 hover:bg-muted" aria-label="Move down"><ArrowDown className="h-4 w-4" /></button>
              <button onClick={() => remove(i)} className="rounded-md p-1.5 text-destructive hover:bg-destructive/10" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button onClick={add} className="inline-flex items-center gap-2 rounded-lg border border-input bg-white px-3 py-2 text-sm hover:bg-muted"><Plus className="h-4 w-4" /> Add partner</button>
        <button onClick={() => save.mutate()} disabled={save.isPending} className="ml-auto inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"><Save className="h-4 w-4" /> {save.isPending ? "Saving…" : "Save"}</button>
      </div>
    </div>
  );
}
