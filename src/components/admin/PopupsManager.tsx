import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ThemedSelect } from "@/components/ui/themed-select";
import { Pencil, Plus, Trash2, Eye, Copy, Sparkles, Megaphone, Newspaper, Home as HomeIcon, X } from "lucide-react";

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
  target_type: string;
  target_value: string | null;
  delay_seconds: number;
  frequency: string;
  position: string;
  bg_color: string | null;
  text_color: string | null;
  accent_color: string | null;
  start_at: string | null;
  end_at: string | null;
  is_active: boolean;
  priority: number;
};

const TEMPLATES = [
  {
    id: "promotional",
    label: "Promotional",
    icon: Sparkles,
    description: "Banner image + headline + CTA — great for campaigns.",
    sample: {
      template: "promotional",
      title: "Big Summer Sale",
      subtitle: "Limited time",
      body: "Get up to 25% off select listings this month.",
      cta_label: "Browse properties",
      cta_url: "/properties",
      image_url: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200",
      accent_color: "#16a34a",
    },
  },
  {
    id: "offer",
    label: "Special Offer",
    icon: Megaphone,
    description: "Badge-style headline for discounts and deals.",
    sample: {
      template: "offer",
      title: "Exclusive Offer",
      subtitle: "This week only",
      body: "Book a viewing this week and get free legal consultation.",
      cta_label: "See offer",
      cta_url: "/offers",
      accent_color: "#dc2626",
    },
  },
  {
    id: "hot-news",
    label: "Hot News",
    icon: Newspaper,
    description: "Bold news-style alert for announcements.",
    sample: {
      template: "hot-news",
      title: "New Project Launched",
      subtitle: "Just announced",
      body: "Explore our newest residential tower in Lusail — now accepting reservations.",
      cta_label: "Read more",
      cta_url: "/news",
      accent_color: "#0ea5e9",
    },
  },
  {
    id: "real-estate",
    label: "Real Estate",
    icon: HomeIcon,
    description: "Property-style card with image and details.",
    sample: {
      template: "real-estate",
      title: "Featured Villa in Pearl",
      subtitle: "4 BR · 3 Bath",
      body: "A beautifully appointed waterfront villa now available for viewing.",
      cta_label: "View property",
      cta_url: "/properties",
      image_url: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200",
      accent_color: "#0f766e",
    },
  },
];

function emptyPopup(): Partial<Popup> {
  return {
    name: "",
    template: "promotional",
    title: "",
    subtitle: "",
    body: "",
    image_url: "",
    cta_label: "",
    cta_url: "",
    target_type: "all",
    target_value: "",
    delay_seconds: 2,
    frequency: "session",
    position: "center",
    bg_color: "#ffffff",
    text_color: "#0f172a",
    accent_color: "#16a34a",
    is_active: true,
    priority: 0,
  };
}

export function PopupsManager() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Partial<Popup> | null>(null);
  const [previewOf, setPreviewOf] = useState<Popup | null>(null);

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
      const payload = {
        name: p.name?.trim() || "Untitled popup",
        template: p.template ?? "promotional",
        title: p.title || null,
        subtitle: p.subtitle || null,
        body: p.body || null,
        image_url: p.image_url || null,
        cta_label: p.cta_label || null,
        cta_url: p.cta_url || null,
        target_type: p.target_type ?? "all",
        target_value: p.target_value || null,
        delay_seconds: Number(p.delay_seconds ?? 2),
        frequency: p.frequency ?? "session",
        position: p.position ?? "center",
        bg_color: p.bg_color || null,
        text_color: p.text_color || null,
        accent_color: p.accent_color || null,
        start_at: p.start_at || null,
        end_at: p.end_at || null,
        is_active: p.is_active ?? true,
        priority: Number(p.priority ?? 0),
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
            <p className="text-xs text-muted-foreground">Pick a style, then customise content and target page.</p>
          </div>
          <button
            onClick={() => setEditing(emptyPopup())}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-4 w-4" /> Blank popup
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TEMPLATES.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => newFromTemplate(t.id)}
                className="rounded-xl border border-border bg-background p-4 text-left transition hover:border-primary hover:shadow-md"
              >
                <Icon className="h-5 w-5 text-primary" />
                <div className="mt-2 font-semibold">{t.label}</div>
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
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      Target: {p.target_type === "all" ? "Entire site" : `${p.target_type} · ${p.target_value || "—"}`} · Frequency: {p.frequency} · Position: {p.position}
                    </div>
                    {p.title && <div className="mt-1 truncate text-sm">{p.title}</div>}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
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
    </div>
  );
}

function EditorModal({
  value,
  onChange,
  onClose,
  onSave,
  saving,
}: {
  value: Partial<Popup>;
  onChange: (v: Partial<Popup>) => void;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  const set = (patch: Partial<Popup>) => onChange({ ...value, ...patch });

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center overflow-y-auto bg-black/60 p-4 sm:p-8">
      <div className="w-full max-w-3xl rounded-2xl bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h3 className="font-display text-lg font-semibold">{value.id ? "Edit popup" : "New popup"}</h3>
          <button onClick={onClose} className="rounded-md p-1.5 hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div className="grid gap-4 p-4 sm:p-5 md:grid-cols-2">
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
          <Field label="Body" full>
            <textarea className="input min-h-[90px]" value={value.body || ""} onChange={(e) => set({ body: e.target.value })} />
          </Field>

          <Field label="Image URL">
            <input className="input" value={value.image_url || ""} onChange={(e) => set({ image_url: e.target.value })} placeholder="https://…" />
          </Field>
          <Field label="CTA label">
            <input className="input" value={value.cta_label || ""} onChange={(e) => set({ cta_label: e.target.value })} />
          </Field>
          <Field label="CTA URL" full>
            <input className="input" value={value.cta_url || ""} onChange={(e) => set({ cta_url: e.target.value })} placeholder="/properties or https://…" />
          </Field>

          <Field label="Target type">
            <ThemedSelect value={value.target_type || "all"} onValueChange={(v) => set({ target_type: v })}
              options={[
                { value: "all", label: "Entire site" },
                { value: "route", label: "Specific page (exact path)" },
                { value: "prefix", label: "Path prefix (e.g. /properties)" },
              ]} />
          </Field>
          <Field label="Target value (path)">
            <input
              className="input"
              value={value.target_value || ""}
              onChange={(e) => set({ target_value: e.target.value })}
              disabled={value.target_type === "all"}
              placeholder={value.target_type === "all" ? "—" : "/offers"}
            />
          </Field>

          <Field label="Position">
            <ThemedSelect value={value.position || "center"} onValueChange={(v) => set({ position: v })}
              options={[
                { value: "center", label: "Center modal" },
                { value: "bottom-right", label: "Bottom right corner" },
                { value: "top", label: "Top banner" },
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

          <Field label="Delay (seconds)">
            <input type="number" min={0} className="input" value={value.delay_seconds ?? 2} onChange={(e) => set({ delay_seconds: Number(e.target.value) })} />
          </Field>
          <Field label="Priority (higher = wins)">
            <input type="number" className="input" value={value.priority ?? 0} onChange={(e) => set({ priority: Number(e.target.value) })} />
          </Field>

          <Field label="Background color">
            <input type="color" className="input h-10" value={value.bg_color || "#ffffff"} onChange={(e) => set({ bg_color: e.target.value })} />
          </Field>
          <Field label="Text color">
            <input type="color" className="input h-10" value={value.text_color || "#0f172a"} onChange={(e) => set({ text_color: e.target.value })} />
          </Field>
          <Field label="Accent / CTA color">
            <input type="color" className="input h-10" value={value.accent_color || "#16a34a"} onChange={(e) => set({ accent_color: e.target.value })} />
          </Field>

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
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md overflow-hidden rounded-2xl shadow-2xl" style={{ background: bg, color: text }} onClick={(e) => e.stopPropagation()}>
        {popup.image_url && <img src={popup.image_url} alt="" className="h-44 w-full object-cover" />}
        <div className="p-5">
          {popup.subtitle && <div className="mb-1 text-xs font-medium uppercase tracking-wider opacity-70">{popup.subtitle}</div>}
          {popup.title && <h3 className="font-display text-xl font-semibold">{popup.title}</h3>}
          {popup.body && <p className="mt-2 text-sm opacity-80 whitespace-pre-line">{popup.body}</p>}
          {popup.cta_label && (
            <button className="mt-4 inline-flex rounded-md px-4 py-2 text-sm font-semibold text-white" style={{ background: accent }}>
              {popup.cta_label}
            </button>
          )}
        </div>
      </div>
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
  } catch {
    return "";
  }
}
function fromLocalInput(v: string) {
  if (!v) return null as any;
  return new Date(v).toISOString();
}
