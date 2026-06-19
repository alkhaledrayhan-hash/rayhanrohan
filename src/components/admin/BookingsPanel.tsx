import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Plus, Search, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  createManualBooking,
  deleteBooking,
  listBookings,
  updateBooking,
} from "@/lib/bookings.functions";

const STATUSES = ["pending", "confirmed", "completed", "cancelled"] as const;
type Status = (typeof STATUSES)[number];

const statusClass: Record<Status, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  completed: "bg-sky-100 text-sky-800",
  cancelled: "bg-rose-100 text-rose-800",
};

export function BookingsPanel({ isAdmin }: { isAdmin: boolean }) {
  const qc = useQueryClient();
  const listFn = useServerFn(listBookings);
  const updateFn = useServerFn(updateBooking);
  const deleteFn = useServerFn(deleteBooking);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: () => listFn(),
  });

  const { data: properties = [] } = useQuery({
    queryKey: ["properties-min"],
    queryFn: async () => {
      const { data } = await supabase
        .from("properties")
        .select("id, title")
        .order("title");
      return data ?? [];
    },
  });

  const setStatus = useMutation({
    mutationFn: (vars: { id: string; status: Status }) =>
      updateFn({ data: vars }),
    onSuccess: () => {
      toast.success("Booking updated");
      qc.invalidateQueries({ queryKey: ["admin-bookings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Booking deleted");
      qc.invalidateQueries({ queryKey: ["admin-bookings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [showCreate, setShowCreate] = useState(false);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return bookings.filter((b) => {
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (!term) return true;
      return (
        b.customer_name.toLowerCase().includes(term) ||
        b.property_title.toLowerCase().includes(term) ||
        (b.customer_phone || "").toLowerCase().includes(term)
      );
    });
  }, [bookings, q, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-semibold">Bookings</h2>
          <p className="text-sm text-muted-foreground">
            Viewings booked through the website or added manually.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> Add booking
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-white p-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by customer, property, phone…"
            className="w-full rounded-lg border border-input bg-muted/30 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as Status | "all")}
          className="rounded-lg border border-input bg-white px-3 py-2 text-sm"
        >
          <option value="all">All status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Property</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">Loading…</td></tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">No bookings yet.</td></tr>
            )}
            {filtered.map((b) => (
              <tr key={b.id} className="border-t border-border">
                <td className="px-4 py-3 font-medium">{b.property_title}</td>
                <td className="px-4 py-3">
                  <div>{b.customer_name}</div>
                  <div className="text-xs text-muted-foreground">{b.customer_phone}</div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    {format(new Date(b.scheduled_date), "d MMM yyyy")}
                  </div>
                  <div className="text-xs text-muted-foreground">{b.scheduled_time}</div>
                </td>
                <td className="px-4 py-3 capitalize text-muted-foreground">{b.source}</td>
                <td className="px-4 py-3">
                  <select
                    value={b.status}
                    onChange={(e) => setStatus.mutate({ id: b.id, status: e.target.value as Status })}
                    className={`rounded-md px-2 py-1 text-xs font-semibold capitalize ${statusClass[b.status as Status] ?? "bg-muted"}`}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  {isAdmin && (
                    <button
                      onClick={() => { if (confirm("Delete this booking?")) remove.mutate(b.id); }}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <CreateBookingDialog
          properties={properties}
          isAdmin={isAdmin}
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            qc.invalidateQueries({ queryKey: ["admin-bookings"] });
          }}
        />
      )}
    </div>
  );
}

function CreateBookingDialog({
  properties,
  isAdmin,
  onClose,
  onCreated,
}: {
  properties: { id: string; title: string }[];
  isAdmin: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const createFn = useServerFn(createManualBooking);
  const [propertyId, setPropertyId] = useState(properties[0]?.id ?? "");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [scheduledDate, setScheduledDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [scheduledTime, setScheduledTime] = useState("10:00");
  const [status, setStatus] = useState<Status>("confirmed");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  void isAdmin;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await createFn({
        data: {
          propertyId,
          customerName,
          customerPhone,
          customerEmail,
          scheduledDate,
          scheduledTime,
          status,
          notes,
        },
      });
      toast.success("Booking created");
      onCreated();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
      <form onSubmit={submit} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="font-display text-lg font-semibold">New booking</h3>
        <p className="text-sm text-muted-foreground">Manually book a viewing on behalf of a customer.</p>

        <div className="mt-4 grid gap-3">
          <Field label="Property">
            <select required value={propertyId} onChange={(e) => setPropertyId(e.target.value)} className="input">
              {properties.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Customer name">
              <input required value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="input" />
            </Field>
            <Field label="Phone">
              <input required value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="input" />
            </Field>
          </div>
          <Field label="Email (optional)">
            <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="input" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Date">
              <input required type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className="input" />
            </Field>
            <Field label="Time">
              <input required type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} className="input" />
            </Field>
            <Field label="Status">
              <select value={status} onChange={(e) => setStatus(e.target.value as Status)} className="input">
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Notes">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="input" />
          </Field>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-3 py-2 text-sm">Cancel</button>
          <button disabled={busy} className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">
            {busy ? "Saving…" : "Create booking"}
          </button>
        </div>
        <style>{`.input{width:100%;border:1px solid hsl(var(--border));background:#fff;border-radius:8px;padding:8px 10px;font-size:14px;outline:none}.input:focus{box-shadow:0 0 0 2px hsl(var(--primary)/0.3)}`}</style>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
