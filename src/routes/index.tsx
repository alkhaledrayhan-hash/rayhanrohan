import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Sparkles, KeyRound } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { HeroSearch } from "@/components/site/HeroSearch";
import { PropertyGrid } from "@/components/site/PropertyGrid";
import { HomeContact } from "@/components/site/HomeContact";
import { OffersSection } from "@/components/site/OffersSection";
import { LogoMarquee } from "@/components/site/LogoMarquee";
import { NewsTicker } from "@/components/site/NewsTicker";
import { useProperties, LOCATIONS } from "@/lib/properties";
import { usePageSections } from "@/lib/page-sections";
import locDoha from "@/assets/prop-7.jpg?w=800&quality=70&format=webp";
import locPearl from "@/assets/prop-1.jpg?w=800&quality=70&format=webp";
import locLusail from "@/assets/prop-3.jpg?w=800&quality=70&format=webp";
import locWestBay from "@/assets/prop-4.jpg?w=800&quality=70&format=webp";
import locAlWaab from "@/assets/prop-2.jpg?w=800&quality=70&format=webp";

const LOCATION_IMAGES: Record<string, string> = {
  Doha: locDoha,
  "The Pearl": locPearl,
  Lusail: locLusail,
  "West Bay": locWestBay,
  "Al Waab": locAlWaab,
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MaisonQatar — Premium Real Estate in Qatar" },
      {
        name: "description",
        content:
          "Discover handpicked apartments, villas and penthouses for rent or sale across Doha, The Pearl, Lusail, West Bay and Al Waab.",
      },
      { property: "og:title", content: "MaisonQatar — Premium Real Estate in Qatar" },
      {
        property: "og:description",
        content:
          "Discover handpicked apartments, villas and penthouses for rent or sale across Doha, The Pearl, Lusail, West Bay and Al Waab.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: sections = {} } = usePageSections("home");
  const { data: allProperties = [] } = useProperties();
  const featured = allProperties.slice(0, 6);
  const offers = [
    allProperties[0] && {
      property: allProperties[0],
      discount: 12,
      tag: "Move-in ready",
      ends: "Jul 31",
    },
    allProperties[2] && {
      property: allProperties[2],
      discount: 8,
      tag: "Sky residence",
      ends: "Aug 15",
    },
    allProperties[1] && {
      property: allProperties[1],
      discount: 10,
      tag: "Signature villa",
      ends: "Jul 20",
    },
  ].filter(Boolean) as { property: any; discount: number; tag: string; ends: string }[];
  const trust = sections.trust?.items ?? [
    { title: "Licensed brokerage", body: "Qatar-registered with verified listings only." },
    { title: "Hand-curated portfolio", body: "Every residence is personally inspected." },
    { title: "Frictionless viewings", body: "Book on WhatsApp or schedule in one tap." },
  ];
  const featuredHeading = sections.featured ?? {
    eyebrow: "Featured residences",
    title: "A portfolio worthy of the address",
    link_label: "View all listings",
    link_href: "/properties",
  };
  const locationsHeading = sections.locations ?? {
    eyebrow: "Premium Qatar locations",
    title: "Live in Qatar's most coveted neighbourhoods",
  };
  const trustIcons = [
    <ShieldCheck className="h-5 w-5" />,
    <Sparkles className="h-5 w-5" />,
    <KeyRound className="h-5 w-5" />,
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSearch />

        <NewsTicker />

        {/* Trust strip */}
        <section className="border-y border-border bg-secondary/40">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-3 sm:px-6 lg:px-8">
            {trust.slice(0, 3).map((t: any, i: number) => (
              <Trust
                key={i}
                icon={trustIcons[i] ?? <ShieldCheck className="h-5 w-5" />}
                title={t.title}
                body={t.body}
              />
            ))}
          </div>
        </section>

        {/* Featured */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-gold">
                {featuredHeading.eyebrow}
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
                {featuredHeading.title}
              </h2>
            </div>
            <Link
              to="/properties"
              search={{ status: "rent" }}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              {featuredHeading.link_label} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-10">
            <PropertyGrid properties={featured} />
          </div>
        </section>

        <LogoMarquee />

        {/* Exclusive offers */}
        <OffersSection offers={offers} />

        {/* Locations */}
        <section className="bg-secondary/40 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-gold">
              {locationsHeading.eyebrow}
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
              {locationsHeading.title}
            </h2>
            {/* Mobile: auto-scrolling marquee */}
            <div className="mt-10 -mx-4 overflow-hidden sm:hidden">
              <div className="flex w-max gap-4 px-4 animate-[locations-marquee_28s_linear_infinite]">
                {[...LOCATIONS, ...LOCATIONS].map((loc, i) => (
                  <Link
                    key={`${loc}-${i}`}
                    to="/properties"
                    search={{ location: loc }}
                    className="group relative isolate w-[68vw] max-w-[280px] flex-shrink-0 overflow-hidden rounded-2xl border border-border bg-card"
                  >
                    <img
                      src={LOCATION_IMAGES[loc]}
                      alt={loc}
                      loading="lazy"
                      decoding="async"
                      className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover"
                    />
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/35 to-black/10"
                    />
                    <div className="relative p-6">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-white/70">Qatar</p>
                      <p className="mt-2 font-display text-xl font-semibold text-white">{loc}</p>
                      <p className="mt-3 inline-flex items-center gap-1 text-sm text-gold">
                        Explore <ArrowRight className="h-3.5 w-3.5" />
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
              <style>{`@keyframes locations-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
            </div>

            {/* Tablet/desktop: grid */}
            <div className="mt-10 hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-5">
              {LOCATIONS.map((loc) => (
                <Link
                  key={loc}
                  to="/properties"
                  search={{ location: loc }}
                  className="group relative isolate overflow-hidden rounded-2xl border border-border bg-card transition-all duration-500 ease-out hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--shadow-soft)]"
                >
                  <img
                    src={LOCATION_IMAGES[loc]}
                    alt={loc}
                    loading="lazy"
                    decoding="async"
                    className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover opacity-0 transition-all duration-700 ease-out group-hover:scale-105 group-hover:opacity-100"
                  />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/35 to-black/10 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  />
                  <div className="relative p-6">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground transition-colors duration-500 group-hover:text-white/70">
                      Qatar
                    </p>
                    <p className="mt-2 font-display text-xl font-semibold text-foreground transition-colors duration-500 group-hover:text-white">
                      {loc}
                    </p>
                    <p className="mt-3 inline-flex items-center gap-1 text-sm text-primary opacity-0 transition-all duration-500 group-hover:text-gold group-hover:opacity-100">
                      Explore <ArrowRight className="h-3.5 w-3.5" />
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <HomeContact />
      </main>
      <Footer />
    </div>
  );
}

function Trust({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </span>
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}
