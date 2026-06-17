import { useEffect, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Globe, Mail, Type } from "lucide-react";

type SettingsMap = Record<string, string>;
const KEYS = ["site_title", "site_tagline", "admin_email"] as const;

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

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

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

const inputCls = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

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
