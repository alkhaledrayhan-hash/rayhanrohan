import logo1 from "@/assets/logo-1.png";
import logo2 from "@/assets/logo-2.png";
import logo3 from "@/assets/logo-3.png";
import logo4 from "@/assets/logo-4.png";
import logo5 from "@/assets/logo-5.png";
import logo6 from "@/assets/logo-6.png";

const LOGOS = [
  { src: logo1, alt: "Aurelia" },
  { src: logo2, alt: "Meridian Group" },
  { src: logo3, alt: "Nordhaus" },
  { src: logo4, alt: "Atlas Capital" },
  { src: logo5, alt: "Seraphine" },
  { src: logo6, alt: "Kairos & Co" },
];

export function LogoMarquee() {
  const row = [...LOGOS, ...LOGOS];
  return (
    <section className="relative overflow-hidden py-20">
      {/* Layered gradient backdrop */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.22 0.09 22) 0%, oklch(0.30 0.12 25) 45%, oklch(0.40 0.14 60) 100%)",
        }}
      />
      {/* Gold radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 -z-10 h-[480px] w-[900px] -translate-x-1/2 rounded-full opacity-50 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.85 0.16 85 / 0.45), transparent 65%)",
        }}
      />
      {/* Maroon corner glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-32 -z-10 h-[420px] w-[420px] rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.55 0.18 22 / 0.6), transparent 70%)",
        }}
      />
      {/* Subtle grid texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.95 0.05 85) 1px, transparent 1px), linear-gradient(90deg, oklch(0.95 0.05 85) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-3">
          <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-gold">
            <span className="h-px w-6 bg-gold/60" />
            Our partners
            <span className="h-px w-6 bg-gold/60" />
          </span>
          <p className="text-center text-sm text-white/70">
            Trusted by Qatar's most discerning brands
          </p>
        </div>
      </div>

      <div className="relative mt-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32"
          style={{ background: "linear-gradient(to right, oklch(0.24 0.10 22), transparent)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32"
          style={{ background: "linear-gradient(to left, oklch(0.36 0.13 45), transparent)" }}
        />

        <div className="logo-marquee flex w-max items-center gap-20 px-8">
          {row.map((logo, i) => (
            <img
              key={i}
              src={logo.src}
              alt={logo.alt}
              loading="lazy"
              decoding="async"
              className="h-16 w-auto shrink-0 object-contain opacity-70 brightness-0 invert transition duration-300 hover:opacity-100 md:h-20"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
