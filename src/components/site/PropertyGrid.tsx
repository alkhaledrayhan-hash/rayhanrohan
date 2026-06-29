import type { Property } from "@/lib/properties";
import { PropertyCard } from "./PropertyCard";
import { columnsToGridClass } from "@/hooks/usePageLayout";

export function PropertyGrid({
  properties,
  columns = 3,
  variant = "grid",
}: {
  properties: Property[];
  columns?: 1 | 2 | 3 | 4;
  variant?: "grid" | "ticket";
}) {
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
  // Ticket variant defaults to single column for the dramatic image-left layout.
  const gridClass = variant === "ticket" && columns === 1
    ? "grid-cols-1"
    : columnsToGridClass(columns);
  return (
    <div className={`grid gap-6 ${gridClass}`}>
      {properties.map((p) => (
        <PropertyCard key={p.id} property={p} variant={variant} />
      ))}
    </div>
  );
}
