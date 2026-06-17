import { Link } from "@tanstack/react-router";
import { Newspaper } from "lucide-react";

const NEWS_TITLES = [
  "Lusail skyline expands with new waterfront towers",
  "Inside The Pearl: a 2026 buyer's guide",
  "Q2 yields hit record highs across West Bay",
  "Interior trends shaping Doha's premium homes",
  "Qatar expands freehold ownership zones",
  "First-time buyer? Start here.",
  "Katara Hills launches signature villa collection",
  "Staging secrets from Qatar's top brokers",
];

export function NewsTicker() {
  // Duplicate the list so the marquee loops seamlessly.
  const items = [...NEWS_TITLES, ...NEWS_TITLES];

  return (
    <section className="relative overflow-hidden bg-[#3d0f1d] text-white">
      <div className="pointer-events-none absolute -left-20 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-gold/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-[#8a1f3a]/60 blur-3xl" />

      <div className="relative flex items-stretch">
        {/* Label */}
        <div className="flex flex-shrink-0 items-center gap-2 border-r border-white/15 bg-white/[0.06] px-5 py-3 backdrop-blur-sm sm:px-6">
          <span className="grid h-7 w-7 place-items-center rounded-full bg-gold/20 text-gold ring-1 ring-gold/40">
            <Newspaper className="h-3.5 w-3.5" />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">
            Latest news
          </span>
        </div>

        {/* Marquee */}
        <div className="group relative flex-1 overflow-hidden">
          {/* Edge fades */}
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[#3d0f1d] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[#3d0f1d] to-transparent" />

          <div
            className="flex w-max items-center gap-10 py-3 animate-[ticker_40s_linear_infinite] group-hover:[animation-play-state:paused]"
            style={{ animationName: "ticker" }}
          >
            {items.map((title, i) => (
              <Link
                key={`${title}-${i}`}
                to="/news"
                className="flex items-center gap-3 whitespace-nowrap text-sm text-white/85 transition-colors hover:text-gold"
              >
                <span className="h-1.5 w-1.5 flex-none rounded-full bg-gold/70" />
                {title}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}
