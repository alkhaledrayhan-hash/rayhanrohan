import { memo } from "react";
import { Link } from "@tanstack/react-router";
import { Bed, Bath, Maximize2, MapPin } from "lucide-react";
import { formatPrice, type Property } from "@/lib/properties";

export type PropertyCardVariant = "grid" | "ticket";

export const PropertyCard = memo(function PropertyCard({
  property,
  variant = "grid",
}: {
  property: Property;
  variant?: PropertyCardVariant;
}) {
  if (variant === "ticket") return <TicketCard property={property} />;
  return <GridCard property={property} />;
});

function GridCard({ property }: { property: Property }) {
  return (
    <Link
      to="/properties/$id"
      params={{ id: property.id }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:border-primary/30 hover:shadow-[var(--shadow-soft)] will-change-transform"
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={property.image}
          alt={property.title}
          loading="lazy"
          decoding="async"
          width={1280}
          height={896}
          className="h-full w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent opacity-0 transition-opacity duration-700 ease-out group-hover:opacity-100" />
        <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-primary-foreground">
          For {property.status}
        </span>
        <span className="absolute right-3 top-3 rounded-full border border-gold/70 bg-black/40 px-3 py-1 text-[11px] font-medium text-gold backdrop-blur">
          {property.type}
        </span>
        <span className="absolute bottom-3 left-3 rounded-md bg-background/95 px-3 py-1.5 text-sm font-semibold text-foreground shadow transition-all duration-700 ease-out group-hover:-translate-y-1 group-hover:shadow-md">
          {formatPrice(property)}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-xl font-semibold text-foreground">
          {property.title}
        </h3>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-primary" />
          {property.location} · {property.address}
        </p>
        <div className="mt-4 flex items-center gap-5 border-t border-border pt-4 text-sm text-muted-foreground">
          <Spec icon={<Bed className="h-4 w-4" />} label={`${property.bedrooms} bd`} />
          <Spec icon={<Bath className="h-4 w-4" />} label={`${property.bathrooms} ba`} />
          <Spec icon={<Maximize2 className="h-4 w-4" />} label={`${property.sqft.toLocaleString()} ft²`} />
        </div>
      </div>
    </Link>
  );
}

function TicketCard({ property }: { property: Property }) {
  return (
    <Link
      to="/properties/$id"
      params={{ id: property.id }}
      className="group relative grid overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] transition-all duration-500 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--shadow-soft)] sm:grid-cols-[minmax(0,320px)_1fr]"
    >
      {/* Perforated divider */}
      <span className="pointer-events-none absolute left-[320px] top-0 hidden h-full w-px bg-[radial-gradient(circle,theme(colors.border)_1px,transparent_1.5px)] bg-[length:2px_10px] bg-repeat-y sm:block" aria-hidden />
      <span className="pointer-events-none absolute -top-2 left-[314px] hidden h-4 w-4 rounded-full bg-background sm:block" aria-hidden />
      <span className="pointer-events-none absolute -bottom-2 left-[314px] hidden h-4 w-4 rounded-full bg-background sm:block" aria-hidden />

      <div className="relative aspect-[4/3] overflow-hidden sm:aspect-auto sm:h-full">
        <img
          src={property.image}
          alt={property.title}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-primary-foreground">
          For {property.status}
        </span>
        <span className="absolute right-3 top-3 rounded-full border border-gold/70 bg-black/40 px-3 py-1 text-[11px] font-medium text-gold backdrop-blur">
          {property.type}
        </span>
      </div>

      <div className="flex flex-col justify-between gap-4 p-6 sm:p-7">
        <div>
          <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            {property.location}
          </p>
          <h3 className="mt-2 font-display text-2xl font-semibold leading-tight text-foreground transition group-hover:text-primary">
            {property.title}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">{property.address}</p>
        </div>

        <div className="flex flex-wrap items-center gap-5 border-y border-border py-3 text-sm text-muted-foreground">
          <Spec icon={<Bed className="h-4 w-4" />} label={`${property.bedrooms} bd`} />
          <Spec icon={<Bath className="h-4 w-4" />} label={`${property.bathrooms} ba`} />
          <Spec icon={<Maximize2 className="h-4 w-4" />} label={`${property.sqft.toLocaleString()} ft²`} />
        </div>

        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Price</p>
            <p className="font-display text-2xl font-semibold text-primary">{formatPrice(property)}</p>
          </div>
          <span className="rounded-full border border-primary/40 bg-primary/5 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
            View details →
          </span>
        </div>
      </div>
    </Link>
  );
}

function Spec({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-primary">{icon}</span>
      {label}
    </span>
  );
}
