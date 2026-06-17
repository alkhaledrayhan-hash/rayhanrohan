import type { Property } from "@/lib/properties";
import { PropertyCard } from "./PropertyCard";

export function PropertyGrid({ properties }: { properties: Property[] }) {
  if (properties.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-secondary/40 p-12 text-center">
        <p className="font-display text-2xl text-foreground">No matching residences</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Try widening your filters — the right address is waiting.
        </p>
      </div>
    );
  }
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {properties.map((p) => (
        <PropertyCard key={p.id} property={p} />
      ))}
    </div>
  );
}
