import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ChevronDown, Loader2, Mail, Search } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { createEnquiry } from "@/lib/bookings.functions";
import type { Property } from "@/lib/properties";

// Common country dial codes (extend as needed)
const COUNTRY_CODES: { code: string; flag: string; name: string }[] = [
  { code: "+974", flag: "🇶🇦", name: "Qatar" },
  { code: "+971", flag: "🇦🇪", name: "United Arab Emirates" },
  { code: "+966", flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "+973", flag: "🇧🇭", name: "Bahrain" },
  { code: "+965", flag: "🇰🇼", name: "Kuwait" },
  { code: "+968", flag: "🇴🇲", name: "Oman" },
  { code: "+20", flag: "🇪🇬", name: "Egypt" },
  { code: "+962", flag: "🇯🇴", name: "Jordan" },
  { code: "+961", flag: "🇱🇧", name: "Lebanon" },
  { code: "+90", flag: "🇹🇷", name: "Türkiye" },
  { code: "+44", flag: "🇬🇧", name: "United Kingdom" },
  { code: "+1", flag: "🇺🇸", name: "United States" },
  { code: "+33", flag: "🇫🇷", name: "France" },
  { code: "+49", flag: "🇩🇪", name: "Germany" },
  { code: "+39", flag: "🇮🇹", name: "Italy" },
  { code: "+34", flag: "🇪🇸", name: "Spain" },
  { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+92", flag: "🇵🇰", name: "Pakistan" },
  { code: "+880", flag: "🇧🇩", name: "Bangladesh" },
  { code: "+94", flag: "🇱🇰", name: "Sri Lanka" },
  { code: "+63", flag: "🇵🇭", name: "Philippines" },
  { code: "+62", flag: "🇮🇩", name: "Indonesia" },
  { code: "+60", flag: "🇲🇾", name: "Malaysia" },
  { code: "+86", flag: "🇨🇳", name: "China" },
  { code: "+81", flag: "🇯🇵", name: "Japan" },
  { code: "+82", flag: "🇰🇷", name: "South Korea" },
  { code: "+61", flag: "🇦🇺", name: "Australia" },
  { code: "+27", flag: "🇿🇦", name: "South Africa" },
  { code: "+234", flag: "🇳🇬", name: "Nigeria" },
];

export function EnquireForm({ property }: { property: Property }) {
  const [name, setName] = useState("");
  const [dialCode, setDialCode] = useState("+974");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(
    `I'd like more information about ${property.title} in ${property.location}.`,
  );
  const [submitting, setSubmitting] = useState(false);
  const submit = useServerFn(createEnquiry);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fullPhone = `${dialCode} ${phone.trim()}`.trim();
    setSubmitting(true);
    try {
      await submit({
        data: { propertyId: property.id, name, phone: fullPhone, email, message },
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

        {/* Phone with country code */}
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Phone
          </span>
          <div className="flex items-stretch gap-2">
            <select
              value={dialCode}
              onChange={(e) => setDialCode(e.target.value)}
              aria-label="Country code"
              className="min-w-[110px] shrink-0 rounded-lg border border-border bg-background px-2 py-2.5 text-sm outline-none ring-primary/30 focus:ring-2"
            >
              {COUNTRY_CODES.map((c) => (
                <option key={c.code + c.name} value={c.code}>
                  {c.flag} {c.code} {c.name}
                </option>
              ))}
            </select>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9\s-]/g, ""))}
              type="tel"
              inputMode="tel"
              required
              maxLength={20}
              placeholder="Phone number"
              className="min-w-0 flex-1 rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none ring-primary/30 focus:ring-2"
            />
          </div>
        </label>

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
