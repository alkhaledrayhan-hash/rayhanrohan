import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminNotifsQuery } from "@/lib/admin-notifs-shared";

const KEYS = {
  leads: "admin_seen_leads_at",
  bookings: "admin_seen_bookings_at",
  messages: "admin_seen_messages_at",
} as const;

export type UnreadSection = keyof typeof KEYS;

function readSeen(key: string) {
  if (typeof window === "undefined") return new Date(0).toISOString();
  return localStorage.getItem(key) || new Date(0).toISOString();
}

export function useUnreadCounts() {
  const [seen, setSeen] = useState(() => ({
    leads: readSeen(KEYS.leads),
    bookings: readSeen(KEYS.bookings),
    messages: readSeen(KEYS.messages),
  }));

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === KEYS.leads || e.key === KEYS.bookings || e.key === KEYS.messages) {
        setSeen({
          leads: readSeen(KEYS.leads),
          bookings: readSeen(KEYS.bookings),
          messages: readSeen(KEYS.messages),
        });
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Reuses cache populated by NotificationsBell — no duplicate network calls.
  const { data } = useQuery(adminNotifsQuery);

  const counts = useMemo(() => {
    const after = (rows: Array<{ created_at: string; last_message_at?: string | null }> | undefined, since: string) => {
      if (!rows) return 0;
      const sinceMs = new Date(since).getTime();
      let n = 0;
      for (const r of rows) {
        const t = new Date(r.last_message_at || r.created_at).getTime();
        if (t > sinceMs) n++;
      }
      return n;
    };
    return {
      leads: after(data?.leads, seen.leads),
      bookings: after(data?.bookings, seen.bookings),
      messages: after(data?.messages, seen.messages),
    };
  }, [data, seen]);

  const markRead = (section: UnreadSection) => {
    const now = new Date().toISOString();
    try { localStorage.setItem(KEYS[section], now); } catch {}
    setSeen((s) => ({ ...s, [section]: now }));
  };

  return { counts, markRead };
}
