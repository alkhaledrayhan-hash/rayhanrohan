import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, X, Tag as TagIcon, FolderTree, Search,
  Newspaper, PenLine, Save, Loader2, Eye, FileText,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  listAllPostsAdmin, upsertPost, deletePost,
  upsertCategory, deleteCategory,
  upsertTag, deleteTag,
} from "@/lib/posts.functions";

type Category = { id: string; name: string; slug: string; description: string | null };
type Tag = { id: string; name: string; slug: string };
type Post = {
  id: string; slug: string; title: string; excerpt: string | null;
  cover_image: string | null; type: "blog" | "news"; status: "draft" | "published";
  published_at: string | null; category_id: string | null; tag_ids: string[];
  is_featured?: boolean;
  content?: string; created_at: string;
};

const empty: Partial<Post> = {
  title: "", slug: "", excerpt: "", content: "", cover_image: "",
  type: "blog", status: "draft", category_id: null, tag_ids: [], is_featured: false,
};

export function PostsManager() {
  const qc = useQueryClient();
  const listFn = useServerFn(listAllPostsAdmin);
  const saveFn = useServerFn(upsertPost);
  const deleteFn = useServerFn(deletePost);
  const saveCatFn = useServerFn(upsertCategory);
  const delCatFn = useServerFn(deleteCategory);
  const saveTagFn = useServerFn(upsertTag);
  const delTagFn = useServerFn(deleteTag);

  const [tab, setTab] = useState<"news" | "blogs" | "categories" | "tags">("news");
  const [editing, setEditing] = useState<Partial<Post> | null>(null);
  const [search, setSearch] = useState("");
  const [fStatus, setFStatus] = useState<"all" | "draft" | "published">("all");
  const [fCategory, setFCategory] = useState<string>("all");
  const currentType: "news" | "blog" = tab === "blogs" ? "blog" : "news";

  const postsQ = useQuery({
    queryKey: ["admin-posts"],
    queryFn: async () => (await listFn()) as Post[],
  });
  const catsQ = useQuery({
    queryKey: ["post-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("post_categories" as any)
        .select("id, name, slug, description")
        .order("name");
      if (error) throw error;
      return ((data ?? []) as unknown) as Category[];
    },
  });
  const tagsQ = useQuery({
    queryKey: ["post-tags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("post_tags" as any)
        .select("id, name, slug")
        .order("name");
      if (error) throw error;
      return ((data ?? []) as unknown) as Tag[];
    },
  });

  const save = useMutation({
    mutationFn: async (p: Partial<Post>) =>
      saveFn({
        data: {
          id: p.id ?? null,
          title: p.title || "",
          slug: p.slug || "",
          excerpt: p.excerpt || "",
          content: p.content || "",
          cover_image: p.cover_image || "",
          category_id: p.category_id || null,
          type: (p.type as any) || "blog",
          status: (p.status as any) || "draft",
          is_featured: !!p.is_featured,
          published_at: p.published_at || null,
          tag_ids: p.tag_ids || [],
        },
      }),
    onSuccess: () => {
      toast.success("Saved");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin-posts"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Deleted");
      qc.invalidateQueries({ queryKey: ["admin-posts"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const posts = postsQ.data ?? [];
  const cats = catsQ.data ?? [];
  const tags = tagsQ.data ?? [];
  const catName = (id: string | null) => cats.find((c) => c.id === id)?.name ?? "—";

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts.filter((p) => {
      if (p.type !== currentType) return false;
      if (fStatus !== "all" && p.status !== fStatus) return false;
      if (fCategory !== "all" && p.category_id !== fCategory) return false;
      if (q && ![p.title, p.slug, p.excerpt || ""].some((v) => v.toLowerCase().includes(q)))
        return false;
      return true;
    });
  }, [posts, search, currentType, fStatus, fCategory]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-border">
        <TabBtn active={tab === "news"} onClick={() => setTab("news")} icon={Newspaper}>
          News
        </TabBtn>
        <TabBtn active={tab === "blogs"} onClick={() => setTab("blogs")} icon={PenLine}>
          Blogs
        </TabBtn>
        <TabBtn active={tab === "categories"} onClick={() => setTab("categories")} icon={FolderTree}>
          Categories
        </TabBtn>
        <TabBtn active={tab === "tags"} onClick={() => setTab("tags")} icon={TagIcon}>
          Tags
        </TabBtn>
      </div>

      {(tab === "news" || tab === "blogs") && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {currentType === "news"
                ? "Write & manage news articles. They appear under the News tab on the website."
                : "Write & manage blog posts. They appear under the Blog tab on the website."}
            </p>
            <button
              onClick={() => setEditing({ ...empty, type: currentType })}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Add {currentType === "news" ? "news" : "blog"}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2 rounded-2xl border border-border bg-white p-3 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title, slug, excerpt…"
                className="w-full rounded-md border border-input bg-background pl-8 pr-3 py-2 text-sm"
              />
            </div>
            <select value={fStatus} onChange={(e) => setFStatus(e.target.value as "all" | "draft" | "published")} className={inputCls}>
              <option value="all">All status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
            <select
              value={fCategory}
              onChange={(e) => setFCategory(e.target.value)}
              className={`${inputCls} lg:col-span-4`}
            >
              <option value="all">All categories</option>
              {cats.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3">Title</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Published</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {postsQ.isLoading && (
                    <tr><td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">Loading…</td></tr>
                  )}
                  {!postsQ.isLoading && filtered.length === 0 && (
                    <tr><td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">
                      {posts.length === 0 ? "No posts yet — click Add post." : "No posts match these filters."}
                    </td></tr>
                  )}
                  {filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-muted/30">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{p.title}</p>
                          {p.is_featured && (
                            <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold">
                              Featured
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground">/{p.slug}</p>
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                          {p.type === "news" ? <Newspaper className="h-3 w-3" /> : <PenLine className="h-3 w-3" />}
                          {p.type}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">{catName(p.category_id)}</td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          p.status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                        }`}>{p.status}</span>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground">
                        {p.published_at ? new Date(p.published_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {p.status === "published" && (
                            <a
                              href={`/news/${p.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="View"
                              className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                              <Eye className="h-4 w-4" />
                            </a>
                          )}
                          <button
                            onClick={() => setEditing(p)}
                            title="Edit"
                            className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => { if (confirm("Delete this post?")) remove.mutate(p.id); }}
                            title="Delete"
                            className="rounded p-1.5 text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {tab === "categories" && (
        <TaxonomyManager
          title="Categories"
          items={cats}
          onSave={async (v) => {
            await saveCatFn({ data: v });
            toast.success("Saved");
            qc.invalidateQueries({ queryKey: ["post-categories"] });
          }}
          onDelete={async (id) => {
            await delCatFn({ data: { id } });
            toast.success("Deleted");
            qc.invalidateQueries({ queryKey: ["post-categories"] });
            qc.invalidateQueries({ queryKey: ["admin-posts"] });
          }}
          withDescription
        />
      )}

      {tab === "tags" && (
        <TaxonomyManager
          title="Tags"
          items={tags}
          onSave={async (v) => {
            await saveTagFn({ data: { id: v.id, name: v.name, slug: v.slug } });
            toast.success("Saved");
            qc.invalidateQueries({ queryKey: ["post-tags"] });
          }}
          onDelete={async (id) => {
            await delTagFn({ data: { id } });
            toast.success("Deleted");
            qc.invalidateQueries({ queryKey: ["post-tags"] });
            qc.invalidateQueries({ queryKey: ["admin-posts"] });
          }}
        />
      )}

      {editing && (
        <PostEditor
          value={editing}
          onChange={setEditing}
          categories={cats}
          tags={tags}
          onClose={() => setEditing(null)}
          onSave={() => save.mutate(editing)}
          saving={save.isPending}
        />
      )}
    </div>
  );
}

function PostEditor({
  value, onChange, categories, tags, onClose, onSave, saving,
}: {
  value: Partial<Post>;
  onChange: (v: Partial<Post>) => void;
  categories: Category[];
  tags: Tag[];
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  const selectedTagIds = value.tag_ids || [];
  const toggleTag = (id: string) => {
    const next = selectedTagIds.includes(id)
      ? selectedTagIds.filter((x) => x !== id)
      : [...selectedTagIds, id];
    onChange({ ...value, tag_ids: next });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h3 className="font-display text-lg font-semibold">
            {value.id ? "Edit post" : "New post"}
          </h3>
          <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); onSave(); }}
          className="grid flex-1 grid-cols-2 gap-4 overflow-y-auto px-6 py-5 text-sm"
        >
          <Field label="Title" className="col-span-2">
            <input
              required maxLength={200}
              value={value.title || ""}
              onChange={(e) => onChange({ ...value, title: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Slug (URL)" hint="Auto-generated from title if left empty">
            <input
              maxLength={80}
              value={value.slug || ""}
              onChange={(e) => onChange({ ...value, slug: e.target.value })}
              placeholder="my-post-slug"
              className={inputCls}
            />
          </Field>
          <Field label="Type">
            <select
              value={value.type || "blog"}
              onChange={(e) => onChange({ ...value, type: e.target.value as any })}
              className={inputCls}
            >
              <option value="blog">Blog</option>
              <option value="news">News</option>
            </select>
          </Field>
          <Field label="Category">
            <select
              value={value.category_id || ""}
              onChange={(e) => onChange({ ...value, category_id: e.target.value || null })}
              className={inputCls}
            >
              <option value="">— None —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              value={value.status || "draft"}
              onChange={(e) => onChange({ ...value, status: e.target.value as any })}
              className={inputCls}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </Field>
          <Field label="Featured" hint="Show as the highlighted story on the News page" className="col-span-2">
            <label className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={!!value.is_featured}
                onChange={(e) => onChange({ ...value, is_featured: e.target.checked })}
              />
              Mark this {value.type || "post"} as featured
            </label>
          </Field>
          <Field label="Cover image URL" className="col-span-2">
            <input
              maxLength={2000}
              value={value.cover_image || ""}
              onChange={(e) => onChange({ ...value, cover_image: e.target.value })}
              placeholder="https://… or paste a Media library URL"
              className={inputCls}
            />
            {value.cover_image && (
              <img
                src={value.cover_image}
                alt=""
                className="mt-2 h-32 w-full rounded-md border border-border object-cover"
              />
            )}
          </Field>
          <Field label="Excerpt (short summary)" className="col-span-2">
            <textarea
              rows={2} maxLength={500}
              value={value.excerpt || ""}
              onChange={(e) => onChange({ ...value, excerpt: e.target.value })}
              className={inputCls}
            />
          </Field>
          <Field label="Content (Markdown / plain text)" className="col-span-2">
            <textarea
              rows={10} maxLength={50000}
              value={value.content || ""}
              onChange={(e) => onChange({ ...value, content: e.target.value })}
              placeholder={"Write your article. You can use blank lines for paragraphs."}
              className={`${inputCls} font-mono text-[13px]`}
            />
          </Field>
          <Field label="Tags" className="col-span-2" hint="Click to toggle">
            <div className="flex flex-wrap gap-1.5">
              {tags.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No tags yet — add some in the Tags tab.
                </p>
              )}
              {tags.map((t) => {
                const on = selectedTagIds.includes(t.id);
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => toggleTag(t.id)}
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                      on
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    <TagIcon className="h-3 w-3" /> {t.name}
                  </button>
                );
              })}
            </div>
          </Field>
        </form>

        <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-3">
          <button onClick={onClose} className="rounded-md border border-input bg-background px-4 py-2 text-sm hover:bg-secondary">
            Cancel
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

type TaxItem = { id: string; name: string; slug: string; description?: string | null };

function TaxonomyManager({
  title, items, onSave, onDelete, withDescription,
}: {
  title: string;
  items: TaxItem[];
  onSave: (v: { id?: string | null; name: string; slug?: string | null; description?: string | null }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  withDescription?: boolean;
}) {
  const [editing, setEditing] = useState<TaxItem | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setSlug(editing.slug);
      setDescription(editing.description || "");
    } else {
      setName(""); setSlug(""); setDescription("");
    }
  }, [editing]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await onSave({
        id: editing?.id,
        name: name.trim(),
        slug: slug.trim() || null,
        description: withDescription ? (description.trim() || null) : null,
      });
      setEditing(null);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">None yet.</td></tr>
            )}
            {items.map((it) => (
              <tr key={it.id} className="hover:bg-muted/30">
                <td className="px-4 py-2.5 font-medium">{it.name}</td>
                <td className="px-4 py-2.5 text-muted-foreground">/{it.slug}</td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => setEditing(it)} className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground">
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => { if (confirm(`Delete "${it.name}"?`)) onDelete(it.id); }}
                      className="rounded p-1.5 text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-border bg-white p-5 shadow-sm">
        <h4 className="font-display text-base font-semibold">
          {editing ? `Edit ${title.slice(0, -1).toLowerCase()}` : `Add new`}
        </h4>
        <Field label="Name">
          <input required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Slug" hint="Optional. Auto-generated from name if empty.">
          <input maxLength={80} value={slug} onChange={(e) => setSlug(e.target.value)} className={inputCls} />
        </Field>
        {withDescription && (
          <Field label="Description">
            <textarea rows={3} maxLength={500} value={description} onChange={(e) => setDescription(e.target.value)} className={inputCls} />
          </Field>
        )}
        <div className="flex items-center justify-end gap-2 pt-1">
          {editing && (
            <button type="button" onClick={() => setEditing(null)} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
              Cancel
            </button>
          )}
          <button
            type="submit" disabled={busy}
            className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {editing ? "Update" : "Add"}
          </button>
        </div>
      </form>
    </div>
  );
}

function TabBtn({
  active, onClick, icon: Icon, children,
}: { active: boolean; onClick: () => void; icon: any; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-4 py-2 text-sm font-medium transition ${
        active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="h-3.5 w-3.5" /> {children}
    </button>
  );
}

function Field({
  label, hint, className, children,
}: { label: string; hint?: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block space-y-1.5 ${className || ""}`}>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  );
}

const inputCls =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";
