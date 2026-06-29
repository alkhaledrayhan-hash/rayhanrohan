import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Calendar, Newspaper, PenLine, Tag as TagIcon } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { PageHero } from "@/components/site/PageHero";
import { usePageHero } from "@/hooks/usePageHero";
import { usePageLayout, columnsToGridClass } from "@/hooks/usePageLayout";
import { Pagination } from "@/components/site/Pagination";
import { listPublishedPosts } from "@/lib/posts.functions";
import { resolveCover } from "@/lib/post-images";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type PostListItem = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  cover_image: string | null;
  type: "blog" | "news";
  published_at: string | null;
  created_at: string;
  category_id: string | null;
  is_featured?: boolean;
  tags: { id: string; name: string; slug: string }[];
};

const postsQuery = queryOptions({
  queryKey: ["public-posts"],
  queryFn: async () => (await listPublishedPosts()) as {
    posts: PostListItem[];
    categories: { id: string; name: string; slug: string }[];
    tags: { id: string; name: string; slug: string }[];
  },
});

export const Route = createFileRoute("/news/")({
  head: () => ({
    meta: [
      { title: "News & Insights — MaisonQatar" },
      { name: "description", content: "Qatar real estate market news, buyer guides, design trends and MaisonQatar updates." },
      { property: "og:title", content: "News & Insights — MaisonQatar" },
      { property: "og:description", content: "Market updates, neighbourhood guides and design stories from Qatar's premium real estate scene." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(postsQuery),
  errorComponent: ({ error }) => {
    console.error(error);
    return (
      <div className="mx-auto max-w-2xl px-6 py-32 text-center">
        <p className="font-display text-2xl">Couldn't load articles.</p>
        <p className="mt-2 text-sm text-muted-foreground">Something went wrong. Please try again.</p>
      </div>
    );
  },
  notFoundComponent: () => <div className="mx-auto max-w-2xl px-6 py-32 text-center">Not found.</div>,
  component: NewsPage,
});

function NewsPage() {
  const { data } = useSuspenseQuery(postsQuery);
  const layout = usePageLayout("news");
  const PAGE_SIZE = layout.pageSize;
  const [tab, setTab] = useState<"all" | "news" | "blog">("all");
  const [activeCat, setActiveCat] = useState<string>("all");
  const [activeTag, setActiveTag] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    return data.posts.filter((p) => {
      if (tab !== "all" && p.type !== tab) return false;
      if (activeCat !== "all" && p.category_id !== activeCat) return false;
      if (activeTag !== "all" && !p.tags.some((t) => t.id === activeTag)) return false;
      return true;
    });
  }, [data.posts, tab, activeCat, activeTag]);

  const featured = filtered.find((p) => p.is_featured) ?? filtered[0];
  const rest = filtered.filter((p) => p.id !== featured?.id);

  const totalPages = Math.max(1, Math.ceil(rest.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageItems = layout.mode === "loadmore"
    ? rest.slice(0, visible)
    : rest.slice(pageStart, pageStart + PAGE_SIZE);
  useEffect(() => { setPage(1); setVisible(PAGE_SIZE); }, [tab, activeCat, activeTag, PAGE_SIZE]);
  const { data: hero } = usePageHero("news");
  const gridClass = columnsToGridClass(layout.columns);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <PageHero
          eyebrow={hero?.eyebrow ?? "News & Insights"}
          title={hero?.title ?? "Stories from Qatar's premium real estate"}
          description={hero?.description ?? "Market reports, neighbourhood guides, design notes and announcements — written by our editorial desk."}
          image={hero?.image || undefined}
        />


        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          {/* Tabs + filters (single row) */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1 shadow-[var(--shadow-soft)]">
                {([
                  { id: "all", label: "All", icon: null },
                  { id: "news", label: "News", icon: Newspaper },
                  { id: "blog", label: "Blog", icon: PenLine },
                ] as const).map(({ id, label, icon: Icon }) => {
                  const active = tab === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setTab(id)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                        active ? "bg-primary text-primary-foreground shadow" : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {Icon && <Icon className="h-3.5 w-3.5" />}
                      {label}
                    </button>
                  );
                })}
              </div>

              {data.categories.length > 0 && (
                <Select value={activeCat} onValueChange={setActiveCat}>
                  <SelectTrigger className="h-9 w-[170px] rounded-full">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {data.categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {data.tags.length > 0 && (
                <Select value={activeTag} onValueChange={setActiveTag}>
                  <SelectTrigger className="h-9 w-[150px] rounded-full">
                    <SelectValue placeholder="All tags" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All tags</SelectItem>
                    {data.tags.map((t) => (
                      <SelectItem key={t.id} value={t.id}>#{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {(activeCat !== "all" || activeTag !== "all") && (
                <button
                  type="button"
                  onClick={() => { setActiveCat("all"); setActiveTag("all"); }}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Clear
                </button>
              )}
            </div>

            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? "article" : "articles"}
            </p>
          </div>


          {/* Featured */}
          {featured && (
            <Link
              to="/news/$slug"
              params={{ slug: featured.slug }}
              className="group mt-10 grid overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 md:grid-cols-2"
            >
              <div className="relative aspect-[16/10] overflow-hidden md:aspect-auto">
                <img
                  src={resolveCover(featured.cover_image, featured.slug)}
                  alt={featured.title}
                  className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground">
                  Featured
                </span>
              </div>
              <div className="flex flex-col justify-center gap-5 p-8 md:p-10">
                <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-gold">
                  <TypeBadge type={featured.type} />
                  {featured.tags.slice(0, 2).map((t) => (
                    <span key={t.id} className="inline-flex items-center gap-1.5 text-muted-foreground">
                      <TagIcon className="h-3 w-3" /> {t.name}
                    </span>
                  ))}
                </div>
                <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">
                  {featured.title}
                </h2>
                {featured.excerpt && (
                  <p className="text-sm text-muted-foreground sm:text-base">{featured.excerpt}</p>
                )}
                <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    {formatDate(featured.published_at || featured.created_at)}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition group-hover:translate-x-0.5">
                  Read story <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          )}

          {/* Grid */}
          {rest.length > 0 && (
            <>
              <div className={`mt-12 grid gap-6 ${gridClass}`}>
                {pageItems.map((a) => (
                  <Link
                    key={a.id}
                    to="/news/$slug"
                    params={{ slug: a.slug }}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:border-primary/30"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={resolveCover(a.cover_image, a.slug)}
                        alt={a.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      />
                      <div className="absolute left-3 top-3">
                        <TypeBadge type={a.type} />
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col gap-3 p-5">
                      <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                        {a.tags[0] && (
                          <span className="inline-flex items-center gap-1.5 text-gold">
                            <TagIcon className="h-3 w-3" /> {a.tags[0].name}
                          </span>
                        )}
                        <span>·</span>
                        <span>{formatDate(a.published_at || a.created_at)}</span>
                      </div>
                      <h3 className="font-display text-lg font-semibold text-foreground transition group-hover:text-primary">
                        {a.title}
                      </h3>
                      {a.excerpt && (
                        <p className="line-clamp-2 text-sm text-muted-foreground">{a.excerpt}</p>
                      )}
                      <div className="mt-auto flex items-center justify-end border-t border-border pt-3 text-xs">
                        <span className="inline-flex items-center gap-1 font-medium text-primary transition group-hover:translate-x-0.5">
                          Read <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              {layout.mode === "loadmore" ? (
                visible < rest.length && (
                  <div className="mt-10 flex justify-center">
                    <button
                      type="button"
                      onClick={() => setVisible((v) => v + PAGE_SIZE)}
                      className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground shadow hover:opacity-95"
                    >
                      {layout.loadMoreLabel}
                    </button>
                  </div>
                )
              ) : (
                <Pagination page={currentPage} totalPages={totalPages} onChange={setPage} />
              )}
            </>
          )}

          {filtered.length === 0 && (
            <div className="mt-12 rounded-2xl border border-dashed border-border bg-secondary/40 p-12 text-center">
              <p className="font-display text-xl text-foreground">No articles yet</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Articles you publish from the admin panel will appear here.
              </p>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

function TypeBadge({ type }: { type: "blog" | "news" }) {
  const isNews = type === "news";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
        isNews ? "bg-primary/90 text-primary-foreground" : "bg-gold/90 text-[oklch(0.25_0.08_60)]"
      }`}
    >
      {isNews ? <Newspaper className="h-3 w-3" /> : <PenLine className="h-3 w-3" />}
      {type}
    </span>
  );
}

function Chip({
  active, onClick, children,
}: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function formatDate(iso: string | null) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric", month: "short", day: "numeric",
    });
  } catch {
    return "";
  }
}
