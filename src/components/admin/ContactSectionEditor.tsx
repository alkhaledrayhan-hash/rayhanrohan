import { useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Save, Trash2, Upload, X } from "lucide-react";
import { fileToDataUrl } from "@/lib/image-upload";

export type HomeContactConfig = {
  eyebrow: string;
  title: string;
  description: string;
  phone_display: string;
  phone_e164: string;
  email: string;
  subjects: string[];
  default_dial_code: string;
};

export type MapTemplate = "classic" | "rounded" | "framed" | "dark" | "minimal";
export type MapConfig = {
  mode: "query" | "embed" | "coords";
  query: string;
  embed_html: string;
  lat: string;
  lng: string;
  zoom: number;
  height: number;
  template: MapTemplate;
  grayscale: boolean;
};

export type ContactPageConfig = {
  hero: { eyebrow: string; title: string; description: string; image?: string };
  phone_display: string;
  phone_e164: string;
  whatsapp_e164: string;
  email: string;
  hours_short: string;
  subjects: string[];
  default_dial_code: string;
  office: { name: string; address: string; hours: string; license: string; cr: string };
  map_query: string;
  map: MapConfig;
};

const HOME_DEFAULT: HomeContactConfig = {
  eyebrow: "Talk to a specialist",
  title: "Have a question? We'd love to hear from you.",
  description: "Whether you're searching for your next home, listing a property, or just exploring the market — our advisors respond within one business hour.",
  phone_display: "+974 4000 0000",
  phone_e164: "+97440000000",
  email: "hello@maisonqatar.com",
  subjects: ["General enquiry","Buying a property","Renting a property","List my property","Investment advice"],
  default_dial_code: "+974",
};

const PAGE_DEFAULT: ContactPageConfig = {
  hero: { eyebrow: "Contact", title: "Talk to a Doha property advisor.", description: "Viewings, valuations, off-market opportunities or listing your property — our team replies within one business hour, seven days a week.", image: "" },
  phone_display: "+974 4444 0123",
  phone_e164: "+97444440123",
  whatsapp_e164: "97433330123",
  email: "hello@maisonqatar.qa",
  hours_short: "Sat–Thu · 9am–8pm",
  subjects: ["General enquiry","Book a viewing","Sell or list a property","Property valuation","Press & partnerships"],
  default_dial_code: "+974",
  office: { name: "Head Office", address: "Tower 2, Level 18, West Bay Business District\nAl Corniche Street, Doha, Qatar", hours: "Sat–Thu · 9:00 AM – 8:00 PM\nFriday · By appointment", license: "QA-RE-2014-0387", cr: "114532" },
  map_query: "West Bay Doha Qatar",
};

export function normalizeHomeContact(raw: any): HomeContactConfig {
  if (!raw) return HOME_DEFAULT;
  return {
    ...HOME_DEFAULT,
    ...raw,
    subjects: Array.isArray(raw.subjects) && raw.subjects.length ? raw.subjects.map(String) : HOME_DEFAULT.subjects,
  };
}

export function normalizeContactPage(raw: any): ContactPageConfig {
  if (!raw) return PAGE_DEFAULT;
  return {
    ...PAGE_DEFAULT,
    ...raw,
    hero: { ...PAGE_DEFAULT.hero, ...(raw.hero || {}) },
    office: { ...PAGE_DEFAULT.office, ...(raw.office || {}) },
    subjects: Array.isArray(raw.subjects) && raw.subjects.length ? raw.subjects.map(String) : PAGE_DEFAULT.subjects,
  };
}

function Field({ label, value, onChange, multiline, rows }: { label: string; value: string; onChange: (v: string) => void; multiline?: boolean; rows?: number }) {
  return (
    <label className="text-sm">
      <span className="mb-1 block text-xs font-medium text-muted-foreground">{label}</span>
      {multiline ? (
        <textarea rows={rows || 3} className="w-full rounded-md border border-input bg-white px-3 py-2" value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input className="w-full rounded-md border border-input bg-white px-3 py-2" value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </label>
  );
}

function SubjectsEditor({ subjects, onChange }: { subjects: string[]; onChange: (s: string[]) => void }) {
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-4">
      <p className="mb-2 text-xs font-medium text-muted-foreground">Subjects / topics</p>
      <div className="space-y-2">
        {subjects.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <input className="flex-1 rounded-md border border-input bg-white px-3 py-1.5 text-sm" value={s} onChange={(e) => { const copy = [...subjects]; copy[i] = e.target.value; onChange(copy); }} />
            <button onClick={() => onChange(subjects.filter((_, idx) => idx !== i))} className="rounded-md p-1.5 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
      <button onClick={() => onChange([...subjects, "New topic"])} className="mt-3 inline-flex items-center gap-2 rounded-md border border-input bg-white px-3 py-1.5 text-sm hover:bg-muted"><Plus className="h-4 w-4" /> Add subject</button>
    </div>
  );
}

function SaveBar({ pending, onSave }: { pending: boolean; onSave: () => void }) {
  return (
    <div className="flex justify-end">
      <button onClick={onSave} disabled={pending} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"><Save className="h-4 w-4" /> {pending ? "Saving…" : "Save"}</button>
    </div>
  );
}

function useSaveSection(sectionId: string, label: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (value: any) => {
      const { error } = await supabase.from("page_sections").update({ content: value }).eq("id", sectionId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`${label} saved`);
      qc.invalidateQueries({ queryKey: ["page-sections"] });
      qc.invalidateQueries({ queryKey: ["home-sections"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function HomeContactEditor({ sectionId, initial }: { sectionId: string; initial: any }) {
  const [v, setV] = useState<HomeContactConfig>(normalizeHomeContact(initial));
  useEffect(() => { setV(normalizeHomeContact(initial)); }, [sectionId]);
  const save = useSaveSection(sectionId, "Contact section");
  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-xl border border-border bg-muted/20 p-4 sm:grid-cols-2">
        <Field label="Eyebrow" value={v.eyebrow} onChange={(x) => setV({ ...v, eyebrow: x })} />
        <Field label="Title" value={v.title} onChange={(x) => setV({ ...v, title: x })} />
        <div className="sm:col-span-2"><Field label="Description" value={v.description} onChange={(x) => setV({ ...v, description: x })} multiline rows={3} /></div>
        <Field label="Phone (display)" value={v.phone_display} onChange={(x) => setV({ ...v, phone_display: x })} />
        <Field label="Phone (tel: link, E.164)" value={v.phone_e164} onChange={(x) => setV({ ...v, phone_e164: x })} />
        <Field label="Email" value={v.email} onChange={(x) => setV({ ...v, email: x })} />
        <Field label="Default dial code" value={v.default_dial_code} onChange={(x) => setV({ ...v, default_dial_code: x })} />
      </div>
      <SubjectsEditor subjects={v.subjects} onChange={(s) => setV({ ...v, subjects: s })} />
      <SaveBar pending={save.isPending} onSave={() => save.mutate(v)} />
    </div>
  );
}

export type ContactSectionKey = "hero" | "channels" | "subjects" | "office";

export function ContactPageEditor({ sectionId, initial, only }: { sectionId: string; initial: any; only?: ContactSectionKey }) {
  const [v, setV] = useState<ContactPageConfig>(normalizeContactPage(initial));
  const fileRef = useRef<HTMLInputElement>(null);
  useEffect(() => { setV(normalizeContactPage(initial)); }, [sectionId]);
  const save = useSaveSection(sectionId, "Contact page");

  async function uploadHero(file: File) {
    try {
      const url = await fileToDataUrl(file, { maxSize: 1600, quality: 0.78 });
      setV({ ...v, hero: { ...v.hero, image: url } });
      toast.success("Image set. Click Save to publish.");
    } catch (e: any) { toast.error(e.message); }
  }

  const show = (k: ContactSectionKey) => !only || only === k;

  return (
    <div className="space-y-4">
      {show("hero") && (
        <div className="grid gap-3 rounded-xl border border-border bg-muted/20 p-4 sm:grid-cols-2">
          <p className="sm:col-span-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Page hero</p>
          <Field label="Eyebrow" value={v.hero.eyebrow} onChange={(x) => setV({ ...v, hero: { ...v.hero, eyebrow: x } })} />
          <Field label="Title" value={v.hero.title} onChange={(x) => setV({ ...v, hero: { ...v.hero, title: x } })} />
          <div className="sm:col-span-2"><Field label="Description" value={v.hero.description} onChange={(x) => setV({ ...v, hero: { ...v.hero, description: x } })} multiline rows={3} /></div>
          <div className="sm:col-span-2 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Hero background image</p>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { if (e.target.files?.[0]) uploadHero(e.target.files[0]); e.target.value = ""; }} />
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"><Upload className="h-4 w-4" /> Upload image</button>
              {v.hero.image && <button type="button" onClick={() => setV({ ...v, hero: { ...v.hero, image: "" } })} className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-muted"><X className="h-3 w-3" /> Remove</button>}
            </div>
            <Field label="Or paste image URL" value={v.hero.image || ""} onChange={(x) => setV({ ...v, hero: { ...v.hero, image: x } })} />
            {v.hero.image && <img src={v.hero.image} alt="" className="mt-2 aspect-[16/6] w-full rounded-lg object-cover" />}
          </div>
        </div>
      )}

      {show("channels") && (
        <div className="grid gap-3 rounded-xl border border-border bg-muted/20 p-4 sm:grid-cols-2">
          <p className="sm:col-span-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact channels</p>
          <Field label="Phone (display)" value={v.phone_display} onChange={(x) => setV({ ...v, phone_display: x })} />
          <Field label="Phone (E.164)" value={v.phone_e164} onChange={(x) => setV({ ...v, phone_e164: x })} />
          <Field label="WhatsApp (digits only, country+number)" value={v.whatsapp_e164} onChange={(x) => setV({ ...v, whatsapp_e164: x })} />
          <Field label="Email" value={v.email} onChange={(x) => setV({ ...v, email: x })} />
          <Field label="Hours (short)" value={v.hours_short} onChange={(x) => setV({ ...v, hours_short: x })} />
          <Field label="Default dial code" value={v.default_dial_code} onChange={(x) => setV({ ...v, default_dial_code: x })} />
        </div>
      )}

      {show("subjects") && (
        <SubjectsEditor subjects={v.subjects} onChange={(s) => setV({ ...v, subjects: s })} />
      )}

      {show("office") && (
        <div className="grid gap-3 rounded-xl border border-border bg-muted/20 p-4 sm:grid-cols-2">
          <p className="sm:col-span-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Head office</p>
          <Field label="Name" value={v.office.name} onChange={(x) => setV({ ...v, office: { ...v.office, name: x } })} />
          <Field label="License" value={v.office.license} onChange={(x) => setV({ ...v, office: { ...v.office, license: x } })} />
          <Field label="CR No." value={v.office.cr} onChange={(x) => setV({ ...v, office: { ...v.office, cr: x } })} />
          <Field label="Map query (used by Google Maps embed)" value={v.map_query} onChange={(x) => setV({ ...v, map_query: x })} />
          <div className="sm:col-span-2"><Field label="Address (multi-line)" value={v.office.address} onChange={(x) => setV({ ...v, office: { ...v.office, address: x } })} multiline rows={3} /></div>
          <div className="sm:col-span-2"><Field label="Hours (multi-line)" value={v.office.hours} onChange={(x) => setV({ ...v, office: { ...v.office, hours: x } })} multiline rows={3} /></div>
        </div>
      )}

      <SaveBar pending={save.isPending} onSave={() => save.mutate(v)} />
    </div>
  );
}
