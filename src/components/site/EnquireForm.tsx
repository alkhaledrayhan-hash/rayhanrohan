import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ChevronDown, Loader2, Mail, Search } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { createEnquiry } from "@/lib/bookings.functions";
import { createConversation } from "@/lib/messages.functions";
import type { Property } from "@/lib/properties";

// Common country dial codes with ISO-3166 alpha-2 for flag images
const COUNTRY_CODES: { iso: string; code: string; name: string }[] = [
  { iso: "qa", code: "+974", name: "Qatar" },
  { iso: "ae", code: "+971", name: "United Arab Emirates" },
  { iso: "sa", code: "+966", name: "Saudi Arabia" },
  { iso: "bh", code: "+973", name: "Bahrain" },
  { iso: "kw", code: "+965", name: "Kuwait" },
  { iso: "om", code: "+968", name: "Oman" },
  { iso: "eg", code: "+20", name: "Egypt" },
  { iso: "jo", code: "+962", name: "Jordan" },
  { iso: "lb", code: "+961", name: "Lebanon" },
  { iso: "tr", code: "+90", name: "Türkiye" },
  { iso: "gb", code: "+44", name: "United Kingdom" },
  { iso: "us", code: "+1", name: "United States" },
  { iso: "fr", code: "+33", name: "France" },
  { iso: "de", code: "+49", name: "Germany" },
  { iso: "it", code: "+39", name: "Italy" },
  { iso: "es", code: "+34", name: "Spain" },
  { iso: "in", code: "+91", name: "India" },
  { iso: "pk", code: "+92", name: "Pakistan" },
  { iso: "bd", code: "+880", name: "Bangladesh" },
  { iso: "lk", code: "+94", name: "Sri Lanka" },
  { iso: "ph", code: "+63", name: "Philippines" },
  { iso: "id", code: "+62", name: "Indonesia" },
  { iso: "my", code: "+60", name: "Malaysia" },
  { iso: "cn", code: "+86", name: "China" },
  { iso: "jp", code: "+81", name: "Japan" },
  { iso: "kr", code: "+82", name: "South Korea" },
  { iso: "au", code: "+61", name: "Australia" },
  { iso: "za", code: "+27", name: "South Africa" },
  { iso: "ng", code: "+234", name: "Nigeria" },
];

function flagUrl(iso: string) {
  return `https://flagcdn.com/w40/${iso}.png`;
}

function flagSrcSet(iso: string) {
  return `https://flagcdn.com/w40/${iso}.png 1x, https://flagcdn.com/w80/${iso}.png 2x`;
}


export function EnquireForm({ property }: { property: Property }) {
  const [name, setName] = useState("");
  const [dialCode, setDialCode] = useState("+974");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(
    `I'd like more information about ${property.title} in ${property.location}.`,
  );
  const [submitting, setSubmitting] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [countryQuery, setCountryQuery] = useState("");
  const submit = useServerFn(createEnquiry);
  const startThread = useServerFn(createConversation);

  const selectedCountry = COUNTRY_CODES.find((c) => c.code === dialCode) ?? COUNTRY_CODES[0];
  const filteredCountries = useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    if (!q) return COUNTRY_CODES;
    return COUNTRY_CODES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.includes(q) ||
        c.iso.includes(q),
    );
  }, [countryQuery]);

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
            <Popover open={countryOpen} onOpenChange={setCountryOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  aria-label="Country code"
                  className="flex shrink-0 items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-2.5 text-sm outline-none ring-primary/30 focus:ring-2"
                >
                  <img
                    src={flagUrl(selectedCountry.iso)}
                    srcSet={flagSrcSet(selectedCountry.iso)}
                    width={20}
                    height={14}
                    alt={`${selectedCountry.name} flag`}
                    className="h-3.5 w-5 rounded-[2px] object-cover"
                    loading="lazy"
                  />
                  <span className="font-medium">{selectedCountry.code}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-[280px] p-0" align="start">
                <div className="flex items-center gap-2 border-b border-border px-3 py-2">
                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    autoFocus
                    value={countryQuery}
                    onChange={(e) => setCountryQuery(e.target.value)}
                    placeholder="Search country or code"
                    className="w-full bg-transparent text-sm outline-none"
                  />
                </div>
                <ScrollArea className="h-64 pointer-events-auto">
                  <ul className="py-1">
                    {filteredCountries.length === 0 && (
                      <li className="px-3 py-4 text-center text-xs text-muted-foreground">
                        No matches
                      </li>
                    )}
                    {filteredCountries.map((c) => (
                      <li key={c.iso + c.code}>
                        <button
                          type="button"
                          onClick={() => {
                            setDialCode(c.code);
                            setCountryOpen(false);
                            setCountryQuery("");
                          }}
                          className={cn(
                            "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition hover:bg-muted",
                            c.code === dialCode && "bg-muted/60",
                          )}
                        >
                          <img
                            src={flagUrl(c.iso)}
                            srcSet={flagSrcSet(c.iso)}
                            width={20}
                            height={14}
                            alt=""
                            className="h-3.5 w-5 shrink-0 rounded-[2px] object-cover"
                            loading="lazy"
                          />
                          <span className="flex-1 truncate">{c.name}</span>
                          <span className="text-xs text-muted-foreground">{c.code}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </PopoverContent>
            </Popover>
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
