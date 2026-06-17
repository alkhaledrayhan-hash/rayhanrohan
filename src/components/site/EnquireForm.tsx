import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { createEnquiry } from "@/lib/bookings.functions";
import type { Property } from "@/lib/properties";

export function EnquireForm({ property }: { property: Property }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(
    `I'd like more information about ${property.title} in ${property.location}.`,
  );
  const [submitting, setSubmitting] = useState(false);
  const submit = useServerFn(createEnquiry);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submit({
        data: { propertyId: property.id, name, phone, email, message },
      });
      toast.success("Enquiry sent — our agent will reply shortly.");
      setName(""); setPhone(""); setEmail("");
    } catch (err) {
      console.error(err);
      toast.error("Please check your details and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2">
        <Mail className="h-5 w-5 text-primary" />
        <h3 className="font-display text-xl font-semibold">Enquire now</h3>
      </div>
      <div className="mt-4 grid gap-3">
        <Field label="Name" value={name} onChange={setName} required />
        <Field label="Phone" value={phone} onChange={setPhone} type="tel" required />
        <Field label="Email" value={email} onChange={setEmail} type="email" required />
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Message</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none ring-primary/30 focus:ring-2"
          />
        </label>
      </div>
      <button
        disabled={submitting}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary bg-background px-5 py-3 text-sm font-medium text-primary transition hover:bg-primary hover:text-primary-foreground disabled:opacity-60"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Send enquiry
      </button>
    </form>
  );
}

function Field({
  label, value, onChange, type = "text", required,
}: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        required={required}
        className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none ring-primary/30 focus:ring-2"
      />
    </label>
  );
}
