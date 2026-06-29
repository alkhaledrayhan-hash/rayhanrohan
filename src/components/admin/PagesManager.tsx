import { useEffect, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText, Home, Info, Mail, Newspaper, Building2, Users, Megaphone, ShieldCheck, Handshake, MapPin, BadgePercent } from "lucide-react";
import { HeroEditor } from "./HeroEditor";
import { TickerSectionEditor } from "./TickerSectionEditor";
import { TrustSectionEditor } from "./TrustSectionEditor";
import { FeaturedSectionEditor } from "./FeaturedSectionEditor";
import { OffersSectionEditor } from "./OffersSectionEditor";
import { PartnersSectionEditor } from "./PartnersSectionEditor";
import { LocationsSectionEditor } from "./LocationsSectionEditor";
import { HomeContactEditor, ContactPageEditor } from "./ContactSectionEditor";
import { PageHeroEditor } from "./PageHeroEditor";

type Section = {
  id: string;
  page_slug: string;
  section_key: string;
  label: string;
  content: any;
  sort_order: number;
};

const PAGES: { slug: string; label: string; icon: typeof Home; editable: boolean }[] = [
  { slug: "home", label: "Home", icon: Home, editable: true },
  { slug: "properties", label: "Properties", icon: Building2, editable: true },
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

  // Virtual sections (not stored in page_sections) that get their own editors.
  const VIRTUAL_HOME: Array<{ section_key: string; label: string; icon: typeof Home; sort_order: number }> = [
    { section_key: "ticker", label: "News ticker", icon: Megaphone, sort_order: 2 },
  ];
  const virtualForPage = activePage === "home" ? VIRTUAL_HOME : [];


  const active = sections.find((s) => s.section_key === activeKey)
    || (virtualForPage.find((v) => v.section_key === activeKey) ? ({ id: `virtual-${activeKey}`, page_slug: activePage, section_key: activeKey!, label: virtualForPage.find((v) => v.section_key === activeKey)!.label, content: null, sort_order: 999 } as Section) : undefined)
    || sections[0];

  useEffect(() => {
    if (active && !["hero", "ticker", "trust", "featured", "offer", "partners", "locations", "contact", "info"].includes(active.section_key)) {
      setDraft(JSON.stringify(active.content, null, 2));
    }
    if (!activeKey && sections[0]) setActiveKey(sections[0].section_key);
  }, [active?.id, sections.length]);

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

  const currentPage = PAGES.find((p) => p.slug === activePage);

  return (
    <div className="grid gap-4 lg:grid-cols-[240px_1fr]">

      {/* Sections */}
      <div className="rounded-2xl border border-border bg-white p-3">
        <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Sections</p>
        {sections.length === 0 && currentPage && !currentPage.editable && (
          <p className="px-3 py-4 text-xs text-muted-foreground">
            No editable sections yet for <strong>{currentPage.label}</strong>.
          </p>
        )}
        {[
          ...sections.map((s) => ({ kind: "db" as const, key: s.section_key, label: s.label, sort_order: s.sort_order, id: s.id, icon: SECTION_ICONS[s.section_key] || FileText })),
          ...virtualForPage.map((v) => ({ kind: "virtual" as const, key: v.section_key, label: v.label, sort_order: v.sort_order, id: `virtual-${v.section_key}`, icon: v.icon })),
        ]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveKey(item.key)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${active?.section_key === item.key ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"}`}
              >
                <span className="flex items-center gap-2"><Icon className="h-3.5 w-3.5" /> {item.label}</span>
              </button>
            );
          })}

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
              <HeroEditor sectionId={active.id} initial={active.content || {}} />
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
