import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Upload,
  Trash2,
  Copy,
  Image as ImageIcon,
  FileText,
  Film,
  Music,
  Loader2,
  Search,
  Download,
  X,
  Link as LinkIcon,
  Home,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

type MediaItem = {
  name: string;
  id: string;
  updated_at: string | null;
  created_at: string | null;
  last_accessed_at: string | null;
  metadata: { size?: number; mimetype?: string } | null;
};

type WithUrl = MediaItem & { url: string; bucket: string };

type SortKey = "newest" | "oldest" | "name" | "size";

const BUCKETS = ["media", "agent-avatars"] as const;
const PRIMARY_BUCKET = "media";
const LONG_EXPIRY = 60 * 60 * 24 * 365; // 1 year — used when assigning to a property

async function listAll(bucket: string, prefix = "", depth = 0): Promise<Array<MediaItem & { bucket: string }>> {
  if (depth > 4) return [];
  const { data, error } = await supabase.storage.from(bucket).list(prefix, {
    limit: 1000,
    sortBy: { column: "created_at", order: "desc" },
  });
  if (error || !data) return [];
  const out: Array<MediaItem & { bucket: string }> = [];
  for (const entry of data) {
    const fullPath = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.id === null) {
      const nested = await listAll(bucket, fullPath, depth + 1);
      out.push(...nested);
    } else {
      out.push({ ...(entry as MediaItem), name: fullPath, bucket });
    }
  }
  return out;
}

function categorize(mime?: string) {
  if (!mime) return "file";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "file";
}

function humanSize(bytes?: number) {
  if (!bytes) return "—";
  const u = ["B", "KB", "MB", "GB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < u.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${u[i]}`;
}

export function MediaPanel() {
  const qc = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "image" | "video" | "audio" | "file">("all");
  const [bucketFilter, setBucketFilter] = useState<"all" | (typeof BUCKETS)[number]>("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [preview, setPreview] = useState<WithUrl | null>(null);
  const [assignItem, setAssignItem] = useState<WithUrl | null>(null);

  const { data: items, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["media", "list", "all-buckets"],
    queryFn: async () => {
      const all: Array<MediaItem & { bucket: string }> = [];
      for (const bucket of BUCKETS) {
        const files = await listAll(bucket);
        all.push(...files);
      }
      if (all.length === 0) return [] as WithUrl[];

      const urlByKey = new Map<string, string>();
      const byBucket = new Map<string, string[]>();
      for (const f of all) {
        const arr = byBucket.get(f.bucket) ?? [];
        arr.push(f.name);
        byBucket.set(f.bucket, arr);
      }
      for (const [bucket, paths] of byBucket) {
        const { data: signed } = await supabase.storage
          .from(bucket)
          .createSignedUrls(paths, 60 * 60);
        (signed ?? []).forEach((s) => {
          if (s.path && s.signedUrl) urlByKey.set(`${bucket}/${s.path}`, s.signedUrl);
        });
      }
      return all
        .map((f) => ({ ...f, url: urlByKey.get(`${f.bucket}/${f.name}`) ?? "" }))
        .sort((a, b) => (b.created_at ?? "").localeCompare(a.created_at ?? ""));
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    refetchOnMount: "always",
  });

  // Listen for cross-component upload events so any uploader in the app refreshes the gallery.
  useEffect(() => {
    const onChanged = () => qc.invalidateQueries({ queryKey: ["media", "list", "all-buckets"] });
    window.addEventListener("media:changed", onChanged);
    return () => window.removeEventListener("media:changed", onChanged);
  }, [qc]);


  const filtered = useMemo(() => {
    if (!items) return [];
    const s = search.trim().toLowerCase();
    const arr = items.filter((it) => {
      const kind = categorize(it.metadata?.mimetype);
      if (filter !== "all" && kind !== filter) return false;
      if (bucketFilter !== "all" && it.bucket !== bucketFilter) return false;
      if (s && !it.name.toLowerCase().includes(s)) return false;
      return true;
    });
    const sorted = [...arr];
    sorted.sort((a, b) => {
      if (sort === "newest") return (b.created_at ?? "").localeCompare(a.created_at ?? "");
      if (sort === "oldest") return (a.created_at ?? "").localeCompare(b.created_at ?? "");
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "size") return (b.metadata?.size ?? 0) - (a.metadata?.size ?? 0);
      return 0;
    });
    return sorted;
  }, [items, search, filter, bucketFilter, sort]);

  const counts = useMemo(() => {
    const c = { all: 0, image: 0, video: 0, audio: 0, file: 0 } as Record<string, number>;
    (items ?? []).forEach((it) => {
      c.all++;
      c[categorize(it.metadata?.mimetype)]++;
    });
    return c;
  }, [items]);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    let ok = 0;
    let fail = 0;
    for (const file of Array.from(files)) {
      const ts = Date.now();
      const safe = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `${ts}-${safe}`;
      const { error } = await supabase.storage.from(PRIMARY_BUCKET).upload(path, file, {
        cacheControl: "3600",
        contentType: file.type || undefined,
      });
      if (error) {
        fail++;
        toast.error(`${file.name}: ${error.message}`);
      } else ok++;
    }
    setUploading(false);
    if (ok) toast.success(`${ok} file${ok > 1 ? "s" : ""} uploaded`);
    if (fail === 0 && fileInput.current) fileInput.current.value = "";
    qc.invalidateQueries({ queryKey: ["media", "list", "all-buckets"] });
  }

  async function handleDelete(item: WithUrl) {
    if (!confirm(`Delete "${item.name}" from ${item.bucket}?`)) return;
    const { error } = await supabase.storage.from(item.bucket).remove([item.name]);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["media", "list", "all-buckets"] });
    if (preview?.name === item.name) setPreview(null);
  }

  async function handleCopy(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("URL copied (valid 1 hour)");
    } catch {
      toast.error("Failed to copy");
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-background p-3">
        <button
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          Upload files
        </button>
        <input
          ref={fileInput}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />

        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search files…"
            className="w-full rounded-full border border-input bg-muted/40 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="rounded-md border border-input bg-background px-3 py-2 text-xs"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="name">Name (A–Z)</option>
          <option value="size">Size (largest)</option>
        </select>

        <select
          value={bucketFilter}
          onChange={(e) => setBucketFilter(e.target.value as any)}
          className="rounded-md border border-input bg-background px-3 py-2 text-xs"
        >
          <option value="all">All buckets</option>
          {BUCKETS.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          title="Refresh"
          className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-xs hover:bg-muted disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`} />
          Sync
        </button>
      </div>

      {/* Type filter pills */}
      <div className="flex flex-wrap items-center gap-1 rounded-full border border-border bg-background p-1 text-xs">
        {(["all", "image", "video", "audio", "file"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 capitalize transition ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f}
            <span className="ml-1.5 rounded-full bg-black/10 px-1.5 py-px text-[10px] tabular-nums">
              {counts[f] ?? 0}
            </span>
          </button>
        ))}
      </div>

      {/* Gallery */}
      {isLoading ? (
        <div className="grid place-items-center rounded-xl border border-border bg-background p-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleUpload(e.dataTransfer.files);
          }}
          className="grid place-items-center rounded-xl border-2 border-dashed border-border bg-background p-16 text-center"
        >
          <ImageIcon className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm font-medium">No media yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Drag files here or click "Upload files" above.
          </p>
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleUpload(e.dataTransfer.files);
          }}
          className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-background p-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
        >
          {filtered.map((it) => (
            <MediaTile
              key={`${it.bucket}/${it.id}`}
              item={it}
              onOpen={() => setPreview(it)}
              onCopy={() => handleCopy(it.url)}
              onDelete={() => handleDelete(it)}
              onAssign={() => setAssignItem(it)}
            />
          ))}
        </div>
      )}

      {preview && (
        <PreviewModal
          item={preview}
          onClose={() => setPreview(null)}
          onCopy={() => handleCopy(preview.url)}
          onDelete={() => handleDelete(preview)}
          onAssign={() => {
            setAssignItem(preview);
            setPreview(null);
          }}
        />
      )}

      {assignItem && (
        <AssignToPropertyDialog item={assignItem} onClose={() => setAssignItem(null)} />
      )}
    </div>
  );
}

function MediaTile({
  item,
  onOpen,
  onCopy,
  onDelete,
  onAssign,
}: {
  item: WithUrl;
  onOpen: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onAssign: () => void;
}) {
  const kind = categorize(item.metadata?.mimetype);
  return (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-muted/30">
      <button onClick={onOpen} className="block aspect-square w-full">
        {kind === "image" && item.url ? (
          <img
            src={item.url}
            alt={item.name}
            loading="lazy"
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-muted-foreground">
            {kind === "video" ? (
              <Film className="h-10 w-10" />
            ) : kind === "audio" ? (
              <Music className="h-10 w-10" />
            ) : (
              <FileText className="h-10 w-10" />
            )}
          </div>
        )}
      </button>
      <span className="pointer-events-none absolute left-1.5 top-1.5 rounded-full bg-black/55 px-1.5 py-px text-[9px] font-medium uppercase tracking-wide text-white">
        {item.bucket}
      </span>
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent px-2 py-2 opacity-0 transition group-hover:opacity-100">
        <span className="truncate text-[10px] text-white" title={item.name}>
          {item.name.replace(/^\d+-/, "")}
        </span>
        <div className="flex items-center gap-1">
          {kind === "image" && (
            <button
              onClick={onAssign}
              title="Assign to property"
              className="grid h-6 w-6 place-items-center rounded bg-white/20 text-white hover:bg-white/30"
            >
              <Home className="h-3 w-3" />
            </button>
          )}
          <button
            onClick={onCopy}
            title="Copy URL"
            className="grid h-6 w-6 place-items-center rounded bg-white/20 text-white hover:bg-white/30"
          >
            <Copy className="h-3 w-3" />
          </button>
          <button
            onClick={onDelete}
            title="Delete"
            className="grid h-6 w-6 place-items-center rounded bg-red-500/80 text-white hover:bg-red-500"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

function PreviewModal({
  item,
  onClose,
  onCopy,
  onDelete,
  onAssign,
}: {
  item: WithUrl;
  onClose: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onAssign: () => void;
}) {
  const kind = categorize(item.metadata?.mimetype);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="min-w-0">
            <h3 className="truncate font-display text-base font-semibold">
              {item.name.replace(/^\d+-/, "")}
            </h3>
            <p className="text-xs text-muted-foreground">
              {item.bucket} · {item.metadata?.mimetype || "unknown"} · {humanSize(item.metadata?.size)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="grid place-items-center overflow-auto bg-muted/30 p-4">
          {kind === "image" ? (
            <img src={item.url} alt={item.name} className="max-h-[60vh] object-contain" />
          ) : kind === "video" ? (
            <video src={item.url} controls className="max-h-[60vh] w-full" />
          ) : kind === "audio" ? (
            <audio src={item.url} controls />
          ) : (
            <div className="grid place-items-center p-10 text-muted-foreground">
              <FileText className="mb-2 h-12 w-12" />
              <p className="text-sm">Preview not available</p>
            </div>
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-5 py-3">
          <input
            readOnly
            value={item.url}
            onClick={(e) => e.currentTarget.select()}
            className="flex-1 min-w-[200px] truncate rounded-md border border-input bg-muted/40 px-3 py-1.5 text-xs"
          />
          <div className="flex items-center gap-2">
            {kind === "image" && (
              <button
                onClick={onAssign}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
              >
                <Home className="h-3.5 w-3.5" /> Assign to property
              </button>
            )}
            <a
              href={item.url}
              download={item.name}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
            >
              <Download className="h-3.5 w-3.5" /> Download
            </a>
            <button
              onClick={onCopy}
              className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
            >
              <Copy className="h-3.5 w-3.5" /> Copy URL
            </button>
            <button
              onClick={onDelete}
              className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

function AssignToPropertyDialog({
  item,
  onClose,
}: {
  item: WithUrl;
  onClose: () => void;
}) {
  const [properties, setProperties] = useState<Array<{ id: string; title: string; image: string | null; gallery: string[] }>>([]);
  const [loading, setLoading] = useState(true);
  const [propertyId, setPropertyId] = useState<string>("");
  const [target, setTarget] = useState<"cover" | "gallery">("cover");
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("id, title, image, gallery")
        .order("updated_at", { ascending: false })
        .limit(500);
      if (cancelled) return;
      if (error) toast.error(error.message);
      const rows = (data ?? []).map((r: any) => ({
        id: r.id,
        title: r.title,
        image: r.image,
        gallery: Array.isArray(r.gallery) ? r.gallery : [],
      }));
      setProperties(rows);
      if (rows[0]) setPropertyId(rows[0].id);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return properties;
    return properties.filter((p) => p.title.toLowerCase().includes(s));
  }, [properties, q]);

  async function assign() {
    if (!propertyId) return;
    setSaving(true);
    // Generate a long-lived signed URL so the property keeps working.
    const { data: signed, error: signErr } = await supabase.storage
      .from(item.bucket)
      .createSignedUrl(item.name, LONG_EXPIRY);
    if (signErr || !signed?.signedUrl) {
      setSaving(false);
      return toast.error(signErr?.message || "Could not create persistent URL");
    }
    const url = signed.signedUrl;
    const prop = properties.find((p) => p.id === propertyId);
    if (!prop) {
      setSaving(false);
      return toast.error("Property not found");
    }
    const patch: { image?: string; gallery?: string[] } = {};
    if (target === "cover") patch.image = url;
    else patch.gallery = [...prop.gallery, url];

    const { error } = await supabase.from("properties").update(patch).eq("id", propertyId);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(target === "cover" ? "Set as cover image" : "Added to gallery");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-background shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4 text-primary" />
            <h3 className="font-display text-base font-semibold">Assign to property</h3>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="space-y-4 p-5">
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-2">
            {categorize(item.metadata?.mimetype) === "image" ? (
              <img src={item.url} alt="" className="h-14 w-14 rounded object-cover" />
            ) : (
              <div className="grid h-14 w-14 place-items-center rounded bg-muted text-muted-foreground">
                <FileText className="h-6 w-6" />
              </div>
            )}
            <div className="min-w-0 text-xs">
              <div className="truncate font-medium">{item.name.replace(/^\d+-/, "")}</div>
              <div className="text-muted-foreground">{item.bucket}</div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Property</label>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search properties…"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              size={6}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {loading ? (
                <option>Loading…</option>
              ) : filtered.length === 0 ? (
                <option value="">No properties found</option>
              ) : (
                filtered.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Assign as</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setTarget("cover")}
                className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
                  target === "cover"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-muted"
                }`}
              >
                Cover image
              </button>
              <button
                onClick={() => setTarget("gallery")}
                className={`rounded-md border px-3 py-2 text-sm font-medium transition ${
                  target === "gallery"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border hover:bg-muted"
                }`}
              >
                Add to gallery
              </button>
            </div>
          </div>
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-border px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={assign}
            disabled={!propertyId || saving}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Assign
          </button>
        </footer>
      </div>
    </div>
  );
}
