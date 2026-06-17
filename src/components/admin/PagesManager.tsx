import { useEffect, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText, ChevronRight, Home, Info, Mail, Newspaper, Building2, Users } from "lucide-react";
import { HeroEditor } from "./HeroEditor";

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
  { slug: "properties", label: "Properties", icon: Building2, editable: false },
  { slug: "agents", label: "Our Agents", icon: Users, editable: false },
  { slug: "about", label: "About", icon: Info, editable: false },
  { slug: "news", label: "News", icon: Newspaper, editable: false },
  { slug: "contact", label: "Contact", icon: Mail, editable: false },
];

export function PagesManager() {
  const qc = useQueryClient();
  const [activePage, setActivePage] = useState("home");
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

  const active = sections.find((s) => s.section_key === activeKey) || sections[0];

  useEffect(() => {
    if (active && active.section_key !== "hero") setDraft(JSON.stringify(active.content, null, 2));
    if (!activeKey && sections[0]) setActiveKey(sections[0].section_key);
  }, [active?.id, sections.length]);

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
    <div className="grid gap-4 lg:grid-cols-[220px_240px_1fr]">
      {/* Pages */}
      <div className="rounded-2xl border border-border bg-white p-3">
        <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Pages</p>
        {PAGES.map((p) => {
          const Icon = p.icon;
          const active = activePage === p.slug;
          return (
            <button
              key={p.slug}
              onClick={() => { setActivePage(p.slug); setActiveKey(null); }}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm ${active ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              <span className="flex items-center gap-2"><Icon className="h-4 w-4" /> {p.label}</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          );
        })}
      </div>

      {/* Sections */}
      <div className="rounded-2xl border border-border bg-white p-3">
        <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Sections</p>
        {sections.length === 0 && currentPage && !currentPage.editable && (
          <p className="px-3 py-4 text-xs text-muted-foreground">
            No editable sections yet for <strong>{currentPage.label}</strong>.
          </p>
        )}
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveKey(s.section_key)}
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${active?.id === s.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"}`}
          >
            <span className="flex items-center gap-2"><FileText className="h-3.5 w-3.5" /> {s.label}</span>
          </button>
        ))}
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
