import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Award,
  Building2,
  Compass,
  Globe2,
  Handshake,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Users2,
} from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import heroImg from "@/assets/qatar-pearl.jpg?w=1600&quality=72&format=webp";
import portraitImg from "@/assets/prop-7.jpg?w=900&quality=72&format=webp";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About MaisonQatar — Qatar's Premium Real Estate Brokerage" },
      {
        name: "description",
        content:
          "MaisonQatar is a licensed Doha-based brokerage curating premium residences across The Pearl, Lusail, West Bay and Al Waab. Meet the team, our story and the values behind the service.",
      },
      { property: "og:title", content: "About MaisonQatar — Qatar's Premium Real Estate Brokerage" },
      {
        property: "og:description",
        content:
          "Founded in Doha, MaisonQatar is a licensed brokerage curating premium residences across Qatar's most coveted addresses.",
      },
      { property: "og:image", content: heroImg },
    ],
  }),
  component: AboutPage,
});

const STATS: Array<{ label: string; value: number; suffix?: string; prefix?: string }> = [
  { label: "Years in Qatar", value: 12, suffix: "+" },
  { label: "Properties closed", value: 1400, suffix: "+" },
  { label: "Client retention", value: 94, suffix: "%" },
  { label: "Premier areas covered", value: 5 },
];

function CountUp({ end, duration = 2000, prefix = "", suffix = "" }: { end: number; duration?: number; prefix?: string; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started.current) {
            started.current = true;
            const startTime = performance.now();
            const tick = (now: number) => {
              const progress = Math.min((now - startTime) / duration, 1);
              const eased = 1 - Math.pow(1 - progress, 3);
              setCount(Math.floor(eased * end));
              if (progress < 1) requestAnimationFrame(tick);
              else setCount(end);
            };
            requestAnimationFrame(tick);
          }
        });
      },
      { threshold: 0.3 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [end, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

const VALUES = [
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    title: "Integrity first",
    body: "Every listing is verified, every figure transparent. Our reputation in Qatar is built on what we don't show as much as what we do.",
  },
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: "Hand-curated quality",
    body: "We personally inspect each residence before it joins the portfolio. If we wouldn't live there, we won't list it.",
  },
  {
    icon: <Handshake className="h-5 w-5" />,
    title: "White-glove service",
    body: "From first viewing to keys in hand, a dedicated agent handles your search — including bilingual paperwork and Qatari ID coordination.",
  },
  {
    icon: <Globe2 className="h-5 w-5" />,
    title: "Local + global",
    body: "Born in Doha, fluent in international expectations. We work with relocations from Europe, the GCC, and South Asia every week.",
  },
];

const TEAM = [
  {
    name: "Mariam Al-Thani",
    role: "Founder & Principal Broker",
    bio: "12 years of luxury real estate experience across Doha and London.",
  },
  {
    name: "Yusuf Rahman",
    role: "Head of Sales · The Pearl & Lusail",
    bio: "Specialist in waterfront apartments and penthouse acquisitions.",
  },
  {
    name: "Aisha Karim",
    role: "Lettings Director · West Bay",
    bio: "Trusted by relocation teams at major Doha embassies and corporates.",
  },
  {
    name: "Khalid Mansour",
    role: "Villa Specialist · Al Waab",
    bio: "Compound villas, family homes and long-tenure leases.",
  },
];

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero */}
        <section className="relative isolate overflow-hidden">
          <img
            src={heroImg}
            alt="Doha skyline at sunset"
            width={1920}
            height={1080}
            className="absolute inset-0 -z-10 h-full w-full object-cover"
          />
          <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero-overlay)" }} />
          <div className="mx-auto max-w-7xl px-4 pb-24 pt-40 sm:px-6 sm:pb-32 sm:pt-48 lg:px-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/60 bg-black/20 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-gold backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              About MaisonQatar
            </span>
            <h1 className="mt-5 max-w-3xl font-display text-4xl font-semibold leading-[1.05] text-white sm:text-5xl lg:text-6xl">
              The quiet standard for premium living in Qatar.
            </h1>
            <p className="mt-4 max-w-2xl text-base text-white/80 sm:text-lg">
              A Doha-based, licensed brokerage trusted by residents, executives and diplomats for over a decade.
              Hand-picked homes, principled advice, and a frictionless experience from first viewing to handover.
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="border-b border-border bg-secondary/40">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:grid-cols-4 sm:px-6 lg:px-8">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-display text-3xl font-semibold text-primary sm:text-4xl">{s.value}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Story */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-gold">Our story</p>
              <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
                Founded in Doha. Built for residents who expect more.
              </h2>
              <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-muted-foreground">
                <p>
                  MaisonQatar was founded in 2013 with a simple thesis: Qatar's premium real estate market
                  deserved a brokerage that behaved like a private office, not a listings catalogue. We started
                  with a single advisor in West Bay and a notebook of personally inspected addresses.
                </p>
                <p>
                  A decade on, that discipline still defines us. We don't chase volume. We work with a curated
                  portfolio across The Pearl, Lusail, West Bay, Al Waab and inner Doha, and we stay with each
                  client from the first viewing through handover, utilities, and — if it's a lease — renewal.
                </p>
                <p>
                  We're proudly licensed in the State of Qatar, fluent in Arabic and English, and trusted by
                  some of the country's most discerning residents to find them a home worthy of the address.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="overflow-hidden rounded-3xl border border-border shadow-[var(--shadow-soft)]">
                <img
                  src={portraitImg}
                  alt="MaisonQatar showroom interior"
                  width={1280}
                  height={896}
                  loading="lazy"
                  className="aspect-[4/5] w-full object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -left-4 hidden rounded-2xl border border-gold/60 bg-card p-5 shadow-[var(--shadow-soft)] sm:block">
                <p className="font-display text-2xl font-semibold text-primary">Est. 2013</p>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">West Bay · Doha</p>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="bg-secondary/40 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-gold">What we stand for</p>
            <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">Our values</h2>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {VALUES.map((v) => (
                <div key={v.title} className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                    {v.icon}
                  </span>
                  <p className="mt-4 font-display text-xl font-semibold text-foreground">{v.title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{v.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-gold">The people</p>
              <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">Meet the team</h2>
            </div>
            <p className="max-w-md text-sm text-muted-foreground">
              A small, senior team of bilingual advisors — each a specialist in their corner of Qatar.
            </p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {TEAM.map((m) => (
              <div key={m.name} className="rounded-2xl border border-border bg-card p-6 text-center shadow-[var(--shadow-card)]">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10">
                  <Users2 className="h-7 w-7 text-primary" />
                </div>
                <p className="mt-4 font-display text-lg font-semibold text-foreground">{m.name}</p>
                <p className="text-xs uppercase tracking-[0.18em] text-gold">{m.role}</p>
                <p className="mt-3 text-sm text-muted-foreground">{m.bio}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Company details */}
        <section className="bg-secondary/40 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-gold">Company details</p>
                <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
                  Licensed. Local. Accountable.
                </h2>
                <p className="mt-4 text-sm text-muted-foreground">
                  Full company disclosure for clients, partners and regulators. Reach out any time —
                  we're happy to share additional documentation.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
                <dl className="grid gap-4 text-sm sm:grid-cols-2">
                  <Detail icon={<Building2 className="h-4 w-4" />} label="Legal name" value="MaisonQatar Real Estate Brokerage W.L.L." />
                  <Detail icon={<Award className="h-4 w-4" />} label="License number" value="QA-RE-2013-08842" />
                  <Detail icon={<Compass className="h-4 w-4" />} label="Founded" value="2013, Doha" />
                  <Detail icon={<Users2 className="h-4 w-4" />} label="Team size" value="24 specialists" />
                  <Detail icon={<MapPin className="h-4 w-4" />} label="Head office" value="Tornado Tower, West Bay, Doha" />
                  <Detail icon={<Globe2 className="h-4 w-4" />} label="Languages" value="Arabic · English · Hindi · French" />
                  <Detail icon={<Phone className="h-4 w-4" />} label="Phone" value="+974 4000 0000" />
                  <Detail icon={<Mail className="h-4 w-4" />} label="Email" value="hello@maisonqatar.qa" />
                </dl>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    to="/properties"
                    search={{ status: "rent" }}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-soft)] transition hover:opacity-95"
                  >
                    Explore listings
                  </Link>
                  <a
                    href="mailto:hello@maisonqatar.qa"
                    className="inline-flex items-center gap-2 rounded-full border border-primary px-5 py-2.5 text-sm font-medium text-primary transition hover:bg-primary hover:text-primary-foreground"
                  >
                    Speak to an advisor
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function Detail({
  icon, label, value,
}: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        <span className="text-primary">{icon}</span>
        {label}
      </dt>
      <dd className="mt-1 font-medium text-foreground">{value}</dd>
    </div>
  );
}
