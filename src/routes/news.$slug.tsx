import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Calendar, Newspaper, PenLine, Tag as TagIcon } from "lucide-react";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { getPublishedPost } from "@/lib/posts.functions";
import { resolveCover } from "@/lib/post-images";

type FullPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  type: "blog" | "news";
  published_at: string | null;
  created_at: string;
  category: { id: string; name: string; slug: string } | null;
  tags: { id: string; name: string; slug: string }[];
} | null;

const postQuery = (slug: string) =>
  queryOptions({
    queryKey: ["public-post", slug],
    queryFn: async () => (await getPublishedPost({ data: { slug } })) as FullPost,
  });

export const Route = createFileRoute("/news/$slug")({
  loader: async ({ params, context }) => {
    const post = await context.queryClient.ensureQueryData(postQuery(params.slug));
    if (!post) throw notFound();
    return null;
  },
  head: ({ params }) => ({
    meta: [{ title: `Article — MaisonQatar` }],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-2xl px-6 py-32 text-center">
        <p className="font-display text-2xl">Article not found.</p>
        <Link to="/news" className="mt-6 inline-flex items-center gap-1.5 text-sm text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to all articles
        </Link>
      </div>
      <Footer />
    </div>
  ),
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-2xl px-6 py-32 text-center">
      <p className="font-display text-2xl">Something went wrong loading this article.</p>
      <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
    </div>
  ),
  component: ArticleDetail,
});

function ArticleDetail() {
  const { slug } = Route.useParams();
  const { data: post } = useSuspenseQuery(postQuery(slug));
  if (!post) return null;

  const paragraphs = post.content.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <div className="relative isolate">
          <div className="relative h-[55vh] min-h-[420px] w-full overflow-hidden">
            {post.cover_image ? (
              <img src={post.cover_image} alt={post.title} className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-muted" />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/40 to-black/85" />
            <div className="relative mx-auto flex h-full max-w-4xl flex-col justify-end px-4 pb-12 sm:px-6 lg:px-8">
              <Link to="/news" className="mb-6 inline-flex w-fit items-center gap-1.5 text-xs text-white/80 hover:text-white">
                <ArrowLeft className="h-3.5 w-3.5" /> All articles
              </Link>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-foreground">
                  {post.type === "news" ? <Newspaper className="h-3 w-3" /> : <PenLine className="h-3 w-3" />}
                  {post.type}
                </span>
                {post.category && (
                  <span className="rounded-full bg-white/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
                    {post.category.name}
                  </span>
                )}
              </div>
              <h1 className="mt-4 font-display text-3xl font-semibold leading-tight text-white sm:text-5xl">
                {post.title}
              </h1>
              {post.excerpt && <p className="mt-4 max-w-2xl text-sm text-white/85 sm:text-base">{post.excerpt}</p>}
              <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-white/80">
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(post.published_at || post.created_at)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="prose prose-neutral max-w-none space-y-5 text-base leading-relaxed text-foreground">
            {paragraphs.map((p, i) => (
              <p key={i} className="whitespace-pre-wrap">{p}</p>
            ))}
            {paragraphs.length === 0 && (
              <p className="text-muted-foreground">No content yet.</p>
            )}
          </div>

          {post.tags.length > 0 && (
            <div className="mt-12 flex flex-wrap items-center gap-2 border-t border-border pt-8">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Tags</span>
              {post.tags.map((t) => (
                <span
                  key={t.id}
                  className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
                >
                  <TagIcon className="h-3 w-3" /> {t.name}
                </span>
              ))}
            </div>
          )}
        </article>
      </main>
      <Footer />
    </div>
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
