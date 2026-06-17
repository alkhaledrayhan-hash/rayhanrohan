import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search, MapPin } from "lucide-react";
import heroImg from "@/assets/hero-qatar.jpg";
import { LOCATIONS } from "@/lib/properties";

const TYPES = ["Apartment", "Villa", "Studio", "Penthouse", "Townhouse"] as const;
const PRICE_RANGES = [
  { label: "Any price", value: "any" },
  { label: "Up to QAR 10k / 2M", value: "0-2000000" },
  { label: "QAR 10k–25k / 2M–6M", value: "2000000-6000000" },
  { label: "QAR 25k+ / 6M+", value: "6000000-99000000" },
];

export function HeroSearch() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"rent" | "sale">("rent");
  const [type, setType] = useState("all");
  const [location, setLocation] = useState("all");
  const [price, setPrice] = useState("any");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const [minPrice, maxPrice] = price === "any" ? [undefined, undefined] : price.split("-").map(Number);
    navigate({
      to: "/properties",
      search: {
        status,
        type: type === "all" ? undefined : type,
        location: location === "all" ? undefined : location,
        minPrice,
        maxPrice,
      },
    });
  }

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
          className="mt-10 rounded-2xl border border-white/10 bg-card/95 p-3 shadow-[var(--shadow-soft)] backdrop-blur sm:p-4"
        >
          <div className="mb-3 inline-flex rounded-full bg-secondary p-1 text-sm">
            {(["rent", "sale"] as const).map((s) => (
              <button
                type="button"
                key={s}
                onClick={() => setStatus(s)}
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
          <div className="grid gap-2 md:grid-cols-[1.2fr_1fr_1fr_auto]">
            <Field label="Location" icon={<MapPin className="h-4 w-4" />}>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-transparent text-sm outline-none"
              >
                <option value="all">All Qatar locations</option>
                {LOCATIONS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </Field>
            <Field label="Property type">
              <select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-transparent text-sm outline-none">
                <option value="all">Any type</option>
                {TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Price range">
              <select value={price} onChange={(e) => setPrice(e.target.value)} className="w-full bg-transparent text-sm outline-none">
                {PRICE_RANGES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </Field>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-[var(--shadow-soft)] transition hover:opacity-95"
            >
              <Search className="h-4 w-4" />
              Search
            </button>
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
    <label className="flex flex-col gap-1 rounded-xl border border-border bg-background px-4 py-2.5 text-left">
      <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      <span className="flex items-center gap-2 text-foreground">
        {icon}
        {children}
      </span>
    </label>
  );
}
