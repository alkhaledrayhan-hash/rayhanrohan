import { useEffect, useMemo, useState } from "react";
import { ThemedSelect } from "@/components/ui/themed-select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProperties, LOCATIONS } from "@/lib/properties";
import { X, Search } from "lucide-react";

export type FeaturedContent = {
  eyebrow: string;
  title: string;
  link_label: string;
  link_href: string;
  mode: "manual" | "random" | "category";
  limit: number;
  propertyIds: string[];
  filter: {
    status?: "" | "rent" | "sale";
    type?: string;
    location?: string;
  };
};

export const FEATURED_DEFAULTS: FeaturedContent = {
  eyebrow: "Featured residences",
  title: "Featured Properties",
  link_label: "View all listings",
  link_href: "/properties",
  mode: "manual",
  limit: 6,
  propertyIds: [],
  filter: { status: "", type: "", location: "" },
};

export function normalizeFeatured(raw: any): FeaturedContent {
  const r = raw || {};
  return {
    eyebrow: r.eyebrow ?? FEATURED_DEFAULTS.eyebrow,
    title: r.title ?? FEATURED_DEFAULTS.title,
    link_label: r.link_label ?? FEATURED_DEFAULTS.link_label,
    link_href: r.link_href ?? FEATURED_DEFAULTS.link_href,
    mode: (r.mode as FeaturedContent["mode"]) ?? "manual",
    limit: Number(r.limit) > 0 ? Number(r.limit) : 6,
    propertyIds: Array.isArray(r.propertyIds) ? r.propertyIds : [],
    filter: {
      status: r.filter?.status ?? "",
      type: r.filter?.type ?? "",
      location: r.filter?.location ?? "",
    },
  };
}

const PROPERTY_TYPES = ["Apartment", "Villa", "Studio", "Penthouse", "Townhouse"];

export function FeaturedSectionEditor({ sectionId, initial }: { sectionId: string; initial: any }) {
  const qc = useQueryClient();
  const [cfg, setCfg] = useState<FeaturedContent>(() => normalizeFeatured(initial));
  const [search, setSearch] = useState("");
  const { data: allProperties = [] } = useProperties();

  useEffect(() => setCfg(normalizeFeatured(initial)), [sectionId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allProperties.slice(0, 20);
    return allProperties.filter((p) =>
      p.title.toLowerCase().includes(q) || p.location.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
    ).slice(0, 20);
  }, [search, allProperties]);

  const selected = useMemo(
    () => cfg.propertyIds.map((id) => allProperties.find((p) => p.id === id)).filter(Boolean) as any[],
    [cfg.propertyIds, allProperties]
  );

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("page_sections").update({ content: cfg }).eq("id", sectionId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Featured section saved");
      qc.invalidateQueries({ queryKey: ["page-sections"] });
      qc.invalidateQueries({ queryKey: ["home-sections"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggle = (id: string) => {
    setCfg((c) => ({
      ...c,
      propertyIds: c.propertyIds.includes(id) ? c.propertyIds.filter((x) => x !== id) : [...c.propertyIds, id],
    }));
  };

  const input = "w-full rounded-lg border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";
  const label = "block text-xs font-medium text-muted-foreground mb-1";

  return (
    <div className="space-y-6">
      {/* Heading content */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={label}>Eyebrow</label>
          <input className={input} value={cfg.eyebrow} onChange={(e) => setCfg({ ...cfg, eyebrow: e.target.value })} />
        </div>
        <div>
          <label className={label}>Title</label>
          <input className={input} value={cfg.title} onChange={(e) => setCfg({ ...cfg, title: e.target.value })} />
        </div>
        <div>
          <label className={label}>Link label</label>
          <input className={input} value={cfg.link_label} onChange={(e) => setCfg({ ...cfg, link_label: e.target.value })} />
        </div>
        <div>
          <label className={label}>Link URL</label>
          <input className={input} value={cfg.link_href} onChange={(e) => setCfg({ ...cfg, link_href: e.target.value })} />
        </div>
      </div>

      {/* Source mode */}
      <div className="rounded-xl border border-border bg-muted/20 p-4">
        <p className="mb-3 text-sm font-semibold">Property source</p>
        <div className="flex flex-wrap gap-2">
          {(["manual", "random", "category"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setCfg({ ...cfg, mode: m })}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize ${cfg.mode === m ? "bg-primary text-primary-foreground" : "bg-white border border-border hover:bg-muted"}`}
            >
              {m === "manual" ? "Showcase (pick)" : m === "random" ? "Random" : "By category"}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Show</span>
            <input
              type="number"
              min={1}
              max={24}
              className="w-16 rounded-lg border border-input bg-white px-2 py-1 text-sm"
              value={cfg.limit}
              onChange={(e) => setCfg({ ...cfg, limit: Math.max(1, Math.min(24, Number(e.target.value) || 6)) })}
            />
          </div>
        </div>

        {cfg.mode === "category" && (
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div>
              <label className={label}>Status</label>
              <ThemedSelect className={input} value={cfg.filter.status} onChange={(v: string) => setCfg({ ...cfg, filter: { ...cfg.filter, status: v as any } })}>
                <option value="">Any</option>
                <option value="rent">For Rent</option>
                <option value="sale">For Sale</option>
              </ThemedSelect>
            </div>
            <div>
              <label className={label}>Type</label>
              <ThemedSelect className={input} value={cfg.filter.type} onChange={(v: string) => setCfg({ ...cfg, filter: { ...cfg.filter, type: v } })}>
                <option value="">Any</option>
                {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </ThemedSelect>
            </div>
            <div>
              <label className={label}>Location</label>
              <ThemedSelect className={input} value={cfg.filter.location} onChange={(v: string) => setCfg({ ...cfg, filter: { ...cfg.filter, location: v } })}>
                <option value="">Any</option>
                {LOCATIONS.map((l) => <option key={l} value={l}>{l}</option>)}
              </ThemedSelect>
            </div>
          </div>
        )}

        {cfg.mode === "manual" && (
          <div className="mt-4 space-y-3">
            {selected.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selected.map((p) => (
                  <span key={p.id} className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                    {p.title}
                    <button onClick={() => toggle(p.id)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                  </span>
                ))}
              </div>
            )}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input className={`${input} pl-9`} placeholder="Search properties to add…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="max-h-64 overflow-y-auto rounded-lg border border-border bg-white">
              {filtered.length === 0 && <p className="p-4 text-xs text-muted-foreground">No properties match.</p>}
              {filtered.map((p) => {
                const isSel = cfg.propertyIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => toggle(p.id)}
                    className={`flex w-full items-center gap-3 border-b border-border/50 px-3 py-2 text-left text-xs last:border-0 hover:bg-muted ${isSel ? "bg-primary/5" : ""}`}
                  >
                    <img src={p.image} alt="" className="h-10 w-14 rounded object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">{p.title}</p>
                      <p className="truncate text-muted-foreground">{p.location} · {p.type} · {p.status}</p>
                    </div>
                    <span className={`text-[10px] font-semibold ${isSel ? "text-primary" : "text-muted-foreground"}`}>
                      {isSel ? "Selected" : "Add"}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {save.isPending ? "Saving…" : "Save section"}
        </button>
      </div>
    </div>
  );
}
