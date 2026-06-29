import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Columns2, Columns3, Columns4, Rows3, Grid3x3, Ticket, Save } from "lucide-react";
import type { PageLayoutContent, PageCardStyle, PageLayoutMode } from "@/hooks/usePageLayout";

export function PageLayoutEditor({
  sectionId,
  pageSlug,
  initial,
}: {
  sectionId: string;
  pageSlug: string;
  initial: PageLayoutContent;
}) {
  const qc = useQueryClient();
  const [columns, setColumns] = useState<1 | 2 | 3 | 4>((initial.columns as any) || 3);
  const [cardStyle, setCardStyle] = useState<PageCardStyle>(initial.cardStyle || "grid");
  const [mode, setMode] = useState<PageLayoutMode>(initial.mode || "pagination");
  const [pageSize, setPageSize] = useState<number>(initial.pageSize || 9);
  const [loadMoreLabel, setLoadMoreLabel] = useState<string>(initial.loadMoreLabel || "Load more");

  // Card style only applies to grids of items (not agents). Ticket mode is most useful at columns=1.
  const supportsCardStyle = !["agents", "news"].includes(pageSlug);

  const save = useMutation({
    mutationFn: async () => {
      const content: PageLayoutContent = { columns, cardStyle, mode, pageSize, loadMoreLabel };
      const { error } = await supabase.from("page_sections").update({ content }).eq("id", sectionId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Layout saved");
      qc.invalidateQueries({ queryKey: ["page-layout", pageSlug] });
      qc.invalidateQueries({ queryKey: ["page-sections"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      {/* Columns */}
      <Section title="Columns per row" subtitle="Choose how many cards render side by side on desktop.">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {([1, 2, 3, 4] as const).map((c) => {
            const Icon = c === 1 ? Rows3 : c === 2 ? Columns2 : c === 3 ? Columns3 : Columns4;
            const active = columns === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setColumns(c)}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-xs font-medium transition ${
                  active ? "border-primary bg-primary/10 text-primary" : "border-border bg-white hover:border-primary/40"
                }`}
              >
                <Icon className="h-5 w-5" />
                {c} column{c > 1 ? "s" : ""}
              </button>
            );
          })}
        </div>
      </Section>

      {/* Card style */}
      {supportsCardStyle && (
        <Section title="Card style" subtitle="Ticket layout is recommended for 1 column — image on the left, info on the right.">
          <div className="grid grid-cols-2 gap-3">
            <StyleCard
              active={cardStyle === "grid"}
              onClick={() => setCardStyle("grid")}
              icon={<Grid3x3 className="h-5 w-5" />}
              title="Grid card"
              hint="Image on top, info below"
            />
            <StyleCard
              active={cardStyle === "ticket"}
              onClick={() => setCardStyle("ticket")}
              icon={<Ticket className="h-5 w-5" />}
              title="Ticket card"
              hint="Image left, info right"
            />
          </div>
        </Section>
      )}

      {/* Pagination mode */}
      <Section title="Pagination behaviour" subtitle="Pagination shows numbered pages. Load more reveals additional items inline.">
        <div className="inline-flex rounded-full border border-border bg-white p-1 text-xs">
          {([
            { id: "pagination", label: "Pagination" },
            { id: "loadmore", label: "Load more button" },
          ] as const).map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setMode(o.id)}
              className={`rounded-full px-4 py-1.5 font-medium transition ${
                mode === o.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </Section>

      {/* Page size */}
      <Section title="Items per page" subtitle="How many items to show before requiring pagination or load more.">
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            max={60}
            value={pageSize}
            onChange={(e) => setPageSize(Math.max(1, Math.min(60, Number(e.target.value) || 1)))}
            className="w-24 rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <span className="text-xs text-muted-foreground">items</span>
        </div>
      </Section>

      {/* Load more label */}
      {mode === "loadmore" && (
        <Section title="Load more button label" subtitle="Shown beneath the list when more items are available.">
          <input
            value={loadMoreLabel}
            onChange={(e) => setLoadMoreLabel(e.target.value)}
            className="w-full max-w-md rounded-lg border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </Section>
      )}

      <div className="flex justify-end">
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {save.isPending ? "Saving…" : "Save layout"}
        </button>
      </div>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4">
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      <div className="mt-3">{children}</div>
    </div>
  );
}

function StyleCard({
  active, onClick, icon, title, hint,
}: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; hint: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-start gap-3 rounded-xl border p-4 text-left transition ${
        active ? "border-primary bg-primary/10" : "border-border bg-white hover:border-primary/40"
      }`}
    >
      <span className={`grid h-9 w-9 place-items-center rounded-lg ${active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
        {icon}
      </span>
      <span>
        <span className={`block text-sm font-semibold ${active ? "text-primary" : "text-foreground"}`}>{title}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
    </button>
  );
}
