import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Newspaper } from "lucide-react";
import { listPublishedPosts } from "@/lib/posts.functions";
import { useTickerConfig } from "@/hooks/useTickerConfig";

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

type TickerItem = { slug: string | null; href: string | null; title: string };

export function NewsTicker() {
  const config = useTickerConfig();
  const style = config.style;

  const { data } = useQuery({
    queryKey: ["public-posts"],
    queryFn: async () => (await listPublishedPosts()) as { posts: any[] },
    staleTime: 60_000,
    enabled: !config.items.length,
  });

  if (!config.enabled) return null;

  const manualItems: TickerItem[] = (config.items || [])
    .filter((i) => i?.title?.trim())
    .map((i) => ({ slug: null, href: i.link?.trim() || null, title: i.title }));

  const postItems: TickerItem[] = (data?.posts ?? [])
    .filter((p: any) => p.type === "news")
    .slice(0, 12)
    .map((p: any) => ({ slug: p.slug, href: null, title: p.title }));

  const source: TickerItem[] =
    manualItems.length > 0
      ? manualItems
      : postItems.length > 0
        ? postItems
        : FALLBACK_TITLES.map((title) => ({ slug: null, href: null, title }));

  const threshold = Math.max(1, config.scrollThreshold || 3);
  const shouldScroll = source.length > threshold;
  const items = shouldScroll ? [...source, ...source] : source;
  const duration = Math.max(5, Math.min(180, Number(config.speed) || 40));

  const textSizeCls =
    style.text_size === "lg" ? "text-base" : style.text_size === "sm" ? "text-sm" : "text-[15px]";

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: `linear-gradient(90deg, ${style.bg_from} 0%, ${style.bg_to} 100%)`,
        color: style.text_color,
        marginTop: `${style.margin_top}px`,
        marginBottom: `${style.margin_bottom}px`,
      }}
    >
      <div
        className="pointer-events-none absolute -left-20 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full blur-3xl"
        style={{ background: `${style.accent_color}26` }}
      />
      <div
        className="pointer-events-none absolute -right-20 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full blur-3xl"
        style={{ background: `${style.bg_to}99` }}
      />

      <div className="relative flex items-stretch">
        {style.show_label && (
          <Link
            to="/news"
            className="flex flex-shrink-0 items-center gap-2 border-r border-white/15 backdrop-blur-sm transition-colors hover:brightness-110 sm:px-6"
            style={{
              background: style.label_bg,
              paddingTop: `${style.padding_y}px`,
              paddingBottom: `${style.padding_y}px`,
              paddingLeft: `${Math.max(12, style.padding_x * 0.75)}px`,
              paddingRight: `${Math.max(12, style.padding_x * 0.75)}px`,
            }}
          >
            <span
              className="grid h-7 w-7 place-items-center rounded-full ring-1"
              style={{
                background: `${style.accent_color}33`,
                color: style.accent_color,
                boxShadow: `inset 0 0 0 1px ${style.accent_color}66`,
              }}
            >
              <Newspaper className="h-3.5 w-3.5" />
            </span>
            <span
              className="hidden text-[11px] font-semibold uppercase tracking-[0.25em] sm:inline"
              style={{ color: style.accent_color }}
            >
              {style.label_text}
            </span>
          </Link>
        )}

        <div className="group relative flex-1 overflow-hidden">
          {shouldScroll && (
            <>
              <div
                className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12"
                style={{ background: `linear-gradient(to right, ${style.bg_from}, transparent)` }}
              />
              <div
                className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12"
                style={{ background: `linear-gradient(to left, ${style.bg_to}, transparent)` }}
              />
            </>
          )}

          <div
            className={`flex items-center ${
              shouldScroll
                ? "w-max group-hover:[animation-play-state:paused]"
                : "flex-wrap justify-start"
            }`}
            style={{
              gap: `${style.item_gap}px`,
              paddingTop: `${style.padding_y}px`,
              paddingBottom: `${style.padding_y}px`,
              paddingLeft: shouldScroll ? 0 : `${style.padding_x}px`,
              paddingRight: shouldScroll ? 0 : `${style.padding_x}px`,
              animation: shouldScroll ? `ticker ${duration}s linear infinite` : undefined,
            }}
          >
            {items.map((item, i) => {
              const content = (
                <>
                  <span
                    className="h-1.5 w-1.5 flex-none rounded-full"
                    style={{ background: `${style.accent_color}b3` }}
                  />
                  <span className={shouldScroll ? "whitespace-nowrap" : ""}>{item.title}</span>
                </>
              );
              const cls = `flex items-center gap-3 ${textSizeCls} transition-colors hover:opacity-80`;
              const inline = { color: style.text_color };
              if (item.slug) {
                return (
                  <Link key={`s-${item.slug}-${i}`} to="/news/$slug" params={{ slug: item.slug }} className={cls} style={inline}>
                    {content}
                  </Link>
                );
              }
              if (item.href) {
                const external = /^https?:\/\//i.test(item.href);
                return external ? (
                  <a key={`h-${i}`} href={item.href} target="_blank" rel="noopener noreferrer" className={cls} style={inline}>
                    {content}
                  </a>
                ) : (
                  <Link key={`h-${i}`} to={item.href as never} className={cls} style={inline}>
                    {content}
                  </Link>
                );
              }
              return (
                <Link key={`t-${i}`} to="/news" className={cls} style={inline}>
                  {content}
                </Link>
              );
            })}
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
