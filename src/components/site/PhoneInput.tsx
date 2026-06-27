import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

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

const flagUrl = (iso: string) => `https://flagcdn.com/w40/${iso}.png`;
const flagSrcSet = (iso: string) =>
  `https://flagcdn.com/w40/${iso}.png 1x, https://flagcdn.com/w80/${iso}.png 2x`;

export type PhoneInputVariant = "default" | "translucent";

interface PhoneInputProps {
  label?: string;
  dialCode: string;
  phone: string;
  onDialCodeChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
  variant?: PhoneInputVariant;
}

export function PhoneInput({
  label = "Phone",
  dialCode,
  phone,
  onDialCodeChange,
  onPhoneChange,
  required,
  placeholder = "Phone number",
  variant = "default",
}: PhoneInputProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = COUNTRY_CODES.find((c) => c.code === dialCode) ?? COUNTRY_CODES[0];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRY_CODES;
    return COUNTRY_CODES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || c.code.includes(q) || c.iso.includes(q),
    );
  }, [query]);

  const isTranslucent = variant === "translucent";
  const fieldClass = isTranslucent
    ? "rounded-md border border-white/20 bg-white/10 text-primary-foreground placeholder:text-primary-foreground/50 backdrop-blur-xl outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/30"
    : "rounded-lg border border-border bg-background text-foreground outline-none ring-primary/30 focus:ring-2";
  const labelClass = isTranslucent
    ? "text-[11px] font-medium uppercase tracking-[0.18em] text-primary-foreground/70"
    : "text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground";

  return (
    <label className="flex flex-col gap-1.5">
      <span className={labelClass}>{label}</span>
      <div className="flex items-stretch gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label="Country code"
              className={cn(
                "flex shrink-0 items-center gap-2 px-2.5 text-sm h-11",
                fieldClass,
              )}
            >
              <img
                src={flagUrl(selected.iso)}
                srcSet={flagSrcSet(selected.iso)}
                width={20}
                height={14}
                alt={`${selected.name} flag`}
                className="h-3.5 w-5 rounded-[2px] object-cover"
                loading="lazy"
              />
              <span className="font-medium">{selected.code}</span>
              <ChevronDown className="h-3.5 w-3.5 opacity-70" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-0" align="start">
            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
              <Search className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search country or code"
                className="w-full bg-transparent text-sm outline-none text-foreground"
              />
            </div>
            <ScrollArea className="h-64 pointer-events-auto">
              <ul className="py-1">
                {filtered.length === 0 && (
                  <li className="px-3 py-4 text-center text-xs text-muted-foreground">
                    No matches
                  </li>
                )}
                {filtered.map((c) => (
                  <li key={c.iso + c.code}>
                    <button
                      type="button"
                      onClick={() => {
                        onDialCodeChange(c.code);
                        setOpen(false);
                        setQuery("");
                      }}
                      className={cn(
                        "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition hover:bg-muted text-foreground",
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
          onChange={(e) => onPhoneChange(e.target.value.replace(/[^0-9\s-]/g, ""))}
          type="tel"
          inputMode="tel"
          required={required}
          maxLength={20}
          placeholder={placeholder}
          className={cn("min-w-0 flex-1 px-3 text-sm h-11", fieldClass)}
        />
      </div>
    </label>
  );
}
