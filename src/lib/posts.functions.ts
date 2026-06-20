import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ------------ Schemas ------------
const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

const upsertPostSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  title: z.string().trim().min(1).max(200),
  slug: z.string().trim().max(80).optional().nullable(),
  excerpt: z.string().trim().max(500).optional().nullable(),
  content: z.string().max(50_000).default(""),
  cover_image: z.string().trim().max(2000).optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  type: z.enum(["blog", "news"]).default("blog"),
  status: z.enum(["draft", "published"]).default("draft"),
  is_featured: z.boolean().default(false),
  published_at: z.string().optional().nullable(),
  tag_ids: z.array(z.string().uuid()).default([]),
});

const idSchema = z.object({ id: z.string().uuid() });
const slugInputSchema = z.object({ slug: z.string().trim().min(1).max(120) });
const upsertTaxSchema = z.object({
  id: z.string().uuid().optional().nullable(),
  name: z.string().trim().min(1).max(80),
  slug: z.string().trim().max(80).optional().nullable(),
  description: z.string().trim().max(500).optional().nullable(),
});

function pubClient() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data) throw new Error("Forbidden");
}

// ------------ Public reads ------------
export const listPublishedPosts = createServerFn({ method: "GET" }).handler(async () => {
  const sb = pubClient();
  const { data: posts, error } = await sb
    .from("posts")
    .select("id, slug, title, excerpt, cover_image, type, published_at, category_id, created_at")
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);

  const { data: cats } = await sb.from("post_categories").select("id, name, slug");
  const { data: tags } = await sb.from("post_tags").select("id, name, slug");
  const { data: links } = await sb.from("post_tag_links").select("post_id, tag_id");

  const tagById = new Map((tags ?? []).map((t: any) => [t.id, t]));
  const linksByPost = new Map<string, any[]>();
  (links ?? []).forEach((l: any) => {
    const t = tagById.get(l.tag_id);
    if (!t) return;
    const arr = linksByPost.get(l.post_id) ?? [];
    arr.push(t);
    linksByPost.set(l.post_id, arr);
  });

  return {
    posts: (posts ?? []).map((p: any) => ({ ...p, tags: linksByPost.get(p.id) ?? [] })),
    categories: cats ?? [],
    tags: tags ?? [],
  };
});

export const getPublishedPost = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => slugInputSchema.parse(data))
  .handler(async ({ data }) => {
    const sb = pubClient();
    const { data: post, error } = await sb
      .from("posts")
      .select(
        "id, slug, title, excerpt, content, cover_image, type, published_at, created_at, category_id",
      )
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!post) return null;

    const [{ data: cat }, { data: links }] = await Promise.all([
      post.category_id
        ? sb.from("post_categories").select("id, name, slug").eq("id", post.category_id).maybeSingle()
        : Promise.resolve({ data: null }),
      sb.from("post_tag_links").select("tag_id, post_tags(id, name, slug)").eq("post_id", post.id),
    ]);

    return {
      ...post,
      category: cat ?? null,
      tags: (links ?? []).map((l: any) => l.post_tags).filter(Boolean),
    };
  });

// ------------ Admin: posts ------------
export const listAllPostsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("posts")
      .select(
        "id, slug, title, excerpt, cover_image, type, status, published_at, category_id, created_at, updated_at",
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const { data: links } = await context.supabase
      .from("post_tag_links")
      .select("post_id, tag_id");
    const byPost = new Map<string, string[]>();
    (links ?? []).forEach((l: any) => {
      const arr = byPost.get(l.post_id) ?? [];
      arr.push(l.tag_id);
      byPost.set(l.post_id, arr);
    });
    return (data ?? []).map((p: any) => ({ ...p, tag_ids: byPost.get(p.id) ?? [] }));
  });

export const upsertPost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => upsertPostSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const slug = slugify(data.slug || data.title);
    if (!slug) throw new Error("Slug could not be generated");

    const payload: any = {
      title: data.title,
      slug,
      excerpt: data.excerpt || null,
      content: data.content || "",
      cover_image: data.cover_image || null,
      category_id: data.category_id || null,
      type: data.type,
      status: data.status,
      published_at:
        data.status === "published" ? data.published_at || new Date().toISOString() : null,
    };

    let postId = data.id ?? null;
    if (postId) {
      const { error } = await context.supabase.from("posts").update(payload).eq("id", postId);
      if (error) throw new Error(error.message);
    } else {
      payload.author_id = context.userId;
      const { data: ins, error } = await context.supabase
        .from("posts")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      postId = ins.id;
    }

    // Replace tag links
    await context.supabase.from("post_tag_links").delete().eq("post_id", postId);
    if (data.tag_ids.length) {
      const rows = data.tag_ids.map((tid) => ({ post_id: postId, tag_id: tid }));
      const { error: linkErr } = await context.supabase.from("post_tag_links").insert(rows);
      if (linkErr) throw new Error(linkErr.message);
    }

    return { id: postId as string, slug };
  });

export const deletePost = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => idSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("posts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ------------ Admin: categories ------------
export const upsertCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => upsertTaxSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const slug = slugify(data.slug || data.name);
    if (!slug) throw new Error("Slug required");
    const payload = { name: data.name, slug, description: data.description || null };
    if (data.id) {
      const { error } = await context.supabase
        .from("post_categories")
        .update(payload)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: ins, error } = await context.supabase
      .from("post_categories")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: ins.id as string };
  });

export const deleteCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => idSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("post_categories").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ------------ Admin: tags ------------
export const upsertTag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({
      id: z.string().uuid().optional().nullable(),
      name: z.string().trim().min(1).max(60),
      slug: z.string().trim().max(60).optional().nullable(),
    }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const slug = slugify(data.slug || data.name);
    if (!slug) throw new Error("Slug required");
    const payload = { name: data.name, slug };
    if (data.id) {
      const { error } = await context.supabase
        .from("post_tags")
        .update(payload)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
      return { id: data.id };
    }
    const { data: ins, error } = await context.supabase
      .from("post_tags")
      .insert(payload)
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { id: ins.id as string };
  });

export const deleteTag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => idSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("post_tags").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
