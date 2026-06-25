import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Newspaper } from "lucide-react";
import { listPublishedPosts } from "@/lib/posts.functions";

const FALLBACK_TITLES = [
  "Lusail skyline expands with new waterfront towers",
  "Inside The Pearl: a 2026 buyer's guide",
  "Q2 yields hit record highs across West Bay",
  "Interior trends shaping Doha's premium homes",
  "Qatar expands freehold ownership zones",
  "First-time buyer? Start here.",
  "Katara Hills launches signature villa collection",
  "Staging secrets from Qatar's top brokers",
];

type TickerItem = { slug: string | null; title: string };

export function NewsTicker() {
  const { data } = useQuery({
    queryKey: ["public-posts"],
    queryFn: async () => (await listPublishedPosts()) as { posts: any[] },
    staleTime: 60_000,
  });

  const newsItems: TickerItem[] = (data?.posts ?? [])
    .filter((p: any) => p.type === "news")
    .slice(0, 12)
    .map((p: any) => ({ slug: p.slug, title: p.title }));


  const source: TickerItem[] =
    newsItems.length > 0
      ? newsItems
      : FALLBACK_TITLES.map((title) => ({ slug: null, title }));

  const items = [...source, ...source];

  return (
    <section className="relative overflow-hidden bg-[#3d0f1d] text-white">
      <div className="pointer-events-none absolute -left-20 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-gold/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-[#8a1f3a]/60 blur-3xl" />

      <div className="relative flex items-stretch">
        {/* Label — links to all news */}
        <Link
          to="/news"
          className="flex flex-shrink-0 items-center gap-2 border-r border-white/15 bg-white/[0.06] px-3 py-3 backdrop-blur-sm transition-colors hover:bg-white/[0.12] sm:px-6"
        >
          <span className="grid h-7 w-7 place-items-center rounded-full bg-gold/20 text-gold ring-1 ring-gold/40">
            <Newspaper className="h-3.5 w-3.5" />
          </span>
          <span className="hidden text-[11px] font-semibold uppercase tracking-[0.25em] text-gold sm:inline">
            Latest news
          </span>
        </Link>

        {/* Marquee */}
        <div className="group relative flex-1 overflow-hidden">
          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-[#3d0f1d] to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-[#3d0f1d] to-transparent" />

          <div
            className="flex w-max items-center gap-10 py-3 animate-[ticker_40s_linear_infinite] group-hover:[animation-play-state:paused]"
            style={{ animationName: "ticker" }}
          >
            {items.map((item, i) =>
              item.slug ? (
                <Link
                  key={`${item.slug}-${i}`}
                  to="/news/$slug"
                  params={{ slug: item.slug }}
                  className="flex items-center gap-3 whitespace-nowrap text-sm text-white/85 transition-colors hover:text-gold"
                >
                  <span className="h-1.5 w-1.5 flex-none rounded-full bg-gold/70" />
                  {item.title}
                </Link>
              ) : (
                <Link
                  key={`${item.title}-${i}`}
                  to="/news"
                  className="flex items-center gap-3 whitespace-nowrap text-sm text-white/85 transition-colors hover:text-gold"
                >
                  <span className="h-1.5 w-1.5 flex-none rounded-full bg-gold/70" />
                  {item.title}
                </Link>
              ),
            )}
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
