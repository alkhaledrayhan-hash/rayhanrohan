import { useEffect, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Plus, Save, Trash2, ListTree, LayoutPanelTop, MousePointerClick, FileText } from "lucide-react";
import {
  DEFAULT_FOOTER_MENU,
  DEFAULT_HEADER_CTA,
  DEFAULT_HEADER_MENU,
  type FooterMenuGroup,
  type HeaderCta,
  type HeaderMenuItem,
} from "@/hooks/useSiteMenus";
import { DEFAULT_TICKER_CONFIG, type TickerConfig } from "@/hooks/useTickerConfig";
import { MENU_ICON_KEYS, getMenuIcon } from "@/lib/menu-icons";

type Tab = "header" | "cta" | "footer" | "footer-content";

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
] as const;
type FooterContentKey = (typeof FOOTER_CONTENT_KEYS)[number];
type FooterContent = Record<FooterContentKey, string>;

const DEFAULT_FOOTER_CONTENT: FooterContent = {
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
};

export function MenusEditor() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("header");
  const [header, setHeader] = useState<HeaderMenuItem[]>(DEFAULT_HEADER_MENU);
  const [footer, setFooter] = useState<FooterMenuGroup[]>(DEFAULT_FOOTER_MENU);
  const [cta, setCta] = useState<HeaderCta>(DEFAULT_HEADER_CTA);
  const [footerContent, setFooterContent] = useState<FooterContent>(DEFAULT_FOOTER_CONTENT);
  

  const { data, isLoading } = useQuery({
    queryKey: ["site-menus-edit"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["header_menu_json", "footer_menu_json", "header_cta_json", ...FOOTER_CONTENT_KEYS]);
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
    const nextFc = { ...DEFAULT_FOOTER_CONTENT };
    FOOTER_CONTENT_KEYS.forEach((k) => { if (data[k]) nextFc[k] = data[k]; });
    setFooterContent(nextFc);
  }, [data]);


  const save = useMutation({
    mutationFn: async () => {
      const rows = [
        { key: "header_menu_json", value: JSON.stringify(header) },
        { key: "footer_menu_json", value: JSON.stringify(footer) },
        { key: "header_cta_json", value: JSON.stringify(cta) },
        { key: "ticker_json", value: JSON.stringify(ticker) },
        ...FOOTER_CONTENT_KEYS.map((k) => ({ key: k, value: footerContent[k] ?? "" })),
      ];
      const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Menus saved");
      qc.invalidateQueries({ queryKey: ["site-menus"] });
      qc.invalidateQueries({ queryKey: ["site-menus-edit"] });
      qc.invalidateQueries({ queryKey: ["site-settings"] });
      qc.invalidateQueries({ queryKey: ["site-settings", "ticker_json"] });
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
        <TabBtn active={tab === "footer-content"} onClick={() => setTab("footer-content")}>
          <FileText className="h-3.5 w-3.5" /> Footer content
        </TabBtn>
      </div>

      {tab === "header" && <HeaderEditor items={header} onChange={setHeader} />}
      {tab === "cta" && <CtaEditor cta={cta} onChange={setCta} />}
      {tab === "footer" && <FooterEditor groups={footer} onChange={setFooter} />}
      {tab === "footer-content" && <FooterContentEditor content={footerContent} onChange={setFooterContent} />}


      <div className="flex flex-col-reverse items-stretch gap-2 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => {
            if (confirm("Reset to default menus? Unsaved edits will be lost.")) {
              setHeader(DEFAULT_HEADER_MENU);
              setFooter(DEFAULT_FOOTER_MENU);
              setCta(DEFAULT_HEADER_CTA);
              setFooterContent(DEFAULT_FOOTER_CONTENT);
              setTicker(DEFAULT_TICKER_CONFIG);
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

function FooterContentEditor({ content, onChange }: { content: FooterContent; onChange: (v: FooterContent) => void }) {
  const set = (k: FooterContentKey, v: string) => onChange({ ...content, [k]: v });
  return (
    <div className="space-y-5">
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

  const updateChild = (i: number, ci: number, patch: Partial<{ label: string; to: string; search?: Record<string, string> }>) => {
    const children = [...(items[i].children || [])];
    children[ci] = { ...children[ci], ...patch };
    update(i, { children });
  };
  const addChild = (i: number) => update(i, { children: [...(items[i].children || []), { label: "New sublink", to: "/" }] });
  const removeChild = (i: number, ci: number) => update(i, { children: (items[i].children || []).filter((_, idx) => idx !== ci) });
  const moveChild = (i: number, ci: number, dir: -1 | 1) => {
    const children = [...(items[i].children || [])];
    const j = ci + dir;
    if (j < 0 || j >= children.length) return;
    [children[ci], children[j]] = [children[j], children[ci]];
    update(i, { children });
  };

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="space-y-3 rounded-xl border border-border bg-muted/20 p-3">
          <div className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]">
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

          <div className="space-y-2 border-l-2 border-primary/20 pl-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Submenu items</p>
            {(item.children || []).map((c, ci) => (
              <div key={ci} className="grid gap-2 rounded-lg border border-border/60 bg-white p-2.5 sm:grid-cols-[1fr_1fr_1fr_auto]">
                <Input label="Label" value={c.label} onChange={(v) => updateChild(i, ci, { label: v })} />
                <Input label="Path" value={c.to} onChange={(v) => updateChild(i, ci, { to: v })} placeholder="/properties" />
                <Input
                  label="Search (optional)"
                  value={searchToString(c.search)}
                  onChange={(v) => updateChild(i, ci, { search: stringToSearch(v) })}
                  placeholder="status=rent"
                />
                <RowActions
                  onUp={() => moveChild(i, ci, -1)}
                  onDown={() => moveChild(i, ci, 1)}
                  onRemove={() => removeChild(i, ci)}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => addChild(i)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background px-3 py-2 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" /> Add submenu link
            </button>
          </div>
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

function TickerEditor({ value, onChange }: { value: TickerConfig; onChange: (v: TickerConfig) => void }) {
  const set = <K extends keyof TickerConfig>(k: K, v: TickerConfig[K]) => onChange({ ...value, [k]: v });
  const updateItem = (i: number, patch: Partial<{ title: string; link: string }>) => {
    const items = [...value.items];
    items[i] = { ...items[i], ...patch };
    set("items", items);
  };
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= value.items.length) return;
    const items = [...value.items];
    [items[i], items[j]] = [items[j], items[i]];
    set("items", items);
  };
  const remove = (i: number) => set("items", value.items.filter((_, idx) => idx !== i));
  const add = () => set("items", [...value.items, { title: "", link: "" }]);

  const speed = Number(value.speed) || 40;
  const threshold = Number(value.scrollThreshold) || 3;
  const willScroll = value.items.filter((i) => i?.title?.trim()).length > threshold;

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={value.enabled}
            onChange={(e) => set("enabled", e.target.checked)}
            className="h-4 w-4 rounded border-input"
          />
          Show news ticker on the website
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Scroll speed</span>
              <span className="text-foreground">{speed}s / loop {speed <= 20 ? "(fast)" : speed >= 60 ? "(slow)" : "(normal)"}</span>
            </span>
            <input
              type="range"
              min={10}
              max={120}
              step={5}
              value={speed}
              onChange={(e) => set("speed", Number(e.target.value))}
              className="w-full accent-primary"
            />
          </label>
          <label className="block space-y-1">
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Scroll only when more than
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={20}
                value={threshold}
                onChange={(e) => set("scrollThreshold", Math.max(1, Number(e.target.value) || 1))}
                className="w-20 rounded-md border border-input bg-background px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <span className="text-xs text-muted-foreground">items (default 3)</span>
            </div>
          </label>
        </div>
        <p className="text-xs text-muted-foreground">
          {willScroll
            ? `Ticker will scroll because there are more than ${threshold} items.`
            : `Ticker will display statically — add more than ${threshold} items to enable scrolling.`}
          {value.items.length === 0 && " When empty, the latest published news posts are used automatically."}
        </p>
      </div>

      <div className="space-y-2">
        {value.items.map((item, i) => (
          <div key={i} className="grid gap-2 rounded-lg border border-border/60 bg-white p-2.5 sm:grid-cols-[1fr_1fr_auto]">
            <Input label="Title" value={item.title} onChange={(v) => updateItem(i, { title: v })} placeholder="Breaking headline" />
            <Input label="Link (optional)" value={item.link || ""} onChange={(v) => updateItem(i, { link: v })} placeholder="/news/slug or https://…" />
            <RowActions onUp={() => move(i, -1)} onDown={() => move(i, 1)} onRemove={() => remove(i)} />
          </div>
        ))}
        <button
          type="button"
          onClick={add}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Plus className="h-4 w-4" /> Add ticker item
        </button>
      </div>
    </div>
  );
}
