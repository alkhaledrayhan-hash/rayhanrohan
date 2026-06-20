import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  // Track seen timestamps in state so badges update immediately on markRead()
  const [seen, setSeen] = useState(() => ({
    leads: readSeen(KEYS.leads),
    bookings: readSeen(KEYS.bookings),
    messages: readSeen(KEYS.messages),
  }));

  // Sync if other tabs change storage
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

  const { data } = useQuery({
    queryKey: ["admin-unread-latest"],
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const [leadsRes, bookingsRes, convRes] = await Promise.all([
        supabase
          .from("leads")
          .select("created_at")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("bookings")
          .select("created_at")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("conversations")
          .select("last_message_at, created_at")
          .order("last_message_at", { ascending: false })
          .limit(50),
      ]);
      return {
        leads: (leadsRes.data ?? []).map((r) => r.created_at as string),
        bookings: (bookingsRes.data ?? []).map((r) => r.created_at as string),
        messages: (convRes.data ?? []).map((r) => (r.last_message_at || r.created_at) as string),
      };
    },
  });

  const countAfter = (list: string[] | undefined, since: string) =>
    (list ?? []).filter((t) => new Date(t) > new Date(since)).length;

  const counts = {
    leads: countAfter(data?.leads, seen.leads),
    bookings: countAfter(data?.bookings, seen.bookings),
    messages: countAfter(data?.messages, seen.messages),
  };

  const markRead = (section: UnreadSection) => {
    const now = new Date().toISOString();
    try {
      localStorage.setItem(KEYS[section], now);
    } catch {}
    setSeen((s) => ({ ...s, [section]: now }));
  };

  return { counts, markRead };
}
