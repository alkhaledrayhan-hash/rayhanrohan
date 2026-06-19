import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2, MapPin, RotateCcw, Search } from "lucide-react";
import heroImg from "@/assets/hero-qatar.jpg?w=1600&quality=72&format=webp";
import heroImg2 from "@/assets/qatar-pearl.jpg?w=1600&quality=72&format=webp";
import heroImg3 from "@/assets/qatar-corniche.jpg?w=1600&quality=72&format=webp";
import heroImg4 from "@/assets/qatar-westbay.jpg?w=1600&quality=72&format=webp";
import { LOCATIONS } from "@/lib/properties";
import { usePageSections } from "@/lib/page-sections";

function withAlpha(hex: string, opacityPct: number) {
  const a = Math.max(0, Math.min(100, opacityPct)) / 100;
  const h = (hex || "#000000").replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(full.slice(0, 2), 16) || 0;
  const g = parseInt(full.slice(2, 4), 16) || 0;
  const b = parseInt(full.slice(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

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

  const { data: sections = {} } = usePageSections("home");
  const hero = (sections.hero || {}) as any;
  const heroStyle = hero.style || {};
  const customImages: string[] = Array.isArray(hero.images) && hero.images.length > 0
    ? hero.images.filter((s: any) => typeof s === "string" && s.length > 0)
    : hero.image_url
      ? [hero.image_url]
      : [];
  const slideInterval: number = Number(hero.slide_interval) > 0 ? Number(hero.slide_interval) : 2000;

  const HERO_IMAGES = customImages.length > 0 ? customImages : [heroImg, heroImg2, heroImg3, heroImg4];
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    setSlide(0);
  }, [HERO_IMAGES.length]);

  useEffect(() => {
    if (HERO_IMAGES.length <= 1) return;
    const id = setInterval(() => {
      setSlide((s) => (s + 1) % HERO_IMAGES.length);
    }, slideInterval);
    return () => clearInterval(id);
  }, [HERO_IMAGES.length, slideInterval]);

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
      <div className="absolute inset-0 -z-10">
        {HERO_IMAGES.map((src, i) => (
          <img
            key={src}
            src={src}
            alt="Qatar skyline"
            width={1920}
            height={1080}
            fetchPriority={i === 0 ? "high" : "low"}
            decoding="async"
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ease-in-out ${
              slide === i ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
      </div>
      {customImages.length > 0 ? (
        <div
          className="absolute inset-0 -z-10"
          style={{
            background: `linear-gradient(135deg, ${withAlpha(heroStyle.overlay_from || "#000000", heroStyle.overlay_opacity ?? 55)} 0%, ${withAlpha(heroStyle.overlay_to || "#000000", heroStyle.overlay_opacity ?? 55)} 100%)`,
          }}
        />
      ) : (
        <div
          className="absolute inset-0 -z-10"
          style={{ background: "var(--gradient-hero-overlay)" }}
        />
      )}
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 sm:pt-32 lg:px-8 lg:pb-24 lg:pt-40">
        <div className={`max-w-3xl text-white ${heroStyle.align === "center" ? "mx-auto text-center" : ""}`}>
          {(hero.eyebrow ?? "Qatar's premium address book") && (
            <span
              className="inline-flex items-center gap-2 rounded-full border border-gold/60 bg-black/20 px-3 py-1 text-[11px] uppercase tracking-[0.25em] backdrop-blur"
              style={heroStyle.eyebrow_color ? { color: heroStyle.eyebrow_color, borderColor: withAlpha(heroStyle.eyebrow_color, 60) } : undefined}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: heroStyle.eyebrow_color || undefined }} />
              {hero.eyebrow ?? "Qatar's premium address book"}
            </span>
          )}
          <h1
            className={`mt-5 font-display font-semibold leading-[1.05] ${heroStyle.title_size === "md" ? "text-3xl sm:text-4xl" : heroStyle.title_size === "lg" ? "text-4xl sm:text-5xl" : "text-4xl sm:text-5xl lg:text-6xl"}`}
            style={heroStyle.title_color ? { color: heroStyle.title_color } : undefined}
          >
            {hero.title ?? <>Find a home worthy of <em className="text-gold not-italic">Qatar.</em></>}
          </h1>
          <p
            className="mt-4 max-w-xl text-base sm:text-lg"
            style={{ color: heroStyle.subtitle_color || "rgba(255,255,255,0.8)" }}
          >
            {hero.subtitle ?? "Curated residences across Doha, The Pearl, Lusail, West Bay and Al Waab. Rent or buy with a white-glove experience from first viewing to keys in hand."}
          </p>
          {(hero.cta_label || hero.cta2_label) && (
            <div className={`mt-6 flex flex-wrap gap-3 ${heroStyle.align === "center" ? "justify-center" : ""}`}>
              {hero.cta_label && (
                <Link
                  to={hero.cta_link || "/properties"}
                  className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-medium shadow-[var(--shadow-soft)] transition hover:opacity-90"
                  style={{ background: heroStyle.cta_bg || "hsl(var(--primary))", color: heroStyle.cta_text || "#ffffff" }}
                >
                  {hero.cta_label}
                </Link>
              )}
              {hero.cta2_label && (
                <Link
                  to={hero.cta2_link || "/"}
                  className="inline-flex items-center justify-center rounded-xl border border-white/40 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  {hero.cta2_label}
                </Link>
              )}
            </div>
          )}
        </div>

        <form
          onSubmit={submit}
          className="group/search mt-10 rounded-2xl border border-white/20 bg-white/10 p-3 shadow-[var(--shadow-soft)] backdrop-blur-2xl backdrop-saturate-150 transition-all duration-500 ease-out hover:border-white/30 hover:bg-white/15 focus-within:border-white/30 focus-within:bg-white/15 sm:p-4"
        >
          <div className="flex flex-nowrap items-center justify-between gap-2">
            <div className="inline-flex shrink-0 rounded-full bg-white/10 p-1 text-xs backdrop-blur sm:text-sm">
              {(["rent", "sale"] as const).map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => set("status", s)}
                  className={`rounded-full px-3 py-1.5 font-medium capitalize transition sm:px-5 ${
                    filters.status === s
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-white/80 hover:text-white"
                  }`}
                >
                  For {s}
                </button>
              ))}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {isDirty ? (
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 text-xs font-medium text-white/80 transition hover:bg-white/10 hover:text-white sm:px-3"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              ) : null}
              <button
                type="submit"
                disabled={loading}
                aria-busy={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-soft)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70 sm:min-w-[140px] sm:px-6"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="hidden sm:inline">Searching…</span>
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    <span className="hidden sm:inline">Search</span>
                  </>
                )}
              </button>
            </div>
          </div>


          <div className="mt-3 grid grid-rows-[1fr] opacity-100 transition-[grid-template-rows,opacity,margin] duration-500 ease-out md:mt-0 md:grid-rows-[0fr] md:opacity-0 md:group-hover/search:mt-3 md:group-hover/search:grid-rows-[1fr] md:group-hover/search:opacity-100 md:group-focus-within/search:mt-3 md:group-focus-within/search:grid-rows-[1fr] md:group-focus-within/search:opacity-100">
            <div className="min-h-0 overflow-hidden">
              <div className="grid gap-2 md:grid-cols-3">
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
              </div>
              <p className="mt-3 px-1 text-[11px] text-white/70">
                Filters sync to the URL — copy the link to share this exact search.
              </p>
            </div>
          </div>
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
