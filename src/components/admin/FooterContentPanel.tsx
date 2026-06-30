import { useEffect, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save } from "lucide-react";

const FOOTER_CONTENT_KEYS = [
  "footer_about",
  "footer_center_eyebrow",
  "footer_center_title",
  "footer_center_subtitle",
  "footer_contact_heading",
  "footer_address",
  "footer_phone",
  "footer_email",
  "footer_badge_text",
  "footer_copyright",
  "footer_show_plane",
  "footer_bg_color",
  "footer_overlay_color",
  "footer_overlay_opacity",
] as const;
type FooterContentKey = (typeof FOOTER_CONTENT_KEYS)[number];
type FooterContent = Record<FooterContentKey, string>;

const DEFAULTS: FooterContent = {
  footer_about:
    "A curated portfolio of premium residences across Doha, The Pearl, Lusail, West Bay and Al Waab — tailored for the discerning resident.",
  footer_center_eyebrow: "Doha → World",
  footer_center_title: "From Qatar, with intent.",
  footer_center_subtitle: "25.2854° N · 51.5310° E",
  footer_contact_heading: "Contact",
  footer_address: "West Bay, Doha — Qatar",
  footer_phone: "+974 4000 0000",
  footer_email: "hello@maisonqatar.qa",
  footer_badge_text: "Licensed real estate brokerage · Qatar",
  footer_copyright: "© {year} {title}. All rights reserved.",
  footer_show_plane: "true",
  footer_bg_color: "",
  footer_overlay_color: "#000000",
  footer_overlay_opacity: "0",
};

export function FooterContentPanel() {
  const qc = useQueryClient();
  const [content, setContent] = useState<FooterContent>(DEFAULTS);

  const { data } = useQuery({
    queryKey: ["footer-content-edit"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", FOOTER_CONTENT_KEYS as unknown as string[]);
      if (error) throw error;
      const map: Record<string, string> = {};
      (data || []).forEach((r: any) => { map[r.key] = r.value || ""; });
      return map;
    },
  });

  useEffect(() => {
    if (!data) return;
    const next = { ...DEFAULTS };
    FOOTER_CONTENT_KEYS.forEach((k) => { if (data[k]) next[k] = data[k]; });
    setContent(next);
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      const rows = FOOTER_CONTENT_KEYS.map((k) => ({ key: k, value: content[k] ?? "" }));
      const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Footer content saved");
      qc.invalidateQueries({ queryKey: ["footer-content-edit"] });
      qc.invalidateQueries({ queryKey: ["site-settings"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to save"),
  });

  const set = (k: FooterContentKey, v: string) => setContent({ ...content, [k]: v });

  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-display text-lg font-semibold">Footer content</h3>
        <p className="text-sm text-muted-foreground">Edit the copy shown across the website footer.</p>
      </div>

      <Section title="Decorations">
        <label className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2.5">
          <span>
            <span className="block text-sm font-medium">Show airplane flight path</span>
            <span className="block text-xs text-muted-foreground">Animated Qatar Airways plane backdrop in the footer.</span>
          </span>
          <input
            type="checkbox"
            className="h-5 w-9 cursor-pointer appearance-none rounded-full bg-muted transition-colors checked:bg-primary relative before:absolute before:top-0.5 before:left-0.5 before:h-4 before:w-4 before:rounded-full before:bg-white before:transition-transform checked:before:translate-x-4"
            checked={content.footer_show_plane !== "false"}
            onChange={(e) => set("footer_show_plane", e.target.checked ? "true" : "false")}
          />
        </label>
      </Section>

      <Section title="Left column (under logo)">
        <Textarea label="About text" value={content.footer_about} onChange={(v) => set("footer_about", v)} />
      </Section>

      <Section title="Middle card">
        <div className="grid gap-2 sm:grid-cols-3">
          <Input label="Eyebrow" value={content.footer_center_eyebrow} onChange={(v) => set("footer_center_eyebrow", v)} />
          <Input label="Title" value={content.footer_center_title} onChange={(v) => set("footer_center_title", v)} />
          <Input label="Subtitle" value={content.footer_center_subtitle} onChange={(v) => set("footer_center_subtitle", v)} />
        </div>
      </Section>

      <Section title="Right card (Contact)">
        <div className="grid gap-2 sm:grid-cols-2">
          <Input label="Heading" value={content.footer_contact_heading} onChange={(v) => set("footer_contact_heading", v)} />
          <Input label="Address" value={content.footer_address} onChange={(v) => set("footer_address", v)} />
          <Input label="Phone" value={content.footer_phone} onChange={(v) => set("footer_phone", v)} />
          <Input label="Email" value={content.footer_email} onChange={(v) => set("footer_email", v)} />
        </div>
      </Section>

      <Section title="Bottom bar">
        <div className="grid gap-2">
          <Input label="Badge text (leave empty to hide)" value={content.footer_badge_text} onChange={(v) => set("footer_badge_text", v)} />
          <Input
            label="Copyright (use {year} and {title} as placeholders)"
            value={content.footer_copyright}
            onChange={(v) => set("footer_copyright", v)}
          />
        </div>
      </Section>

      <div className="flex justify-end border-t border-border pt-4">
        <button
          type="button"
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          <Save className="h-4 w-4" /> {save.isPending ? "Saving…" : "Save footer"}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

function Input({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="block space-y-1">
      <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </label>
  );
}

function Textarea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block space-y-1">
      <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </label>
  );
}
