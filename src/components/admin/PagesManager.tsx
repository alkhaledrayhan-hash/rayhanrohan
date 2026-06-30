import { useEffect, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText, Home, Info, Mail, Newspaper, Building2, Users, Megaphone, ShieldCheck, Handshake, MapPin, BadgePercent, Layout, BarChart3, BookOpen, Target, Sparkles, UsersRound, Briefcase, Phone, ListChecks, MapPinned, ArrowUp, ArrowDown, Eye, EyeOff, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { HeroEditor } from "./HeroEditor";
import { TickerSectionEditor } from "./TickerSectionEditor";
import { TrustSectionEditor } from "./TrustSectionEditor";
import { FeaturedSectionEditor } from "./FeaturedSectionEditor";
import { OffersSectionEditor } from "./OffersSectionEditor";
import { PartnersSectionEditor } from "./PartnersSectionEditor";
import { LocationsSectionEditor } from "./LocationsSectionEditor";
import { HomeContactEditor, ContactPageEditor } from "./ContactSectionEditor";
import { PageHeroEditor } from "./PageHeroEditor";
import { PageLayoutEditor } from "./PageLayoutEditor";
import { AboutContentEditor } from "./AboutContentEditor";

type Section = {
  id: string;
  page_slug: string;
  section_key: string;
  label: string;
  content: any;
  sort_order: number;
  is_hidden?: boolean;
};

const PAGES: { slug: string; label: string; icon: typeof Home; editable: boolean }[] = [
  { slug: "home", label: "Home", icon: Home, editable: true },
  { slug: "properties", label: "Properties", icon: Building2, editable: true },
  { slug: "offers", label: "Offers", icon: BadgePercent, editable: true },
  { slug: "agents", label: "Our Agents", icon: Users, editable: true },
  { slug: "about", label: "About", icon: Info, editable: true },
  { slug: "news", label: "News", icon: Newspaper, editable: true },
  { slug: "contact", label: "Contact", icon: Mail, editable: true },
];

export function PagesManager({
  pageSlug,
  onPageChange,
}: {
  pageSlug?: string;
  onPageChange?: (slug: string) => void;
} = {}) {
  const qc = useQueryClient();
  const [activePage, setActivePageState] = useState(pageSlug || "home");
  const setActivePage = (slug: string) => {
    setActivePageState(slug);
    onPageChange?.(slug);
  };
  useEffect(() => {
    if (pageSlug && pageSlug !== activePage) setActivePageState(pageSlug);
  }, [pageSlug]);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<string>("");
  const [sectionsCollapsed, setSectionsCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("pm:sectionsCollapsed") === "1";
  });
  const toggleSectionsCollapsed = () => {
    setSectionsCollapsed((v) => {
      const nv = !v;
      try { localStorage.setItem("pm:sectionsCollapsed", nv ? "1" : "0"); } catch {}
      return nv;
    });
  };

  const { data: sections = [] } = useQuery({
    queryKey: ["page-sections", activePage],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_sections")
        .select("*")
        .eq("page_slug", activePage)
        .order("sort_order");
      if (error) throw error;
      return data as Section[];
    },
  });

  // Virtual sections (not stored as their own rows) that get their own editors.
  const VIRTUAL_HOME: Array<{ section_key: string; label: string; icon: typeof Home; sort_order: number }> = [
    { section_key: "ticker", label: "News ticker", icon: Megaphone, sort_order: 2 },
  ];
  // For the About page we expose the parts of the single `content` row as
  // separate sidebar entries — each routes back into AboutContentEditor with `only=`.
  const aboutContentRow = sections.find((s) => s.section_key === "content");
  const ABOUT_SUBS: Array<{ section_key: string; label: string; icon: typeof Home; sort_order: number }> = aboutContentRow ? [
    { section_key: "about-stats", label: "Stats strip", icon: BarChart3, sort_order: 10 },
    { section_key: "about-story", label: "Our Story", icon: BookOpen, sort_order: 11 },
    { section_key: "about-mission", label: "Mission & Vision", icon: Target, sort_order: 12 },
    { section_key: "about-values", label: "Values", icon: Sparkles, sort_order: 13 },
    { section_key: "about-team", label: "Team", icon: UsersRound, sort_order: 14 },
    { section_key: "about-company", label: "Company details", icon: Briefcase, sort_order: 15 },
  ] : [];
  // Same idea for the Contact page — split the `info` row into focused tabs.
  const contactInfoRow = sections.find((s) => s.section_key === "info");
  const CONTACT_SUBS: Array<{ section_key: string; label: string; icon: typeof Home; sort_order: number }> = contactInfoRow ? [
    { section_key: "contact-hero", label: "Hero", icon: Home, sort_order: 1 },
    { section_key: "contact-channels", label: "Contact channels", icon: Phone, sort_order: 2 },
    { section_key: "contact-subjects", label: "Subjects", icon: ListChecks, sort_order: 3 },
    { section_key: "contact-office", label: "Head office", icon: MapPinned, sort_order: 4 },
    { section_key: "contact-map", label: "Map", icon: MapPinned, sort_order: 5 },
  ] : [];
  const virtualForPageBase = activePage === "home" ? VIRTUAL_HOME : activePage === "about" ? ABOUT_SUBS : activePage === "contact" ? CONTACT_SUBS : [];
  // Parent row that stores per-virtual meta (hidden / sort_order) in content._meta.virtual
  const parentVirtualRow: Section | undefined = activePage === "about" ? aboutContentRow : activePage === "contact" ? contactInfoRow : undefined;
  const virtualMetaMap: Record<string, { hidden?: boolean; sort_order?: number }> =
    (parentVirtualRow?.content as any)?._meta?.virtual || {};
  const virtualForPage = virtualForPageBase.map((v) => ({
    ...v,
    sort_order: virtualMetaMap[v.section_key]?.sort_order ?? v.sort_order,
    hidden: !!virtualMetaMap[v.section_key]?.hidden,
  }));

  // Hide raw aggregate rows from their respective sidebars — the parts replace them.
  const visibleSections = activePage === "about"
    ? sections.filter((s) => s.section_key !== "content")
    : activePage === "contact"
    ? sections.filter((s) => s.section_key !== "info")
    : sections;

  const aboutOnlyMap: Record<string, "stats" | "story" | "mission" | "values" | "team" | "company"> = {
    "about-stats": "stats",
    "about-story": "story",
    "about-mission": "mission",
    "about-values": "values",
    "about-team": "team",
    "about-company": "company",
  };
  const contactOnlyMap: Record<string, "hero" | "channels" | "subjects" | "office" | "map"> = {
    "contact-hero": "hero",
    "contact-channels": "channels",
    "contact-subjects": "subjects",
    "contact-office": "office",
    "contact-map": "map",
  };

  const virtualHit = virtualForPage.find((v) => v.section_key === activeKey);
  const virtualSourceRow = virtualHit
    ? (aboutOnlyMap[virtualHit.section_key] ? aboutContentRow : contactOnlyMap[virtualHit.section_key] ? contactInfoRow : null)
    : null;
  const active = sections.find((s) => s.section_key === activeKey)
    || (virtualHit
      ? ({
          id: virtualSourceRow ? virtualSourceRow.id : `virtual-${activeKey}`,
          page_slug: activePage,
          section_key: activeKey!,
          label: virtualHit.label,
          content: virtualSourceRow ? virtualSourceRow.content : null,
          sort_order: 999,
        } as Section)
      : undefined)
    || visibleSections[0];

  useEffect(() => {
    if (active && !["hero", "ticker", "trust", "featured", "offer", "partners", "locations", "contact", "info", "layout", "content"].includes(active.section_key) && !active.section_key.startsWith("about-") && !active.section_key.startsWith("contact-")) {
      setDraft(JSON.stringify(active.content, null, 2));
    }
    if (!activeKey && visibleSections[0]) setActiveKey(visibleSections[0].section_key);
  }, [active?.id, visibleSections.length]);


  const SECTION_ICONS: Record<string, typeof Home> = {
    hero: Home,
    trust: ShieldCheck,
    featured: Building2,
    offer: BadgePercent,
    locations: MapPin,
    ticker: Megaphone,
    partners: Handshake,
    contact: Mail,
    info: Mail,
    layout: Layout,
    content: FileText,
  };



  const saveJson = useMutation({
    mutationFn: async () => {
      if (!active) return;
      let parsed: any;
      try { parsed = JSON.parse(draft); } catch { throw new Error("Invalid JSON"); }
      const { error } = await supabase.from("page_sections").update({ content: parsed }).eq("id", active.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Section saved");
      qc.invalidateQueries({ queryKey: ["page-sections"] });
      qc.invalidateQueries({ queryKey: ["home-sections"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleHidden = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const { error } = await supabase.from("page_sections").update({ is_hidden: value } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["page-sections"] });
      qc.invalidateQueries({ queryKey: ["home-sections"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const swapOrder = useMutation({
    mutationFn: async ({ a, b }: { a: Section; b: Section }) => {
      // Two-step swap to avoid unique conflicts if any
      const tmp = -Math.abs(a.sort_order) - 1000 - Math.floor(Math.random() * 1000);
      const r1 = await supabase.from("page_sections").update({ sort_order: tmp }).eq("id", a.id);
      if (r1.error) throw r1.error;
      const r2 = await supabase.from("page_sections").update({ sort_order: a.sort_order }).eq("id", b.id);
      if (r2.error) throw r2.error;
      const r3 = await supabase.from("page_sections").update({ sort_order: b.sort_order }).eq("id", a.id);
      if (r3.error) throw r3.error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["page-sections"] });
      qc.invalidateQueries({ queryKey: ["home-sections"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const setVirtualMeta = useMutation({
    mutationFn: async ({ parent, key, patch }: { parent: Section; key: string; patch: Partial<{ hidden: boolean; sort_order: number }> }) => {
      const cur = (parent.content as any) || {};
      const meta = cur._meta || {};
      const v = meta.virtual || {};
      const newContent = { ...cur, _meta: { ...meta, virtual: { ...v, [key]: { ...(v[key] || {}), ...patch } } } };
      const { error } = await supabase.from("page_sections").update({ content: newContent }).eq("id", parent.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["page-sections"] });
      qc.invalidateQueries({ queryKey: ["home-sections"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const swapVirtualOrder = async (parent: Section, a: { key: string; sort_order: number }, b: { key: string; sort_order: number }) => {
    await setVirtualMeta.mutateAsync({ parent, key: a.key, patch: { sort_order: b.sort_order } });
    await setVirtualMeta.mutateAsync({ parent, key: b.key, patch: { sort_order: a.sort_order } });
  };

  const currentPage = PAGES.find((p) => p.slug === activePage);

  return (
    <div className={`grid gap-4 ${sectionsCollapsed ? "lg:grid-cols-[44px_1fr]" : "lg:grid-cols-[240px_1fr]"}`}>

      {/* Sections */}
      <div className="rounded-2xl border border-border bg-white p-3">
        <div className="flex items-center justify-between gap-2 px-2 pb-2">
          {!sectionsCollapsed && (
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Sections</p>
          )}
          <button
            type="button"
            onClick={toggleSectionsCollapsed}
            title={sectionsCollapsed ? "Show sections" : "Hide sections"}
            className="ml-auto grid h-7 w-7 place-items-center rounded-md hover:bg-muted text-muted-foreground"
          >
            {sectionsCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>
        {!sectionsCollapsed && visibleSections.length === 0 && virtualForPage.length === 0 && currentPage && !currentPage.editable && (
          <p className="px-3 py-4 text-xs text-muted-foreground">
            No editable sections yet for <strong>{currentPage.label}</strong>.
          </p>
        )}
        {(() => {
          const items = [
            ...visibleSections.map((s) => ({ kind: "db" as const, key: s.section_key, label: s.label, sort_order: s.sort_order, id: s.id, icon: SECTION_ICONS[s.section_key] || FileText, hidden: !!s.is_hidden, row: s })),
            ...virtualForPage.map((v) => ({ kind: "virtual" as const, key: v.section_key, label: v.label, sort_order: v.sort_order, id: `virtual-${v.section_key}`, icon: v.icon, hidden: !!(v as any).hidden, row: null as Section | null })),
          ].sort((a, b) => a.sort_order - b.sort_order);
          const dbItems = items.filter((i) => i.kind === "db");
          const virtualItems = items.filter((i) => i.kind === "virtual");
          const pending = swapOrder.isPending || setVirtualMeta.isPending;
          return items.map((item) => {
            const Icon = item.icon;
            const isVirtual = item.kind === "virtual";
            const dbIdx = !isVirtual ? dbItems.findIndex((d) => d.id === item.id) : -1;
            const vIdx = isVirtual ? virtualItems.findIndex((d) => d.id === item.id) : -1;
            const canUp = isVirtual ? vIdx > 0 : dbIdx > 0;
            const canDown = isVirtual ? vIdx >= 0 && vIdx < virtualItems.length - 1 : dbIdx >= 0 && dbIdx < dbItems.length - 1;
            const onMove = (dir: -1 | 1) => {
              if (isVirtual) {
                if (!parentVirtualRow) return;
                const other = virtualItems[vIdx + dir];
                if (!other) return;
                swapVirtualOrder(parentVirtualRow, { key: item.key, sort_order: item.sort_order }, { key: other.key, sort_order: other.sort_order });
              } else {
                const other = dbItems[dbIdx + dir];
                if (!other) return;
                swapOrder.mutate({ a: item.row as Section, b: other.row as Section });
              }
            };
            const onToggleHide = () => {
              if (isVirtual) {
                if (!parentVirtualRow) return;
                setVirtualMeta.mutate({ parent: parentVirtualRow, key: item.key, patch: { hidden: !item.hidden } });
              } else {
                toggleHidden.mutate({ id: item.id, value: !item.hidden });
              }
            };
            return (
              <div
                key={item.id}
                className={`group flex w-full items-center gap-1 rounded-lg px-2 py-1.5 text-sm ${active?.section_key === item.key ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"} ${item.hidden ? "opacity-60" : ""}`}
              >
                <button
                  onClick={() => setActiveKey(item.key)}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                  {item.hidden && <span className="ml-1 rounded bg-muted-foreground/10 px-1 text-[9px] uppercase tracking-wide text-muted-foreground">hidden</span>}
                </button>
                <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    title="Move up"
                    disabled={!canUp || pending}
                    onClick={(e) => { e.stopPropagation(); if (canUp) onMove(-1); }}
                    className="grid h-6 w-6 place-items-center rounded hover:bg-background disabled:opacity-30"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    title="Move down"
                    disabled={!canDown || pending}
                    onClick={(e) => { e.stopPropagation(); if (canDown) onMove(1); }}
                    className="grid h-6 w-6 place-items-center rounded hover:bg-background disabled:opacity-30"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    title={item.hidden ? "Show on site" : "Hide from site"}
                    onClick={(e) => { e.stopPropagation(); onToggleHide(); }}
                    className="grid h-6 w-6 place-items-center rounded hover:bg-background"
                  >
                    {item.hidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </button>
                </div>
              </div>
            );
          });
        })()}

      </div>

      {/* Editor */}
      <div className="min-w-0 rounded-2xl border border-border bg-white p-5">
        {active ? (
          active.section_key === "hero" ? (
            <>
              <div className="mb-4">
                <h3 className="font-display text-lg font-semibold">{active.label}</h3>
                <p className="text-xs text-muted-foreground">{active.page_slug} · live preview below</p>
              </div>
              {active.page_slug === "home" ? (
                <HeroEditor sectionId={active.id} initial={active.content || {}} />
              ) : (
                <PageHeroEditor sectionId={active.id} pageSlug={active.page_slug} initial={active.content || {}} />
              )}
            </>
          ) : active.section_key === "ticker" ? (
            <>
              <div className="mb-4">
                <h3 className="font-display text-lg font-semibold">News ticker</h3>
                <p className="text-xs text-muted-foreground">Shown across the site below the hero. Falls back to latest news posts when empty.</p>
              </div>
              <TickerSectionEditor />
            </>
          ) : active.section_key === "trust" ? (
            <>
              <div className="mb-4">
                <h3 className="font-display text-lg font-semibold">{active.label}</h3>
                <p className="text-xs text-muted-foreground">{active.page_slug} · trust strip · auto-scrolls when many items</p>
              </div>
              <TrustSectionEditor sectionId={active.id} initial={active.content || {}} />
            </>
          ) : active.section_key === "featured" ? (
            <>
              <div className="mb-4">
                <h3 className="font-display text-lg font-semibold">Featured Properties</h3>
                <p className="text-xs text-muted-foreground">Heading + source: showcase specific, random, or by category.</p>
              </div>
              <FeaturedSectionEditor sectionId={active.id} initial={active.content || {}} />
            </>
          ) : active.section_key === "offer" ? (
            <>
              <div className="mb-4">
                <h3 className="font-display text-lg font-semibold">Special Offers</h3>
                <p className="text-xs text-muted-foreground">Promote any property (your own or agents'). Showcase manually or shuffle randomly.</p>
              </div>
              <OffersSectionEditor sectionId={active.id} initial={active.content || {}} />
            </>
          ) : active.section_key === "partners" ? (
            <>
              <div className="mb-4">
                <h3 className="font-display text-lg font-semibold">Our Partners</h3>
                <p className="text-xs text-muted-foreground">Logos, heading, and marquee speed.</p>
              </div>
              <PartnersSectionEditor sectionId={active.id} initial={active.content || {}} />
            </>
          ) : active.section_key === "locations" ? (
            <>
              <div className="mb-4">
                <h3 className="font-display text-lg font-semibold">Locations</h3>
                <p className="text-xs text-muted-foreground">Heading, source (auto / random / custom), limit, and marquee.</p>
              </div>
              <LocationsSectionEditor sectionId={active.id} initial={active.content || {}} />
            </>
          ) : active.section_key === "contact" ? (
            <>
              <div className="mb-4">
                <h3 className="font-display text-lg font-semibold">Contact (homepage)</h3>
                <p className="text-xs text-muted-foreground">Talk-to-a-specialist section on the home page.</p>
              </div>
              <HomeContactEditor sectionId={active.id} initial={active.content || {}} />
            </>
          ) : active.section_key === "info" ? (
            <>
              <div className="mb-4">
                <h3 className="font-display text-lg font-semibold">Contact page</h3>
                <p className="text-xs text-muted-foreground">Hero, channels, subjects and office details.</p>
              </div>
              <ContactPageEditor sectionId={active.id} initial={active.content || {}} />
            </>
          ) : active.section_key === "layout" ? (
            <>
              <div className="mb-4">
                <h3 className="font-display text-lg font-semibold">Layout &amp; Pagination</h3>
                <p className="text-xs text-muted-foreground">{active.page_slug} · columns, card style and pagination behaviour.</p>
              </div>
              <PageLayoutEditor sectionId={active.id} pageSlug={active.page_slug} initial={active.content || {}} />
            </>
          ) : active.page_slug === "about" && active.section_key.startsWith("about-") ? (
            <>
              <div className="mb-4">
                <h3 className="font-display text-lg font-semibold">{active.label}</h3>
                <p className="text-xs text-muted-foreground">About page · edit this section and click save.</p>
              </div>
              <AboutContentEditor sectionId={active.id} initial={active.content || {}} only={aboutOnlyMap[active.section_key]} />
            </>
          ) : active.page_slug === "contact" && active.section_key.startsWith("contact-") ? (
            <>
              <div className="mb-4">
                <h3 className="font-display text-lg font-semibold">{active.label}</h3>
                <p className="text-xs text-muted-foreground">Contact page · edit this section and click save.</p>
              </div>
              <ContactPageEditor sectionId={active.id} initial={active.content || {}} only={contactOnlyMap[active.section_key]} />
            </>
          ) : active.section_key === "content" && active.page_slug === "about" ? (
            <>
              <div className="mb-4">
                <h3 className="font-display text-lg font-semibold">About content</h3>
                <p className="text-xs text-muted-foreground">Stats, story, mission, values, team and company details.</p>
              </div>
              <AboutContentEditor sectionId={active.id} initial={active.content || {}} />
            </>

          ) : (
            <>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-base font-semibold">{active.label}</h3>
                  <p className="text-xs text-muted-foreground">{active.page_slug} · {active.section_key}</p>
                </div>
                <button onClick={() => saveJson.mutate()} disabled={saveJson.isPending} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">
                  {saveJson.isPending ? "Saving…" : "Save section"}
                </button>
              </div>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={18}
                spellCheck={false}
                className="w-full rounded-lg border border-input bg-muted/30 p-3 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <p className="mt-2 text-xs text-muted-foreground">Edit the JSON content for this section. Changes appear instantly on the live site.</p>
            </>
          )

        ) : (
          <div className="grid h-full place-items-center text-sm text-muted-foreground">
            Select a section to edit.
          </div>
        )}
      </div>
    </div>
  );
}
