import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Globe, Mail, Type, Palette, Image as ImageIcon, Upload, X } from "lucide-react";
import { fileToDataUrl } from "@/lib/image-upload";

type SettingsMap = Record<string, string>;
const KEYS = [
  "site_title",
  "site_tagline",
  "admin_email",
  "auth_bg_color",
  "auth_bg_image_url",
] as const;

export function SettingsPanel() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("key, value");
      if (error) throw error;
      const map: SettingsMap = {};
      (data || []).forEach((r: any) => { map[r.key] = r.value || ""; });
      return map;
    },
  });

  const [form, setForm] = useState<SettingsMap>({});
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (data) setForm(data); }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      const rows = KEYS.map((k) => ({ key: k, value: (form[k] || "").trim() }));
      const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Settings saved");
      qc.invalidateQueries({ queryKey: ["site-settings"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  async function handleFile(file: File) {
    try {
      setUploading(true);
      const dataUrl = await fileToDataUrl(file, { maxSize: 1600, quality: 0.8, mime: "image/jpeg" });
      setForm((f) => ({ ...f, auth_bg_image_url: dataUrl }));
      toast.success("Image ready — click Save to apply.");
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const bgColor = form.auth_bg_color || "#1a0a0f";
  const bgImage = form.auth_bg_image_url || "";

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); save.mutate(); }}
      className="max-w-2xl space-y-5 rounded-2xl border border-border bg-white p-6 shadow-sm"
    >
      <div>
        <h3 className="font-display text-lg font-semibold">Website settings</h3>
        <p className="text-sm text-muted-foreground">Update the site title, tagline, and admin email used for lead notifications.</p>
      </div>

      <Field icon={Type} label="Site title">
        <input
          value={form.site_title || ""}
          onChange={(e) => setForm({ ...form, site_title: e.target.value })}
          placeholder="Your site name"
          className={inputCls}
        />
      </Field>

      <Field icon={Globe} label="Tagline">
        <input
          value={form.site_tagline || ""}
          onChange={(e) => setForm({ ...form, site_tagline: e.target.value })}
          placeholder="A short tagline shown across the site"
          className={inputCls}
        />
      </Field>

      <Field icon={Mail} label="Admin email" hint="Leads exports can be emailed to this address.">
        <input
          type="email"
          value={form.admin_email || ""}
          onChange={(e) => setForm({ ...form, admin_email: e.target.value })}
          placeholder="admin@example.com"
          className={inputCls}
        />
      </Field>

      <div className="space-y-4 rounded-xl border border-border bg-secondary/30 p-4">
        <div>
          <h4 className="font-display text-base font-semibold">Auth pages appearance</h4>
          <p className="text-xs text-muted-foreground">Background color and optional image shown on Sign in, Sign up, Forgot password, and Reset password screens.</p>
        </div>

        <Field icon={Palette} label="Background color">
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setForm({ ...form, auth_bg_color: e.target.value })}
              className="h-10 w-14 cursor-pointer rounded-md border border-input bg-background"
            />
            <input
              value={bgColor}
              onChange={(e) => setForm({ ...form, auth_bg_color: e.target.value })}
              placeholder="#1a0a0f"
              className={inputCls}
            />
          </div>
        </Field>

        <Field icon={ImageIcon} label="Background image" hint="Upload an image or paste a URL. Leave empty to use the gradient.">
          <div className="space-y-3">
            <input
              value={bgImage.startsWith("data:") ? "" : bgImage}
              onChange={(e) => setForm({ ...form, auth_bg_image_url: e.target.value })}
              placeholder="https://example.com/background.jpg"
              className={inputCls}
              disabled={bgImage.startsWith("data:")}
            />
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFile(f);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-secondary disabled:opacity-60"
              >
                <Upload className="h-4 w-4" />
                {uploading ? "Processing…" : "Upload image"}
              </button>
              {bgImage && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, auth_bg_image_url: "" })}
                  className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-secondary"
                >
                  <X className="h-4 w-4" /> Remove image
                </button>
              )}
            </div>
            <div
              className="relative h-40 w-full overflow-hidden rounded-lg border border-input"
              style={{ backgroundColor: bgColor }}
            >
              {bgImage ? (
                <>
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${bgImage})` }}
                  />
                  <div className="absolute inset-0 bg-black/40" />
                </>
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,38,53,0.4),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(212,175,55,0.15),transparent_50%)]" />
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-xl bg-white/95 px-4 py-2 text-xs font-medium text-foreground shadow">
                  Preview
                </div>
              </div>
            </div>
          </div>
        </Field>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={save.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          <Save className="h-4 w-4" /> {save.isPending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}

const inputCls = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60";

function Field({ icon: Icon, label, hint, children }: { icon: any; label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </span>
      {children}
      {hint && <span className="block text-[11px] text-muted-foreground">{hint}</span>}
    </label>
  );
}
