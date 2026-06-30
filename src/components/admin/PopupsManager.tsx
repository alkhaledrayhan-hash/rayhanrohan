import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ThemedSelect } from "@/components/ui/themed-select";
import { ThemedColorInput } from "@/components/ui/themed-color-input";
import {
  Pencil, Plus, Trash2, Eye, Copy, Sparkles, Megaphone, Newspaper, Home as HomeIcon,
  X, Mail, Cookie, LogOut, ShieldAlert, Video, BarChart3, Palette, Target, Zap, FlaskConical, FileText,
  Columns2, Wand2, Layers,
} from "lucide-react";

type Popup = {
  id: string;
  name: string;
  template: string;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  image_url: string | null;
  cta_label: string | null;
  cta_url: string | null;
  secondary_cta_label: string | null;
  secondary_cta_url: string | null;
  collect_email: boolean;
  email_placeholder: string | null;
  target_type: string;
  target_value: string | null;
  trigger_type: string;
  scroll_threshold: number;
  device_target: string;
  visitor_target: string;
  delay_seconds: number;
  frequency: string;
  position: string;
  bg_color: string | null;
  text_color: string | null;
  accent_color: string | null;
  overlay_color: string | null;
  overlay_opacity: number;
  overlay_blur: number;
  animation: string;
  border_radius: number;
  shadow: string;
  font_family: string | null;
  title_size: number;
  body_size: number;
  variant_b: any;
  ab_split: number;
  start_at: string | null;
  end_at: string | null;
  is_active: boolean;
  priority: number;
  gradient_from: string | null;
  gradient_to: string | null;
  gradient_angle: number;
  glass_blur: number;
  glass_tint: number;
  glass_border: number;
};

const TEMPLATES: { id: string; label: string; icon: any; description: string; sample: Partial<Popup> }[] = [
  { id: "promotional", label: "Promotional", icon: Sparkles, description: "Banner image + headline + CTA.",
    sample: { template: "promotional", title: "Big Summer Sale", subtitle: "Limited time", body: "Get up to 25% off select listings.", cta_label: "Browse properties", cta_url: "/properties", image_url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200", accent_color: "#16a34a" } },
  { id: "offer", label: "Special Offer", icon: Megaphone, description: "Badge-style discount alert.",
    sample: { template: "offer", title: "Exclusive Offer", subtitle: "This week only", body: "Book a viewing this week and get free legal consultation.", cta_label: "See offer", cta_url: "/offers", accent_color: "#dc2626" } },
  { id: "hot-news", label: "Hot News", icon: Newspaper, description: "Bold news-style announcement.",
    sample: { template: "hot-news", title: "New Project Launched", subtitle: "Just announced", body: "Explore our newest residential tower in Lusail.", cta_label: "Read more", cta_url: "/news", accent_color: "#0ea5e9" } },
  { id: "real-estate", label: "Real Estate", icon: HomeIcon, description: "Property-style card.",
    sample: { template: "real-estate", title: "Featured Villa in Pearl", subtitle: "4 BR · 3 Bath", body: "Waterfront villa now available.", cta_label: "View property", cta_url: "/properties", image_url: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200", accent_color: "#0f766e" } },
  { id: "newsletter", label: "Newsletter", icon: Mail, description: "Email signup with capture form.",
    sample: { template: "newsletter", title: "Join our newsletter", subtitle: "Weekly insights", body: "Be the first to know about new listings and market trends.", cta_label: "Subscribe", collect_email: true, email_placeholder: "you@example.com", accent_color: "#6366f1" } },
  { id: "cookie", label: "Cookie Consent", icon: Cookie, description: "GDPR-style bottom banner.",
    sample: { template: "cookie", title: "We use cookies", body: "We use cookies to improve your experience. By using our site, you accept our cookie policy.", cta_label: "Accept", secondary_cta_label: "Decline", position: "bottom-right", accent_color: "#0f172a", frequency: "once" } },
  { id: "exit-intent", label: "Exit Intent", icon: LogOut, description: "Triggers when user moves to leave.",
    sample: { template: "exit-intent", title: "Wait! Don't leave yet", subtitle: "Special offer inside", body: "Get a free property consultation before you go.", cta_label: "Yes, I'm interested", trigger_type: "exit_intent", accent_color: "#f59e0b" } },
  { id: "age-verify", label: "Age Verification", icon: ShieldAlert, description: "Confirm visitor is 18+.",
    sample: { template: "age-verify", title: "Are you 18 or older?", body: "This site contains content intended for adults only.", cta_label: "Yes, I am 18+", secondary_cta_label: "No, exit", frequency: "once", accent_color: "#7c3aed" } },
  { id: "video", label: "Video Popup", icon: Video, description: "Embed a YouTube/Vimeo video.",
    sample: { template: "video", title: "See the property tour", body: "https://www.youtube.com/embed/dQw4w9WgXcQ", cta_label: "Explore listings", cta_url: "/properties", accent_color: "#ef4444" } },
  { id: "split-image", label: "Split — Image Left", icon: Columns2, description: "Image on the left, headline + CTA on the right.",
    sample: { template: "split-image", title: "Discover your next home", subtitle: "Curated picks", body: "Hand-selected listings updated weekly by our experts.", cta_label: "View collection", cta_url: "/properties", image_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200", accent_color: "#0f766e" } },
  { id: "gradient-hero", label: "Gradient Hero", icon: Wand2, description: "No image — bold gradient background with text on top.",
    sample: { template: "gradient-hero", title: "Limited-time launch", subtitle: "Early access", body: "Lock in launch pricing before public release.", cta_label: "Get early access", cta_url: "/offers", accent_color: "#7c3aed", text_color: "#ffffff" } },
  { id: "glass-card", label: "Frosted Glass", icon: Layers, description: "Frosted glass card with decorative gradient blobs.",
    sample: { template: "glass-card", title: "Become a member", subtitle: "Members only", body: "Unlock private listings, early access, and partner perks.", cta_label: "Join now", cta_url: "/auth", accent_color: "#0ea5e9" } },
];

function emptyPopup(): Partial<Popup> {
  return {
    name: "", template: "promotional",
    title: "", subtitle: "", body: "", image_url: "",
    cta_label: "", cta_url: "",
    secondary_cta_label: "", secondary_cta_url: "",
    collect_email: false, email_placeholder: "Your email",
    target_type: "all", target_value: "",
    trigger_type: "time", scroll_threshold: 50,
    device_target: "all", visitor_target: "all",
    delay_seconds: 2, frequency: "session", position: "center",
    bg_color: "#ffffff", text_color: "#0f172a", accent_color: "#16a34a",
    overlay_color: "#000000", overlay_opacity: 50, overlay_blur: 4,
    animation: "fade", border_radius: 16, shadow: "xl",
    font_family: "", title_size: 24, body_size: 14,
    variant_b: null, ab_split: 0,
    is_active: true, priority: 0,
  };
}

type Tab = "content" | "design" | "targeting" | "triggers" | "schedule" | "abtest" | "analytics";

export function PopupsManager() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Popup> | null>(null);
  const [previewOf, setPreviewOf] = useState<Popup | null>(null);
  const [statsOf, setStatsOf] = useState<Popup | null>(null);

  const { data: popups, isLoading } = useQuery({
    queryKey: ["admin", "popups"],
    queryFn: async () => {
      const { data, error } = await supabase.from("popups").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Popup[];
    },
  });

  const save = useMutation({
    mutationFn: async (p: Partial<Popup>) => {
      const payload: any = {
        name: p.name?.trim() || "Untitled popup",
        template: p.template ?? "promotional",
        title: p.title || null, subtitle: p.subtitle || null, body: p.body || null,
        image_url: p.image_url || null,
        cta_label: p.cta_label || null, cta_url: p.cta_url || null,
        secondary_cta_label: p.secondary_cta_label || null, secondary_cta_url: p.secondary_cta_url || null,
        collect_email: !!p.collect_email, email_placeholder: p.email_placeholder || null,
        target_type: p.target_type ?? "all", target_value: p.target_value || null,
        trigger_type: p.trigger_type ?? "time", scroll_threshold: Number(p.scroll_threshold ?? 50),
        device_target: p.device_target ?? "all", visitor_target: p.visitor_target ?? "all",
        delay_seconds: Number(p.delay_seconds ?? 2),
        frequency: p.frequency ?? "session", position: p.position ?? "center",
        bg_color: p.bg_color || null, text_color: p.text_color || null, accent_color: p.accent_color || null,
        overlay_color: p.overlay_color || null,
        overlay_opacity: Number(p.overlay_opacity ?? 50),
        overlay_blur: Number(p.overlay_blur ?? 4),
        animation: p.animation ?? "fade",
        border_radius: Number(p.border_radius ?? 16),
        shadow: p.shadow ?? "xl",
        font_family: p.font_family || null,
        title_size: Number(p.title_size ?? 24),
        body_size: Number(p.body_size ?? 14),
        variant_b: p.variant_b ?? null,
        ab_split: Number(p.ab_split ?? 0),
        start_at: p.start_at || null, end_at: p.end_at || null,
        is_active: p.is_active ?? true, priority: Number(p.priority ?? 0),
      };
      if (p.id) {
        const { error } = await supabase.from("popups").update(payload).eq("id", p.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("popups").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Popup saved");
      qc.invalidateQueries({ queryKey: ["admin", "popups"] });
      setEditing(null);
    },
    onError: (e: any) => toast.error(e.message || "Could not save popup"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("popups").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Popup deleted");
      qc.invalidateQueries({ queryKey: ["admin", "popups"] });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async (p: Popup) => {
      const { error } = await supabase.from("popups").update({ is_active: !p.is_active }).eq("id", p.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "popups"] }),
  });

  const newFromTemplate = (templateId: string) => {
    const tpl = TEMPLATES.find((t) => t.id === templateId);
    setEditing({ ...emptyPopup(), ...(tpl?.sample as any), name: tpl?.label || "New popup" });
  };

  return (
    <div className="space-y-6">
      {/* Templates */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-semibold">Start from a template</h2>
            <p className="text-xs text-muted-foreground">{TEMPLATES.length} templates · pick one, then customize.</p>
          </div>
          <button
            onClick={() => setEditing(emptyPopup())}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Blank popup
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {TEMPLATES.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => newFromTemplate(t.id)}
                className="rounded-xl border border-border bg-background p-4 text-left transition hover:border-primary hover:shadow-md"
              >
                <Icon className="h-5 w-5 text-primary" />
                <div className="mt-2 font-semibold text-sm">{t.label}</div>
                <div className="mt-1 text-xs text-muted-foreground">{t.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        <h2 className="font-display text-lg font-semibold">All popups</h2>
        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : !popups || popups.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">No popups yet. Create one from a template above.</div>
        ) : (
          <div className="mt-3 grid gap-3">
            {popups.map((p) => (
              <div key={p.id} className="rounded-xl border border-border bg-background p-3 sm:p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-semibold">{p.name}</div>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide">{p.template}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide ${p.is_active ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                        {p.is_active ? "Active" : "Off"}
                      </span>
                      {p.ab_split > 0 && (
                        <span className="rounded-full bg-purple-100 text-purple-700 px-2 py-0.5 text-[10px] uppercase tracking-wide">A/B {p.ab_split}%</span>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Target: {p.target_type === "all" ? "Entire site" : `${p.target_type} · ${p.target_value || "—"}`} · Trigger: {p.trigger_type || "time"} · Device: {p.device_target || "all"}
                    </div>
                    {p.title && <div className="mt-1 truncate text-sm">{p.title}</div>}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <button onClick={() => setStatsOf(p)} className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted">
                      <BarChart3 className="h-3.5 w-3.5" /> Stats
                    </button>
                    <button onClick={() => setPreviewOf(p)} className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted">
                      <Eye className="h-3.5 w-3.5" /> Preview
                    </button>
                    <button onClick={() => toggleActive.mutate(p)} className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted">
                      {p.is_active ? "Disable" : "Enable"}
                    </button>
                    <button
                      onClick={() => setEditing({ ...p, id: undefined as any, name: `${p.name} (copy)` })}
                      className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted"
                    >
                      <Copy className="h-3.5 w-3.5" /> Duplicate
                    </button>
                    <button onClick={() => setEditing(p)} className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted">
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${p.name}"?`)) remove.mutate(p.id);
                      }}
                      className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-xs text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <EditorModal
          value={editing}
          onChange={setEditing}
          onClose={() => setEditing(null)}
          onSave={() => save.mutate(editing)}
          saving={save.isPending}
        />
      )}

      {previewOf && <PreviewModal popup={previewOf} onClose={() => setPreviewOf(null)} />}
      {statsOf && <StatsModal popup={statsOf} onClose={() => setStatsOf(null)} />}
    </div>
  );
}

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "content", label: "Content", icon: FileText },
  { id: "design", label: "Design", icon: Palette },
  { id: "targeting", label: "Targeting", icon: Target },
  { id: "triggers", label: "Triggers", icon: Zap },
  { id: "schedule", label: "Schedule", icon: Sparkles },
  { id: "abtest", label: "A/B Test", icon: FlaskConical },
];

function EditorModal({
  value, onChange, onClose, onSave, saving,
}: {
  value: Partial<Popup>;
  onChange: (v: Partial<Popup>) => void;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  const [tab, setTab] = useState<Tab>("content");
  const [previewVariant, setPreviewVariant] = useState<"a" | "b">("a");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">(
    value.device_target === "mobile" ? "mobile" : "desktop"
  );
  const set = (patch: Partial<Popup>) => onChange({ ...value, ...patch });

  return (
    <div className="popup-editor fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:p-8">
      <div className="w-full max-w-6xl rounded-2xl bg-card shadow-2xl">

        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="font-display text-lg font-semibold">{value.id ? "Edit popup" : "New popup"}</h3>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>

        {/* Tab bar */}
        <div className="flex flex-wrap gap-1 border-b border-border bg-muted/30 px-2 py-2">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition ${active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-background"}`}
              >
                <Icon className="h-3.5 w-3.5" /> {t.label}
              </button>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
          <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-2 content-start">
            {tab === "content" && <ContentTab value={value} set={set} />}
            {tab === "design" && <DesignTab value={value} set={set} />}
            {tab === "targeting" && <TargetingTab value={value} set={set} />}
            {tab === "triggers" && <TriggersTab value={value} set={set} />}
            {tab === "schedule" && <ScheduleTab value={value} set={set} />}
            {tab === "abtest" && <ABTestTab value={value} set={set} />}
          </div>

          {/* Live preview */}
          <div className="border-t border-border bg-muted/20 p-4 lg:border-l lg:border-t-0">
            <div className="space-y-3 lg:sticky lg:top-4">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Live preview</div>
                <div className="flex gap-1">
                  <button onClick={() => setPreviewDevice("desktop")} className={`rounded-md px-2 py-1 text-[11px] ${previewDevice === "desktop" ? "bg-primary text-primary-foreground" : "border border-border"}`}>Desktop</button>
                  <button onClick={() => setPreviewDevice("mobile")} className={`rounded-md px-2 py-1 text-[11px] ${previewDevice === "mobile" ? "bg-primary text-primary-foreground" : "border border-border"}`}>Mobile</button>
                </div>
              </div>
              {(value.ab_split ?? 0) > 0 && (
                <div className="flex gap-1">
                  <button onClick={() => setPreviewVariant("a")} className={`flex-1 rounded-md px-2 py-1 text-[11px] ${previewVariant === "a" ? "bg-primary text-primary-foreground" : "border border-border"}`}>Variant A</button>
                  <button onClick={() => setPreviewVariant("b")} className={`flex-1 rounded-md px-2 py-1 text-[11px] ${previewVariant === "b" ? "bg-primary text-primary-foreground" : "border border-border"}`}>Variant B</button>
                </div>
              )}
              <LivePreview popup={value} device={previewDevice} variant={previewVariant} />
              <TargetingSummary popup={value} />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border p-4">
          <button onClick={onClose} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">Cancel</button>
          <button onClick={onSave} disabled={saving} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60">
            {saving ? "Saving…" : "Save popup"}
          </button>
        </div>
      </div>

      <style>{`.input { width:100%; border:1px solid hsl(var(--border)); background: hsl(var(--background)); border-radius:0.5rem; padding:0.5rem 0.75rem; font-size:0.875rem; }`}</style>
    </div>
  );
}

const SHADOW_MAP: Record<string, string> = {
  none: "none",
  sm: "0 1px 2px rgba(0,0,0,.08)",
  md: "0 4px 12px rgba(0,0,0,.1)",
  lg: "0 10px 25px rgba(0,0,0,.15)",
  xl: "0 25px 50px -12px rgba(0,0,0,.25)",
  "2xl": "0 35px 60px -15px rgba(0,0,0,.35)",
};

function hexAlpha(hex: string, opacity: number) {
  const clean = (hex || "#000000").replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(0,0,0,${opacity / 100})`;
  return `rgba(${r},${g},${b},${opacity / 100})`;
}

function LivePreview({ popup, device, variant }: { popup: Partial<Popup>; device: "desktop" | "mobile"; variant: "a" | "b" }) {
  const vb = variant === "b" && popup.variant_b ? popup.variant_b : {};
  const title = vb.title ?? popup.title;
  const body = vb.body ?? popup.body;
  const ctaLabel = vb.cta_label ?? popup.cta_label;
  const accent = vb.accent_color || popup.accent_color || "#16a34a";
  const bg = popup.bg_color || "#ffffff";
  const text = popup.text_color || "#0f172a";
  const radius = popup.border_radius ?? 16;
  const shadowVal = SHADOW_MAP[popup.shadow || "xl"] ?? SHADOW_MAP.xl;
  const position = popup.position || "center";

  const stageH = device === "mobile" ? 520 : 360;
  const stageW = device === "mobile" ? 270 : "100%";

  const isCorner = position === "bottom-right";
  const isBanner = position === "bottom" || position === "top";

  const align =
    position === "bottom-right" ? "items-end justify-end p-3"
      : position === "bottom" ? "items-end justify-center pb-3"
        : position === "top" ? "items-start justify-center pt-4"
          : "items-center justify-center p-3";

  const overlayBg = position === "center"
    ? hexAlpha(popup.overlay_color || "#000000", popup.overlay_opacity ?? 50)
    : "transparent";

  const cardW = isCorner ? 200 : isBanner ? "94%" : device === "mobile" ? 230 : 300;

  const isSplit = popup.template === "split-image";
  const isGradient = popup.template === "gradient-hero";
  const isGlass = popup.template === "glass-card";

  const cardBg = isGradient
    ? `linear-gradient(135deg, ${accent}, ${shiftHex(accent, -40)})`
    : isGlass
      ? `linear-gradient(135deg, ${hexAlpha(accent, 15)}, ${hexAlpha(accent, 5)}), ${bg}`
      : bg;

  return (
    <div className="mx-auto overflow-hidden rounded-xl border border-border bg-[linear-gradient(135deg,#f8fafc,#e2e8f0)] shadow-inner" style={{ width: stageW, height: stageH, maxWidth: "100%" }}>
      <div className={`relative h-full w-full flex ${align}`} style={{ background: overlayBg, backdropFilter: position === "center" && (popup.overlay_blur ?? 0) > 0 ? `blur(${Math.min(popup.overlay_blur ?? 0, 12)}px)` : undefined }}>
        <div className="relative overflow-hidden" style={{ width: isSplit ? Math.min(Number(cardW) + 80, device === "mobile" ? 250 : 360) : cardW, background: cardBg, color: text, borderRadius: radius, boxShadow: shadowVal, fontFamily: popup.font_family || undefined, maxHeight: "95%", border: isGlass ? `1px solid ${hexAlpha(accent, 25)}` : undefined }}>
          <div className="absolute right-2 top-2 z-10 rounded-full bg-black/10 p-1"><X className="h-3 w-3" /></div>
          {(isGradient || isGlass) && (
            <>
              <div className="pointer-events-none absolute -left-6 -top-6 h-20 w-20 rounded-full opacity-40 blur-2xl" style={{ background: shiftHex(accent, 60) }} />
              <div className="pointer-events-none absolute -bottom-8 -right-6 h-24 w-24 rounded-full opacity-30 blur-2xl" style={{ background: shiftHex(accent, -30) }} />
            </>
          )}
          {isSplit ? (
            <div className="grid grid-cols-2">
              <div className="relative" style={{ minHeight: 120 }}>
                {popup.image_url ? (
                  <img src={popup.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${accent}, ${shiftHex(accent, -40)})` }} />
                )}
              </div>
              <PreviewBody popup={popup} title={title} body={body} ctaLabel={ctaLabel} accent={accent} />
            </div>
          ) : (
            <>
              {popup.template === "video" && body?.startsWith("http") ? (
                <div className="flex aspect-video w-full items-center justify-center bg-black/80 text-[10px] text-white">Video embed</div>
              ) : popup.image_url && !isGradient && !isGlass ? (
                <img src={popup.image_url} alt="" className={`w-full object-cover ${isCorner ? "h-16" : "h-20"}`} />
              ) : null}
              {(popup.template === "hot-news" || popup.template === "offer") && (
                <div className="relative px-3 pt-3">
                  <span className="inline-block rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white" style={{ background: accent }}>
                    {popup.template === "hot-news" ? "Hot News" : "Special Offer"}
                  </span>
                </div>
              )}
              <PreviewBody popup={popup} title={title} body={body} ctaLabel={ctaLabel} accent={accent} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PreviewBody({ popup, title, body, ctaLabel, accent }: { popup: Partial<Popup>; title?: string | null; body?: string | null; ctaLabel?: string | null; accent: string }) {
  return (
    <div className="relative p-3" style={{ fontSize: Math.max(10, Math.min((popup.body_size ?? 14) * 0.78, 13)) }}>
      {popup.subtitle && <div className="mb-0.5 text-[9px] font-medium uppercase tracking-wider opacity-70">{popup.subtitle}</div>}
      {title && <div className="font-display font-semibold leading-tight" style={{ fontSize: Math.max(12, Math.min((popup.title_size ?? 24) * 0.6, 18)) }}>{title}</div>}
      {body && popup.template !== "video" && <p className="mt-1 line-clamp-3 opacity-80">{body}</p>}
      {popup.collect_email && (
        <div className="mt-2 rounded border border-current/20 bg-white/90 px-2 py-1 text-[10px] text-slate-500">{popup.email_placeholder || "you@example.com"}</div>
      )}
      <div className="mt-2 flex flex-wrap gap-1">
        {ctaLabel && <span className="rounded px-2 py-1 text-[10px] font-semibold text-white" style={{ background: accent }}>{ctaLabel}</span>}
        {popup.secondary_cta_label && <span className="rounded border border-current/40 px-2 py-1 text-[10px] font-semibold">{popup.secondary_cta_label}</span>}
      </div>
    </div>
  );
}

function shiftHex(color: string, amount: number) {
  if (!color || !color.startsWith("#")) return color || "#000000";
  const clean = color.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return color;
  const s = (v: number) => Math.max(0, Math.min(255, v + amount));
  const hex = (n: number) => s(n).toString(16).padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}


function TargetingSummary({ popup }: { popup: Partial<Popup> }) {
  const chips: string[] = [];
  chips.push(popup.target_type === "all" ? "Entire site" : `${popup.target_type}: ${popup.target_value || "—"}`);
  const trig = popup.trigger_type || "time";
  chips.push(
    `Trigger: ${trig}${trig === "time" || trig === "time_and_scroll" ? ` · ${popup.delay_seconds ?? 0}s` : ""}${trig === "scroll" || trig === "time_and_scroll" ? ` · ${popup.scroll_threshold ?? 50}%` : ""}`
  );
  chips.push(`Device: ${popup.device_target || "all"}`);
  chips.push(`Visitors: ${popup.visitor_target || "all"}`);
  chips.push(`Freq: ${popup.frequency || "session"}`);
  if ((popup.ab_split ?? 0) > 0) chips.push(`A/B ${popup.ab_split}%`);
  return (
    <div className="flex flex-wrap gap-1">
      {chips.map((c, i) => (
        <span key={i} className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] text-muted-foreground">{c}</span>
      ))}
    </div>
  );
}

function ContentTab({ value, set }: { value: Partial<Popup>; set: (p: Partial<Popup>) => void }) {
  return (
    <>
      <Field label="Name (internal)">
        <input className="input" value={value.name || ""} onChange={(e) => set({ name: e.target.value })} />
      </Field>
      <Field label="Template">
        <ThemedSelect value={value.template || "promotional"} onValueChange={(v) => set({ template: v })}
          options={TEMPLATES.map((t) => ({ value: t.id, label: t.label }))} />
      </Field>
      <Field label="Subtitle / eyebrow">
        <input className="input" value={value.subtitle || ""} onChange={(e) => set({ subtitle: e.target.value })} />
      </Field>
      <Field label="Title">
        <input className="input" value={value.title || ""} onChange={(e) => set({ title: e.target.value })} />
      </Field>
      <Field label={value.template === "video" ? "Video embed URL" : "Body"} full>
        <textarea className="input min-h-[90px]" value={value.body || ""} onChange={(e) => set({ body: e.target.value })}
          placeholder={value.template === "video" ? "https://www.youtube.com/embed/..." : ""} />
      </Field>
      <Field label="Image URL">
        <input className="input" value={value.image_url || ""} onChange={(e) => set({ image_url: e.target.value })} placeholder="https://…" />
      </Field>
      <Field label="Primary CTA label">
        <input className="input" value={value.cta_label || ""} onChange={(e) => set({ cta_label: e.target.value })} />
      </Field>
      <Field label="Primary CTA URL" full>
        <input className="input" value={value.cta_url || ""} onChange={(e) => set({ cta_url: e.target.value })} placeholder="/properties or https://…" />
      </Field>
      <Field label="Secondary CTA label (optional)">
        <input className="input" value={value.secondary_cta_label || ""} onChange={(e) => set({ secondary_cta_label: e.target.value })} placeholder="No thanks" />
      </Field>
      <Field label="Secondary CTA URL (optional)">
        <input className="input" value={value.secondary_cta_url || ""} onChange={(e) => set({ secondary_cta_url: e.target.value })} placeholder="Leave blank to dismiss" />
      </Field>
      <label className="flex items-center gap-2 md:col-span-2 mt-2">
        <input type="checkbox" checked={!!value.collect_email} onChange={(e) => set({ collect_email: e.target.checked })} />
        <span className="text-sm">Collect email address (shows input above CTA)</span>
      </label>
      {value.collect_email && (
        <Field label="Email field placeholder" full>
          <input className="input" value={value.email_placeholder || ""} onChange={(e) => set({ email_placeholder: e.target.value })} placeholder="you@example.com" />
        </Field>
      )}
    </>
  );
}

function DesignTab({ value, set }: { value: Partial<Popup>; set: (p: Partial<Popup>) => void }) {
  return (
    <>
      <Field label="Position">
        <ThemedSelect value={value.position || "center"} onValueChange={(v) => set({ position: v })}
          options={[
            { value: "center", label: "Center modal" },
            { value: "bottom-right", label: "Bottom right corner" },
            { value: "bottom", label: "Bottom banner" },
            { value: "top", label: "Top banner" },
          ]} />
      </Field>
      <Field label="Entry animation">
        <ThemedSelect value={value.animation || "fade"} onValueChange={(v) => set({ animation: v })}
          options={[
            { value: "fade", label: "Fade" },
            { value: "zoom", label: "Zoom in" },
            { value: "slide-up", label: "Slide up" },
            { value: "slide-down", label: "Slide down" },
            { value: "bounce", label: "Bounce" },
            { value: "none", label: "None" },
          ]} />
      </Field>
      <Field label="Background color">
        <ThemedColorInput value={value.bg_color || "#ffffff"} onChange={(v) => set({ bg_color: v })} />
      </Field>
      <Field label="Text color">
        <ThemedColorInput value={value.text_color || "#0f172a"} onChange={(v) => set({ text_color: v })} />
      </Field>
      <Field label="Accent / CTA color">
        <ThemedColorInput value={value.accent_color || "#16a34a"} onChange={(v) => set({ accent_color: v })} />
      </Field>
      <Field label="Border radius (px)">
        <input type="number" min={0} max={48} className="input" value={value.border_radius ?? 16} onChange={(e) => set({ border_radius: Number(e.target.value) })} />
      </Field>
      <Field label="Shadow">
        <ThemedSelect value={value.shadow || "xl"} onValueChange={(v) => set({ shadow: v })}
          options={[
            { value: "none", label: "None" },
            { value: "sm", label: "Small" },
            { value: "md", label: "Medium" },
            { value: "lg", label: "Large" },
            { value: "xl", label: "Extra large" },
            { value: "2xl", label: "Dramatic" },
          ]} />
      </Field>
      <Field label="Font family (CSS family, optional)">
        <input className="input" value={value.font_family || ""} onChange={(e) => set({ font_family: e.target.value })} placeholder="Inter, system-ui, sans-serif" />
      </Field>
      <Field label="Title size (px)">
        <input type="number" min={12} max={64} className="input" value={value.title_size ?? 24} onChange={(e) => set({ title_size: Number(e.target.value) })} />
      </Field>
      <Field label="Body size (px)">
        <input type="number" min={10} max={28} className="input" value={value.body_size ?? 14} onChange={(e) => set({ body_size: Number(e.target.value) })} />
      </Field>
      <div className="md:col-span-2 rounded-xl border border-border bg-muted/30 p-3 space-y-3">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Backdrop overlay</div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Overlay color">
            <ThemedColorInput value={value.overlay_color || "#000000"} onChange={(v) => set({ overlay_color: v })} />
          </Field>
          <Field label={`Opacity ${value.overlay_opacity ?? 50}%`}>
            <input type="range" min={0} max={100} value={value.overlay_opacity ?? 50} onChange={(e) => set({ overlay_opacity: Number(e.target.value) })} className="w-full" />
          </Field>
          <Field label={`Blur ${value.overlay_blur ?? 4}px`}>
            <input type="range" min={0} max={20} value={value.overlay_blur ?? 4} onChange={(e) => set({ overlay_blur: Number(e.target.value) })} className="w-full" />
          </Field>
        </div>
      </div>
    </>
  );
}

function TargetingTab({ value, set }: { value: Partial<Popup>; set: (p: Partial<Popup>) => void }) {
  return (
    <>
      <Field label="Target type">
        <ThemedSelect value={value.target_type || "all"} onValueChange={(v) => set({ target_type: v })}
          options={[
            { value: "all", label: "Entire site" },
            { value: "route", label: "Specific page (exact path)" },
            { value: "prefix", label: "Path prefix" },
          ]} />
      </Field>
      <Field label="Target value (path)">
        <input className="input" value={value.target_value || ""} onChange={(e) => set({ target_value: e.target.value })}
          disabled={value.target_type === "all"} placeholder={value.target_type === "all" ? "—" : "/offers"} />
      </Field>
      <Field label="Device target">
        <ThemedSelect value={value.device_target || "all"} onValueChange={(v) => set({ device_target: v })}
          options={[
            { value: "all", label: "All devices" },
            { value: "desktop", label: "Desktop only" },
            { value: "mobile", label: "Mobile only" },
          ]} />
      </Field>
      <Field label="Visitor target">
        <ThemedSelect value={value.visitor_target || "all"} onValueChange={(v) => set({ visitor_target: v })}
          options={[
            { value: "all", label: "All visitors" },
            { value: "new", label: "New visitors only" },
            { value: "returning", label: "Returning visitors only" },
          ]} />
      </Field>
      <Field label="Frequency">
        <ThemedSelect value={value.frequency || "session"} onValueChange={(v) => set({ frequency: v })}
          options={[
            { value: "always", label: "Always show" },
            { value: "session", label: "Once per session" },
            { value: "once", label: "Only once (ever)" },
          ]} />
      </Field>
      <Field label="Priority (higher = wins)">
        <input type="number" className="input" value={value.priority ?? 0} onChange={(e) => set({ priority: Number(e.target.value) })} />
      </Field>
    </>
  );
}

function TriggersTab({ value, set }: { value: Partial<Popup>; set: (p: Partial<Popup>) => void }) {
  return (
    <>
      <Field label="Trigger type">
        <ThemedSelect value={value.trigger_type || "time"} onValueChange={(v) => set({ trigger_type: v })}
          options={[
            { value: "time", label: "Time delay" },
            { value: "exit_intent", label: "Exit intent (mouse leaves)" },
            { value: "scroll", label: "Scroll percentage" },
            { value: "time_and_scroll", label: "Time + scroll (both)" },
          ]} />
      </Field>
      <Field label="Delay (seconds)">
        <input type="number" min={0} className="input" value={value.delay_seconds ?? 2} onChange={(e) => set({ delay_seconds: Number(e.target.value) })}
          disabled={value.trigger_type === "exit_intent" || value.trigger_type === "scroll"} />
      </Field>
      <Field label={`Scroll threshold (${value.scroll_threshold ?? 50}%)`} full>
        <input type="range" min={5} max={100} value={value.scroll_threshold ?? 50} onChange={(e) => set({ scroll_threshold: Number(e.target.value) })}
          className="w-full" disabled={value.trigger_type === "time" || value.trigger_type === "exit_intent"} />
        <div className="mt-1 text-xs text-muted-foreground">Used for "Scroll" and "Time + scroll" triggers.</div>
      </Field>
    </>
  );
}

function ScheduleTab({ value, set }: { value: Partial<Popup>; set: (p: Partial<Popup>) => void }) {
  return (
    <>
      <Field label="Start date (optional)">
        <input type="datetime-local" className="input" value={toLocalInput(value.start_at)} onChange={(e) => set({ start_at: fromLocalInput(e.target.value) })} />
      </Field>
      <Field label="End date (optional)">
        <input type="datetime-local" className="input" value={toLocalInput(value.end_at)} onChange={(e) => set({ end_at: fromLocalInput(e.target.value) })} />
      </Field>
      <label className="flex items-center gap-2 md:col-span-2">
        <input type="checkbox" checked={!!value.is_active} onChange={(e) => set({ is_active: e.target.checked })} />
        <span className="text-sm">Active</span>
      </label>
    </>
  );
}

function ABTestTab({ value, set }: { value: Partial<Popup>; set: (p: Partial<Popup>) => void }) {
  const variant = value.variant_b || {};
  const setV = (patch: any) => set({ variant_b: { ...variant, ...patch } });
  return (
    <>
      <Field label={`A/B split — % of viewers shown variant B (${value.ab_split ?? 0}%)`} full>
        <input type="range" min={0} max={100} value={value.ab_split ?? 0} onChange={(e) => set({ ab_split: Number(e.target.value) })} className="w-full" />
        <div className="mt-1 text-xs text-muted-foreground">Set to 0 to disable the A/B test.</div>
      </Field>
      {(value.ab_split ?? 0) > 0 && (
        <>
          <Field label="Variant B title">
            <input className="input" value={variant.title || ""} onChange={(e) => setV({ title: e.target.value })} />
          </Field>
          <Field label="Variant B CTA label">
            <input className="input" value={variant.cta_label || ""} onChange={(e) => setV({ cta_label: e.target.value })} />
          </Field>
          <Field label="Variant B body" full>
            <textarea className="input min-h-[80px]" value={variant.body || ""} onChange={(e) => setV({ body: e.target.value })} />
          </Field>
          <Field label="Variant B accent color">
            <ThemedColorInput value={variant.accent_color || value.accent_color || "#16a34a"} onChange={(v) => setV({ accent_color: v })} />
          </Field>
        </>
      )}
    </>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={`block ${full ? "md:col-span-2" : ""}`}>
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function PreviewModal({ popup, onClose }: { popup: Popup; onClose: () => void }) {
  const accent = popup.accent_color || "#16a34a";
  const bg = popup.bg_color || "#ffffff";
  const text = popup.text_color || "#0f172a";
  const radius = popup.border_radius ?? 16;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md overflow-hidden shadow-2xl" style={{ background: bg, color: text, borderRadius: radius, fontFamily: popup.font_family || undefined }} onClick={(e) => e.stopPropagation()}>
        {popup.template === "video" && popup.body?.startsWith("http") ? (
          <div className="aspect-video w-full"><iframe src={popup.body} className="h-full w-full" allowFullScreen /></div>
        ) : popup.image_url ? (
          <img src={popup.image_url} alt="" className="h-44 w-full object-cover" />
        ) : null}
        <div className="p-5" style={{ fontSize: popup.body_size ?? 14 }}>
          {popup.subtitle && <div className="mb-1 text-xs font-medium uppercase tracking-wider opacity-70">{popup.subtitle}</div>}
          {popup.title && <h3 className="font-display font-semibold" style={{ fontSize: popup.title_size ?? 24 }}>{popup.title}</h3>}
          {popup.body && popup.template !== "video" && <p className="mt-2 opacity-80 whitespace-pre-line">{popup.body}</p>}
          {popup.collect_email && <input className="mt-3 w-full rounded-md border border-border bg-white/80 px-3 py-2 text-sm text-slate-900" placeholder={popup.email_placeholder || "you@example.com"} />}
          <div className="mt-4 flex flex-wrap gap-2">
            {popup.cta_label && (
              <button className="inline-flex rounded-md px-4 py-2 text-sm font-semibold text-white" style={{ background: accent }}>{popup.cta_label}</button>
            )}
            {popup.secondary_cta_label && (
              <button className="inline-flex rounded-md border border-current px-4 py-2 text-sm font-semibold">{popup.secondary_cta_label}</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsModal({ popup, onClose }: { popup: Popup; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "popup-events", popup.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("popup_events")
        .select("event_type, variant, occurred_at")
        .eq("popup_id", popup.id);
      if (error) throw error;
      return data as { event_type: string; variant: string; occurred_at: string }[];
    },
  });

  const stats = useMemo(() => {
    const out = { a: { view: 0, click: 0, dismiss: 0, conversion: 0 }, b: { view: 0, click: 0, dismiss: 0, conversion: 0 } } as any;
    (data || []).forEach((e) => {
      const v = e.variant === "b" ? "b" : "a";
      if (out[v][e.event_type] !== undefined) out[v][e.event_type] += 1;
    });
    return out;
  }, [data]);

  const rate = (clicks: number, views: number) => views > 0 ? ((clicks / views) * 100).toFixed(1) + "%" : "—";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-2xl bg-card shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="font-display text-lg font-semibold">Stats · {popup.name}</h3>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-5">
          {isLoading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">Loading…</div>
          ) : (
            <div className={`grid gap-4 ${popup.ab_split > 0 ? "sm:grid-cols-2" : ""}`}>
              <VariantStats name={popup.ab_split > 0 ? "Variant A" : "All time"} stats={stats.a} rate={rate} />
              {popup.ab_split > 0 && <VariantStats name="Variant B" stats={stats.b} rate={rate} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function VariantStats({ name, stats, rate }: { name: string; stats: any; rate: (a: number, b: number) => string }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <div className="font-semibold mb-3">{name}</div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <Stat label="Views" value={stats.view} />
        <Stat label="Clicks" value={stats.click} />
        <Stat label="Dismissed" value={stats.dismiss} />
        <Stat label="Conversions" value={stats.conversion} />
      </div>
      <div className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
        CTR: <span className="font-semibold text-foreground">{rate(stats.click, stats.view)}</span> · Conv rate: <span className="font-semibold text-foreground">{rate(stats.conversion, stats.view)}</span>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-muted/40 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}

function toLocalInput(v: string | null | undefined) {
  if (!v) return "";
  try {
    const d = new Date(v);
    const off = d.getTimezoneOffset();
    const local = new Date(d.getTime() - off * 60000);
    return local.toISOString().slice(0, 16);
  } catch { return ""; }
}
function fromLocalInput(v: string) {
  if (!v) return null as any;
  return new Date(v).toISOString();
}
