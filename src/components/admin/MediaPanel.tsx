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

type WithUrl = MediaItem & { url: string };

const BUCKET = "media";

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
  const [preview, setPreview] = useState<WithUrl | null>(null);

  const { data: items, isLoading } = useQuery({
    queryKey: ["media", "list"],
    queryFn: async () => {
      const { data, error } = await supabase.storage.from(BUCKET).list("", {
        limit: 200,
        sortBy: { column: "created_at", order: "desc" },
      });
      if (error) throw error;
      const files = (data ?? []).filter((f) => f.id !== null) as MediaItem[];
      if (files.length === 0) return [] as WithUrl[];
      const { data: signed } = await supabase.storage
        .from(BUCKET)
        .createSignedUrls(
          files.map((f) => f.name),
          60 * 60, // 1h
        );
      const urlByPath = new Map<string, string>();
      (signed ?? []).forEach((s) => {
        if (s.path && s.signedUrl) urlByPath.set(s.path, s.signedUrl);
      });
      return files.map((f) => ({ ...f, url: urlByPath.get(f.name) ?? "" }));
    },
  });

  const filtered = useMemo(() => {
    if (!items) return [];
    const s = search.trim().toLowerCase();
    return items.filter((it) => {
      const kind = categorize(it.metadata?.mimetype);
      if (filter !== "all" && kind !== filter) return false;
      if (s && !it.name.toLowerCase().includes(s)) return false;
      return true;
    });
  }, [items, search, filter]);

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    let ok = 0;
    let fail = 0;
    for (const file of Array.from(files)) {
      const ts = Date.now();
      const safe = file.name.replace(/[^\w.\-]+/g, "_");
      const path = `${ts}-${safe}`;
      const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
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
    qc.invalidateQueries({ queryKey: ["media", "list"] });
  }

  async function handleDelete(name: string) {
    if (!confirm(`Delete "${name}"?`)) return;
    const { error } = await supabase.storage.from(BUCKET).remove([name]);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["media", "list"] });
    if (preview?.name === name) setPreview(null);
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

        <div className="flex items-center gap-1 rounded-full border border-border p-1 text-xs">
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
            </button>
          ))}
        </div>
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
              key={it.id}
              item={it}
              onOpen={() => setPreview(it)}
              onCopy={() => handleCopy(it.url)}
              onDelete={() => handleDelete(it.name)}
            />
          ))}
        </div>
      )}

      {preview && (
        <PreviewModal
          item={preview}
          onClose={() => setPreview(null)}
          onCopy={() => handleCopy(preview.url)}
          onDelete={() => handleDelete(preview.name)}
        />
      )}
    </div>
  );
}

function MediaTile({
  item,
  onOpen,
  onCopy,
  onDelete,
}: {
  item: WithUrl;
  onOpen: () => void;
  onCopy: () => void;
  onDelete: () => void;
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
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent px-2 py-2 opacity-0 transition group-hover:opacity-100">
        <span className="truncate text-[10px] text-white" title={item.name}>
          {item.name.replace(/^\d+-/, "")}
        </span>
        <div className="flex items-center gap-1">
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
}: {
  item: WithUrl;
  onClose: () => void;
  onCopy: () => void;
  onDelete: () => void;
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
              {item.metadata?.mimetype || "unknown"} · {humanSize(item.metadata?.size)}
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
