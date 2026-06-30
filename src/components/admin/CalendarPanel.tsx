import { useMemo, useState } from "react";
import { ThemedSelect } from "@/components/ui/themed-select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronLeft, ChevronRight, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { createManualBooking, listBookings } from "@/lib/bookings.functions";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const statusDot: Record<string, string> = {
  pending: "bg-amber-500",
  confirmed: "bg-emerald-500",
  completed: "bg-sky-500",
  cancelled: "bg-rose-500",
};

type Property = { id: string; title: string; assigned_agent_id: string | null; created_by: string | null };
type AgentProfile = { id: string; full_name: string | null; email: string | null };

function ymd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function CalendarPanel() {
  const qc = useQueryClient();
  const listFn = useServerFn(listBookings);
  const createFn = useServerFn(createManualBooking);

  const { data: bookings = [] } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: () => listFn(),
  });

  const { data: isAdmin } = useQuery({
    queryKey: ["my-is-admin"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return false;
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id);
      return (data ?? []).some((r) => r.role === "admin");
    },
  });

  const { data: properties = [] } = useQuery({
    queryKey: ["calendar-properties-min"],
    queryFn: async () => {
      const { data } = await supabase
        .from("properties")
        .select("id, title, assigned_agent_id, created_by")
        .order("title");
      return (data ?? []) as Property[];
    },
  });

  const { data: agents = [] } = useQuery({
    queryKey: ["calendar-agents"],
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "agent");
      const ids = (roles ?? []).map((r) => r.user_id as string);
      if (!ids.length) return [] as AgentProfile[];
      const { data } = await supabase.from("profiles").select("id, full_name, email").in("id", ids);
      return (data ?? []) as AgentProfile[];
    },
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

  // ---- New booking modal ----
  const [modalDate, setModalDate] = useState<string | null>(null);
  const [form, setForm] = useState({
    propertyId: "",
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    scheduledTime: "10:00",
    agentId: "",
    notes: "",
    status: "pending" as "pending" | "confirmed" | "completed" | "cancelled",
  });

  const openCreate = (dateKey: string) => {
    setForm((f) => ({ ...f, scheduledTime: "10:00" }));
    setModalDate(dateKey);
  };

  const create = useMutation({
    mutationFn: async () => {
      if (!modalDate) throw new Error("Pick a date");
      if (!form.propertyId) throw new Error("Pick a property");
      if (form.customerName.trim().length < 2) throw new Error("Customer name required");
      if (form.customerPhone.trim().length < 6) throw new Error("Customer phone required");
      return createFn({
        data: {
          propertyId: form.propertyId,
          customerName: form.customerName,
          customerPhone: form.customerPhone,
          customerEmail: form.customerEmail || "",
          scheduledDate: modalDate,
          scheduledTime: form.scheduledTime,
          agentId: form.agentId || "",
          status: form.status,
          notes: form.notes || "",
        },
      });
    },
    onSuccess: () => {
      toast.success("Booking created");
      qc.invalidateQueries({ queryKey: ["admin-bookings"] });
      qc.invalidateQueries({ queryKey: ["admin-notifications"] });
      setModalDate(null);
      setForm({
        propertyId: "", customerName: "", customerPhone: "", customerEmail: "",
        scheduledTime: "10:00", agentId: "", notes: "", status: "pending",
      });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-xl font-semibold">Calendar</h2>
          <p className="text-sm text-muted-foreground">All scheduled viewings — click a day to add a booking.</p>
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
              const key = c.date ? ymd(c.date) : `e-${i}`;
              const items = c.date ? byDate.get(key) ?? [] : [];
              const isToday = c.date && c.date.toDateString() === new Date().toDateString();
              const isSelected = selected === key;
              return (
                <button
                  key={key}
                  disabled={!c.date}
                  onClick={() => c.date && setSelected(key)}
                  onDoubleClick={() => c.date && openCreate(key)}
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
                      <div className={`flex items-center justify-between text-[11px] font-semibold ${isToday ? "text-primary" : ""}`}>
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => { e.stopPropagation(); openCreate(key); }}
                          className="grid h-4 w-4 place-items-center rounded text-muted-foreground opacity-0 transition hover:bg-primary hover:text-primary-foreground group-hover:opacity-100"
                          title="Add booking"
                        >
                          <Plus className="h-3 w-3" />
                        </span>
                        <span>{c.date.getDate()}</span>
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
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold">
                {selected ? new Date(selected).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" }) : "Select a day"}
              </h3>
              <p className="text-xs text-muted-foreground">{selectedBookings.length} viewing(s)</p>
            </div>
            {selected && (
              <button
                onClick={() => openCreate(selected)}
                className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
              >
                <Plus className="h-3.5 w-3.5" /> New booking
              </button>
            )}
          </div>
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

      {/* Create booking modal */}
      {modalDate && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setModalDate(null)}>
          <div
            className="w-full max-w-lg rounded-2xl border border-border bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">
                New booking · {new Date(modalDate).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
              </h3>
              <button onClick={() => setModalDate(null)} className="rounded p-1 text-muted-foreground hover:bg-muted">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 grid gap-3">
              <Field label="Property">
                <ThemedSelect
                  value={form.propertyId}
                  onChange={(v: string) => setForm((f) => ({ ...f, propertyId: v }))}
                  className="rounded-lg border border-input bg-white px-3 py-2 text-sm"
                >
                  <option value="">— Select a property —</option>
                  {properties.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
                </ThemedSelect>
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Time">
                  <input
                    type="time"
                    value={form.scheduledTime}
                    onChange={(e) => setForm((f) => ({ ...f, scheduledTime: e.target.value }))}
                    className="rounded-lg border border-input bg-white px-3 py-2 text-sm"
                  />
                </Field>
                <Field label="Status">
                  <ThemedSelect
                    value={form.status}
                    onChange={(v: string) => setForm((f) => ({ ...f, status: v as typeof form.status }))}
                    className="rounded-lg border border-input bg-white px-3 py-2 text-sm"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </ThemedSelect>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Customer name">
                  <input
                    value={form.customerName}
                    onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
                    className="rounded-lg border border-input bg-white px-3 py-2 text-sm"
                  />
                </Field>
                <Field label="Phone">
                  <input
                    value={form.customerPhone}
                    onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))}
                    className="rounded-lg border border-input bg-white px-3 py-2 text-sm"
                  />
                </Field>
              </div>

              <Field label="Email (optional)">
                <input
                  type="email"
                  value={form.customerEmail}
                  onChange={(e) => setForm((f) => ({ ...f, customerEmail: e.target.value }))}
                  className="rounded-lg border border-input bg-white px-3 py-2 text-sm"
                />
              </Field>

              {isAdmin && (
                <Field label="Assign agent (optional)">
                  <ThemedSelect
                    value={form.agentId}
                    onChange={(v: string) => setForm((f) => ({ ...f, agentId: v }))}
                    className="rounded-lg border border-input bg-white px-3 py-2 text-sm"
                  >
                    <option value="">— Use property's assigned agent —</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>{a.full_name || a.email}</option>
                    ))}
                  </ThemedSelect>
                </Field>
              )}

              <Field label="Notes">
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  className="rounded-lg border border-input bg-white px-3 py-2 text-sm"
                />
              </Field>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setModalDate(null)}
                className="rounded-lg border border-border bg-white px-3 py-2 text-sm hover:bg-muted"
              >Cancel</button>
              <button
                disabled={create.isPending}
                onClick={() => create.mutate()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60"
              >{create.isPending ? "Saving…" : "Create booking"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
