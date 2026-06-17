import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Calendar, Clock, Newspaper, PenLine, Tag, User } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { ARTICLES, getArticle, type Article, type Category } from "@/lib/articles";

export const Route = createFileRoute("/news/$slug")({
  loader: ({ params }) => {
    const article = getArticle(params.slug);
    if (!article) throw notFound();
    return { article };
  },
  head: ({ loaderData }) => {
    const a = loaderData?.article;
    if (!a) return { meta: [{ title: "Article — MaisonQatar" }] };
    return {
      meta: [
        { title: `${a.title} — MaisonQatar` },
        { name: "description", content: a.excerpt },
        { property: "og:title", content: a.title },
        { property: "og:description", content: a.excerpt },
        { property: "og:image", content: a.image },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: a.image },
      ],
    };
  },
  notFoundComponent: ArticleNotFound,
  errorComponent: ({ reset }) => (
    <div className="mx-auto max-w-2xl px-6 py-32 text-center">
      <p className="font-display text-2xl">Something went wrong loading this article.</p>
      <button onClick={reset} className="mt-6 rounded-full bg-primary px-5 py-2 text-sm text-primary-foreground">
        Try again
      </button>
    </div>
  ),
  component: ArticleDetail,
});

function ArticleDetail() {
  const { article } = Route.useLoaderData();
  const related = ARTICLES.filter(
    (a) => a.id !== article.id && a.category === article.category,
  ).slice(0, 3);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* Hero image */}
        <div className="relative isolate">
          <div className="relative h-[55vh] min-h-[420px] w-full overflow-hidden">
            <img
              src={article.image}
              alt={article.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/40 to-black/85" />
            <div className="relative mx-auto flex h-full max-w-4xl flex-col justify-end px-4 pb-12 sm:px-6 lg:px-8">
              <Link
                to="/news"
                className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur transition hover:bg-white/20"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to News
              </Link>
              <div className="mt-5 flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.25em] text-gold">
                <CategoryBadge category={article.category} />
                <span className="inline-flex items-center gap-1.5 text-white/80">
                  <Tag className="h-3 w-3" /> {article.tag}
                </span>
              </div>
              <h1 className="mt-4 max-w-3xl font-display text-3xl font-semibold leading-[1.1] text-white sm:text-4xl lg:text-5xl">
                {article.title}
              </h1>
              <div className="mt-5 flex flex-wrap items-center gap-5 text-sm text-white/80">
                <span className="inline-flex items-center gap-1.5">
                  <User className="h-4 w-4 text-gold" /> {article.author}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-gold" /> {article.date}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-gold" /> {article.readTime}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="font-display text-xl leading-relaxed text-foreground sm:text-2xl">
            {article.excerpt}
          </p>
          <div className="mt-8 space-y-6 text-[15px] leading-[1.8] text-muted-foreground sm:text-base">
            {article.body.map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          {/* Author card */}
          <div className="mt-12 flex items-center gap-4 rounded-2xl border border-border bg-secondary/40 p-5">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Written by</p>
              <p className="font-display text-lg font-semibold text-foreground">{article.author}</p>
            </div>
          </div>
        </article>

        {/* Related */}
        {related.length > 0 && (
          <section className="border-t border-border bg-secondary/40 py-16">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-gold">
                    Keep reading
                  </p>
                  <h2 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">
                    More from {article.category}
                  </h2>
                </div>
                <Link
                  to="/news"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  All articles <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-8 grid gap-6 md:grid-cols-3">
                {related.map((a) => (
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
                        className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-5">
                      <span className="text-[11px] uppercase tracking-[0.2em] text-gold">{a.tag}</span>
                      <h3 className="font-display text-base font-semibold text-foreground transition group-hover:text-primary">
                        {a.title}
                      </h3>
                      <p className="line-clamp-2 text-sm text-muted-foreground">{a.excerpt}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}

function ArticleNotFound() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-2xl px-6 py-32 text-center">
        <p className="text-[11px] uppercase tracking-[0.25em] text-gold">404</p>
        <h1 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">Article not found</h1>
        <p className="mt-4 text-muted-foreground">
          The story you're looking for may have moved or been retired.
        </p>
        <Link
          to="/news"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to News
        </Link>
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

// Keep Article type referenced for the loader's typing
export type { Article };
