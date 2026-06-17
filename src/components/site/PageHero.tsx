import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import heroImg from "@/assets/hero-qatar.jpg?w=1600&quality=70&format=webp";

export interface Crumb {
  label: string;
  to?: string;
  search?: Record<string, unknown>;
}

export function PageHero({
  title,
  description,
  eyebrow,
  crumbs,
  image,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  crumbs?: Crumb[];
  image?: string;
}) {
  return (
    <section className="relative isolate overflow-hidden">
      <img
        src={image ?? heroImg}
        alt=""
        aria-hidden
        width={1920}
        height={720}
        className="absolute inset-0 -z-10 h-full w-full object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{ background: "var(--gradient-hero-overlay)" }}
      />
      <div className="mx-auto max-w-7xl px-4 pb-12 pt-32 sm:px-6 sm:pb-16 sm:pt-40 lg:px-8">
        {crumbs && crumbs.length > 0 ? (
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-1.5 text-xs text-white/80 sm:text-sm"
          >
            {crumbs.map((c, i) => {
              const isLast = i === crumbs.length - 1;
              return (
                <span key={`${c.label}-${i}`} className="flex items-center gap-1.5">
                  {c.to && !isLast ? (
                    <Link
                      to={c.to as never}
                      search={c.search as never}
                      className="transition-colors hover:text-gold"
                    >
                      {c.label}
                    </Link>
                  ) : (
                    <span className={isLast ? "text-gold" : "text-white/80"}>{c.label}</span>
                  )}
                  {!isLast ? <ChevronRight className="h-3 w-3 text-white/50" /> : null}
                </span>
              );
            })}
          </nav>
        ) : null}

        {eyebrow ? (
          <span className="mt-4 inline-flex items-center gap-2 rounded-full border border-gold/60 bg-black/20 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-gold backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" />
            {eyebrow}
          </span>
        ) : null}

        <h1 className="mt-4 max-w-3xl font-display text-3xl font-semibold leading-[1.05] text-white sm:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-2xl text-sm text-white/85 sm:text-base">{description}</p>
        ) : null}
      </div>
    </section>
  );
}
