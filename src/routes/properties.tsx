import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { PropertyGrid } from "@/components/site/PropertyGrid";
import { filterProperties, LOCATIONS, PROPERTIES } from "@/lib/properties";

const searchSchema = z.object({
  status: z.enum(["rent", "sale"]).optional(),
  location: z.string().optional(),
  type: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/properties")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Properties for Rent & Sale in Qatar — MaisonQatar" },
      {
        name: "description",
        content:
          "Browse premium apartments, villas, studios and penthouses for rent or sale across Doha, The Pearl, Lusail, West Bay and Al Waab.",
      },
      { property: "og:title", content: "Properties for Rent & Sale in Qatar — MaisonQatar" },
      {
        property: "og:description",
        content:
          "Browse premium apartments, villas, studios and penthouses for rent or sale across Doha, The Pearl, Lusail, West Bay and Al Waab.",
      },
    ],
  }),
  component: PropertiesPage,
});

const TYPES = ["Apartment", "Villa", "Studio", "Penthouse", "Townhouse"];

function PropertiesPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const status = search.status ?? "rent";
  const items = filterProperties(PROPERTIES, { ...search, status });

  function update(patch: Partial<typeof search>) {
    navigate({ search: (prev: typeof search) => ({ ...prev, ...patch }), replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-gold">
              Browse the portfolio
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
              Properties for {status === "rent" ? "Rent" : "Sale"} in Qatar
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {items.length} residence{items.length === 1 ? "" : "s"} match your criteria.
            </p>
          </div>
          <div className="inline-flex rounded-full bg-secondary p-1 text-sm">
            {(["rent", "sale"] as const).map((s) => (
              <button
                key={s}
                onClick={() => update({ status: s })}
                className={`rounded-full px-5 py-1.5 font-medium capitalize transition ${
                  status === s
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                For {s}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid gap-3 rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-card)] md:grid-cols-4">
          <Select
            label="Location"
            value={search.location ?? "all"}
            onChange={(v) => update({ location: v === "all" ? undefined : v })}
            options={[{ value: "all", label: "All locations" }, ...LOCATIONS.map((l) => ({ value: l, label: l }))]}
          />
          <Select
            label="Type"
            value={search.type ?? "all"}
            onChange={(v) => update({ type: v === "all" ? undefined : v })}
            options={[{ value: "all", label: "Any type" }, ...TYPES.map((t) => ({ value: t, label: t }))]}
          />
          <NumberField
            label="Min price (QAR)"
            value={search.minPrice}
            onChange={(v) => update({ minPrice: v })}
          />
          <NumberField
            label="Max price (QAR)"
            value={search.maxPrice}
            onChange={(v) => update({ maxPrice: v })}
          />
        </div>

        <div className="mt-10">
          <PropertyGrid properties={items} />
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Select({
  label, value, onChange, options,
}: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="flex flex-col gap-1 rounded-xl border border-border bg-background px-4 py-2.5">
      <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="bg-transparent text-sm outline-none">
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

function NumberField({
  label, value, onChange,
}: { label: string; value?: number; onChange: (v: number | undefined) => void }) {
  return (
    <label className="flex flex-col gap-1 rounded-xl border border-border bg-background px-4 py-2.5">
      <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <input
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
        placeholder="Any"
        className="bg-transparent text-sm outline-none"
      />
    </label>
  );
}
