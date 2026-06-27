import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from "lucide-react";

export type LocationItem = { name: string; image_url?: string; link?: string };
export type LocationsConfig = {
  eyebrow: string;
  title: string;
  mode: "auto" | "random" | "manual";
  limit: number;
  customItems: LocationItem[];
  scroll: { enabled: boolean; threshold: number; speed: number };
};

const DEFAULT: LocationsConfig = {
  eyebrow: "Premium Qatar locations",
  title: "Live in Qatar's most coveted neighbourhoods",
  mode: "auto",
  limit: 5,
  customItems: [],
  scroll: { enabled: true, threshold: 6, speed: 28 },
};

export function normalizeLocations(raw: any): LocationsConfig {
  if (!raw) return DEFAULT;
  const scroll = raw.scroll && typeof raw.scroll === "object" ? raw.scroll : {};
  const customItems = Array.isArray(raw.customItems) ? raw.customItems : [];
  const mode = ["auto", "random", "manual"].includes(raw.mode) ? raw.mode : DEFAULT.mode;
  return {
    eyebrow: raw.eyebrow ?? DEFAULT.eyebrow,
    title: raw.title ?? DEFAULT.title,
    mode,
    limit: Number(raw.limit) > 0 ? Number(raw.limit) : DEFAULT.limit,
    customItems: customItems.map((i: any) => ({
      name: i?.name || "",
      image_url: i?.image_url || i?.src || "",
      link: i?.link || undefined,
    })),
    scroll: {
      enabled: scroll.enabled !== false,
      threshold: Number(scroll.threshold) > 0 ? Number(scroll.threshold) : DEFAULT.scroll.threshold,
      speed: Number(scroll.speed) > 0 ? Number(scroll.speed) : DEFAULT.scroll.speed,
    },
  };
}

export function LocationsSectionEditor({ sectionId, initial }: { sectionId: string; initial: any }) {
  const qc = useQueryClient();
  const [value, setValue] = useState<LocationsConfig>(normalizeLocations(initial));

  useEffect(() => { setValue(normalizeLocations(initial)); }, [sectionId]);

  const { data: dbLocations = [] } = useQuery({
    queryKey: ["distinct-property-locations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("location")
        .eq("listing_status", "approved");
      if (error) throw error;
      const set = new Set<string>();
      for (const r of data || []) if (r.location) set.add(String(r.location));
      return Array.from(set).sort();
    },
    staleTime: 60_000,
  });

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("page_sections").update({ content: value }).eq("id", sectionId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Locations saved");
      qc.invalidateQueries({ queryKey: ["page-sections"] });
      qc.invalidateQueries({ queryKey: ["home-sections"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const setItem = (i: number, patch: Partial<LocationItem>) => {
    const items = [...value.customItems];
    items[i] = { ...items[i], ...patch };
    setValue({ ...value, customItems: items });
  };
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.customItems.length) return;
    const items = [...value.customItems];
    [items[i], items[j]] = [items[j], items[i]];
    setValue({ ...value, customItems: items });
  };
  const remove = (i: number) => setValue({ ...value, customItems: value.customItems.filter((_, idx) => idx !== i) });
  const add = () => setValue({ ...value, customItems: [...value.customItems, { name: "New location", image_url: "" }] });

  const detectedCount = dbLocations.length;

  const input = "w-full rounded-lg border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";
  const labelCls = "block text-xs font-medium text-muted-foreground mb-1";

  return (
    <div className="space-y-6">
      {/* Heading content */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelCls}>Eyebrow</label>
          <input className={input} value={value.eyebrow} onChange={(e) => setValue({ ...value, eyebrow: e.target.value })} />
        </div>
        <div>
          <label className={labelCls}>Title</label>
          <input className={input} value={value.title} onChange={(e) => setValue({ ...value, title: e.target.value })} />
        </div>
      </div>

      {/* Source mode */}
      <div className="rounded-xl border border-border bg-muted/20 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold">Location source</p>
          <span className="text-[11px] text-muted-foreground">{detectedCount} distinct locations detected from properties.</span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {(["auto", "random", "manual"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setValue({ ...value, mode: m })}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize ${value.mode === m ? "bg-primary text-primary-foreground" : "bg-white border border-border hover:bg-muted"}`}
            >
              {m === "auto" ? "Auto (alphabetical)" : m === "random" ? "Random" : "Showcase (pick)"}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Show</span>
            <input
              type="number"
              min={1}
              max={50}
              className="w-16 rounded-lg border border-input bg-white px-2 py-1 text-sm"
              value={value.limit}
              onChange={(e) => setValue({ ...value, limit: Math.max(1, Math.min(50, Number(e.target.value) || 1)) })}
            />
          </div>
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          {value.mode === "auto"
            ? `Pulls up to ${value.limit} location${value.limit === 1 ? "" : "s"} from live properties, sorted alphabetically.`
            : value.mode === "random"
            ? `Picks ${value.limit} location${value.limit === 1 ? "" : "s"} at random from live properties on each load.`
            : `Show the custom list below (in order).`}
        </p>
      </div>

      {/* Marquee */}
      <div className="rounded-xl border border-border bg-muted/20 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold">Auto-scroll marquee</p>
          <label className="inline-flex items-center gap-2 text-xs">
            <input type="checkbox" checked={value.scroll.enabled} onChange={(e) => setValue({ ...value, scroll: { ...value.scroll, enabled: e.target.checked } })} />
            Enable when over threshold
          </label>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Threshold (min items to start scrolling)</label>
            <input type="number" min={1} max={50} className={input} value={value.scroll.threshold} onChange={(e) => setValue({ ...value, scroll: { ...value.scroll, threshold: Number(e.target.value) || 1 } })} />
          </div>
          <div>
            <label className={labelCls}>Speed <span className="text-muted-foreground">(seconds per loop — lower = faster)</span></label>
            <input type="number" min={5} max={120} className={input} value={value.scroll.speed} onChange={(e) => setValue({ ...value, scroll: { ...value.scroll, speed: Number(e.target.value) || 28 } })} />
          </div>
        </div>
      </div>

      {/* Manual items */}
      {value.mode === "manual" && (
        <div className="space-y-2">
          <p className="text-sm font-semibold">Custom locations</p>
          {value.customItems.length === 0 && (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-xs text-muted-foreground">No custom locations yet — add one below.</div>
          )}
          {value.customItems.map((item, i) => (
            <div key={i} className="grid items-center gap-2 rounded-xl border border-border bg-white p-3 sm:grid-cols-[1fr_1.5fr_1fr_auto]">
              <input className="rounded-md border border-input px-2 py-1.5 text-sm" placeholder="Location name" value={item.name} onChange={(e) => setItem(i, { name: e.target.value })} />
              <input className="rounded-md border border-input px-2 py-1.5 text-sm" placeholder="Image URL (optional)" value={item.image_url || ""} onChange={(e) => setItem(i, { image_url: e.target.value })} />
              <input className="rounded-md border border-input px-2 py-1.5 text-sm" placeholder="Link (default: /properties?location=…)" value={item.link || ""} onChange={(e) => setItem(i, { link: e.target.value })} />
              <div className="flex items-center gap-1">
                <button onClick={() => move(i, -1)} className="rounded-md p-1.5 hover:bg-muted" aria-label="Move up"><ArrowUp className="h-4 w-4" /></button>
                <button onClick={() => move(i, 1)} className="rounded-md p-1.5 hover:bg-muted" aria-label="Move down"><ArrowDown className="h-4 w-4" /></button>
                <button onClick={() => remove(i)} className="rounded-md p-1.5 text-destructive hover:bg-destructive/10" aria-label="Delete"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
          <button onClick={add} className="inline-flex items-center gap-2 rounded-lg border border-input bg-white px-3 py-2 text-sm hover:bg-muted"><Plus className="h-4 w-4" /> Add location</button>
        </div>
      )}

      <div className="flex items-center justify-end">
        <button onClick={() => save.mutate()} disabled={save.isPending} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"><Save className="h-4 w-4" /> {save.isPending ? "Saving…" : "Save"}</button>
      </div>
    </div>
  );
}

