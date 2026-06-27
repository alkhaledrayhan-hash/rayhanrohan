import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useProperties } from "@/lib/properties";
import { X, Search, BadgePercent } from "lucide-react";

export type OffersContent = {
  eyebrow: string;
  title: string;
  description: string;
  cta_label: string;
  cta_href: string;
  mode: "manual" | "random";
  limit: number;
  only_special: boolean;
  propertyIds: string[];
};

export const OFFERS_DEFAULTS: OffersContent = {
  eyebrow: "Limited-time offers",
  title: "Exclusive residences, exceptional value",
  description:
    "A short list of premium residences available at preferential pricing this season — reserved for early enquiries only.",
  cta_label: "See all offers",
  cta_href: "/offers",
  mode: "random",
  limit: 6,
  only_special: true,
  propertyIds: [],
};

export function normalizeOffers(raw: any): OffersContent {
  const r = raw || {};
  return {
    eyebrow: r.eyebrow ?? OFFERS_DEFAULTS.eyebrow,
    title: r.title ?? OFFERS_DEFAULTS.title,
    description: r.description ?? OFFERS_DEFAULTS.description,
    cta_label: r.cta_label ?? OFFERS_DEFAULTS.cta_label,
    cta_href: r.cta_href ?? OFFERS_DEFAULTS.cta_href,
    mode: (r.mode as OffersContent["mode"]) ?? "random",
    limit: Number(r.limit) > 0 ? Number(r.limit) : 6,
    only_special: r.only_special !== false,
    propertyIds: Array.isArray(r.propertyIds) ? r.propertyIds : [],
  };
}

export function OffersSectionEditor({ sectionId, initial }: { sectionId: string; initial: any }) {
  const qc = useQueryClient();
  const [cfg, setCfg] = useState<OffersContent>(() => normalizeOffers(initial));
  const [search, setSearch] = useState("");
  const { data: allProperties = [] } = useProperties();

  useEffect(() => setCfg(normalizeOffers(initial)), [sectionId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = allProperties;
    if (!q) return base.slice(0, 25);
    return base
      .filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q),
      )
      .slice(0, 25);
  }, [search, allProperties]);

  const selected = useMemo(
    () =>
      cfg.propertyIds
        .map((id) => allProperties.find((p) => p.id === id))
        .filter(Boolean) as any[],
    [cfg.propertyIds, allProperties],
  );

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("page_sections")
        .update({ content: cfg })
        .eq("id", sectionId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Offers section saved");
      qc.invalidateQueries({ queryKey: ["page-sections"] });
      qc.invalidateQueries({ queryKey: ["home-sections"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggle = (id: string) => {
    setCfg((c) => ({
      ...c,
      propertyIds: c.propertyIds.includes(id)
        ? c.propertyIds.filter((x) => x !== id)
        : [...c.propertyIds, id],
    }));
  };

  const input =
    "w-full rounded-lg border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";
  const label = "block text-xs font-medium text-muted-foreground mb-1";

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={label}>Eyebrow</label>
          <input
            className={input}
            value={cfg.eyebrow}
            onChange={(e) => setCfg({ ...cfg, eyebrow: e.target.value })}
          />
        </div>
        <div>
          <label className={label}>Title</label>
          <input
            className={input}
            value={cfg.title}
            onChange={(e) => setCfg({ ...cfg, title: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={label}>Description</label>
          <textarea
            rows={2}
            className={input}
            value={cfg.description}
            onChange={(e) => setCfg({ ...cfg, description: e.target.value })}
          />
        </div>
        <div>
          <label className={label}>CTA label</label>
          <input
            className={input}
            value={cfg.cta_label}
            onChange={(e) => setCfg({ ...cfg, cta_label: e.target.value })}
          />
        </div>
        <div>
          <label className={label}>CTA link</label>
          <input
            className={input}
            value={cfg.cta_href}
            onChange={(e) => setCfg({ ...cfg, cta_href: e.target.value })}
          />
        </div>
      </div>

      <div className="rounded-xl border border-border bg-muted/20 p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <p className="mr-auto text-sm font-semibold">Property source</p>
          {(["manual", "random"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setCfg({ ...cfg, mode: m })}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize ${
                cfg.mode === m
                  ? "bg-primary text-primary-foreground"
                  : "bg-white border border-border hover:bg-muted"
              }`}
            >
              {m === "manual" ? "Showcase (pick)" : "Random"}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Show</span>
            <input
              type="number"
              min={1}
              max={24}
              className="w-16 rounded-lg border border-input bg-white px-2 py-1 text-sm"
              value={cfg.limit}
              onChange={(e) =>
                setCfg({
                  ...cfg,
                  limit: Math.max(1, Math.min(24, Number(e.target.value) || 6)),
                })
              }
            />
            <span className="text-muted-foreground">properties</span>
          </label>

          {cfg.mode === "random" && (
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={cfg.only_special}
                onChange={(e) => setCfg({ ...cfg, only_special: e.target.checked })}
              />
              <span>Only properties flagged as special offer</span>
            </label>
          )}
        </div>

        {cfg.mode === "manual" && (
          <div className="mt-4 space-y-3">
            {selected.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selected.map((p) => (
                  <span
                    key={p.id}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs text-primary"
                  >
                    <BadgePercent className="h-3 w-3" /> {p.title}
                    <button
                      onClick={() => toggle(p.id)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                className={`${input} pl-9`}
                placeholder="Search properties (any agent or owner)…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="max-h-72 overflow-y-auto rounded-lg border border-border bg-white">
              {filtered.length === 0 && (
                <p className="p-4 text-xs text-muted-foreground">No properties match.</p>
              )}
              {filtered.map((p) => {
                const isSel = cfg.propertyIds.includes(p.id);
                const hasOffer =
                  Number(p.offerDiscount) > 0 || !!p.offerTag || !!p.offerEnds;
                return (
                  <button
                    key={p.id}
                    onClick={() => toggle(p.id)}
                    className={`flex w-full items-center gap-3 border-b border-border/50 px-3 py-2 text-left text-xs last:border-0 hover:bg-muted ${
                      isSel ? "bg-primary/5" : ""
                    }`}
                  >
                    <img
                      src={p.image}
                      alt=""
                      className="h-10 w-14 rounded object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-medium">
                        {p.title}{" "}
                        {hasOffer && (
                          <span className="ml-1 rounded bg-gold/30 px-1.5 py-0.5 text-[9px] font-bold uppercase text-foreground">
                            offer
                          </span>
                        )}
                      </p>
                      <p className="truncate text-muted-foreground">
                        {p.location} · {p.type} · {p.status}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-semibold ${
                        isSel ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
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
