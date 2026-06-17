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
    <section className="relative overflow-hidden py-16">
      {/* Soft warm-ivory backdrop */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(180deg, oklch(0.96 0.02 80) 0%, oklch(0.99 0.008 85) 50%, oklch(0.96 0.02 80) 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-px bg-gradient-to-r from-transparent via-gold/40 to-transparent"
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-2">
          <span className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-gold">
            <span className="h-px w-6 bg-gold/60" />
            Our partners
            <span className="h-px w-6 bg-gold/60" />
          </span>
          <p className="text-center text-sm text-muted-foreground">
            Trusted by Qatar's most discerning brands
          </p>
        </div>
      </div>

      <div className="relative mt-10">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-[oklch(0.96_0.02_80)] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-[oklch(0.96_0.02_80)] to-transparent" />

        <div className="logo-marquee flex w-max items-center gap-20 px-8">
          {row.map((logo, i) => (
            <img
              key={i}
              src={logo.src}
              alt={logo.alt}
              loading="lazy"
              decoding="async"
              className="h-16 w-auto shrink-0 object-contain opacity-60 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0 md:h-20"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
