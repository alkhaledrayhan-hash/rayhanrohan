import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { ChevronRight, RotateCcw, Search as SearchIcon } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { PropertyGrid } from "@/components/site/PropertyGrid";
import { filterProperties, LOCATIONS, PROPERTIES, type SortKey } from "@/lib/properties";

const searchSchema = z.object({
  status: z.enum(["rent", "sale"]).optional(),
  location: z.string().optional(),
  type: z.string().optional(),
  beds: z.coerce.number().optional(),
  baths: z.coerce.number().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minArea: z.coerce.number().optional(),
  maxArea: z.coerce.number().optional(),
  q: z.string().optional(),
  sort: z.enum(["newest", "price-asc", "price-desc", "area-desc"]).optional(),
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

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Default order" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "area-desc", label: "Largest first" },
];

function PropertiesPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const status = search.status ?? "rent";
  const items = filterProperties(PROPERTIES, { ...search, status });

  function update(patch: Partial<typeof search>) {
    navigate({ search: (prev: typeof search) => ({ ...prev, ...patch }), replace: true });
  }
  function reset() {
    navigate({ search: { status }, replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground">Property Listing</span>
        </nav>

        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-semibold sm:text-4xl">
              Properties for {status === "rent" ? "Rent" : "Sale"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Showing <span className="text-foreground font-medium">{items.length}</span> result{items.length === 1 ? "" : "s"} in Qatar.
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

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Listings column */}
          <section>
            <div className="mb-5 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing 1–{items.length} of {items.length} results
              </p>
              <label className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Sort</span>
                <select
                  value={search.sort ?? "newest"}
                  onChange={(e) => update({ sort: e.target.value as SortKey })}
                  className="bg-transparent text-sm outline-none"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </label>
            </div>
            <PropertyGrid properties={items} />
          </section>

          {/* Sidebar filters */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <FilterSidebar
              key={JSON.stringify(search)} // reset local inputs when URL changes
              initial={search}
              onApply={(patch) => update(patch)}
              onReset={reset}
            />
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}

interface SidebarValues {
  q?: string;
  status?: "rent" | "sale";
  type?: string;
  location?: string;
  beds?: number;
  baths?: number;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
}

function FilterSidebar({
  initial,
  onApply,
  onReset,
}: {
  initial: SidebarValues;
  onApply: (v: SidebarValues) => void;
  onReset: () => void;
}) {
  const [v, setV] = useState<SidebarValues>({
    q: initial.q ?? "",
    type: initial.type ?? "all",
    location: initial.location ?? "all",
    beds: initial.beds,
    baths: initial.baths,
    minPrice: initial.minPrice,
    maxPrice: initial.maxPrice,
    minArea: initial.minArea,
    maxArea: initial.maxArea,
  });
  function set<K extends keyof SidebarValues>(k: K, val: SidebarValues[K]) {
    setV((p) => ({ ...p, [k]: val }));
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    onApply({
      q: v.q || undefined,
      type: v.type === "all" ? undefined : v.type,
      location: v.location === "all" ? undefined : v.location,
      beds: v.beds || undefined,
      baths: v.baths || undefined,
      minPrice: v.minPrice || undefined,
      maxPrice: v.maxPrice || undefined,
      minArea: v.minArea || undefined,
      maxArea: v.maxArea || undefined,
    });
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">Refine search</h3>
        <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.18em] text-gold-foreground">
          Filter
        </span>
      </div>

      <div className="mt-4 space-y-3">
        <FieldText
          label="Keyword"
          value={v.q ?? ""}
          onChange={(x) => set("q", x)}
          placeholder="Enter keyword…"
        />
        <FieldSelect
          label="Location"
          value={v.location ?? "all"}
          onChange={(x) => set("location", x)}
          options={[{ value: "all", label: "All locations" }, ...LOCATIONS.map((l) => ({ value: l, label: l }))]}
        />
        <FieldSelect
          label="Type"
          value={v.type ?? "all"}
          onChange={(x) => set("type", x)}
          options={[{ value: "all", label: "Any type" }, ...TYPES.map((t) => ({ value: t, label: t }))]}
        />
        <div className="grid grid-cols-2 gap-3">
          <FieldNumber label="Beds" value={v.beds} onChange={(x) => set("beds", x)} placeholder="Any" />
          <FieldNumber label="Baths" value={v.baths} onChange={(x) => set("baths", x)} placeholder="Any" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FieldNumber label="Min price" value={v.minPrice} onChange={(x) => set("minPrice", x)} placeholder="QAR" />
          <FieldNumber label="Max price" value={v.maxPrice} onChange={(x) => set("maxPrice", x)} placeholder="QAR" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FieldNumber label="Min area" value={v.minArea} onChange={(x) => set("minArea", x)} placeholder="ft²" />
          <FieldNumber label="Max area" value={v.maxArea} onChange={(x) => set("maxArea", x)} placeholder="ft²" />
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full border border-primary text-primary transition hover:bg-primary hover:text-primary-foreground"
          aria-label="Reset filters"
        >
          <RotateCcw className="h-4 w-4" />
        </button>
        <button
          type="submit"
          className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-primary text-sm font-medium text-primary-foreground shadow-[var(--shadow-soft)] transition hover:opacity-95"
        >
          <SearchIcon className="h-4 w-4" />
          Search
        </button>
      </div>
    </form>
  );
}

function FieldText({
  label, value, onChange, placeholder,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none ring-primary/30 focus:ring-2"
      />
    </label>
  );
}

function FieldSelect({
  label, value, onChange, options,
}: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none ring-primary/30 focus:ring-2"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

function FieldNumber({
  label, value, onChange, placeholder,
}: { label: string; value?: number; onChange: (v: number | undefined) => void; placeholder?: string }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <input
        type="number"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
        placeholder={placeholder}
        className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none ring-primary/30 focus:ring-2"
      />
    </label>
  );
}
