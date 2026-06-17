import { Link } from "@tanstack/react-router";
import { Bed, Bath, Maximize2, MapPin } from "lucide-react";
import { formatPrice, type Property } from "@/lib/properties";

export function PropertyCard({ property }: { property: Property }) {
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
          className="h-full w-full object-cover transform-gpu transition-transform duration-[2200ms] ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform group-hover:scale-[1.06]"
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

function Spec({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-primary">{icon}</span>
      {label}
    </span>
  );
}
