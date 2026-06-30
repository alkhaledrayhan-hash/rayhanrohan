import { useMemo, useState } from "react";
import { ThemedSelect } from "@/components/ui/themed-select";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  Mail,
  Phone,
  Plus,
  Printer,
  Search,
  Trash2,
  User as UserIcon,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  createManualBooking,
  deleteBooking,
  listBookings,
  updateBooking,
} from "@/lib/bookings.functions";
import { printBookingInvoice } from "@/lib/invoice";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const STATUSES = ["pending", "confirmed", "completed", "cancelled"] as const;
type Status = (typeof STATUSES)[number];

const statusClass: Record<Status, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  completed: "bg-sky-100 text-sky-800",
  cancelled: "bg-rose-100 text-rose-800",
};

type Booking = Awaited<ReturnType<typeof listBookings>>[number];
type Profile = { id: string; full_name: string | null; email: string | null };
type Property = { id: string; title: string; created_by: string | null };

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
        .select("id, title, created_by")
        .order("title");
      return (data ?? []) as Property[];
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["all-profiles-min"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, email");
      return (data ?? []) as Profile[];
    },
  });

  const propertyAgentMap = useMemo(() => {
    const m = new Map<string, string | null>();
    for (const p of properties) m.set(p.id, p.created_by);
    return m;
  }, [properties]);

  const profileMap = useMemo(() => {
    const m = new Map<string, Profile>();
    for (const p of profiles) m.set(p.id, p);
    return m;
  }, [profiles]);

  function agentForBooking(b: Booking): Profile | null {
    const id = b.agent_id || (b.property_id ? propertyAgentMap.get(b.property_id) ?? null : null);
    return id ? profileMap.get(id) ?? null : null;
  }

  const setStatus = useMutation({
    mutationFn: (vars: { id: string; status: Status }) => updateFn({ data: vars }),
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
      setSelected(null);
      qc.invalidateQueries({ queryKey: ["admin-bookings"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [showCreate, setShowCreate] = useState(false);
  const [selected, setSelected] = useState<Booking | null>(null);

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
            Viewings booked through the website or added manually. Click a row to see full details.
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
        <ThemedSelect
          value={statusFilter}
          onChange={(v: string) => setStatusFilter(v as Status | "all")}
          className="rounded-lg border border-input bg-white px-3 py-2 text-sm"
        >
          <option value="all">All status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </ThemedSelect>
      </div>

      <div className="responsive-table-wrap overflow-x-auto rounded-xl border border-border bg-white">
        <table className="responsive-table w-full min-w-[720px] text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Property</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Agent</th>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">Loading…</td></tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-muted-foreground">No bookings yet.</td></tr>
            )}
            {filtered.map((b) => {
              const agent = agentForBooking(b);
              return (
                <tr
                  key={b.id}
                  onClick={() => setSelected(b)}
                  className="cursor-pointer border-t border-border transition hover:bg-muted/40"
                >
                  <td className="px-4 py-3 font-medium">{b.property_title}</td>
                  <td className="px-4 py-3">
                    <div>{b.customer_name}</div>
                    <div className="text-xs text-muted-foreground">{b.customer_phone}</div>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {agent ? (
                      <div>
                        <div className="font-medium text-foreground">{agent.full_name || "Agent"}</div>
                        <div className="text-muted-foreground">{agent.email}</div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground italic">Unassigned</span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                      {format(new Date(b.scheduled_date), "d MMM yyyy")}
                    </div>
                    <div className="text-xs text-muted-foreground">{b.scheduled_time}</div>
                  </td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{b.source}</td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <ThemedSelect
                      value={b.status}
                      onChange={(v: string) => setStatus.mutate({ id: b.id, status: v as Status })}
                      className={`rounded-md px-2 py-1 text-xs font-semibold capitalize ${statusClass[b.status as Status] ?? "bg-muted"}`}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </ThemedSelect>
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
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
              );
            })}
          </tbody>
        </table>
      </div>

      {selected && (
        <BookingDetailDialog
          booking={selected}
          agent={agentForBooking(selected)}
          isAdmin={isAdmin}
          onClose={() => setSelected(null)}
          onDelete={() => { if (confirm("Delete this booking?")) remove.mutate(selected.id); }}
        />
      )}

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

function BookingDetailDialog({
  booking, agent, isAdmin, onClose, onDelete,
}: {
  booking: Booking;
  agent: Profile | null;
  isAdmin: boolean;
  onClose: () => void;
  onDelete: () => void;
}) {
  const qc = useQueryClient();
  const updateFn = useServerFn(updateBooking);
  const settings = useSiteSettings();
  const [editing, setEditing] = useState(false);
  const [scheduledDate, setScheduledDate] = useState(booking.scheduled_date);
  const [scheduledTime, setScheduledTime] = useState(booking.scheduled_time);
  const [status, setStatus] = useState<Status>(booking.status as Status);
  const [notes, setNotes] = useState(booking.notes || "");
  const [busy, setBusy] = useState(false);

  const { data: propertyExtra } = useQuery({
    queryKey: ["booking-property", booking.property_id],
    enabled: !!booking.property_id,
    queryFn: async () => {
      const { data } = await supabase
        .from("properties")
        .select("price, location")
        .eq("id", booking.property_id!)
        .maybeSingle();
      return (data ?? null) as { price: number | null; location: string | null } | null;
    },
  });

  function handlePrint() {
    printBookingInvoice(
      booking,
      {
        siteTitle: settings.site_title,
        siteTagline: settings.site_tagline,
        logoUrl: settings.site_logo_url,
        address: settings.footer_address,
        phone: settings.footer_phone,
        email: settings.footer_email,
      },
      {
        agentName: agent?.full_name ?? null,
        agentEmail: agent?.email ?? null,
        propertyPrice: propertyExtra?.price ?? null,
        propertyLocation: propertyExtra?.location ?? null,
      },
    );
  }

  async function save() {
    setBusy(true);
    try {
      await updateFn({
        data: { id: booking.id, scheduledDate, scheduledTime, status, notes },
      });
      toast.success("Booking updated");
      qc.invalidateQueries({ queryKey: ["admin-bookings"] });
      setEditing(false);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-6 py-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Booking details</p>
            <h3 className="font-display text-lg font-semibold">{booking.property_title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${statusClass[booking.status as Status] ?? "bg-muted"}`}>
              {booking.status}
            </span>
            <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-5 text-sm">
          {/* Customer */}
          <section>
            <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Customer
            </h4>
            <div className="space-y-1.5 rounded-lg border border-border bg-muted/30 p-3">
              <Row icon={UserIcon} label="Name" value={booking.customer_name} />
              <Row icon={Phone} label="Phone" value={booking.customer_phone}
                href={`tel:${booking.customer_phone}`} />
              {booking.customer_email && (
                <Row icon={Mail} label="Email" value={booking.customer_email}
                  href={`mailto:${booking.customer_email}`} />
              )}
            </div>
          </section>

          {/* Agent */}
          <section>
            <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Assigned agent
            </h4>
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              {agent ? (
                <>
                  <Row icon={UserIcon} label="Name" value={agent.full_name || "Agent"} />
                  {agent.email && <Row icon={Mail} label="Email" value={agent.email}
                    href={`mailto:${agent.email}`} />}
                </>
              ) : (
                <p className="text-xs italic text-muted-foreground">No agent assigned to this property yet.</p>
              )}
            </div>
          </section>

          {/* Booking info */}
          <section>
            <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Booking
            </h4>
            <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
              {!editing ? (
                <>
                  <Row icon={CalendarIcon} label="Date"
                    value={format(new Date(booking.scheduled_date), "EEE, d MMM yyyy")} />
                  <Row label="Time" value={booking.scheduled_time} />
                  <Row label="Source" value={booking.source} />
                  <Row label="Reference" value={booking.id} mono />
                  <Row label="Created" value={format(new Date(booking.created_at), "d MMM yyyy, HH:mm")} />
                  {booking.notes && (
                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Notes</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm">{booking.notes}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Date">
                    <input type="date" value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)} className="input" />
                  </Field>
                  <Field label="Time">
                    <input type="time" value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)} className="input" />
                  </Field>
                  <Field label="Status">
                    <ThemedSelect value={status} onChange={(v: string) => setStatus(v as Status)} className="input">
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </ThemedSelect>
                  </Field>
                  <Field label="Notes" className="sm:col-span-2">
                    <textarea rows={3} value={notes}
                      onChange={(e) => setNotes(e.target.value)} className="input" />
                  </Field>
                </div>
              )}
            </div>
          </section>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-border bg-muted/30 px-6 py-3">
          <div>
            {isAdmin && !editing && (
              <button onClick={onDelete}
                className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-rose-600 hover:bg-rose-50">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {editing ? (
              <>
                <button onClick={() => setEditing(false)}
                  className="rounded-lg border border-border bg-white px-3 py-2 text-sm">Cancel</button>
                <button disabled={busy} onClick={save}
                  className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">
                  {busy ? "Saving…" : "Save changes"}
                </button>
              </>
            ) : (
              <>
                <button onClick={onClose}
                  className="rounded-lg border border-border bg-white px-3 py-2 text-sm">Close</button>
                <button onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-sm font-medium hover:bg-muted">
                  <Printer className="h-4 w-4" /> Print invoice
                </button>
                {isAdmin && (
                  <button onClick={() => setEditing(true)}
                    className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
                    Edit booking
                  </button>
                )}
              </>
            )}
          </div>
        </div>
        <style>{`.input{width:100%;border:1px solid hsl(var(--border));background:#fff;border-radius:8px;padding:8px 10px;font-size:14px;outline:none}.input:focus{box-shadow:0 0 0 2px hsl(var(--primary)/0.3)}`}</style>
      </div>
    </div>
  );
}

function Row({
  icon: Icon, label, value, href, mono,
}: {
  icon?: typeof UserIcon;
  label: string;
  value: string;
  href?: string;
  mono?: boolean;
}) {
  const content = (
    <span className={`text-sm ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
  );
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {Icon && <Icon className="h-3.5 w-3.5" />} {label}
      </span>
      {href ? (
        <a href={href} className="text-primary hover:underline">{content}</a>
      ) : content}
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
            <ThemedSelect required value={propertyId} onChange={(v: string) => setPropertyId(v)} className="input">
              {properties.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
            </ThemedSelect>
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
              <ThemedSelect value={status} onChange={(v: string) => setStatus(v as Status)} className="input">
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </ThemedSelect>
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

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1 ${className ?? ""}`}>
      <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
