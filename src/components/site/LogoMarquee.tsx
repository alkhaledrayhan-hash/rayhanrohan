const LOGOS = [
  "QATAR AIRWAYS",
  "QATARENERGY",
  "OOREDOO",
  "QNB",
  "MSHEIREB",
  "KATARA",
  "QATAR MUSEUMS",
  "QATAR INVESTMENT",
];

export function LogoMarquee() {
  // duplicate for seamless loop
  const row = [...LOGOS, ...LOGOS];
  return (
    <section className="relative overflow-hidden border-y border-border bg-background py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-[11px] font-medium uppercase tracking-[0.3em] text-muted-foreground">
          Trusted by Qatar's most discerning brands
        </p>
      </div>

      <div className="relative mt-8">
        {/* edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent" />

        <div className="logo-marquee flex w-max gap-16 px-8">
          {row.map((name, i) => (
            <span
              key={i}
              className="flex h-10 shrink-0 items-center whitespace-nowrap font-display text-lg font-semibold uppercase tracking-[0.25em] text-foreground/40 transition-colors hover:text-primary"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
