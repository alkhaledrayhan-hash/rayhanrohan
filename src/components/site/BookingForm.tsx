import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CalendarCheck, CalendarIcon, Clock, Loader2 } from "lucide-react";
import { format, differenceInCalendarDays } from "date-fns";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { createBooking, createBookingAsUser } from "@/lib/bookings.functions";
import { supabase } from "@/integrations/supabase/client";
import type { Property } from "@/lib/properties";
import { useSiteSettings } from "@/hooks/useSiteSettings";

// 24-hour day, every 30 minutes
function buildTimeSlots() {
  const slots: { value: string; label: string }[] = [];
  for (let h = 0; h < 24; h++) {
    for (const m of [0, 30]) {
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      const value = `${hh}:${mm}`;
      const period = h < 12 ? "AM" : "PM";
      const h12 = ((h + 11) % 12) + 1;
      slots.push({ value, label: `${h12}:${mm} ${period}` });
    }
  }
  return slots;
}

export function BookingForm({ property }: { property: Property }) {
  const isRent = property.status === "rent";
  const settings = useSiteSettings();
  const currency = settings.site_currency || "QAR";
  const taxPct = Math.max(
    0,
    Number(isRent ? settings.rent_tax_percent : settings.sale_tax_percent) || 0,
  );
  const fmt = useMemo(
    () => new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }),
    [],
  );
  const timeSlots = useMemo(buildTimeSlots, []);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [range, setRange] = useState<DateRange | undefined>(undefined);

  const [time, setTime] = useState("10:00");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const submit = useServerFn(createBooking);
  const submitAsUser = useServerFn(createBookingAsUser);

  useEffect(() => {
    const start = new Date();
    start.setDate(start.getDate() + 1);
    if (isRent) {
      const end = new Date(start);
      end.setDate(end.getDate() + 2);
      setRange({ from: start, to: end });
    } else {
      setDate(start);
    }
  }, [isRent]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const nights =
    isRent && range?.from && range?.to
      ? Math.max(1, differenceInCalendarDays(range.to, range.from))
      : 0;

  // Pricing — treat property.price as nightly for rent, total for sale.
  const discount = Number(property.offerDiscount) || 0;
  const offerActive =
    discount > 0 &&
    (!property.offerEnds || new Date(property.offerEnds).getTime() > Date.now());
  const unitPrice = offerActive
    ? property.price * (1 - discount / 100)
    : property.price;
  const units = isRent ? nights : 1;
  const subtotal = unitPrice * units;
  const taxAmount = subtotal * (taxPct / 100);
  const total = subtotal + taxAmount;
  const money = (n: number) => `${currency} ${fmt.format(Math.round(n * 100) / 100)}`;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const isValidDate = (d: unknown): d is Date =>
      d instanceof Date && !Number.isNaN(d.getTime());

    if (isRent) {
      if (!range?.from || !isValidDate(range.from)) {
        toast.error("Please select a valid check-in date.");
        return;
      }
      if (!range?.to || !isValidDate(range.to)) {
        toast.error("Please select a valid check-out date.");
        return;
      }
      if (range.from < today) {
        toast.error("Check-in date cannot be in the past.");
        return;
      }
      if (differenceInCalendarDays(range.to, range.from) < 1) {
        toast.error("Check-out date must be after the check-in date (at least 1 night).");
        return;
      }
    } else {
      if (!date || !isValidDate(date)) {
        toast.error("Please select a valid viewing date.");
        return;
      }
      if (date < today) {
        toast.error("Viewing date cannot be in the past.");
        return;
      }
    }
    if (name.trim().length < 2 || phone.trim().length < 6) {
      toast.error("Please add your name and a valid phone number.");
      return;
    }

    setSubmitting(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const startDate = isRent ? range!.from! : date!;
      const endDate = isRent ? range!.to! : null;
      const iso = (d: Date) => d.toISOString().slice(0, 10);
      const lines: string[] = [];
      if (endDate) lines.push(`Rent period: ${iso(startDate)} → ${iso(endDate)} (${nights} night${nights === 1 ? "" : "s"})`);
      if (isRent) {
        lines.push(`Rate: ${money(unitPrice)} / night${offerActive ? ` (${discount}% offer applied)` : ""}`);
        lines.push(`Subtotal: ${money(unitPrice)} × ${nights} = ${money(subtotal)}`);
      } else {
        lines.push(`Price: ${money(unitPrice)}${offerActive ? ` (${discount}% offer applied)` : ""}`);
      }
      if (taxPct > 0) lines.push(`VAT (${taxPct}%): ${money(taxAmount)}`);
      lines.push(`Total: ${money(total)}`);
      const notes = lines.join("\n");
      const payload = {
        propertyId: property.id,
        propertyTitle: property.title,
        name,
        phone,
        date: iso(startDate),
        time,
        notes,
      };
      const res = auth?.user
        ? await submitAsUser({ data: payload })
        : await submit({ data: payload });
      toast.success(isRent ? "Rental requested" : "Viewing requested", {
        description: `Reference ${res.id}. Our agent will confirm by phone shortly.`,
      });
      setName("");
      setPhone("");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const selectedTimeLabel =
    timeSlots.find((t) => t.value === time)?.label ?? time;

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2">
        <CalendarCheck className="h-5 w-5 text-primary" />
        <h3 className="font-display text-xl font-semibold">
          {isRent ? "Book this rental" : "Schedule a viewing"}
        </h3>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {isRent
          ? "Pick your check-in and check-out dates."
          : "No payment, no registration — just pick a slot."}
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {/* Date / Date range */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {isRent ? "Check-in → Check-out" : "Date"}
          </span>
          <Popover open={dateOpen} onOpenChange={setDateOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2.5 text-left text-sm outline-none ring-primary/30 focus:ring-2",
                  ((isRent && !range?.from) || (!isRent && !date)) && "text-muted-foreground",
                )}
              >
                <span className="flex items-center gap-2 truncate">
                  <CalendarIcon className="h-4 w-4 shrink-0 text-primary" />
                  {isRent
                    ? range?.from
                      ? range.to
                        ? `${format(range.from, "d MMM")} → ${format(range.to, "d MMM yyyy")}`
                        : `${format(range.from, "d MMM yyyy")} → …`
                      : "Pick dates"
                    : date
                      ? format(date, "EEE, d MMM yyyy")
                      : "Pick a date"}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              {isRent ? (
                <Calendar
                  mode="range"
                  selected={range}
                  onSelect={(r) => {
                    setRange(r);
                    if (r?.from && r?.to) setDateOpen(false);
                  }}
                  numberOfMonths={2}
                  disabled={(d) => d < today}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              ) : (
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => {
                    setDate(d);
                    if (d) setDateOpen(false);
                  }}
                  disabled={(d) => d < today}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              )}
            </PopoverContent>
          </Popover>
          {isRent && nights > 0 ? (
            <span className="text-[11px] text-muted-foreground">
              {nights} night{nights === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>

        {/* Time */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {isRent ? "Check-in time" : "Preferred time"}
          </span>
          <Popover open={timeOpen} onOpenChange={setTimeOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2.5 text-left text-sm outline-none ring-primary/30 focus:ring-2"
              >
                <span className="flex items-center gap-2 truncate">
                  <Clock className="h-4 w-4 shrink-0 text-primary" />
                  {selectedTimeLabel}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-[220px] p-0" align="start">
              <ScrollArea className="h-64 pointer-events-auto">
                <div className="grid grid-cols-2 gap-1 p-2">
                  {timeSlots.map((t) => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => {
                        setTime(t.value);
                        setTimeOpen(false);
                      }}
                      className={cn(
                        "rounded-md px-2 py-1.5 text-center text-xs transition",
                        time === t.value
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-muted",
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Input label="Your name" value={name} onChange={setName} placeholder="Full name" />
        <Input label="Phone number" value={phone} onChange={setPhone} placeholder="+974 …" type="tel" />
      </div>

      {/* Pricing breakdown */}
      <div className="mt-5 rounded-xl border border-border bg-secondary/40 p-4 text-sm">
        {isRent ? (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              {money(unitPrice)} × {nights} night{nights === 1 ? "" : "s"}
              {offerActive ? ` · ${discount}% offer` : ""}
            </span>
            <span className="font-medium">{money(subtotal)}</span>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">
              Property price{offerActive ? ` · ${discount}% offer` : ""}
            </span>
            <span className="font-medium">{money(subtotal)}</span>
          </div>
        )}
        {taxPct > 0 ? (
          <div className="mt-1 flex items-center justify-between text-muted-foreground">
            <span>VAT ({taxPct}%)</span>
            <span>{money(taxAmount)}</span>
          </div>
        ) : null}
        <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
          <span className="font-display text-base font-semibold">Total</span>
          <span className="font-display text-base font-semibold text-primary">{money(total)}</span>
        </div>
      </div>


      <button
        type="submit"
        disabled={submitting}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-[var(--shadow-soft)] transition hover:opacity-95 disabled:opacity-60"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {isRent ? "Request rental booking" : "Request booking"}
      </button>
      <p className="mt-2 text-center text-[11px] text-muted-foreground">
        We confirm within 30 minutes during business hours.
      </p>
    </form>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none ring-primary/30 focus:ring-2"
      />
    </label>
  );
}
