import { useEffect, useRef, useState } from "react";
import { ThemedSelect } from "@/components/ui/themed-select";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Save,
  Globe,
  Mail,
  Type,
  Palette,
  Image as ImageIcon,
  Upload,
  X,
  Link as LinkIcon,
  Clock,
  Calendar,
  CalendarDays,
} from "lucide-react";
import { fileToDataUrl } from "@/lib/image-upload";
import { MenusEditor } from "@/components/admin/MenusEditor";
import { ThemeEditor } from "@/components/admin/ThemeEditor";

type SettingsMap = Record<string, string>;
const KEYS = [
  "site_title",
  "site_tagline",
  "site_url",
  "site_logo_url",
  "admin_email",
  "site_timezone",
  "date_format",
  "time_format",
  "week_starts_on",
  "site_currency",
  "site_language",
  "auth_bg_color",
  "auth_bg_image_url",
  "auth_heading",
  "auth_subheading",
  "auth_signin_heading",
  "auth_signup_heading",
] as const;

const CURRENCIES = [
  { code: "QAR", label: "Qatari Riyal (QAR ر.ق)" },
  { code: "USD", label: "US Dollar (USD $)" },
  { code: "EUR", label: "Euro (EUR €)" },
  { code: "GBP", label: "British Pound (GBP £)" },
  { code: "AED", label: "UAE Dirham (AED د.إ)" },
  { code: "SAR", label: "Saudi Riyal (SAR ﷼)" },
  { code: "INR", label: "Indian Rupee (INR ₹)" },
  { code: "BDT", label: "Bangladeshi Taka (BDT ৳)" },
  { code: "PKR", label: "Pakistani Rupee (PKR ₨)" },
  { code: "TRY", label: "Turkish Lira (TRY ₺)" },
  { code: "JPY", label: "Japanese Yen (JPY ¥)" },
  { code: "CNY", label: "Chinese Yuan (CNY ¥)" },
];

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "ar", label: "العربية (Arabic)" },
  { code: "bn", label: "বাংলা (Bengali)" },
  { code: "hi", label: "हिन्दी (Hindi)" },
  { code: "ur", label: "اردو (Urdu)" },
  { code: "tr", label: "Türkçe (Turkish)" },
  { code: "fr", label: "Français (French)" },
  { code: "es", label: "Español (Spanish)" },
  { code: "de", label: "Deutsch (German)" },
  { code: "zh", label: "中文 (Chinese)" },
];

type TabId = "general" | "auth" | "theme" | "menus";

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
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [tab, setTab] = useState<TabId>("general");
  const fileRef = useRef<HTMLInputElement>(null);
  const logoFileRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!data) return;
    const next = { ...data };
    if (!next.site_url && typeof window !== "undefined") next.site_url = window.location.origin;
    if (!next.site_timezone && typeof Intl !== "undefined") {
      try { next.site_timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch {}
    }
    setForm(next);
  }, [data]);

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

  async function handleLogoFile(file: File) {
    try {
      setUploadingLogo(true);
      const dataUrl = await fileToDataUrl(file, { maxSize: 512, quality: 0.9, mime: "image/png" });
      setForm((f) => ({ ...f, site_logo_url: dataUrl }));
      toast.success("Logo ready — click Save to apply.");
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setUploadingLogo(false);
    }
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const bgColor = form.auth_bg_color || "#1a0a0f";
  const bgImage = form.auth_bg_image_url || "";

  return (
    <div className="max-w-4xl space-y-5">
      <div className="flex flex-wrap items-center gap-2 border-b border-border">
        <TabButton active={tab === "general"} onClick={() => setTab("general")}>General settings</TabButton>
        <TabButton active={tab === "auth"} onClick={() => setTab("auth")}>Auth page settings</TabButton>
        <TabButton active={tab === "theme"} onClick={() => setTab("theme")}>Theme & style</TabButton>
        <TabButton active={tab === "menus"} onClick={() => setTab("menus")}>Menu controller</TabButton>
      </div>

      {tab === "menus" ? (
        <MenusEditor />
      ) : tab === "theme" ? (
        <ThemeEditor />
      ) : (
      <form
        onSubmit={(e) => { e.preventDefault(); save.mutate(); }}
        className="space-y-5 rounded-2xl border border-border bg-white p-6 shadow-sm"
      >

      {tab === "general" && (
        <div className="space-y-5">
          <div>
            <h3 className="font-display text-lg font-semibold">General settings</h3>
            <p className="text-sm text-muted-foreground">Core website information and formatting preferences.</p>
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

          <Field icon={ImageIcon} label="Site logo" hint="Shown in the header, footer and auth pages. Square image works best.">
            <div className="space-y-3">
              <input
                value={(form.site_logo_url || "").startsWith("data:") ? "" : (form.site_logo_url || "")}
                onChange={(e) => setForm({ ...form, site_logo_url: e.target.value })}
                placeholder="https://example.com/logo.png"
                className={inputCls}
                disabled={(form.site_logo_url || "").startsWith("data:")}
              />
              <div className="flex flex-wrap items-center gap-3">
                {form.site_logo_url && (
                  <img
                    src={form.site_logo_url}
                    alt="Logo preview"
                    className="h-14 w-14 rounded-md border border-input object-cover"
                  />
                )}
                <input
                  ref={logoFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleLogoFile(f);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => logoFileRef.current?.click()}
                  disabled={uploadingLogo}
                  className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-secondary disabled:opacity-60"
                >
                  <Upload className="h-4 w-4" />
                  {uploadingLogo ? "Processing…" : "Upload logo"}
                </button>
                {form.site_logo_url && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, site_logo_url: "" })}
                    className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-secondary"
                  >
                    <X className="h-4 w-4" /> Remove
                  </button>
                )}
              </div>
            </div>
          </Field>

          <Field icon={LinkIcon} label="Website address (URL)" hint="Public address of this site. Auto-detected from the current browser if empty.">
            <div className="flex gap-2">
              <input
                type="url"
                value={form.site_url || ""}
                onChange={(e) => setForm({ ...form, site_url: e.target.value })}
                placeholder="https://example.com"
                className={inputCls}
              />
              <button
                type="button"
                onClick={() => setForm({ ...form, site_url: window.location.origin })}
                className="shrink-0 rounded-md border border-input bg-background px-3 text-xs hover:bg-secondary"
              >
                Use current
              </button>
            </div>
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

          <Field icon={Globe} label="Website time zone" hint="Used to display dates and times across the dashboard.">
            <ThemedSelect
              value={form.site_timezone || "Asia/Qatar"}
              onChange={(e) => setForm({ ...form, site_timezone: e.target.value })}
              className={inputCls}
            >
              {Array.from(new Set([...(form.site_timezone ? [form.site_timezone] : []), ...TIMEZONES])).map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </ThemedSelect>
          </Field>

          <Field icon={Calendar} label="Date format">
            <ThemedSelect
              value={form.date_format || "MMMM d, yyyy"}
              onChange={(e) => setForm({ ...form, date_format: e.target.value })}
              className={inputCls}
            >
              <option value="MMMM d, yyyy">November 6, 2025</option>
              <option value="yyyy-MM-dd">2025-11-06</option>
              <option value="dd/MM/yyyy">06/11/2025</option>
              <option value="MM/dd/yyyy">11/06/2025</option>
              <option value="d MMM yyyy">6 Nov 2025</option>
            </ThemedSelect>
          </Field>

          <Field icon={Clock} label="Time format">
            <ThemedSelect
              value={form.time_format || "h:mm a"}
              onChange={(e) => setForm({ ...form, time_format: e.target.value })}
              className={inputCls}
            >
              <option value="h:mm a">12-hour (3:45 PM)</option>
              <option value="HH:mm">24-hour (15:45)</option>
            </ThemedSelect>
          </Field>

          <Field icon={CalendarDays} label="Week starts on">
            <ThemedSelect
              value={form.week_starts_on || "monday"}
              onChange={(e) => setForm({ ...form, week_starts_on: e.target.value })}
              className={inputCls}
            >
              <option value="sunday">Sunday</option>
              <option value="monday">Monday</option>
              <option value="saturday">Saturday</option>
            </ThemedSelect>
          </Field>

          <Field icon={Globe} label="Default currency" hint="Used across the website for prices. Default: QAR.">
            <ThemedSelect
              value={form.site_currency || "QAR"}
              onChange={(e) => setForm({ ...form, site_currency: e.target.value })}
              className={inputCls}
            >
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </ThemedSelect>
          </Field>

          <Field icon={Globe} label="Default language" hint="Default interface language for the website. Default: English.">
            <ThemedSelect
              value={form.site_language || "en"}
              onChange={(e) => setForm({ ...form, site_language: e.target.value })}
              className={inputCls}
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>{l.label}</option>
              ))}
            </ThemedSelect>
          </Field>
        </div>
      )}

      {tab === "auth" && (
        <div className="space-y-4 rounded-xl border border-border bg-secondary/30 p-4">
          <div>
            <h4 className="font-display text-base font-semibold">Auth pages appearance</h4>
            <p className="text-xs text-muted-foreground">Background color and optional image shown on Sign in, Sign up, Forgot password, and Reset password screens.</p>
          </div>

          <Field icon={Type} label="Brand heading" hint="Shown under the logo. Leave empty to use the site title.">
            <input
              value={form.auth_heading || ""}
              onChange={(e) => setForm({ ...form, auth_heading: e.target.value })}
              placeholder="e.g. Ayesha Maison Qatar"
              className={inputCls}
            />
          </Field>

          <Field icon={Type} label="Subheading" hint="Optional small text under the brand heading.">
            <input
              value={form.auth_subheading || ""}
              onChange={(e) => setForm({ ...form, auth_subheading: e.target.value })}
              placeholder="Welcome to your luxury living portal"
              className={inputCls}
            />
          </Field>

          <Field icon={Type} label="Sign in heading">
            <input
              value={form.auth_signin_heading || ""}
              onChange={(e) => setForm({ ...form, auth_signin_heading: e.target.value })}
              placeholder="Welcome back"
              className={inputCls}
            />
          </Field>

          <Field icon={Type} label="Sign up heading">
            <input
              value={form.auth_signup_heading || ""}
              onChange={(e) => setForm({ ...form, auth_signup_heading: e.target.value })}
              placeholder="Create your account"
              className={inputCls}
            />
          </Field>


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
      )}

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
      )}
    </div>
  );
}

const inputCls = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60";

const TIMEZONES = [
  "UTC",
  "Asia/Qatar",
  "Asia/Dubai",
  "Asia/Riyadh",
  "Asia/Kolkata",
  "Asia/Dhaka",
  "Asia/Karachi",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Istanbul",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Australia/Sydney",
];

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

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
