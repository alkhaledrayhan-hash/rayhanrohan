import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Bath, Bed, Check, MapPin, Maximize2, MessageCircle } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { BookingForm } from "@/components/site/BookingForm";
import { EnquireForm } from "@/components/site/EnquireForm";
import { formatPrice, getProperty } from "@/lib/properties";

export const Route = createFileRoute("/properties/$id")({
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
      <main className="mx-auto max-w-3xl px-4 py-24 text-center">
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

  const waMsg = encodeURIComponent(
    `Hello, I am interested in viewing the property ${property.title} located in ${property.location}. Please let me know your availability.`,
  );
  const waLink = `https://wa.me/97440000000?text=${waMsg}`;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          to="/properties"
          search={{ status: property.status }}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to listings
        </Link>

        <div className="mt-6 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          <div>
            <div className="relative overflow-hidden rounded-3xl border border-border">
              <img
                src={property.image}
                alt={property.title}
                width={1280}
                height={896}
                className="aspect-[16/11] w-full object-cover"
              />
              <span className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-primary-foreground">
                For {property.status}
              </span>
              <span className="absolute right-4 top-4 rounded-full border border-gold/70 bg-black/40 px-3 py-1 text-[11px] font-medium text-gold backdrop-blur">
                {property.type}
              </span>
            </div>

            <div className="mt-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary" />
                  {property.address}
                </p>
                <h1 className="mt-2 font-display text-4xl font-semibold text-foreground sm:text-5xl">
                  {property.title}
                </h1>
              </div>
              <div className="rounded-xl bg-primary px-5 py-3 text-primary-foreground shadow-[var(--shadow-soft)]">
                <span className="text-[10px] uppercase tracking-[0.2em] opacity-80">Price</span>
                <p className="font-display text-2xl font-semibold">{formatPrice(property)}</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-card text-center">
              <Stat icon={<Bed className="h-4 w-4" />} value={property.bedrooms} label="Bedrooms" />
              <Stat icon={<Bath className="h-4 w-4" />} value={property.bathrooms} label="Bathrooms" />
              <Stat icon={<Maximize2 className="h-4 w-4" />} value={property.sqft.toLocaleString()} label="Sq Ft" />
            </div>

            <section className="mt-10">
              <h2 className="font-display text-2xl font-semibold">About this residence</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{property.description}</p>
            </section>

            <section className="mt-10">
              <h2 className="font-display text-2xl font-semibold">Features</h2>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {property.features.map((f: string) => (
                  <li key={f} className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm">
                    <Check className="h-4 w-4 text-gold" /> {f}
                  </li>
                ))}
              </ul>
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

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number | string; label: string }) {
  return (
    <div className="px-4 py-5">
      <div className="mx-auto mb-1 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <p className="font-display text-2xl font-semibold">{value}</p>
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
    </div>
  );
}
