import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";
import { Calendar as CalendarIcon, MapPin, Printer, X } from "lucide-react";
import { useState } from "react";
import { listMyBookings } from "@/lib/bookings.functions";
import { printBookingInvoice } from "@/lib/invoice";
import { useSiteSettings } from "@/hooks/useSiteSettings";

type RawBooking = Awaited<ReturnType<typeof listMyBookings>>[number];
type Booking = RawBooking & {
  properties?: {
    id: string;
    slug: string;
    price: number | null;
    location: string | null;
    image: string | null;
  } | null;
};

const statusClass: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  confirmed: "bg-emerald-100 text-emerald-800",
  completed: "bg-sky-100 text-sky-800",
  cancelled: "bg-rose-100 text-rose-800",
};

export function MyBookingsPanel() {
  const listFn = useServerFn(listMyBookings);
  const settings = useSiteSettings();
  const [selected, setSelected] = useState<Booking | null>(null);

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["my-bookings"],
    queryFn: () => listFn() as Promise<Booking[]>,
  });

  function print(b: Booking) {
    printBookingInvoice(
      b,
      {
        siteTitle: settings.site_title,
        siteTagline: settings.site_tagline,
        logoUrl: settings.site_logo_url,
        address: settings.footer_address,
        phone: settings.footer_phone,
        email: settings.footer_email,
      },
      {
        propertyPrice: b.properties?.price ?? null,
        propertyLocation: b.properties?.location ?? null,
      },
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-xl font-semibold">My Bookings</h2>
        <p className="text-sm text-muted-foreground">
          Property viewings you've booked. Click a card to view details or print the invoice.
        </p>
      </div>

      {isLoading && (
        <div className="rounded-2xl border border-border bg-background p-10 text-center text-sm text-muted-foreground">
          Loading bookings…
        </div>
      )}

      {!isLoading && bookings.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-background p-10 text-center">
          <CalendarIcon className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 font-medium">No bookings yet</p>
          <p className="text-sm text-muted-foreground">
            Book a property viewing from any listing and it will appear here.
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {bookings.map((b) => (
          <button
            key={b.id}
            onClick={() => setSelected(b)}
            className="group flex flex-col gap-3 rounded-2xl border border-border bg-background p-4 text-left transition hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Ref · {b.id.slice(0, 8).toUpperCase()}
                </p>
                <h3 className="truncate font-display text-base font-semibold">{b.property_title}</h3>
                {b.properties?.location && (
                  <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" /> {b.properties.location}
                  </p>
                )}
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${statusClass[b.status] ?? "bg-muted"}`}>
                {b.status}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CalendarIcon className="h-3.5 w-3.5" />
                {format(new Date(b.scheduled_date), "d MMM yyyy")} · {b.scheduled_time}
              </span>
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); print(b); }}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-muted"
              >
                <Printer className="h-3 w-3" /> Invoice
              </span>
            </div>
          </button>
        ))}
      </div>

      {selected && (
        <DetailDialog booking={selected} onClose={() => setSelected(null)} onPrint={() => print(selected)} />
      )}
    </div>
  );
}

function DetailDialog({
  booking,
  onClose,
  onPrint,
}: {
  booking: Booking;
  onClose: () => void;
  onPrint: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-6 py-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              Booking details
            </p>
            <h3 className="font-display text-lg font-semibold">{booking.property_title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${statusClass[booking.status] ?? "bg-muted"}`}>
              {booking.status}
            </span>
            <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-3 px-6 py-5 text-sm">
          <Row label="Reference" value={booking.id} mono />
          <Row label="Date" value={format(new Date(booking.scheduled_date), "EEE, d MMM yyyy")} />
          <Row label="Time" value={booking.scheduled_time} />
          {booking.properties?.location && <Row label="Location" value={booking.properties.location} />}
          {booking.properties?.price != null && (
            <Row
              label="Property value"
              value={new Intl.NumberFormat("en-US", { style: "currency", currency: "QAR", maximumFractionDigits: 0 }).format(booking.properties.price)}
            />
          )}
          <Row label="Customer" value={booking.customer_name} />
          <Row label="Phone" value={booking.customer_phone} />
          {booking.customer_email && <Row label="Email" value={booking.customer_email} />}
          {booking.notes && (
            <div className="rounded-lg bg-muted/40 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Notes</p>
              <p className="mt-1 whitespace-pre-wrap text-sm">{booking.notes}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-border bg-muted/30 px-6 py-3">
          <button onClick={onClose} className="rounded-lg border border-border bg-white px-3 py-2 text-sm">
            Close
          </button>
          <button
            onClick={onPrint}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
          >
            <Printer className="h-4 w-4" /> Print invoice
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</span>
      <span className={`text-right text-sm ${mono ? "font-mono text-xs" : ""}`}>{value}</span>
    </div>
  );
}
