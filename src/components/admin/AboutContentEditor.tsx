import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Save, Trash2, Upload, X, Image as ImageIcon } from "lucide-react";
import { fileToDataUrl } from "@/lib/image-upload";

export type AboutContent = {
  stats: Array<{ label: string; value: number; suffix?: string; prefix?: string }>;
  story: {
    eyebrow: string;
    title: string;
    paragraphs: string[];
    image?: string;
    badge_title?: string;
    badge_subtitle?: string;
  };
  mission: {
    eyebrow: string;
    title: string;
    description: string;
    items: Array<{ tag: string; title: string; body: string; points: string[] }>;
  };
  values: {
    eyebrow: string;
    title: string;
    items: Array<{ icon: string; title: string; body: string }>;
  };
  team: {
    eyebrow: string;
    title: string;
    description: string;
    members: Array<{ name: string; role: string; bio: string }>;
  };
  company: {
    eyebrow: string;
    title: string;
    description: string;
    details: Array<{ label: string; value: string }>;
    primary_cta_label: string;
    secondary_cta_label: string;
    secondary_cta_email: string;
  };
};

const DEFAULT: AboutContent = {
  stats: [],
  story: { eyebrow: "", title: "", paragraphs: [], image: "", badge_title: "", badge_subtitle: "" },
  mission: { eyebrow: "", title: "", description: "", items: [] },
  values: { eyebrow: "", title: "", items: [] },
  team: { eyebrow: "", title: "", description: "", members: [] },
  company: { eyebrow: "", title: "", description: "", details: [], primary_cta_label: "", secondary_cta_label: "", secondary_cta_email: "" },
};

export function normalizeAbout(raw: any): AboutContent {
  if (!raw) return DEFAULT;
  return {
    stats: Array.isArray(raw.stats) ? raw.stats : DEFAULT.stats,
    story: { ...DEFAULT.story, ...(raw.story || {}), paragraphs: Array.isArray(raw.story?.paragraphs) ? raw.story.paragraphs : [] },
    mission: { ...DEFAULT.mission, ...(raw.mission || {}), items: Array.isArray(raw.mission?.items) ? raw.mission.items : [] },
    values: { ...DEFAULT.values, ...(raw.values || {}), items: Array.isArray(raw.values?.items) ? raw.values.items : [] },
    team: { ...DEFAULT.team, ...(raw.team || {}), members: Array.isArray(raw.team?.members) ? raw.team.members : [] },
    company: { ...DEFAULT.company, ...(raw.company || {}), details: Array.isArray(raw.company?.details) ? raw.company.details : [] },
  };
}

const inputCls = "w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

function Input({ label, value, onChange, multiline, rows }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean; rows?: number }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {multiline
        ? <textarea rows={rows || 3} className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} />
        : <input className={inputCls} value={value} onChange={(e) => onChange(e.target.value)} />}
    </label>
  );
}

function NumberInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      <input type="number" className={inputCls} value={value} onChange={(e) => onChange(Number(e.target.value) || 0)} />
    </label>
  );
}

function Card({ title, children, onRemove }: { title: string; children: React.ReactNode; onRemove?: () => void }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
        {onRemove && (
          <button onClick={onRemove} className="rounded-md p-1 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
        )}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details open className="rounded-xl border border-border bg-white">
      <summary className="cursor-pointer rounded-xl px-4 py-3 text-sm font-semibold">{title}</summary>
      <div className="space-y-3 border-t border-border p-4">{children}</div>
    </details>
  );
}

export type AboutSectionKey = "stats" | "story" | "mission" | "values" | "team" | "company";

export function AboutContentEditor({ sectionId, initial, only }: { sectionId: string; initial: any; only?: AboutSectionKey }) {
  const qc = useQueryClient();
  const [v, setV] = useState<AboutContent>(normalizeAbout(initial));
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => { setV(normalizeAbout(initial)); }, [sectionId]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("page_sections").update({ content: v }).eq("id", sectionId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("About content saved");
      qc.invalidateQueries({ queryKey: ["page-sections"] });
      qc.invalidateQueries({ queryKey: ["home-sections"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  async function uploadStoryImage(file: File) {
    try {
      const url = await fileToDataUrl(file, { maxSize: 1400, quality: 0.78 });
      setV({ ...v, story: { ...v.story, image: url } });
      toast.success("Image set. Click Save to publish.");
    } catch (e: any) { toast.error(e.message); }
  }

  const show = (k: AboutSectionKey) => !only || only === k;

  return (
    <div className="space-y-4">

      {show("stats") && (
      <>
      {/* Stats */}
      <Group title="Stats strip">
        {v.stats.map((s, i) => (
          <Card key={i} title={`Stat ${i + 1}`} onRemove={() => setV({ ...v, stats: v.stats.filter((_, j) => j !== i) })}>
            <div className="grid gap-3 sm:grid-cols-4">
              <Input label="Label" value={s.label} onChange={(x) => { const c = [...v.stats]; c[i] = { ...c[i], label: x }; setV({ ...v, stats: c }); }} />
              <NumberInput label="Value" value={s.value} onChange={(x) => { const c = [...v.stats]; c[i] = { ...c[i], value: x }; setV({ ...v, stats: c }); }} />
              <Input label="Prefix" value={s.prefix || ""} onChange={(x) => { const c = [...v.stats]; c[i] = { ...c[i], prefix: x }; setV({ ...v, stats: c }); }} />
              <Input label="Suffix" value={s.suffix || ""} onChange={(x) => { const c = [...v.stats]; c[i] = { ...c[i], suffix: x }; setV({ ...v, stats: c }); }} />
            </div>
          </Card>
        ))}
        <button onClick={() => setV({ ...v, stats: [...v.stats, { label: "New stat", value: 0, suffix: "" }] })} className="inline-flex items-center gap-2 rounded-md border border-input bg-white px-3 py-1.5 text-sm hover:bg-muted"><Plus className="h-4 w-4" /> Add stat</button>
      </Group>
      </>
      )}

      {show("story") && (
      <>
      {/* Story */}
      <Group title="Story section">

        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Eyebrow" value={v.story.eyebrow} onChange={(x) => setV({ ...v, story: { ...v.story, eyebrow: x } })} />
          <Input label="Title" value={v.story.title} onChange={(x) => setV({ ...v, story: { ...v.story, title: x } })} />
          <Input label="Badge title" value={v.story.badge_title || ""} onChange={(x) => setV({ ...v, story: { ...v.story, badge_title: x } })} />
          <Input label="Badge subtitle" value={v.story.badge_subtitle || ""} onChange={(x) => setV({ ...v, story: { ...v.story, badge_subtitle: x } })} />
        </div>
        <Card title="Paragraphs">
          {v.story.paragraphs.map((p, i) => (
            <div key={i} className="flex gap-2">
              <textarea rows={3} className={inputCls} value={p} onChange={(e) => { const c = [...v.story.paragraphs]; c[i] = e.target.value; setV({ ...v, story: { ...v.story, paragraphs: c } }); }} />
              <button onClick={() => setV({ ...v, story: { ...v.story, paragraphs: v.story.paragraphs.filter((_, j) => j !== i) } })} className="rounded-md p-2 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
          <button onClick={() => setV({ ...v, story: { ...v.story, paragraphs: [...v.story.paragraphs, ""] } })} className="inline-flex items-center gap-2 rounded-md border border-input bg-white px-3 py-1.5 text-sm hover:bg-muted"><Plus className="h-4 w-4" /> Add paragraph</button>
        </Card>
        <Card title="Image">
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { if (e.target.files?.[0]) uploadStoryImage(e.target.files[0]); e.target.value = ""; }} />
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"><Upload className="h-4 w-4" /> Upload image</button>
            {v.story.image && <button onClick={() => setV({ ...v, story: { ...v.story, image: "" } })} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-muted"><X className="h-3 w-3" /> Remove</button>}
          </div>
          <Input label="Or paste image URL" value={v.story.image || ""} onChange={(x) => setV({ ...v, story: { ...v.story, image: x } })} />
          {v.story.image && <img src={v.story.image} alt="" className="mt-2 aspect-[4/3] w-full max-w-sm rounded-lg object-cover" />}
        </Card>
      </Group>
      </>
      )}

      {show("mission") && (
      <>
      {/* Mission & Vision */}
      <Group title="Mission & Vision">

        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Eyebrow" value={v.mission.eyebrow} onChange={(x) => setV({ ...v, mission: { ...v.mission, eyebrow: x } })} />
          <Input label="Title" value={v.mission.title} onChange={(x) => setV({ ...v, mission: { ...v.mission, title: x } })} />
        </div>
        <Input label="Description" value={v.mission.description} onChange={(x) => setV({ ...v, mission: { ...v.mission, description: x } })} multiline rows={2} />
        {v.mission.items.map((it, i) => (
          <Card key={i} title={`Item ${i + 1}`} onRemove={() => setV({ ...v, mission: { ...v.mission, items: v.mission.items.filter((_, j) => j !== i) } })}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Tag (Mission/Vision)" value={it.tag} onChange={(x) => { const c = [...v.mission.items]; c[i] = { ...c[i], tag: x }; setV({ ...v, mission: { ...v.mission, items: c } }); }} />
              <Input label="Title" value={it.title} onChange={(x) => { const c = [...v.mission.items]; c[i] = { ...c[i], title: x }; setV({ ...v, mission: { ...v.mission, items: c } }); }} />
            </div>
            <Input label="Body" value={it.body} onChange={(x) => { const c = [...v.mission.items]; c[i] = { ...c[i], body: x }; setV({ ...v, mission: { ...v.mission, items: c } }); }} multiline rows={3} />
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Bullet points</p>
              {it.points.map((p, k) => (
                <div key={k} className="flex gap-2">
                  <input className={inputCls} value={p} onChange={(e) => { const c = [...v.mission.items]; c[i].points[k] = e.target.value; setV({ ...v, mission: { ...v.mission, items: c } }); }} />
                  <button onClick={() => { const c = [...v.mission.items]; c[i].points = c[i].points.filter((_, j) => j !== k); setV({ ...v, mission: { ...v.mission, items: c } }); }} className="rounded-md p-2 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
              <button onClick={() => { const c = [...v.mission.items]; c[i].points = [...c[i].points, ""]; setV({ ...v, mission: { ...v.mission, items: c } }); }} className="inline-flex items-center gap-2 rounded-md border border-input bg-white px-3 py-1 text-xs hover:bg-muted"><Plus className="h-3 w-3" /> Add point</button>
            </div>
          </Card>
        ))}
        <button onClick={() => setV({ ...v, mission: { ...v.mission, items: [...v.mission.items, { tag: "Mission", title: "", body: "", points: [] }] } })} className="inline-flex items-center gap-2 rounded-md border border-input bg-white px-3 py-1.5 text-sm hover:bg-muted"><Plus className="h-4 w-4" /> Add item</button>
      </Group>
      </>
      )}

      {show("values") && (
      <>
      {/* Values */}
      <Group title="Values">

        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Eyebrow" value={v.values.eyebrow} onChange={(x) => setV({ ...v, values: { ...v.values, eyebrow: x } })} />
          <Input label="Title" value={v.values.title} onChange={(x) => setV({ ...v, values: { ...v.values, title: x } })} />
        </div>
        {v.values.items.map((it, i) => (
          <Card key={i} title={`Value ${i + 1}`} onRemove={() => setV({ ...v, values: { ...v.values, items: v.values.items.filter((_, j) => j !== i) } })}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Icon (shield, sparkles, handshake, globe)" value={it.icon} onChange={(x) => { const c = [...v.values.items]; c[i] = { ...c[i], icon: x }; setV({ ...v, values: { ...v.values, items: c } }); }} />
              <Input label="Title" value={it.title} onChange={(x) => { const c = [...v.values.items]; c[i] = { ...c[i], title: x }; setV({ ...v, values: { ...v.values, items: c } }); }} />
            </div>
            <Input label="Body" value={it.body} onChange={(x) => { const c = [...v.values.items]; c[i] = { ...c[i], body: x }; setV({ ...v, values: { ...v.values, items: c } }); }} multiline rows={2} />
          </Card>
        ))}
        <button onClick={() => setV({ ...v, values: { ...v.values, items: [...v.values.items, { icon: "sparkles", title: "", body: "" }] } })} className="inline-flex items-center gap-2 rounded-md border border-input bg-white px-3 py-1.5 text-sm hover:bg-muted"><Plus className="h-4 w-4" /> Add value</button>
      </Group>
      </>
      )}

      {show("team") && (
      <>
      {/* Team */}
      <Group title="Team">

        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Eyebrow" value={v.team.eyebrow} onChange={(x) => setV({ ...v, team: { ...v.team, eyebrow: x } })} />
          <Input label="Title" value={v.team.title} onChange={(x) => setV({ ...v, team: { ...v.team, title: x } })} />
        </div>
        <Input label="Description" value={v.team.description} onChange={(x) => setV({ ...v, team: { ...v.team, description: x } })} multiline rows={2} />
        {v.team.members.map((m, i) => (
          <Card key={i} title={`Member ${i + 1}`} onRemove={() => setV({ ...v, team: { ...v.team, members: v.team.members.filter((_, j) => j !== i) } })}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Name" value={m.name} onChange={(x) => { const c = [...v.team.members]; c[i] = { ...c[i], name: x }; setV({ ...v, team: { ...v.team, members: c } }); }} />
              <Input label="Role" value={m.role} onChange={(x) => { const c = [...v.team.members]; c[i] = { ...c[i], role: x }; setV({ ...v, team: { ...v.team, members: c } }); }} />
            </div>
            <Input label="Bio" value={m.bio} onChange={(x) => { const c = [...v.team.members]; c[i] = { ...c[i], bio: x }; setV({ ...v, team: { ...v.team, members: c } }); }} multiline rows={2} />
          </Card>
        ))}
        <button onClick={() => setV({ ...v, team: { ...v.team, members: [...v.team.members, { name: "", role: "", bio: "" }] } })} className="inline-flex items-center gap-2 rounded-md border border-input bg-white px-3 py-1.5 text-sm hover:bg-muted"><Plus className="h-4 w-4" /> Add member</button>
      </Group>

      {/* Company */}
      <Group title="Company details">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label="Eyebrow" value={v.company.eyebrow} onChange={(x) => setV({ ...v, company: { ...v.company, eyebrow: x } })} />
          <Input label="Title" value={v.company.title} onChange={(x) => setV({ ...v, company: { ...v.company, title: x } })} />
        </div>
        <Input label="Description" value={v.company.description} onChange={(x) => setV({ ...v, company: { ...v.company, description: x } })} multiline rows={2} />
        {v.company.details.map((d, i) => (
          <div key={i} className="flex gap-2">
            <input className={inputCls} placeholder="Label" value={d.label} onChange={(e) => { const c = [...v.company.details]; c[i] = { ...c[i], label: e.target.value }; setV({ ...v, company: { ...v.company, details: c } }); }} />
            <input className={inputCls} placeholder="Value" value={d.value} onChange={(e) => { const c = [...v.company.details]; c[i] = { ...c[i], value: e.target.value }; setV({ ...v, company: { ...v.company, details: c } }); }} />
            <button onClick={() => setV({ ...v, company: { ...v.company, details: v.company.details.filter((_, j) => j !== i) } })} className="rounded-md p-2 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
        <button onClick={() => setV({ ...v, company: { ...v.company, details: [...v.company.details, { label: "", value: "" }] } })} className="inline-flex items-center gap-2 rounded-md border border-input bg-white px-3 py-1.5 text-sm hover:bg-muted"><Plus className="h-4 w-4" /> Add detail</button>
        <div className="grid gap-3 sm:grid-cols-3">
          <Input label="Primary CTA label" value={v.company.primary_cta_label} onChange={(x) => setV({ ...v, company: { ...v.company, primary_cta_label: x } })} />
          <Input label="Secondary CTA label" value={v.company.secondary_cta_label} onChange={(x) => setV({ ...v, company: { ...v.company, secondary_cta_label: x } })} />
          <Input label="Secondary CTA email" value={v.company.secondary_cta_email} onChange={(x) => setV({ ...v, company: { ...v.company, secondary_cta_email: x } })} />
        </div>
      </Group>

      <div className="sticky bottom-2 flex justify-end">
        <button onClick={() => save.mutate()} disabled={save.isPending} className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow disabled:opacity-60">
          <Save className="h-4 w-4" /> {save.isPending ? "Saving…" : "Save About content"}
        </button>
      </div>
    </div>
  );
}
