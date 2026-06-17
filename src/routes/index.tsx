import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldCheck, Sparkles, KeyRound } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { HeroSearch } from "@/components/site/HeroSearch";
import { PropertyGrid } from "@/components/site/PropertyGrid";
import { PROPERTIES, LOCATIONS } from "@/lib/properties";

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
  const featured = PROPERTIES.slice(0, 6);
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSearch />

        {/* Trust strip */}
        <section className="border-y border-border bg-secondary/40">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-3 sm:px-6 lg:px-8">
            <Trust icon={<ShieldCheck className="h-5 w-5" />} title="Licensed brokerage" body="Qatar-registered with verified listings only." />
            <Trust icon={<Sparkles className="h-5 w-5" />} title="Hand-curated portfolio" body="Every residence is personally inspected." />
            <Trust icon={<KeyRound className="h-5 w-5" />} title="Frictionless viewings" body="Book on WhatsApp or schedule in one tap." />
          </div>
        </section>

        {/* Featured */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-gold">
                Featured residences
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
                A portfolio worthy of the address
              </h2>
            </div>
            <Link
              to="/properties"
              search={{ status: "rent" }}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              View all listings <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-10">
            <PropertyGrid properties={featured} />
          </div>
        </section>

        {/* Locations */}
        <section className="bg-secondary/40 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-gold">
              Premium Qatar locations
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
              Live in Qatar's most coveted neighbourhoods
            </h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {LOCATIONS.map((loc) => (
                <Link
                  key={loc}
                  to="/properties"
                  search={{ location: loc }}
                  className="group rounded-2xl border border-border bg-card p-6 transition hover:border-primary/40 hover:shadow-[var(--shadow-soft)]"
                >
                  <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Qatar</p>
                  <p className="mt-2 font-display text-xl font-semibold text-foreground">{loc}</p>
                  <p className="mt-3 inline-flex items-center gap-1 text-sm text-primary opacity-0 transition group-hover:opacity-100">
                    Explore <ArrowRight className="h-3.5 w-3.5" />
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
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
