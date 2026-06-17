import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CalendarCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createBooking } from "@/lib/bookings.functions";
import type { Property } from "@/lib/properties";

const TIME_SLOTS = ["10:00 AM", "12:00 PM", "2:00 PM", "4:00 PM", "6:00 PM"];

function nextDays(n: number) {
  const out: { iso: string; label: string; weekday: string; day: string }[] = [];
  const today = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    out.push({
      iso: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }),
      weekday: d.toLocaleDateString("en-GB", { weekday: "short" }),
      day: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    });
  }
  return out;
}

export function BookingForm({ property }: { property: Property }) {
  const days = useMemo(() => nextDays(7), []);
  const [date, setDate] = useState(days[1].iso);
  const [time, setTime] = useState(TIME_SLOTS[1]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submit = useServerFn(createBooking);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
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
          date,
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

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2">
        <CalendarCheck className="h-5 w-5 text-primary" />
        <h3 className="font-display text-xl font-semibold">Schedule a viewing</h3>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        No payment, no registration — just pick a slot.
      </p>

      <div className="mt-5">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Date</p>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {days.map((d) => (
            <button
              key={d.iso}
              type="button"
              onClick={() => setDate(d.iso)}
              className={`min-w-[78px] flex-shrink-0 rounded-xl border px-3 py-2 text-center text-sm transition ${
                date === d.iso
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:border-primary/40"
              }`}
            >
              <span className="block text-[11px] uppercase tracking-wider opacity-80">{d.weekday}</span>
              <span className="block font-medium">{d.day}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Preferred time</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {TIME_SLOTS.map((t) => (
            <button
              type="button"
              key={t}
              onClick={() => setTime(t)}
              className={`rounded-full border px-3 py-1.5 text-sm transition ${
                time === t
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:border-primary/40"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
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
