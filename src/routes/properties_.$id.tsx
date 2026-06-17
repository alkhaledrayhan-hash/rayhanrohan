import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Bath,
  Bed,
  BadgeCheck,
  Calendar,
  DoorOpen,
  MapPin,
  Maximize2,
  MessageCircle,
  Share2,
  Star,
} from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { PageHero } from "@/components/site/PageHero";
import { BookingForm } from "@/components/site/BookingForm";
import { EnquireForm } from "@/components/site/EnquireForm";
import { formatPrice, getProperty } from "@/lib/properties";

export const Route = createFileRoute("/properties_/$id")({
  loader: ({ params }) => {
    const property = getProperty(params.id);
    if (!property) throw notFound();
    return { property };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.property;
    const title = p ? `${p.title}, ${p.location} — MaisonQatar` : "Property — MaisonQatar";
    const desc = p
      ? `${p.bedrooms}-bed ${p.type.toLowerCase()} in ${p.location} · ${formatPrice(p)}. ${p.description}`
      : "Premium real estate in Qatar.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        ...(p ? [{ property: "og:image", content: p.image }] : []),
      ],
    };
  },
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-3xl px-4 pb-24 pt-40 text-center">
        <h1 className="font-display text-4xl font-semibold">Property not found</h1>
        <p className="mt-2 text-muted-foreground">It may have been let or sold. Browse our latest listings.</p>
        <Link
          to="/properties"
          search={{ status: "rent" }}
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to listings
        </Link>
      </main>
      <Footer />
    </div>
  ),
  component: PropertyDetail,
});

function PropertyDetail() {
  const { property } = Route.useLoaderData();
  const [activeImg, setActiveImg] = useState(property.gallery[0] ?? property.image);

  const waMsg = encodeURIComponent(
    `Hello, I am interested in viewing the property ${property.title} located in ${property.location}. Please let me know your availability.`,
  );
  const waLink = `https://wa.me/97440000000?text=${waMsg}`;
  const propertyId = property.id.slice(-6).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <PageHero
        image={property.image}
        eyebrow={`${property.type} · ${property.location}`}
        title={property.title}
        description={`${property.bedrooms} bed · ${property.bathrooms} bath · ${property.sqft.toLocaleString()} sq ft — ${formatPrice(property)}`}
        crumbs={[
          { label: "Home", to: "/" },
          { label: property.type, to: "/properties", search: { status: property.status } },
          { label: property.title },
        ]}
      />
      <main className="mx-auto max-w-7xl px-4 pb-8 pt-10 sm:px-6 lg:px-8">

        {/* Gallery */}
        <div className="mt-5 grid gap-3 md:grid-cols-[2fr_1fr]">
          <div className="relative overflow-hidden rounded-2xl border border-border">
            <img
              src={activeImg}
              alt={property.title}
              width={1280}
              height={896}
              className="aspect-[16/11] w-full object-cover"
            />
            <span className="absolute left-4 top-4 rounded-md bg-background/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-foreground shadow">
              For {property.status}
            </span>
            <button
              aria-label="Share"
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full bg-background/95 text-foreground shadow transition hover:bg-primary hover:text-primary-foreground"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3 md:grid-cols-1">
            {property.gallery.slice(1, 4).map((g: string, i: number) => (
              <button
                key={`${g}-${i}`}
                onClick={() => setActiveImg(g)}
                className={`relative overflow-hidden rounded-2xl border transition ${
                  activeImg === g ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/40"
                }`}
              >
                <img
                  src={g}
                  alt={`${property.title} ${i + 2}`}
                  loading="lazy"
                  width={640}
                  height={480}
                  className="aspect-[4/3] w-full object-cover md:aspect-[4/3]"
                />
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          <div>
            {/* Title row */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-3xl font-semibold text-foreground sm:text-4xl">
                    {property.title}
                  </h1>
                  {property.verified ? <BadgeCheck className="h-6 w-6 text-gold" /> : null}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
                  <span className="rounded-md bg-secondary px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider text-foreground">
                    For {property.status}
                  </span>
                  <span className="flex items-center gap-0.5 text-gold">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-gold" />
                    ))}
                    <span className="ml-1.5 text-muted-foreground">(No reviews yet)</span>
                  </span>
                </div>
                <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary" />
                  {property.address}
                </p>
              </div>
              <div className="text-right">
                <p className="font-display text-3xl font-semibold text-primary sm:text-4xl">
                  {formatPrice(property)}
                </p>
                <p className="text-sm text-muted-foreground">{property.sqft.toLocaleString()} Sq Ft</p>
              </div>
            </div>

            {/* Overview */}
            <section className="mt-8">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <h2 className="font-display text-2xl font-semibold">Overview</h2>
                <p className="text-sm text-muted-foreground">
                  Property ID: <span className="font-mono text-foreground">{propertyId}</span>
                </p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
                <OverviewStat icon={<Bed className="h-4 w-4" />} label="Bedrooms" value={property.bedrooms} />
                <OverviewStat icon={<Bath className="h-4 w-4" />} label="Bathrooms" value={property.bathrooms} />
                <OverviewStat icon={<DoorOpen className="h-4 w-4" />} label="Rooms" value={property.rooms} />
                <OverviewStat icon={<Maximize2 className="h-4 w-4" />} label="Size" value={`${property.sqft.toLocaleString()} ft²`} />
                <OverviewStat icon={<Calendar className="h-4 w-4" />} label="Year Built" value={property.yearBuilt} />
              </div>
            </section>

            {/* Description */}
            <section className="mt-10">
              <h2 className="font-display text-2xl font-semibold">About this residence</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{property.description}</p>
            </section>

            {/* Features */}
            <section className="mt-10">
              <h2 className="font-display text-2xl font-semibold">Features & amenities</h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {property.features.map((f: string) => (
                  <li key={f} className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                    {f}
                  </li>
                ))}
              </ul>
            </section>

            {/* Address block */}
            <section className="mt-10 rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-2xl font-semibold">Address</h2>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <Row label="Address" value={property.address} />
                <Row label="City" value={property.location} />
                <Row label="Country" value="Qatar" />
                <Row label="Type" value={property.type} />
              </dl>
            </section>
          </div>

          {/* Sticky booking column */}
          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-5 py-4 text-base font-semibold text-white shadow-[var(--shadow-soft)] transition hover:opacity-95"
            >
              <MessageCircle className="h-5 w-5" />
              Book Viewing via WhatsApp
            </a>
            <BookingForm property={property} />
            <EnquireForm property={property} />
          </aside>
        </div>
      </main>

      {/* Mobile sticky WhatsApp */}
      <a
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-4 left-4 right-4 z-50 flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3.5 text-sm font-semibold text-white shadow-2xl lg:hidden"
      >
        <MessageCircle className="h-5 w-5" />
        Book Viewing via WhatsApp
      </a>
      <Footer />
    </div>
  );
}

function OverviewStat({
  icon, label, value,
}: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <div className="min-w-0 rounded-xl border border-border bg-card px-3 py-4 text-center">
      <p className="flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
        <span className="shrink-0 text-primary">{icon}</span>
        <span className="truncate">{label}</span>
      </p>
      <p className="mt-1 truncate font-display text-lg font-semibold text-foreground sm:text-xl">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}
