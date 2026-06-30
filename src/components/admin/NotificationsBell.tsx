import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, Calendar, Mail, MessageSquare } from "lucide-react";
import { useFormatters } from "@/lib/format";
import { adminNotifsQuery, type NotifSection } from "@/lib/admin-notifs-shared";

type Notif = {
  id: string;
  kind: NotifSection;
  title: string;
  subtitle: string;
  created_at: string;
};

const LS_KEY = "admin_notifs_seen_at";

export function NotificationsBell({ onNavigate }: { onNavigate: (s: NotifSection) => void }) {
  const [open, setOpen] = useState(false);
  const [seenAt, setSeenAt] = useState<string>(() => {
    if (typeof window === "undefined") return new Date(0).toISOString();
    return localStorage.getItem(LS_KEY) || new Date(0).toISOString();
  });
  const { formatDateTime } = useFormatters();
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const { data } = useQuery(adminNotifsQuery);

  const notifs = useMemo<Notif[]>(() => {
    if (!data) return [];
    const out: Notif[] = [];
    for (const l of data.leads) {
      out.push({
        id: `lead-${l.id}`,
        kind: "leads",
        title: `New lead · ${l.name ?? ""}`,
        subtitle: l.property_title || l.subject || l.source || "Website lead",
        created_at: l.created_at,
      });
    }
    for (const b of data.bookings) {
      const cur = b.currency || "";
      const bits: string[] = [];
      bits.push(`${b.property_title ?? ""} — ${b.scheduled_date ?? ""}`);
      if (b.nights && b.nights > 0) bits.push(`${b.nights} night${b.nights === 1 ? "" : "s"}`);
      if (b.discount_percent && b.discount_percent > 0)
        bits.push(`-${b.discount_percent}% offer`);
      if (b.tax_percent && b.tax_percent > 0) bits.push(`VAT ${b.tax_percent}%`);
      if (b.total_amount && b.total_amount > 0)
        bits.push(`Total ${cur} ${b.total_amount}`);
      out.push({
        id: `book-${b.id}`,
        kind: "bookings",
        title: `Booking request · ${b.customer_name ?? ""}`,
        subtitle: bits.filter(Boolean).join(" · "),
        created_at: b.created_at,
      });
    }
    for (const c of data.messages) {
      out.push({
        id: `msg-${c.id}`,
        kind: "messages",
        title: `Message · ${c.customer_name ?? ""}`,
        subtitle: c.subject || "Customer enquiry",
        created_at: c.last_message_at || c.created_at,
      });
    }
    return out
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
      .slice(0, 20);
  }, [data]);

  const unread = useMemo(
    () => notifs.filter((n) => new Date(n.created_at) > new Date(seenAt)).length,
    [notifs, seenAt],
  );

  const markRead = () => {
    const now = new Date().toISOString();
    setSeenAt(now);
    try { localStorage.setItem(LS_KEY, now); } catch {}
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => {
          const willOpen = !open;
          setOpen(willOpen);
          if (willOpen) markRead();
        }}
        aria-label="Notifications"
        className="relative grid h-9 w-9 place-items-center rounded-full border border-border bg-white text-muted-foreground transition hover:text-foreground"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 grid h-4 min-w-[16px] place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[340px] max-w-[92vw] overflow-hidden rounded-xl border border-border bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
            <span className="text-sm font-semibold">Notifications</span>
            <span className="text-[11px] text-muted-foreground">Auto-refreshing</span>
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {notifs.length === 0 && (
              <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                You're all caught up.
              </div>
            )}
            {notifs.map((n) => {
              const Icon = n.kind === "leads" ? Mail : n.kind === "bookings" ? Calendar : MessageSquare;
              return (
                <button
                  key={n.id}
                  onClick={() => {
                    onNavigate(n.kind);
                    setOpen(false);
                    // Extract original record id (after first dash) and dispatch
                    // an open event AFTER the target panel has mounted.
                    const recordId = n.id.replace(/^(lead|book|msg)-/, "");
                    const evtName =
                      n.kind === "leads"
                        ? "admin:open-lead"
                        : n.kind === "bookings"
                        ? "admin:open-booking"
                        : "admin:open-message";
                    setTimeout(() => {
                      window.dispatchEvent(
                        new CustomEvent(evtName, { detail: { id: recordId } }),
                      );
                    }, 50);
                  }}
                  className="flex w-full items-start gap-3 border-b border-border/60 px-4 py-3 text-left transition hover:bg-muted/40"
                >
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{n.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{n.subtitle}</span>
                    <span className="mt-0.5 block text-[10px] text-muted-foreground/80">{formatDateTime(n.created_at)}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
