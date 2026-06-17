import { Link } from "@tanstack/react-router";
import { useRef } from "react";
import Autoplay from "embla-carousel-autoplay";
import { ArrowRight, BadgePercent, Clock, Flame, Bed, Bath, Maximize2 } from "lucide-react";
import { formatPrice, type Property } from "@/lib/properties";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface Offer {
  property: Property;
  discount: number;
  tag: string;
  ends: string;
}

export function OffersSection({ offers }: { offers: Offer[] }) {
  const autoplay = useRef(
    Autoplay({ delay: 3000, stopOnInteraction: false, stopOnMouseEnter: true }),
  );

  return (
    <section className="relative overflow-hidden py-20">
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(180deg, oklch(0.985 0.012 85) 0%, oklch(0.97 0.022 85) 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 top-10 -z-10 h-96 w-96 rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, oklch(0.85 0.14 85 / 0.55), transparent 70%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 bottom-0 -z-10 h-96 w-96 rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, oklch(0.55 0.16 22 / 0.4), transparent 70%)" }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-[oklch(0.45_0.12_60)]">
              <Flame className="h-3.5 w-3.5" />
              Limited-time offers
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-foreground sm:text-4xl">
              Exclusive residences,{" "}
              <span className="italic text-primary">exceptional value</span>
            </h2>
            <p className="mt-3 max-w-xl text-sm text-muted-foreground">
              A short list of premium residences available at preferential pricing this season —
              reserved for early enquiries only.
            </p>
          </div>
          <Link
            to="/properties"
            search={{ status: "rent" }}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-soft)] transition hover:opacity-90"
          >
            See all offers <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <Carousel
          opts={{ align: "start", loop: true, duration: 40 }}
          plugins={[autoplay.current]}
          className="mt-12"
        >
          <CarouselContent className="-ml-6">
            {offers.map(({ property, discount, tag, ends }) => {
              const discounted = Math.round(property.price * (1 - discount / 100));
              const offerProperty = { ...property, price: discounted } as Property;
              return (
                <CarouselItem
                  key={property.id}
                  className="pl-6 md:basis-1/2 lg:basis-1/3"
                >
                  <Link
                    to="/properties/$id"
                    params={{ id: property.id }}
                    className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] transition-all duration-500 hover:-translate-y-1.5 hover:border-primary/30 hover:shadow-[var(--shadow-soft)]"
                  >
                    <div className="pointer-events-none absolute -right-12 top-5 z-10 rotate-45 bg-primary px-12 py-1 text-[11px] font-bold uppercase tracking-wider text-primary-foreground shadow-lg">
                      {discount}% off
                    </div>

                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={property.image}
                        alt={property.title}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />

                      <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-background/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-foreground shadow">
                        <BadgePercent className="h-3.5 w-3.5 text-primary" />
                        {tag}
                      </span>

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
                        <Spec icon={<Bed className="h-4 w-4" />} label={`${property.bedrooms} bd`} />
                        <Spec icon={<Bath className="h-4 w-4" />} label={`${property.bathrooms} ba`} />
                        <Spec
                          icon={<Maximize2 className="h-4 w-4" />}
                          label={`${property.sqft.toLocaleString()} ft²`}
                        />
                      </div>

                      <div className="flex items-end justify-between gap-4 rounded-xl border border-gold/30 bg-gold/[0.08] p-4">
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-muted-foreground">
                            Offer price
                          </p>
                          <p className="font-display text-2xl font-semibold text-primary">
                            {formatPrice(offerProperty)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                            Was
                          </p>
                          <p className="text-sm font-medium text-muted-foreground line-through">
                            {formatPrice(property)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-primary" />
                          Ends {ends}
                        </span>
                        <span className="inline-flex items-center gap-1 font-medium text-primary transition group-hover:translate-x-0.5">
                          View details <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          <CarouselPrevious className="left-2 lg:-left-6" />
          <CarouselNext className="right-2 lg:-right-6" />
        </Carousel>
      </div>
    </section>
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
