import { usePageSections } from "@/lib/page-sections";
import { normalizePartners } from "@/components/admin/PartnersSectionEditor";
import { resolveLogo } from "@/lib/partner-logos";

export function LogoMarquee() {
  const { data: sections } = usePageSections("home");
  const config = normalizePartners(sections?.partners);
  if (config.items.length === 0) return null;

  const row = [...config.items, ...config.items];
  const duration = `${Math.max(8, config.scroll.speed)}s`;

  return (
    <section className="relative isolate overflow-hidden py-20">
      <div aria-hidden className="absolute inset-0 -z-10" style={{ background: "#6B1220" }} />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-[480px] w-[900px] -translate-x-1/2 rounded-full opacity-50 blur-3xl"
        style={{ background: "radial-gradient(circle, oklch(0.85 0.16 85 / 0.45), transparent 65%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-32 -z-10 h-[420px] w-[420px] rounded-full opacity-40 blur-3xl"
        style={{ background: "radial-gradient(circle, oklch(0.55 0.18 22 / 0.6), transparent 70%)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.95 0.05 85) 1px, transparent 1px), linear-gradient(90deg, oklch(0.95 0.05 85) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-3">
          {config.eyebrow && (
            <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-gold">
              <span className="h-px w-6 bg-gold/60" />
              {config.eyebrow}
              <span className="h-px w-6 bg-gold/60" />
            </span>
          )}
          {config.title && <p className="text-center text-sm text-white/70">{config.title}</p>}
          {config.subtitle && <p className="text-center text-xs text-white/50">{config.subtitle}</p>}
        </div>
      </div>

      <div className="relative mt-12">
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32" style={{ background: "linear-gradient(to right, #6B1220, transparent)" }} />
        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32" style={{ background: "linear-gradient(to left, #6B1220, transparent)" }} />

        <div
          className={config.scroll.enabled ? "logo-marquee flex w-max items-center gap-10 px-8" : "flex flex-wrap items-center justify-center gap-10 px-8"}
          style={config.scroll.enabled ? ({ animationDuration: duration } as any) : undefined}
        >
          {(config.scroll.enabled ? row : config.items).map((logo, i) => (
            <div
              key={i}
              className="flex h-24 w-52 shrink-0 items-center justify-center rounded-xl border border-white/25 bg-white/15 px-6 py-4 shadow-[0_8px_30px_rgba(0,0,0,0.25)] backdrop-blur-xl backdrop-saturate-150 transition duration-300 hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/25"
            >
              <img
                src={resolveLogo(logo.logo_url, logo.name)}
                alt={logo.name}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-contain brightness-0 invert"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
