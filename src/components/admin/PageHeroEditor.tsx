import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fileToDataUrl } from "@/lib/image-upload";
import { toast } from "sonner";
import { Image as ImageIcon, Type, Upload, X } from "lucide-react";
import type { PageHeroContent } from "@/hooks/usePageHero";

const inputCls =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

export function PageHeroEditor({
  sectionId,
  pageSlug,
  initial,
}: {
  sectionId: string;
  pageSlug: string;
  initial: PageHeroContent;
}) {
  const qc = useQueryClient();
  const [content, setContent] = useState<PageHeroContent>(initial || {});
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setContent(initial || {});
  }, [sectionId]);

  function update<K extends keyof PageHeroContent>(k: K, v: PageHeroContent[K]) {
    setContent((c) => ({ ...c, [k]: v }));
  }

  async function onPickImage(file: File) {
    try {
      const dataUrl = await fileToDataUrl(file, { maxSize: 1600, quality: 0.78 });
      update("image", dataUrl);
      toast.success("Image set. Click Save to publish.");
    } catch (e: any) {
      toast.error(e.message);
    }
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
      qc.invalidateQueries({ queryKey: ["page-sections"] });
      qc.invalidateQueries({ queryKey: ["page-hero", pageSlug] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const isProperties = pageSlug === "properties";

  return (
    <div className="space-y-5">
      {/* Preview */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-black/5">
        <div className="relative aspect-[16/6] w-full">
          {content.image ? (
            <img src={content.image} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center bg-muted text-xs text-muted-foreground">
              No image — using default page hero
            </div>
          )}
          <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(0,0,0,0.55), rgba(0,0,0,0.55))" }} />
          <div className="absolute inset-0 flex flex-col justify-end px-6 py-6 sm:px-10 sm:py-8">
            {content.eyebrow ? (
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-gold/60 bg-black/30 px-3 py-1 text-[10px] uppercase tracking-[0.25em] text-gold backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-gold" />
                {content.eyebrow}
              </span>
            ) : null}
            <h2 className="mt-3 max-w-2xl font-display text-2xl font-semibold text-white sm:text-4xl">
              {content.title || "Untitled"}
            </h2>
            {content.description ? (
              <p className="mt-2 max-w-xl text-xs text-white/85 sm:text-sm">{content.description}</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Content */}
        <Panel icon={Type} title="Content">
          <Field label="Eyebrow">
            <input className={inputCls} value={content.eyebrow || ""} onChange={(e) => update("eyebrow", e.target.value)} />
          </Field>
          <Field label="Title">
            <textarea rows={2} className={inputCls} value={content.title || ""} onChange={(e) => update("title", e.target.value)} />
          </Field>
          <Field label="Description">
            <textarea rows={3} className={inputCls} value={content.description || ""} onChange={(e) => update("description", e.target.value)} />
          </Field>
        </Panel>

        {/* Image */}
        <Panel icon={ImageIcon} title="Background image">
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
              <Upload className="h-4 w-4" /> Upload image
            </button>
            {content.image ? (
              <button
                type="button"
                onClick={() => update("image", "")}
                className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-muted"
              >
                <X className="h-3 w-3" /> Remove
              </button>
            ) : null}
          </div>
          <Field label="Or paste image URL">
            <input
              className={inputCls}
              value={content.image || ""}
              onChange={(e) => update("image", e.target.value)}
              placeholder="https://… or /hero/your-image.jpg"
            />
          </Field>
          <p className="text-xs text-muted-foreground">Recommended size: 1600×900 or larger.</p>
        </Panel>

        {isProperties ? (
          <Panel icon={Type} title="Per-status overrides (Properties page)" className="lg:col-span-2">
            <p className="-mt-2 text-xs text-muted-foreground">
              These override the title/eyebrow when the visitor switches between rent / sale / all.
              Leave blank to fall back to the main title/eyebrow above.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Title — For Rent">
                <input className={inputCls} value={content.title_rent || ""} onChange={(e) => update("title_rent", e.target.value)} />
              </Field>
              <Field label="Eyebrow — For Rent">
                <input className={inputCls} value={content.eyebrow_rent || ""} onChange={(e) => update("eyebrow_rent", e.target.value)} />
              </Field>
              <Field label="Title — For Sale">
                <input className={inputCls} value={content.title_sale || ""} onChange={(e) => update("title_sale", e.target.value)} />
              </Field>
              <Field label="Eyebrow — For Sale">
                <input className={inputCls} value={content.eyebrow_sale || ""} onChange={(e) => update("eyebrow_sale", e.target.value)} />
              </Field>
              <Field label="Title — All">
                <input className={inputCls} value={content.title_all || ""} onChange={(e) => update("title_all", e.target.value)} />
              </Field>
              <Field label="Eyebrow — All">
                <input className={inputCls} value={content.eyebrow_all || ""} onChange={(e) => update("eyebrow_all", e.target.value)} />
              </Field>
            </div>
          </Panel>
        ) : null}
      </div>

      <div className="flex justify-end">
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function Panel({
  icon: Icon,
  title,
  className,
  children,
}: {
  icon: typeof Type;
  title: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`space-y-3 rounded-2xl border border-border bg-secondary/30 p-4 ${className || ""}`}>
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </div>
      {children}
    </div>
  );
}
