import { useEffect, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Plus, Save, Trash2, ListTree, LayoutPanelTop, MousePointerClick } from "lucide-react";
import {
  DEFAULT_FOOTER_MENU,
  DEFAULT_HEADER_CTA,
  DEFAULT_HEADER_MENU,
  type FooterMenuGroup,
  type HeaderCta,
  type HeaderMenuItem,
} from "@/hooks/useSiteMenus";

type Tab = "header" | "cta" | "footer";

export function MenusEditor() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("header");
  const [header, setHeader] = useState<HeaderMenuItem[]>(DEFAULT_HEADER_MENU);
  const [footer, setFooter] = useState<FooterMenuGroup[]>(DEFAULT_FOOTER_MENU);
  const [cta, setCta] = useState<HeaderCta>(DEFAULT_HEADER_CTA);

  const { data, isLoading } = useQuery({
    queryKey: ["site-menus-edit"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["header_menu_json", "footer_menu_json", "header_cta_json"]);
      if (error) throw error;
      const map: Record<string, string> = {};
      (data || []).forEach((r: any) => { map[r.key] = r.value || ""; });
      return map;
    },
  });

  useEffect(() => {
    if (!data) return;
    try {
      const h = data.header_menu_json ? JSON.parse(data.header_menu_json) : DEFAULT_HEADER_MENU;
      if (Array.isArray(h)) setHeader(h);
    } catch { /* keep defaults */ }
    try {
      const f = data.footer_menu_json ? JSON.parse(data.footer_menu_json) : DEFAULT_FOOTER_MENU;
      if (Array.isArray(f)) setFooter(f);
    } catch { /* keep defaults */ }
    try {
      const c = data.header_cta_json ? JSON.parse(data.header_cta_json) : DEFAULT_HEADER_CTA;
      if (c && typeof c === "object") setCta({ ...DEFAULT_HEADER_CTA, ...c });
    } catch { /* keep defaults */ }
  }, [data]);

  const save = useMutation({
    mutationFn: async () => {
      const rows = [
        { key: "header_menu_json", value: JSON.stringify(header) },
        { key: "footer_menu_json", value: JSON.stringify(footer) },
        { key: "header_cta_json", value: JSON.stringify(cta) },
      ];
      const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Menus saved");
      qc.invalidateQueries({ queryKey: ["site-menus"] });
      qc.invalidateQueries({ queryKey: ["site-menus-edit"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to save"),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="space-y-5 rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
      <div>
        <h3 className="font-display text-lg font-semibold">Menu controller</h3>
        <p className="text-sm text-muted-foreground">
          Add, edit, reorder or remove links shown in the website header, the header CTA button, and the footer.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-border">
        <TabBtn active={tab === "header"} onClick={() => setTab("header")}>
          <LayoutPanelTop className="h-3.5 w-3.5" /> Header menu
        </TabBtn>
        <TabBtn active={tab === "cta"} onClick={() => setTab("cta")}>
          <MousePointerClick className="h-3.5 w-3.5" /> Header CTA button
        </TabBtn>
        <TabBtn active={tab === "footer"} onClick={() => setTab("footer")}>
          <ListTree className="h-3.5 w-3.5" /> Footer menu
        </TabBtn>
      </div>

      {tab === "header" && <HeaderEditor items={header} onChange={setHeader} />}
      {tab === "cta" && <CtaEditor cta={cta} onChange={setCta} />}
      {tab === "footer" && <FooterEditor groups={footer} onChange={setFooter} />}

      <div className="flex flex-col-reverse items-stretch gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => {
            if (confirm("Reset to default menus? Unsaved edits will be lost.")) {
              setHeader(DEFAULT_HEADER_MENU);
              setFooter(DEFAULT_FOOTER_MENU);
              setCta(DEFAULT_HEADER_CTA);
            }
          }}
          className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Reset to defaults
        </button>
        <button
          type="button"
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          <Save className="h-4 w-4" /> {save.isPending ? "Saving…" : "Save menus"}
        </button>
      </div>
    </div>
  );
}

function CtaEditor({ cta, onChange }: { cta: HeaderCta; onChange: (v: HeaderCta) => void }) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={cta.enabled}
          onChange={(e) => onChange({ ...cta, enabled: e.target.checked })}
          className="h-4 w-4 rounded border-input"
        />
        Show CTA button in header
      </label>
      <div className="grid gap-2 sm:grid-cols-3">
        <Input label="Button label" value={cta.label} onChange={(v) => onChange({ ...cta, label: v })} placeholder="Browse Listings" />
        <Input label="Path (URL)" value={cta.to} onChange={(v) => onChange({ ...cta, to: v })} placeholder="/properties" />
        <Input
          label="Search (key=value, optional)"
          value={searchToString(cta.search)}
          onChange={(v) => onChange({ ...cta, search: stringToSearch(v) })}
          placeholder="status=rent"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Uncheck the box to hide the button entirely on desktop and mobile.
      </p>
    </div>
  );
}


function HeaderEditor({ items, onChange }: { items: HeaderMenuItem[]; onChange: (v: HeaderMenuItem[]) => void }) {
  const update = (i: number, patch: Partial<HeaderMenuItem>) => {
    const next = [...items];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  const add = () => onChange([...items, { label: "New link", to: "/" }]);

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="grid gap-2 rounded-xl border border-border bg-muted/20 p-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
          <Input label="Label" value={item.label} onChange={(v) => update(i, { label: v })} />
          <Input label="Path (URL)" value={item.to} onChange={(v) => update(i, { to: v })} placeholder="/about" />
          <Input
            label="Search (key=value, optional)"
            value={searchToString(item.search)}
            onChange={(v) => update(i, { search: stringToSearch(v) })}
            placeholder="status=rent"
          />
          <RowActions onUp={() => move(i, -1)} onDown={() => move(i, 1)} onRemove={() => remove(i)} />
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Plus className="h-4 w-4" /> Add header link
      </button>
    </div>
  );
}

function FooterEditor({ groups, onChange }: { groups: FooterMenuGroup[]; onChange: (v: FooterMenuGroup[]) => void }) {
  const updateGroup = (gi: number, patch: Partial<FooterMenuGroup>) => {
    const next = [...groups];
    next[gi] = { ...next[gi], ...patch };
    onChange(next);
  };
  const updateItem = (gi: number, ii: number, patch: Partial<{ label: string; to: string }>) => {
    const next = [...groups];
    const items = [...next[gi].items];
    items[ii] = { ...items[ii], ...patch };
    next[gi] = { ...next[gi], items };
    onChange(next);
  };
  const moveItem = (gi: number, ii: number, dir: -1 | 1) => {
    const items = [...groups[gi].items];
    const j = ii + dir;
    if (j < 0 || j >= items.length) return;
    [items[ii], items[j]] = [items[j], items[ii]];
    updateGroup(gi, { items });
  };
  const moveGroup = (gi: number, dir: -1 | 1) => {
    const j = gi + dir;
    if (j < 0 || j >= groups.length) return;
    const next = [...groups];
    [next[gi], next[j]] = [next[j], next[gi]];
    onChange(next);
  };
  const removeItem = (gi: number, ii: number) =>
    updateGroup(gi, { items: groups[gi].items.filter((_, idx) => idx !== ii) });
  const removeGroup = (gi: number) => onChange(groups.filter((_, idx) => idx !== gi));
  const addItem = (gi: number) => updateGroup(gi, { items: [...groups[gi].items, { label: "New link", to: "/" }] });
  const addGroup = () => onChange([...groups, { heading: "New group", items: [{ label: "New link", to: "/" }] }]);

  return (
    <div className="space-y-4">
      {groups.map((group, gi) => (
        <div key={gi} className="space-y-3 rounded-xl border border-border bg-muted/20 p-3">
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <Input label="Group heading" value={group.heading} onChange={(v) => updateGroup(gi, { heading: v })} />
            </div>
            <RowActions onUp={() => moveGroup(gi, -1)} onDown={() => moveGroup(gi, 1)} onRemove={() => removeGroup(gi)} />
          </div>

          <div className="space-y-2 border-l-2 border-primary/20 pl-3">
            {group.items.map((item, ii) => (
              <div key={ii} className="grid gap-2 rounded-lg border border-border/60 bg-white p-2.5 sm:grid-cols-[1fr_1fr_auto]">
                <Input label="Label" value={item.label} onChange={(v) => updateItem(gi, ii, { label: v })} />
                <Input label="Path" value={item.to} onChange={(v) => updateItem(gi, ii, { to: v })} placeholder="/about" />
                <RowActions
                  onUp={() => moveItem(gi, ii, -1)}
                  onDown={() => moveItem(gi, ii, 1)}
                  onRemove={() => removeItem(gi, ii)}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => addItem(gi)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" /> Add link
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={addGroup}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        <Plus className="h-4 w-4" /> Add footer group
      </button>
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

function RowActions({ onUp, onDown, onRemove }: { onUp: () => void; onDown: () => void; onRemove: () => void }) {
  return (
    <div className="flex items-end justify-end gap-1 sm:flex-col sm:items-stretch">
      <button type="button" onClick={onUp} className="grid h-8 w-8 place-items-center rounded-md border border-input bg-background hover:bg-muted" aria-label="Move up">
        <ArrowUp className="h-3.5 w-3.5" />
      </button>
      <button type="button" onClick={onDown} className="grid h-8 w-8 place-items-center rounded-md border border-input bg-background hover:bg-muted" aria-label="Move down">
        <ArrowDown className="h-3.5 w-3.5" />
      </button>
      <button type="button" onClick={onRemove} className="grid h-8 w-8 place-items-center rounded-md border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100" aria-label="Remove">
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
        active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function searchToString(s?: Record<string, string>): string {
  if (!s) return "";
  return Object.entries(s).map(([k, v]) => `${k}=${v}`).join("&");
}
function stringToSearch(s: string): Record<string, string> | undefined {
  const trimmed = s.trim();
  if (!trimmed) return undefined;
  const out: Record<string, string> = {};
  trimmed.split("&").forEach((pair) => {
    const [k, v] = pair.split("=");
    if (k) out[k.trim()] = (v ?? "").trim();
  });
  return Object.keys(out).length ? out : undefined;
}
