import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, Calendar, Clock, Newspaper, PenLine, Tag } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { PageHero } from "@/components/site/PageHero";
import { ARTICLES, type Category } from "@/lib/articles";

const FILTERS: Category[] = ["News", "Blog"];

export const Route = createFileRoute("/news")({
  head: () => ({
    meta: [
      { title: "News & Insights — MaisonQatar" },
      {
        name: "description",
        content:
          "Qatar real estate market news, buyer guides, design trends and MaisonQatar updates — curated by our editorial desk.",
      },
      { property: "og:title", content: "News & Insights — MaisonQatar" },
      {
        property: "og:description",
        content:
          "Market updates, neighbourhood guides and design stories from Qatar's premium real estate scene.",
      },
    ],
  }),
  component: NewsPage,
});

function NewsPage() {
  const [filter, setFilter] = useState<Category>("News");

  const filtered = useMemo(
    () => ARTICLES.filter((a) => a.category === filter),
    [filter],
  );

  const featured = filtered[0];
  const rest = filtered.slice(1);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <PageHero
          eyebrow="News & Insights"
          title="Stories from Qatar's premium real estate"
          description="Market reports, neighbourhood guides, design notes and announcements — written by our editorial desk."
        />

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          {/* Filter tabs */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1 shadow-[var(--shadow-soft)]">
              {FILTERS.map((f) => {
                const active = filter === f;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                      active
                        ? "bg-primary text-primary-foreground shadow"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f === "News" && <Newspaper className="h-3.5 w-3.5" />}
                    {f === "Blog" && <PenLine className="h-3.5 w-3.5" />}
                    {f}
                  </button>
                );
              })}
            </div>
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? "article" : "articles"}
            </p>
          </div>

          {/* Featured article */}
          {featured && (
            <Link
              to="/news/$slug"
              params={{ slug: featured.id }}
              className="group mt-10 grid overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)] md:grid-cols-2"
            >
              <div className="relative aspect-[16/10] overflow-hidden md:aspect-auto">
                <img
                  src={featured.image}
                  alt={featured.title}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground">
                  Featured
                </span>
              </div>
              <div className="flex flex-col justify-center gap-5 p-8 md:p-10">
                <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-gold">
                  <CategoryBadge category={featured.category} />
                  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                    <Tag className="h-3 w-3" /> {featured.tag}
                  </span>
                </div>
                <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
                  {featured.title}
                </h2>
                <p className="text-sm text-muted-foreground sm:text-base">{featured.excerpt}</p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-primary" /> {featured.date}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-primary" /> {featured.readTime}
                  </span>
                  <span>by {featured.author}</span>
                </div>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition group-hover:translate-x-0.5">
                  Read story <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          )}

          {/* Grid */}
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {rest.map((a) => (
              <Link
                key={a.id}
                to="/news/$slug"
                params={{ slug: a.id }}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-[var(--shadow-soft)]"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={a.image}
                    alt={a.title}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <div className="absolute left-3 top-3">
                    <CategoryBadge category={a.category} />
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5 text-gold">
                      <Tag className="h-3 w-3" /> {a.tag}
                    </span>
                    <span>·</span>
                    <span>{a.date}</span>
                  </div>
                  <h3 className="font-display text-lg font-semibold text-foreground transition group-hover:text-primary">
                    {a.title}
                  </h3>
                  <p className="line-clamp-2 text-sm text-muted-foreground">{a.excerpt}</p>
                  <div className="mt-auto flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-primary" /> {a.readTime}
                    </span>
                    <span className="inline-flex items-center gap-1 font-medium text-primary transition group-hover:translate-x-0.5">
                      Read <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="mt-12 rounded-2xl border border-dashed border-border bg-secondary/40 p-12 text-center">
              <p className="font-display text-xl text-foreground">No articles yet</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Try switching the filter — more stories are on the way.
              </p>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

function CategoryBadge({ category }: { category: Category }) {
  const isNews = category === "News";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
        isNews
          ? "bg-primary/90 text-primary-foreground"
          : "bg-gold/90 text-[oklch(0.25_0.08_60)]"
      }`}
    >
      {isNews ? <Newspaper className="h-3 w-3" /> : <PenLine className="h-3 w-3" />}
      {category}
    </span>
  );
}
