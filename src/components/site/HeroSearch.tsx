import { useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, MapPin, RotateCcw, Search } from "lucide-react";
import heroImg from "@/assets/hero-qatar.jpg";
import { LOCATIONS } from "@/lib/properties";

const TYPES = ["Apartment", "Villa", "Studio", "Penthouse", "Townhouse"] as const;
const PRICE_RANGES = [
  { label: "Any price", value: "any" },
  { label: "Up to QAR 10k / 2M", value: "0-2000000" },
  { label: "QAR 10k–25k / 2M–6M", value: "2000000-6000000" },
  { label: "QAR 25k+ / 6M+", value: "6000000-99000000" },
];

type Status = "rent" | "sale";

interface FilterState {
  status: Status;
  type: string;
  location: string;
  price: string;
}

const DEFAULTS: FilterState = {
  status: "rent",
  type: "all",
  location: "all",
  price: "any",
};

function priceToRange(value: string): [number | undefined, number | undefined] {
  if (value === "any") return [undefined, undefined];
  const [min, max] = value.split("-").map(Number);
  return [min, max];
}

function rangeToPrice(min?: number, max?: number): string {
  if (min == null && max == null) return "any";
  const match = PRICE_RANGES.find((p) => {
    const [pMin, pMax] = priceToRange(p.value);
    return pMin === min && pMax === max;
  });
  return match?.value ?? "any";
}

/** Read filters from current URL so the hero reflects shared/bookmarked links. */
function readFromUrl(): FilterState {
  if (typeof window === "undefined") return DEFAULTS;
  const params = new URLSearchParams(window.location.search);
  const status = params.get("status");
  const min = params.get("minPrice");
  const max = params.get("maxPrice");
  return {
    status: status === "sale" ? "sale" : "rent",
    type: params.get("type") ?? "all",
    location: params.get("location") ?? "all",
    price: rangeToPrice(min ? Number(min) : undefined, max ? Number(max) : undefined),
  };
}

export function HeroSearch() {
  const navigate = useNavigate();
  const isNavigating = useRouterState({ select: (s) => s.isLoading || s.isTransitioning });
  const [filters, setFilters] = useState<FilterState>(DEFAULTS);
  const [submitting, setSubmitting] = useState(false);

  // Hydrate from URL after mount so SSR markup stays stable.
  useEffect(() => {
    setFilters(readFromUrl());
  }, []);

  // Clear the submitting flag once router transitions settle.
  useEffect(() => {
    if (!isNavigating) setSubmitting(false);
  }, [isNavigating]);

  const isDirty =
    filters.status !== DEFAULTS.status ||
    filters.type !== DEFAULTS.type ||
    filters.location !== DEFAULTS.location ||
    filters.price !== DEFAULTS.price;

  function set<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function reset() {
    setFilters(DEFAULTS);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const [minPrice, maxPrice] = priceToRange(filters.price);
    setSubmitting(true);
    navigate({
      to: "/properties",
      search: {
        status: filters.status,
        type: filters.type === "all" ? undefined : filters.type,
        location: filters.location === "all" ? undefined : filters.location,
        minPrice,
        maxPrice,
      },
    });
  }

  const loading = submitting || isNavigating;

  return (
    <section className="relative isolate overflow-hidden">
      <img
        src={heroImg}
        alt="Qatar skyline at golden hour"
        width={1920}
        height={1080}
        className="absolute inset-0 -z-10 h-full w-full object-cover"
      />
      <div
        className="absolute inset-0 -z-10"
        style={{ background: "var(--gradient-hero-overlay)" }}
      />
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 sm:pt-32 lg:px-8 lg:pb-24 lg:pt-40">
        <div className="max-w-3xl text-white">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/60 bg-black/20 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-gold backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            Qatar's premium address book
          </span>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] sm:text-5xl lg:text-6xl">
            Find a home worthy of <em className="text-gold not-italic">Qatar.</em>
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/80 sm:text-lg">
            Curated residences across Doha, The Pearl, Lusail, West Bay and Al Waab. Rent or buy with a
            white-glove experience from first viewing to keys in hand.
          </p>
        </div>

        <form
          onSubmit={submit}
          className="mt-10 rounded-2xl border border-white/20 bg-white/10 p-3 shadow-[var(--shadow-soft)] backdrop-blur-2xl backdrop-saturate-150 sm:p-4"
        >
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="inline-flex rounded-full bg-white/10 p-1 text-sm backdrop-blur">
              {(["rent", "sale"] as const).map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => set("status", s)}
                  className={`rounded-full px-5 py-1.5 font-medium capitalize transition ${
                    filters.status === s
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  For {s}
                </button>
              ))}
            </div>
            {isDirty ? (
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset filters
              </button>
            ) : null}
          </div>
          <div className="grid gap-2 md:grid-cols-[1.2fr_1fr_1fr_auto]">
            <Field label="Location" icon={<MapPin className="h-4 w-4" />}>
              <select
                value={filters.location}
                onChange={(e) => set("location", e.target.value)}
                className="w-full bg-transparent text-sm outline-none"
              >
                <option value="all">All Qatar locations</option>
                {LOCATIONS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </Field>
            <Field label="Property type">
              <select
                value={filters.type}
                onChange={(e) => set("type", e.target.value)}
                className="w-full bg-transparent text-sm outline-none"
              >
                <option value="all">Any type</option>
                {TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Price range">
              <select
                value={filters.price}
                onChange={(e) => set("price", e.target.value)}
                className="w-full bg-transparent text-sm outline-none"
              >
                {PRICE_RANGES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </Field>
            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="inline-flex min-w-[140px] items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-[var(--shadow-soft)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Searching…
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Search
                </>
              )}
            </button>
          </div>
          <p className="mt-3 px-1 text-[11px] text-white/70">
            Filters sync to the URL — copy the link to share this exact search.
          </p>
        </form>
      </div>
    </section>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-left backdrop-blur-xl">
      <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/70">
        {label}
      </span>
      <span className="flex items-center gap-2 text-white [&_select]:text-white [&_select_option]:text-foreground">
        {icon}
        {children}
      </span>
    </label>
  );
}
