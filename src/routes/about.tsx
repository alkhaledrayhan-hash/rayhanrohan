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
  Target,
  Telescope,
  Users2,
} from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { usePageHero } from "@/hooks/usePageHero";
import { usePageSections } from "@/lib/page-sections";
import { normalizeAbout } from "@/components/admin/AboutContentEditor";
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

const VALUE_ICONS: Record<string, React.ReactNode> = {
  shield: <ShieldCheck className="h-5 w-5" />,
  sparkles: <Sparkles className="h-5 w-5" />,
  handshake: <Handshake className="h-5 w-5" />,
  globe: <Globe2 className="h-5 w-5" />,
};

const MISSION_ICONS: Record<string, React.ReactNode> = {
  Mission: <Target className="h-5 w-5" />,
  Vision: <Telescope className="h-5 w-5" />,
};

const DETAIL_ICONS: Record<string, React.ReactNode> = {
  "Legal name": <Building2 className="h-4 w-4" />,
  "License number": <Award className="h-4 w-4" />,
  "Founded": <Compass className="h-4 w-4" />,
  "Team size": <Users2 className="h-4 w-4" />,
  "Head office": <MapPin className="h-4 w-4" />,
  "Languages": <Globe2 className="h-4 w-4" />,
  "Phone": <Phone className="h-4 w-4" />,
  "Email": <Mail className="h-4 w-4" />,
};

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

function AboutPage() {
  const { data: hero } = usePageHero("about");
  const { data: sections } = usePageSections("about");
  const c = normalizeAbout(sections?.content);

  const heroBg = hero?.image || heroImg;
  const heroEyebrow = hero?.eyebrow ?? "About MaisonQatar";
  const heroTitle = hero?.title ?? "The quiet standard for premium living in Qatar.";
  const heroDescription = hero?.description ?? "A Doha-based, licensed brokerage trusted by residents, executives and diplomats for over a decade. Hand-picked homes, principled advice, and a frictionless experience from first viewing to handover.";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero */}
        <section className="relative isolate overflow-hidden">
          <img
            src={heroBg}
            alt="Doha skyline at sunset"
            width={1920}
            height={1080}
            className="absolute inset-0 -z-10 h-full w-full object-cover"
          />
          <div className="absolute inset-0 -z-10" style={{ background: "var(--gradient-hero-overlay)" }} />
          <div className="mx-auto max-w-7xl px-4 pb-24 pt-40 sm:px-6 sm:pb-32 sm:pt-48 lg:px-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/60 bg-black/20 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-gold backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              {heroEyebrow}
            </span>
            <h1 className="mt-5 max-w-3xl font-display text-4xl font-semibold leading-[1.05] text-white sm:text-5xl lg:text-6xl">
              {heroTitle}
            </h1>
            <p className="mt-4 max-w-2xl text-base text-white/80 sm:text-lg">
              {heroDescription}
            </p>
          </div>
        </section>

        {/* Stats */}
        {c.stats.length > 0 && (
          <section className="border-b border-border bg-secondary/40">
            <div className={`mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:px-8 grid-cols-2 sm:grid-cols-${Math.min(c.stats.length, 4)}`}>
              {c.stats.map((s) => (
                <div key={s.label} className="text-center">
                  <p className="font-display text-3xl font-semibold text-primary sm:text-4xl">
                    <CountUp end={s.value} prefix={s.prefix} suffix={s.suffix} />
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Story */}
        {(c.story.title || c.story.paragraphs.length > 0) && (
          <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                {c.story.eyebrow && <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-gold">{c.story.eyebrow}</p>}
                {c.story.title && <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">{c.story.title}</h2>}
                <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-muted-foreground">
                  {c.story.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
                </div>
              </div>
              <div className="relative">
                <div className="overflow-hidden rounded-3xl border border-border shadow-[var(--shadow-soft)]">
                  <img
                    src={c.story.image || portraitImg}
                    alt="MaisonQatar showroom interior"
                    width={1280}
                    height={896}
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover"
                  />
                </div>
                {(c.story.badge_title || c.story.badge_subtitle) && (
                  <div className="absolute -bottom-6 -left-4 hidden rounded-2xl border border-gold/60 bg-card p-5 shadow-[var(--shadow-soft)] sm:block">
                    {c.story.badge_title && <p className="font-display text-2xl font-semibold text-primary">{c.story.badge_title}</p>}
                    {c.story.badge_subtitle && <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{c.story.badge_subtitle}</p>}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Mission & Vision */}
        {c.mission.items.length > 0 && (
          <section className="relative overflow-hidden bg-[#3d0f1d] py-24 text-white">
            <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:60px_60px]" />
            <div className="pointer-events-none absolute -left-32 top-1/3 h-96 w-96 rounded-full bg-gold/20 blur-[120px]" />
            <div className="pointer-events-none absolute -right-32 -bottom-32 h-[28rem] w-[28rem] rounded-full bg-[#8a1f3a]/60 blur-[140px]" />
            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="max-w-2xl">
                {c.mission.eyebrow && <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-gold">{c.mission.eyebrow}</p>}
                {c.mission.title && <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">{c.mission.title}</h2>}
                {c.mission.description && <p className="mt-4 text-sm leading-relaxed text-white/70">{c.mission.description}</p>}
              </div>
              <div className={`mt-12 grid gap-6 ${({1:"",2:"md:grid-cols-2",3:"sm:grid-cols-2 lg:grid-cols-3",4:"sm:grid-cols-2 lg:grid-cols-4"} as Record<number,string>)[(c.mission as any).columns ?? 2] || "md:grid-cols-2"}`}>
                {c.mission.items.map((item) => (
                  <article key={item.tag} className="group relative overflow-hidden rounded-3xl border border-white/15 bg-white/[0.06] p-8 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1 hover:border-gold/50 hover:bg-white/[0.09] sm:p-10">
                    <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gold/10 blur-3xl" />
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
                    <div className="relative flex items-center gap-3">
                      <span className="grid h-11 w-11 place-items-center rounded-xl bg-gold/15 text-gold ring-1 ring-gold/30 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                        {MISSION_ICONS[item.tag] || <Target className="h-5 w-5" />}
                      </span>
                      <span className="text-[11px] font-medium uppercase tracking-[0.25em] text-gold">{item.tag}</span>
                    </div>
                    <h3 className="relative mt-6 font-display text-2xl font-semibold leading-tight sm:text-[28px]">{item.title}</h3>
                    <p className="relative mt-4 text-sm leading-relaxed text-white/75">{item.body}</p>
                    {item.points.length > 0 && (
                      <ul className="relative mt-6 space-y-2.5 border-t border-white/10 pt-6">
                        {item.points.map((p) => (
                          <li key={p} className="flex items-start gap-3 text-sm text-white/85">
                            <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-gold" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Values */}
        {c.values.items.length > 0 && (
          <section className="bg-secondary/40 py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {c.values.eyebrow && <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-gold">{c.values.eyebrow}</p>}
              {c.values.title && <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">{c.values.title}</h2>}
              <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {c.values.items.map((v) => (
                  <div key={v.title} className="group rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--shadow-soft)]">
                    <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
                      {VALUE_ICONS[v.icon] || <Sparkles className="h-5 w-5" />}
                    </span>
                    <p className="mt-4 font-display text-xl font-semibold text-foreground">{v.title}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{v.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Team */}
        {c.team.members.length > 0 && (
          <section className="relative overflow-hidden bg-[#3d0f1d] py-20 text-white">
            <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(rgba(255,255,255,0.6)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.6)_1px,transparent_1px)] [background-size:60px_60px]" />
            <div className="pointer-events-none absolute -left-32 top-1/3 h-96 w-96 rounded-full bg-gold/20 blur-[120px]" />
            <div className="pointer-events-none absolute -right-32 -bottom-32 h-[28rem] w-[28rem] rounded-full bg-[#8a1f3a]/60 blur-[140px]" />
            <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  {c.team.eyebrow && <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-gold">{c.team.eyebrow}</p>}
                  {c.team.title && <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">{c.team.title}</h2>}
                </div>
                {c.team.description && <p className="max-w-md text-sm text-white/70">{c.team.description}</p>}
              </div>
              <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {c.team.members.map((m) => (
                  <div key={m.name} className="group rounded-2xl border border-white/20 bg-white/10 p-6 text-center backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-gold/60 hover:bg-white/15 hover:shadow-2xl">
                    <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white/15 ring-1 ring-white/25 transition-all duration-300 group-hover:scale-110 group-hover:bg-gold/30 group-hover:ring-gold/60">
                      <Users2 className="h-7 w-7 text-white" />
                    </div>
                    <p className="mt-4 font-display text-lg font-semibold text-white">{m.name}</p>
                    <p className="text-xs uppercase tracking-[0.18em] text-gold">{m.role}</p>
                    <p className="mt-3 text-sm text-white/75">{m.bio}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Company details */}
        {c.company.details.length > 0 && (
          <section className="bg-secondary/40 py-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="grid gap-10 lg:grid-cols-[1fr_1.4fr]">
                <div>
                  {c.company.eyebrow && <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-gold">{c.company.eyebrow}</p>}
                  {c.company.title && <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">{c.company.title}</h2>}
                  {c.company.description && <p className="mt-4 text-sm text-muted-foreground">{c.company.description}</p>}
                </div>
                <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
                  <dl className="grid gap-4 text-sm sm:grid-cols-2">
                    {c.company.details.map((d) => (
                      <div key={d.label}>
                        <dt className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                          <span className="text-primary">{DETAIL_ICONS[d.label] || <Award className="h-4 w-4" />}</span>
                          {d.label}
                        </dt>
                        <dd className="mt-1 font-medium text-foreground">{d.value}</dd>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-6 flex flex-wrap gap-3">
                    {c.company.primary_cta_label && (
                      <Link to="/properties" search={{ status: "rent" }} className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-soft)] transition hover:opacity-95">
                        {c.company.primary_cta_label}
                      </Link>
                    )}
                    {c.company.secondary_cta_label && (
                      <a href={`mailto:${c.company.secondary_cta_email || "hello@maisonqatar.qa"}`} className="inline-flex items-center gap-2 rounded-full border border-primary px-5 py-2.5 text-sm font-medium text-primary transition hover:bg-primary hover:text-primary-foreground">
                        {c.company.secondary_cta_label}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
