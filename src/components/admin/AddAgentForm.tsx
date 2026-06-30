import { useRef, useState } from "react";
import { ThemedSelect } from "@/components/ui/themed-select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { z } from "zod";
import { ImageIcon, Save, Upload, X } from "lucide-react";
import { createAgent } from "@/lib/agents.functions";
import { fileToDataUrl } from "@/lib/image-upload";

const agentSchema = z.object({
  full_name: z.string().trim().min(2, "Agent name is required (min 2 chars)").max(100),
  email: z.string().trim().email("Valid email is required").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  username: z.string().trim().max(30).optional().or(z.literal("")),
  gender: z.string().max(20).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  country: z.string().trim().max(80).optional().or(z.literal("")),
  address: z.string().trim().max(500).optional().or(z.literal("")),
  avatar_url: z.string().max(500000).optional().or(z.literal("")),
});



const empty = {
  full_name: "",
  email: "",
  phone: "",
  username: "",
  password: "",
  gender: "",
  city: "",
  country: "",
  address: "",
  avatar_url: "",
};

export function AddAgentForm() {
  const [form, setForm] = useState(empty);
  const fn = useServerFn(createAgent);
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: () => fn({ data: form }),
    onSuccess: () => {
      toast.success("Agent created successfully");
      setForm(empty);
      qc.invalidateQueries({ queryKey: ["agents"] });
    },
    onError: (e: any) => toast.error(e?.message || "Failed to create agent"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const result = agentSchema.safeParse(form);
    if (!result.success) {
      toast.error(result.error.issues[0]?.message || "Please check the form");
      return;
    }
    mut.mutate();
  };


  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}
      className="grid gap-5 lg:grid-cols-[340px_1fr]"
    >
      {/* Avatar card */}
      <AvatarUploader
        value={form.avatar_url}
        onChange={(v) => setForm((f) => ({ ...f, avatar_url: v }))}
      />


      {/* Fields card */}
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-semibold">Add Agent</h3>
          <button
            type="submit"
            disabled={mut.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            <Save className="h-4 w-4" /> {mut.isPending ? "Saving…" : "Save Agent"}
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Agent Name *"><input required value={form.full_name} onChange={set("full_name")} placeholder="Enter Full Name" className={inputCls} maxLength={100} /></Field>
          <Field label="Agent Email *"><input required type="email" value={form.email} onChange={set("email")} placeholder="Enter email" className={inputCls} maxLength={255} /></Field>
          <Field label="Agent Number"><input value={form.phone} onChange={set("phone")} placeholder="+974 0000 0000" className={inputCls} maxLength={40} /></Field>

          <Field label="Username"><input value={form.username} onChange={set("username")} placeholder="agent_handle" className={inputCls} maxLength={30} /></Field>
          <Field label="Gender">
            <ThemedSelect value={form.gender} onChange={(v) => setForm((f) => ({ ...f, gender: v }))} className={inputCls}>
              <option value="">Select gender</option>
              <option>Male</option><option>Female</option><option>Other</option>
            </ThemedSelect>
          </Field>
          <Field label="Temporary Password *"><input required type="password" autoComplete="new-password" value={form.password} onChange={set("password")} placeholder="min 8 characters" className={inputCls} minLength={8} maxLength={72} /></Field>

          <Field label="Country"><input value={form.country} onChange={set("country")} placeholder="Qatar" className={inputCls} maxLength={80} /></Field>
          <Field label="City"><input value={form.city} onChange={set("city")} placeholder="Doha" className={inputCls} maxLength={80} /></Field>
          <Field label="&nbsp;" hideLabel><span className="hidden lg:block" /></Field>

          <Field label="Address" className="sm:col-span-2 lg:col-span-3">
            <textarea rows={4} value={form.address} onChange={set("address")} placeholder="Enter address" className={inputCls} maxLength={500} />
          </Field>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={() => setForm(empty)} className="rounded-lg border border-border px-4 py-2 text-sm">Cancel</button>
          <button type="submit" disabled={mut.isPending} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">
            {mut.isPending ? "Submitting…" : "Submit"}
          </button>
        </div>
      </div>
    </form>
  );
}

const inputCls = "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

function Field({ label, children, className = "", hideLabel = false }: { label: string; children: React.ReactNode; className?: string; hideLabel?: boolean }) {
  return (
    <label className={`space-y-1.5 ${className}`}>
      <span className={`block text-sm font-medium text-foreground ${hideLabel ? "opacity-0" : ""}`} dangerouslySetInnerHTML={{ __html: label }} />
      {children}
    </label>
  );
}


export function AvatarUploader({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [urlMode, setUrlMode] = useState(false);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      setBusy(true);
      const url = await fileToDataUrl(file, { maxSize: 512, quality: 0.82 });
      onChange(url);
    } catch (err: any) {
      toast.error(err?.message || "Could not read image");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <h3 className="font-display text-base font-semibold">Agent Photo</h3>

      <div className="relative mt-4 grid h-56 place-items-center overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted/40">
        {value ? (
          <>
            <img src={value} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white hover:bg-black"
              aria-label="Remove photo"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex flex-col items-center gap-2 px-4 py-6 text-center text-muted-foreground hover:text-foreground"
          >
            <ImageIcon className="h-12 w-12 opacity-40" />
            <span className="text-sm">Click to upload from your device</span>
            <span className="text-[11px]">PNG, JPG up to 8 MB</span>
          </button>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/*" hidden onChange={onPick} />

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          <Upload className="h-4 w-4" /> {busy ? "Processing…" : value ? "Replace" : "Upload"}
        </button>
        <button
          type="button"
          onClick={() => setUrlMode((v) => !v)}
          className="rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          URL
        </button>
      </div>

      {urlMode && (
        <input
          value={value.startsWith("data:") ? "" : value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://…"
          className="mt-3 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      )}
    </div>
  );
}

