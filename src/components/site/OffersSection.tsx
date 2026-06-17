import { Link } from "@tanstack/react-router";
import { ArrowRight, BadgePercent, Clock, Flame } from "lucide-react";
import { formatPrice, type Property } from "@/lib/properties";

interface Offer {
  property: Property;
  discount: number; // percentage 0-100
  tag: string;
  ends: string;
}

export function OffersSection({ offers }: { offers: Offer[] }) {
  return (
    <section className="relative overflow-hidden py-20">
      {/* Backdrop */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(180deg, oklch(0.16 0.04 25) 0%, oklch(0.20 0.07 22) 100%)",
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 15% 25%, white 1px, transparent 1px), radial-gradient(circle at 75% 70%, white 1px, transparent 1px)",
          backgroundSize: "48px 48px, 64px 64px",
        }}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.25em] text-gold">
              <Flame className="h-3.5 w-3.5" />
              Limited-time offers
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-white sm:text-4xl">
              Exclusive residences, exceptional value
            </h2>
            <p className="mt-3 max-w-xl text-sm text-white/65">
              A short list of premium residences available at preferential pricing this season —
              reserved for early enquiries only.
            </p>
          </div>
          <Link
            to="/properties"
            search={{ status: "rent" }}
            className="inline-flex items-center gap-1.5 rounded-md border border-gold/40 bg-gold/10 px-4 py-2 text-sm font-medium text-gold backdrop-blur transition hover:bg-gold/20"
          >
            See all offers <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {offers.map(({ property, discount, tag, ends }) => {
            const discounted = Math.round(property.price * (1 - discount / 100));
            const offerProperty = { ...property, price: discounted } as Property;
            return (
              <Link
                key={property.id}
                to="/properties/$id"
                params={{ id: property.id }}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_20px_60px_-30px_rgba(0,0,0,0.7)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-1.5 hover:border-gold/40"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={property.image}
                    alt={property.title}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                  {/* Discount ribbon */}
                  <div className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-gold px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-gold-foreground shadow-lg">
                    <BadgePercent className="h-3.5 w-3.5" />
                    {discount}% off
                  </div>
                  <span className="absolute right-3 top-3 rounded-full border border-white/30 bg-black/40 px-3 py-1 text-[11px] font-medium text-white backdrop-blur">
                    {tag}
                  </span>

                  <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.25em] text-white/65">
                        For {property.status}
                      </p>
                      <p className="font-display text-lg font-semibold text-white">
                        {property.title}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-1 flex-col gap-4 p-5">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.25em] text-white/50">
                        Offer price
                      </p>
                      <p className="font-display text-2xl font-semibold text-gold">
                        {formatPrice(offerProperty)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-[0.25em] text-white/40">
                        Was
                      </p>
                      <p className="text-sm font-medium text-white/50 line-through">
                        {formatPrice(property)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/10 pt-4 text-xs text-white/60">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-gold" />
                      Ends {ends}
                    </span>
                    <span className="inline-flex items-center gap-1 text-gold transition group-hover:translate-x-0.5">
                      View <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
