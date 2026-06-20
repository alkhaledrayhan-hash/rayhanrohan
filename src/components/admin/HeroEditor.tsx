import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fileToDataUrl } from "@/lib/image-upload";
import { toast } from "sonner";
import { Image as ImageIcon, Palette, Plus, Type, Upload, X } from "lucide-react";

export type HeroContent = {
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  cta_label?: string;
  cta_link?: string;
  cta2_label?: string;
  cta2_link?: string;
  image_url?: string; // legacy single image (still respected)
  images?: string[]; // slider images
  slide_interval?: number; // ms between slides
  style?: {
    eyebrow_color?: string;
    title_color?: string;
    subtitle_color?: string;
    overlay_from?: string;
    overlay_to?: string;
    overlay_opacity?: number; // 0-100
    cta_bg?: string;
    cta_text?: string;
    title_size?: "md" | "lg" | "xl";
    align?: "left" | "center";
  };
};

const DEFAULT_STYLE: NonNullable<HeroContent["style"]> = {
  eyebrow_color: "#d4af37",
  title_color: "#ffffff",
  subtitle_color: "#e5e7eb",
  overlay_from: "#000000",
  overlay_to: "#000000",
  overlay_opacity: 55,
  cta_bg: "#7a1325",
  cta_text: "#ffffff",
  title_size: "xl",
  align: "left",
};

export function HeroEditor({ sectionId, initial }: { sectionId: string; initial: HeroContent }) {
  const qc = useQueryClient();
  const [content, setContent] = useState<HeroContent>({
    ...initial,
    style: { ...DEFAULT_STYLE, ...(initial.style || {}) },
  });
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setContent({ ...initial, style: { ...DEFAULT_STYLE, ...(initial.style || {}) } });
  }, [sectionId]);

  function update<K extends keyof HeroContent>(k: K, v: HeroContent[K]) {
    setContent((c) => ({ ...c, [k]: v }));
  }
  function updateStyle<K extends keyof NonNullable<HeroContent["style"]>>(
    k: K,
    v: NonNullable<HeroContent["style"]>[K],
  ) {
    setContent((c) => ({ ...c, style: { ...DEFAULT_STYLE, ...(c.style || {}), [k]: v } }));
  }

  async function onPickImage(file: File) {
    try {
      const dataUrl = await fileToDataUrl(file, { maxSize: 1600, quality: 0.75 });
      setContent((c) => ({ ...c, images: [...(c.images || []), dataUrl] }));
      toast.success("Image added. Click Save to publish.");
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  function removeImage(idx: number) {
    setContent((c) => ({ ...c, images: (c.images || []).filter((_, i) => i !== idx) }));
  }
  function moveImage(idx: number, dir: -1 | 1) {
    setContent((c) => {
      const arr = [...(c.images || [])];
      const j = idx + dir;
      if (j < 0 || j >= arr.length) return c;
      [arr[idx], arr[j]] = [arr[j], arr[idx]];
      return { ...c, images: arr };
    });
  }
  function addUrl(url: string) {
    const v = url.trim();
    if (!v) return;
    setContent((c) => ({ ...c, images: [...(c.images || []), v] }));
  }

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("page_sections")
        .update({ content })
        .eq("id", sectionId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Hero saved");
      qc.invalidateQueries({ queryKey: ["home-sections"] });
      qc.invalidateQueries({ queryKey: ["page-sections"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const st = content.style || DEFAULT_STYLE;
  const overlayBg = `linear-gradient(135deg, ${withAlpha(st.overlay_from!, st.overlay_opacity!)} 0%, ${withAlpha(st.overlay_to!, st.overlay_opacity!)} 100%)`;
  const titleSize =
    st.title_size === "md" ? "text-3xl" : st.title_size === "lg" ? "text-4xl" : "text-5xl";
  const slides =
    content.images && content.images.length > 0
      ? content.images
      : content.image_url
        ? [content.image_url]
        : [];
  const [previewSlide, setPreviewSlide] = useState(0);
  useEffect(() => {
    setPreviewSlide(0);
  }, [slides.length]);
  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(
      () => setPreviewSlide((s) => (s + 1) % slides.length),
      content.slide_interval || 2500,
    );
    return () => clearInterval(id);
  }, [slides.length, content.slide_interval]);

  return (
    <div className="space-y-5">
      {/* Live preview */}
      <div className="relative overflow-hidden rounded-2xl border border-border">
        {slides.length > 0 ? (
          <div className="relative h-64 w-full">
            {slides.map((src, i) => (
              <img
                key={src + i}
                src={src}
                alt=""
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${previewSlide === i ? "opacity-100" : "opacity-0"}`}
              />
            ))}
          </div>
        ) : (
          <div className="grid h-64 w-full place-items-center bg-muted text-xs text-muted-foreground">
            No image — using default hero
          </div>
        )}
        <div className="absolute inset-0" style={{ background: overlayBg }} />
        <div
          className={`absolute inset-0 flex flex-col justify-center p-8 ${st.align === "center" ? "items-center text-center" : "items-start"}`}
        >
          {content.eyebrow && (
            <p
              className="text-[11px] font-medium uppercase tracking-[0.25em]"
              style={{ color: st.eyebrow_color }}
            >
              {content.eyebrow}
            </p>
          )}
          {content.title && (
            <h2
              className={`mt-2 font-display font-semibold leading-tight ${titleSize}`}
              style={{ color: st.title_color }}
            >
              {content.title}
            </h2>
          )}
          {content.subtitle && (
            <p className="mt-2 max-w-xl text-sm" style={{ color: st.subtitle_color }}>
              {content.subtitle}
            </p>
          )}
          {(content.cta_label || content.cta2_label) && (
            <div className="mt-4 flex gap-2">
              {content.cta_label && (
                <span
                  className="rounded-lg px-4 py-2 text-xs font-medium"
                  style={{ background: st.cta_bg, color: st.cta_text }}
                >
                  {content.cta_label}
                </span>
              )}
              {content.cta2_label && (
                <span className="rounded-lg border border-white/40 px-4 py-2 text-xs font-medium text-white">
                  {content.cta2_label}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Content */}
        <Panel icon={Type} title="Content">
          <Field label="Eyebrow">
            <input
              className={inputCls}
              value={content.eyebrow || ""}
              onChange={(e) => update("eyebrow", e.target.value)}
            />
          </Field>
          <Field label="Title">
            <textarea
              rows={2}
              className={inputCls}
              value={content.title || ""}
              onChange={(e) => update("title", e.target.value)}
            />
          </Field>
          <Field label="Subtitle / description">
            <textarea
              rows={3}
              className={inputCls}
              value={content.subtitle || ""}
              onChange={(e) => update("subtitle", e.target.value)}
            />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Primary button label">
              <input
                className={inputCls}
                value={content.cta_label || ""}
                onChange={(e) => update("cta_label", e.target.value)}
              />
            </Field>
            <Field label="Primary button link">
              <input
                className={inputCls}
                value={content.cta_link || ""}
                onChange={(e) => update("cta_link", e.target.value)}
              />
            </Field>
            <Field label="Secondary button label">
              <input
                className={inputCls}
                value={content.cta2_label || ""}
                onChange={(e) => update("cta2_label", e.target.value)}
              />
            </Field>
            <Field label="Secondary button link">
              <input
                className={inputCls}
                value={content.cta2_link || ""}
                onChange={(e) => update("cta2_link", e.target.value)}
              />
            </Field>
          </div>
        </Panel>

        {/* Media slider */}
        <Panel icon={ImageIcon} title="Background slider">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              if (e.target.files?.[0]) onPickImage(e.target.files[0]);
              e.target.value = "";
            }}
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              <Plus className="h-4 w-4" /> Add image
            </button>
            <span className="text-xs text-muted-foreground">
              {slides.length} {slides.length === 1 ? "slide" : "slides"} in slider
            </span>
          </div>

          {slides.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {(content.images || (content.image_url ? [content.image_url] : [])).map((src, i) => (
                <div
                  key={i}
                  className="group relative overflow-hidden rounded-lg border border-border"
                >
                  <img src={src} alt="" className="h-24 w-full object-cover" />
                  <div className="absolute inset-0 flex items-end justify-between gap-1 bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-0 transition group-hover:opacity-100">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => moveImage(i, -1)}
                        disabled={i === 0}
                        className="rounded bg-white/90 px-1.5 text-xs disabled:opacity-40"
                      >
                        ←
                      </button>
                      <button
                        type="button"
                        onClick={() => moveImage(i, 1)}
                        disabled={i === (content.images?.length || 1) - 1}
                        className="rounded bg-white/90 px-1.5 text-xs disabled:opacity-40"
                      >
                        →
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (content.images) removeImage(i);
                        else update("image_url", "");
                      }}
                      className="rounded bg-red-500/90 p-1 text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  <span className="absolute left-1 top-1 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    {i + 1}
                  </span>
                </div>
              ))}
            </div>
          )}

          <UrlAdder onAdd={addUrl} />

          <Field
            label={`Slide interval (${((content.slide_interval || 2500) / 1000).toFixed(1)}s)`}
          >
            <input
              type="range"
              min={1000}
              max={8000}
              step={250}
              value={content.slide_interval || 2500}
              onChange={(e) => update("slide_interval", Number(e.target.value))}
              className="w-full"
            />
          </Field>
          <p className="text-xs text-muted-foreground">
            Add 1+ images to build the background slider. Recommended size: 1600×900 or larger.
          </p>
        </Panel>

        {/* Style */}
        <Panel icon={Palette} title="Style & colors" className="lg:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ColorField
              label="Eyebrow"
              value={st.eyebrow_color!}
              onChange={(v) => updateStyle("eyebrow_color", v)}
            />
            <ColorField
              label="Title"
              value={st.title_color!}
              onChange={(v) => updateStyle("title_color", v)}
            />
            <ColorField
              label="Subtitle"
              value={st.subtitle_color!}
              onChange={(v) => updateStyle("subtitle_color", v)}
            />
            <ColorField
              label="Button bg"
              value={st.cta_bg!}
              onChange={(v) => updateStyle("cta_bg", v)}
            />
            <ColorField
              label="Button text"
              value={st.cta_text!}
              onChange={(v) => updateStyle("cta_text", v)}
            />
            <ColorField
              label="Overlay from"
              value={st.overlay_from!}
              onChange={(v) => updateStyle("overlay_from", v)}
            />
            <ColorField
              label="Overlay to"
              value={st.overlay_to!}
              onChange={(v) => updateStyle("overlay_to", v)}
            />
            <Field label={`Overlay opacity (${st.overlay_opacity}%)`}>
              <input
                type="range"
                min={0}
                max={100}
                value={st.overlay_opacity}
                onChange={(e) => updateStyle("overlay_opacity", Number(e.target.value))}
                className="w-full"
              />
            </Field>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Title size">
              <div className="flex gap-1 rounded-lg bg-muted p-1 text-xs">
                {(["md", "lg", "xl"] as const).map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => updateStyle("title_size", s)}
                    className={`flex-1 rounded-md px-3 py-1.5 capitalize ${st.title_size === s ? "bg-white shadow-sm" : "text-muted-foreground"}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Alignment">
              <div className="flex gap-1 rounded-lg bg-muted p-1 text-xs">
                {(["left", "center"] as const).map((a) => (
                  <button
                    type="button"
                    key={a}
                    onClick={() => updateStyle("align", a)}
                    className={`flex-1 rounded-md px-3 py-1.5 capitalize ${st.align === a ? "bg-white shadow-sm" : "text-muted-foreground"}`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </Field>
          </div>
        </Panel>
      </div>

      <div className="flex justify-end gap-2">
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {save.isPending ? "Saving…" : "Save hero"}
        </button>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2 rounded-lg border border-input bg-background p-1.5">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-xs uppercase tracking-wide outline-none"
        />
      </div>
    </Field>
  );
}

function Panel({
  icon: Icon,
  title,
  children,
  className = "",
}: {
  icon: typeof Type;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-3 rounded-2xl border border-border bg-white p-5 ${className}`}>
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4 text-primary" /> {title}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function withAlpha(hex: string, opacityPct: number) {
  const a = Math.max(0, Math.min(100, opacityPct)) / 100;
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function UrlAdder({ onAdd }: { onAdd: (url: string) => void }) {
  const [v, setV] = useState("");
  return (
    <div className="flex gap-2">
      <input
        className={inputCls}
        placeholder="…or paste an image URL"
        value={v}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            onAdd(v);
            setV("");
          }
        }}
      />
      <button
        type="button"
        onClick={() => {
          onAdd(v);
          setV("");
        }}
        className="rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted"
      >
        Add
      </button>
    </div>
  );
}
