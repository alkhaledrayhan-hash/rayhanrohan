import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Sparkles, KeyRound } from "lucide-react";
import { getMenuIcon, guessMenuIcon } from "@/lib/menu-icons";
import { normalizeTrust } from "@/components/admin/TrustSectionEditor";
import { normalizeFeatured } from "@/components/admin/FeaturedSectionEditor";
import { normalizeOffers } from "@/components/admin/OffersSectionEditor";
import { normalizeLocations } from "@/components/admin/LocationsSectionEditor";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { HeroSearch } from "@/components/site/HeroSearch";
import { PropertyGrid } from "@/components/site/PropertyGrid";
import { HomeContact } from "@/components/site/HomeContact";
import { OffersSection } from "@/components/site/OffersSection";
import { LogoMarquee } from "@/components/site/LogoMarquee";
import { NewsTicker } from "@/components/site/NewsTicker";
import { useProperties, useOfferProperties, LOCATIONS } from "@/lib/properties";
import { usePageSections, useHiddenSections, useSectionOrder } from "@/lib/page-sections";
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
  const { data: hidden = new Set<string>() } = useHiddenSections("home");
  const { data: orderMap = {} } = useSectionOrder("home");
  const isHidden = (k: string) => hidden.has(k);
  const { data: allProperties = [] } = useProperties();
  const { data: offerProperties = [] } = useOfferProperties();
  const featuredCfg = normalizeFeatured(sections.featured);
  const featured = (() => {
    const limit = featuredCfg.limit || 6;
    if (featuredCfg.mode === "manual" && featuredCfg.propertyIds.length) {
      const map = new Map(allProperties.map((p) => [p.id, p]));
      return featuredCfg.propertyIds.map((id) => map.get(id)).filter(Boolean).slice(0, limit) as typeof allProperties;
    }
    if (featuredCfg.mode === "category") {
      const { status, type, location } = featuredCfg.filter;
      return allProperties.filter((p) =>
        (!status || p.status === status) &&
        (!type || p.type === type) &&
        (!location || p.location === location)
      ).slice(0, limit);
    }
    if (featuredCfg.mode === "random") {
      return [...allProperties].sort(() => Math.random() - 0.5).slice(0, limit);
    }
    return allProperties.slice(0, limit);
  })();
  const offersCfg = normalizeOffers(sections.offer);
  const offerSourceList = (() => {
    const limit = offersCfg.limit || 6;
    if (offersCfg.mode === "manual" && offersCfg.propertyIds.length) {
      const map = new Map(allProperties.map((p) => [p.id, p]));
      return offersCfg.propertyIds.map((id) => map.get(id)).filter(Boolean).slice(0, limit) as typeof allProperties;
    }
    // random
    const pool = offersCfg.only_special
      ? (offerProperties.length ? offerProperties : allProperties.filter((p) => Number(p.offerDiscount) > 0 || !!p.offerTag))
      : allProperties;
    return [...pool].sort(() => Math.random() - 0.5).slice(0, limit);
  })();
  const offers = offerSourceList.map((property) => ({
    property,
    discount: property.offerDiscount || 0,
    tag: property.offerTag || "Special offer",
    ends: property.offerEnds || "",
  }));
  const trustConfig = normalizeTrust(sections.trust);
  const trust = trustConfig.items;
  const trustScroll = trustConfig.scroll;
  const trustShouldScroll = trustScroll.enabled && trust.length > trustScroll.threshold;
  const trustItems = trustShouldScroll ? [...trust, ...trust] : trust;
  const trustDuration = Math.max(8, Math.min(180, Number(trustScroll.speed) || 35));
  const featuredHeading = featuredCfg;
  const locationsCfg = normalizeLocations(sections.locations);
  const locationsHeading = { eyebrow: locationsCfg.eyebrow, title: locationsCfg.title };

  type LocItem = { name: string; image_url?: string; link?: string };
  const locationItems: LocItem[] = (() => {
    const limit = Math.max(1, locationsCfg.limit || 5);
    if (locationsCfg.mode === "manual") {
      return locationsCfg.customItems.slice(0, limit);
    }
    const distinct = Array.from(new Set(allProperties.map((p) => p.location).filter(Boolean))) as string[];
    const pool = distinct.length ? distinct : (LOCATIONS as readonly string[]).slice();
    const ordered = locationsCfg.mode === "random"
      ? [...pool].sort(() => Math.random() - 0.5)
      : [...pool].sort();
    return ordered.slice(0, limit).map((name) => ({ name }));
  })();

  const locScroll = locationsCfg.scroll;
  const locShouldScroll = locScroll.enabled && locationItems.length > locScroll.threshold;
  const locDuration = Math.max(5, Math.min(180, Number(locScroll.speed) || 28));
  const locRenderItems = locShouldScroll ? [...locationItems, ...locationItems] : locationItems;
  const resolveLocImage = (it: LocItem) => it.image_url || LOCATION_IMAGES[it.name] || locDoha;
  const resolveLocLink = (it: LocItem) => it.link || `/properties?location=${encodeURIComponent(it.name)}`;

  const sectionRenderers: Record<string, () => React.ReactNode> = {
    hero: () => <HeroSearch />,
    ticker: () => <NewsTicker />,
    trust: () => (
      <section className="bg-secondary/40">
        {trustShouldScroll ? (
          <div className="group relative overflow-hidden py-8">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-secondary/80 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-secondary/80 to-transparent" />
            <div
              className="flex w-max items-center gap-10 px-6 group-hover:[animation-play-state:paused]"
              style={{ animation: `trust-scroll ${trustDuration}s linear infinite` }}
            >
              {trustItems.map((t, i) => (
                <div key={i} className="flex w-[300px] flex-shrink-0">
                  <Trust icon={renderTrustIcon(t.icon, i)} title={t.title} body={t.body} />
                </div>
              ))}
            </div>
            <style>{`@keyframes trust-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
          </div>
        ) : (
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-3 sm:px-6 lg:px-8">
            {trust.slice(0, 3).map((t, i) => (
              <Trust key={i} icon={renderTrustIcon(t.icon, i)} title={t.title} body={t.body} />
            ))}
          </div>
        )}
      </section>
    ),
    featured: () => (
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
          <a
            href={featuredHeading.link_href || "/properties"}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            {featuredHeading.link_label} <ArrowRight className="h-4 w-4" />
          </a>
        </div>
        <div className="mt-10">
          <PropertyGrid properties={featured} />
        </div>
      </section>
    ),
    offer: () => offers.length > 0 ? (
      <OffersSection
        offers={offers}
        heading={{
          eyebrow: offersCfg.eyebrow,
          title: offersCfg.title,
          description: offersCfg.description,
          ctaLabel: offersCfg.cta_label,
          ctaHref: offersCfg.cta_href,
        }}
      />
    ) : null,
    locations: () => (
      <section className="bg-secondary/40 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-gold">
            {locationsHeading.eyebrow}
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
            {locationsHeading.title}
          </h2>
          {locationItems.length > 0 && (
            locShouldScroll ? (
              <div className="group relative mt-10 -mx-4 overflow-hidden">
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-secondary/80 to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-secondary/80 to-transparent" />
                <div
                  className="flex w-max gap-4 px-4 group-hover:[animation-play-state:paused]"
                  style={{ animation: `locations-marquee ${locDuration}s linear infinite` }}
                >
                  {locRenderItems.map((it, i) => (
                    <a
                      key={`${it.name}-${i}`}
                      href={resolveLocLink(it)}
                      className="group/card relative isolate w-[68vw] max-w-[260px] flex-shrink-0 overflow-hidden rounded-2xl border border-border bg-card sm:w-[260px]"
                    >
                      <img
                        src={resolveLocImage(it)}
                        alt={it.name}
                        loading="lazy"
                        decoding="async"
                        className="pointer-events-none absolute inset-0 -z-10 h-full w-full object-cover"
                      />
                      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />
                      <div className="relative p-6">
                        <p className="text-[11px] uppercase tracking-[0.2em] text-white/70">Qatar</p>
                        <p className="mt-2 font-display text-xl font-semibold text-white">{it.name}</p>
                        <p className="mt-3 inline-flex items-center gap-1 text-sm text-gold">
                          Explore <ArrowRight className="h-3.5 w-3.5" />
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
                <style>{`@keyframes locations-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
              </div>
            ) : (
              <div className={`mt-10 grid gap-4 sm:grid-cols-2 ${locationItems.length >= 5 ? "lg:grid-cols-5" : locationItems.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
                {locationItems.map((it) => (
                  <a
                    key={it.name}
                    href={resolveLocLink(it)}
                    className="group relative isolate overflow-hidden rounded-2xl border border-border bg-card transition-all duration-500 ease-out hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--shadow-soft)]"
                  >
                    <img
                      src={resolveLocImage(it)}
                      alt={it.name}
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
                        {it.name}
                      </p>
                      <p className="mt-3 inline-flex items-center gap-1 text-sm text-primary opacity-0 transition-all duration-500 group-hover:text-gold group-hover:opacity-100">
                        Explore <ArrowRight className="h-3.5 w-3.5" />
                      </p>
                    </div>
                  </a>
                ))}
              </div>
            )
          )}
        </div>
      </section>
    ),
    contact: () => <HomeContact />,
    partners: () => <LogoMarquee />,
  };

  const DEFAULT_ORDER: Record<string, number> = {
    hero: 1, ticker: 2, trust: 3, featured: 4, offer: 5,
    locations: 6, contact: 7, partners: 8,
  };
  const orderedKeys = Object.keys(sectionRenderers)
    .filter((k) => !isHidden(k))
    .sort((a, b) => (orderMap[a] ?? DEFAULT_ORDER[a] ?? 99) - (orderMap[b] ?? DEFAULT_ORDER[b] ?? 99));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {orderedKeys.map((key) => (
          <React.Fragment key={key}>{sectionRenderers[key]()}</React.Fragment>
        ))}
      </main>
      <Footer />
    </div>
  );
}

const TRUST_FALLBACK_ICONS = [ShieldCheck, Sparkles, KeyRound];
function renderTrustIcon(name: string | undefined, index: number) {
  const Icon = getMenuIcon(name) ?? TRUST_FALLBACK_ICONS[index % TRUST_FALLBACK_ICONS.length] ?? guessMenuIcon("");
  return <Icon className="h-5 w-5" />;
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
