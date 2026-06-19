import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { listBookings } from "@/lib/bookings.functions";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const statusDot: Record<string, string> = {
  pending: "bg-amber-500",
  confirmed: "bg-emerald-500",
  completed: "bg-sky-500",
  cancelled: "bg-rose-500",
};

export function CalendarPanel() {
  const listFn = useServerFn(listBookings);
  const { data: bookings = [] } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: () => listFn(),
  });

  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const monthLabel = cursor.toLocaleString("en-US", { month: "long", year: "numeric" });

  const days = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const startWeekday = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: { date: Date | null }[] = [];
    for (let i = 0; i < startWeekday; i++) cells.push({ date: null });
    for (let d = 1; d <= daysInMonth; d++) cells.push({ date: new Date(year, month, d) });
    while (cells.length % 7 !== 0) cells.push({ date: null });
    return cells;
  }, [cursor]);

  const byDate = useMemo(() => {
    const m = new Map<string, typeof bookings>();
    for (const b of bookings) {
      const k = b.scheduled_date;
      if (!m.has(k)) m.set(k, [] as typeof bookings);
      m.get(k)!.push(b);
    }
    return m;
  }, [bookings]);

  const [selected, setSelected] = useState<string | null>(null);
  const selectedBookings = selected ? byDate.get(selected) ?? [] : [];

  function shift(delta: number) {
    const d = new Date(cursor);
    d.setMonth(d.getMonth() + delta);
    setCursor(d);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold">Calendar</h2>
          <p className="text-sm text-muted-foreground">All scheduled viewings across the team.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => shift(-1)} className="grid h-8 w-8 place-items-center rounded-md border border-border bg-white">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[160px] text-center text-sm font-medium">{monthLabel}</span>
          <button onClick={() => shift(1)} className="grid h-8 w-8 place-items-center rounded-md border border-border bg-white">
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => { const d = new Date(); d.setDate(1); setCursor(d); }}
            className="rounded-md border border-border bg-white px-3 py-1.5 text-xs"
          >Today</button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="rounded-xl border border-border bg-white p-3">
          <div className="grid grid-cols-7 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {WEEKDAYS.map((w) => <div key={w} className="py-2">{w}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((c, i) => {
              const key = c.date ? c.date.toISOString().slice(0, 10) : `e-${i}`;
              const items = c.date ? byDate.get(key) ?? [] : [];
              const isToday = c.date && c.date.toDateString() === new Date().toDateString();
              const isSelected = selected === key;
              return (
                <button
                  key={key}
                  disabled={!c.date}
                  onClick={() => c.date && setSelected(key)}
                  className={`min-h-[90px] rounded-lg border p-1.5 text-left text-xs transition ${
                    !c.date
                      ? "border-transparent"
                      : isSelected
                        ? "border-primary bg-primary/5"
                        : isToday
                          ? "border-primary/40 bg-primary/5 hover:bg-primary/10"
                          : "border-border bg-white hover:bg-muted/40"
                  }`}
                >
                  {c.date && (
                    <>
                      <div className={`text-right text-[11px] font-semibold ${isToday ? "text-primary" : ""}`}>
                        {c.date.getDate()}
                      </div>
                      <div className="mt-1 space-y-0.5">
                        {items.slice(0, 3).map((b) => (
                          <div key={b.id} className="flex items-center gap-1 truncate">
                            <span className={`inline-block h-1.5 w-1.5 rounded-full ${statusDot[b.status] ?? "bg-muted"}`} />
                            <span className="truncate">{b.scheduled_time} · {b.customer_name}</span>
                          </div>
                        ))}
                        {items.length > 3 && (
                          <div className="text-[10px] text-muted-foreground">+{items.length - 3} more</div>
                        )}
                      </div>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <aside className="rounded-xl border border-border bg-white p-4">
          <h3 className="text-sm font-semibold">
            {selected ? new Date(selected).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" }) : "Select a day"}
          </h3>
          <p className="text-xs text-muted-foreground">{selectedBookings.length} viewing(s)</p>
          <div className="mt-3 space-y-2">
            {selectedBookings.length === 0 && (
              <p className="rounded-lg bg-muted/40 px-3 py-4 text-center text-xs text-muted-foreground">
                Nothing scheduled.
              </p>
            )}
            {selectedBookings
              .slice()
              .sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time))
              .map((b) => (
                <div key={b.id} className="rounded-lg border border-border p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{b.scheduled_time}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                      b.status === "confirmed" ? "bg-emerald-100 text-emerald-800" :
                      b.status === "pending" ? "bg-amber-100 text-amber-800" :
                      b.status === "completed" ? "bg-sky-100 text-sky-800" :
                      "bg-rose-100 text-rose-800"
                    }`}>{b.status}</span>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">{b.property_title}</div>
                  <div className="mt-1 text-xs">{b.customer_name} · {b.customer_phone}</div>
                </div>
              ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
