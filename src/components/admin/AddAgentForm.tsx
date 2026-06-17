import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ImageIcon, Save, Upload, X } from "lucide-react";
import { createAgent } from "@/lib/agents.functions";
import { fileToDataUrl } from "@/lib/image-upload";


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
      toast.success("Agent created");
      setForm(empty);
      qc.invalidateQueries({ queryKey: ["agents"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to create agent"),
  });

  const set = (k: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}
      className="grid gap-5 lg:grid-cols-[340px_1fr]"
    >
      {/* Avatar card */}
      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <h3 className="font-display text-base font-semibold">Upload Agent Photo</h3>
        <div className="mt-4 grid h-56 place-items-center rounded-xl border-2 border-dashed border-border bg-muted/40">
          {form.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={form.avatar_url} alt="" className="h-full w-full rounded-xl object-cover" />
          ) : (
            <ImageIcon className="h-14 w-14 text-muted-foreground/40" />
          )}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Paste an image URL below. PNG, JPG recommended.</p>
        <input
          value={form.avatar_url}
          onChange={set("avatar_url")}
          placeholder="https://…"
          className={inputCls + " mt-3"}
        />
      </div>

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
            <select value={form.gender} onChange={set("gender")} className={inputCls}>
              <option value="">Select gender</option>
              <option>Male</option><option>Female</option><option>Other</option>
            </select>
          </Field>
          <Field label="Temporary Password *"><input required type="text" value={form.password} onChange={set("password")} placeholder="min 8 characters" className={inputCls} minLength={8} maxLength={72} /></Field>

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
