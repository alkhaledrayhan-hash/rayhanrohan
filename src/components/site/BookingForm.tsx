import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CalendarCheck, CalendarIcon, Clock, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { createBooking, createBookingAsUser } from "@/lib/bookings.functions";
import { supabase } from "@/integrations/supabase/client";
import type { Property } from "@/lib/properties";

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
  const timeSlots = useMemo(buildTimeSlots, []);
  const [date, setDate] = useState<Date | undefined>(undefined);

  const [time, setTime] = useState("10:00");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const submit = useServerFn(createBooking);
  const submitAsUser = useServerFn(createBookingAsUser);

  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setDate(d);
  }, []);

  const today = useMemo(() => {

    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date) {
      toast.error("Please pick a date.");
      return;
    }
    if (name.trim().length < 2 || phone.trim().length < 6) {
      toast.error("Please add your name and a valid phone number.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await submit({
        data: {
          propertyId: property.id,
          propertyTitle: property.title,
          name,
          phone,
          date: date.toISOString().slice(0, 10),
          time,
        },
      });
      toast.success("Viewing requested", {
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
        <h3 className="font-display text-xl font-semibold">Schedule a viewing</h3>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        No payment, no registration — just pick a slot.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {/* Date */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Date
          </span>
          <Popover open={dateOpen} onOpenChange={setDateOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2.5 text-left text-sm outline-none ring-primary/30 focus:ring-2",
                  !date && "text-muted-foreground",
                )}
              >
                <span className="flex items-center gap-2 truncate">
                  <CalendarIcon className="h-4 w-4 shrink-0 text-primary" />
                  {date ? format(date, "EEE, d MMM yyyy") : "Pick a date"}
                </span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
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
            </PopoverContent>
          </Popover>
        </div>

        {/* Time */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Preferred time
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

      <button
        type="submit"
        disabled={submitting}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-[var(--shadow-soft)] transition hover:opacity-95 disabled:opacity-60"
      >
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Request booking
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
