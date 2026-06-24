import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { BadgePercent, Bed, Bath, Maximize2, Clock, Flame, ArrowRight, ChevronRight, Home } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Pagination } from "@/components/site/Pagination";
import { useOfferProperties, formatPrice, type Property } from "@/lib/properties";
import offersCover from "@/assets/offers-cover.jpg";

const PAGE_SIZE = 9;

export const Route = createFileRoute("/offers")({
  head: () => ({
    meta: [
      { title: "Special Offers — MaisonQatar" },
      {
        name: "description",
        content:
          "Limited-time offers on premium apartments, villas and penthouses across Doha, The Pearl, Lusail, West Bay and Al Waab.",
      },
      { property: "og:title", content: "Special Offers — MaisonQatar" },
      {
        property: "og:description",
        content:
          "Hand-picked residences available at preferential pricing — reserved for early enquiries only.",
      },
    ],
  }),
  component: OffersPage,
});

function OffersPage() {
  const { data: offers = [], isLoading } = useOfferProperties();
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(offers.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = offers.slice(start, start + PAGE_SIZE);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Cover hero */}
        <section className="relative isolate overflow-hidden">
          <img
            src={offersCover}
            alt="Doha luxury waterfront at golden hour"
            width={1920}
            height={800}
            className="absolute inset-0 -z-10 h-full w-full object-cover"
          />
          <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-black/55 via-black/40 to-black/75" />
          <div className="mx-auto max-w-7xl px-4 pt-36 pb-20 sm:px-6 lg:px-8 lg:pt-44 lg:pb-28">
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1.5 text-xs text-white/80">
              <Link to="/" className="inline-flex items-center gap-1 hover:text-white">
                <Home className="h-3.5 w-3.5" /> Home
              </Link>
              <ChevronRight className="h-3.5 w-3.5 opacity-60" />
              <Link to="/properties" search={{ status: "rent" }} className="hover:text-white">
                Properties
              </Link>
              <ChevronRight className="h-3.5 w-3.5 opacity-60" />
              <span className="font-medium text-white">Special Offers</span>
            </nav>

            <p className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-white backdrop-blur">
              <Flame className="h-3.5 w-3.5" />
              Limited-time offers
            </p>
            <h1 className="mt-4 font-display text-4xl font-semibold text-white sm:text-5xl lg:text-6xl">
              Exclusive residences,{" "}
              <span className="italic text-gold">exceptional value</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base text-white/85">
              A curated list of premium residences available at preferential pricing this season.
              Reserved for early enquiries only — once they're gone, they're gone.
            </p>
          </div>
        </section>

        {/* Offers grid */}
        <section className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
          {isLoading ? (
            <p className="py-16 text-center text-muted-foreground">Loading offers…</p>
          ) : offers.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/40 p-16 text-center">
              <BadgePercent className="mx-auto h-10 w-10 text-muted-foreground/60" />
              <p className="mt-4 font-display text-xl">No active offers right now</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Check back soon — or browse our full collection.
              </p>
              <Link
                to="/properties"
                search={{ status: "rent" }}
                className="mt-6 inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
              >
                Browse all properties <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {pageItems.map((p) => (
                  <OfferCard key={p.id} property={p} />
                ))}
              </div>
              <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
            </>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

function OfferCard({ property }: { property: Property }) {
  const discount = property.offerDiscount || 0;
  const discounted = Math.round(property.price * (1 - discount / 100));
  const discountedProp = { ...property, price: discounted } as Property;

  return (
    <Link
      to="/properties/$id"
      params={{ id: property.id }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] transition-all duration-500 hover:-translate-y-1.5 hover:border-primary/30 hover:shadow-[var(--shadow-soft)]"
    >
      {discount > 0 && (
        <div className="pointer-events-none absolute -right-12 top-5 z-10 rotate-45 bg-primary px-12 py-1 text-[11px] font-bold uppercase tracking-wider text-primary-foreground shadow-lg">
          {discount}% off
        </div>
      )}

      <div className="relative aspect-[4/3] overflow-hidden">
        {property.image ? (
          <img
            src={property.image}
            alt={property.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-muted" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

        {property.offerTag && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-background/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-foreground shadow">
            <BadgePercent className="h-3.5 w-3.5 text-primary" />
            {property.offerTag}
          </span>
        )}

        <div className="absolute inset-x-4 bottom-3">
          <p className="text-[10px] uppercase tracking-[0.25em] text-white/80">
            For {property.status} · {property.location}
          </p>
          <p className="font-display text-lg font-semibold text-white drop-shadow">
            {property.title}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-center gap-5 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><Bed className="h-4 w-4" />{property.bedrooms} bd</span>
          <span className="inline-flex items-center gap-1.5"><Bath className="h-4 w-4" />{property.bathrooms} ba</span>
          <span className="inline-flex items-center gap-1.5"><Maximize2 className="h-4 w-4" />{property.sqft.toLocaleString()} ft²</span>
        </div>

        <div className="mt-auto flex items-end justify-between border-t border-border pt-4">
          <div>
            {discount > 0 && (
              <p className="text-xs text-muted-foreground line-through">{formatPrice(property)}</p>
            )}
            <p className="font-display text-xl font-semibold text-primary">
              {formatPrice(discountedProp)}
            </p>
          </div>
          {property.offerEnds && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-[10px] font-semibold uppercase text-rose-700">
              <Clock className="h-3 w-3" /> Ends {property.offerEnds}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
