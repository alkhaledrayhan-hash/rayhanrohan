import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type NotifSection = "leads" | "bookings" | "messages";

export type AdminNotifsPayload = {
  leads: Array<{
    id: string;
    name: string | null;
    subject: string | null;
    source: string | null;
    property_title: string | null;
    created_at: string;
  }>;
  bookings: Array<{
    id: string;
    customer_name: string | null;
    property_title: string | null;
    scheduled_date: string | null;
    created_at: string;
    nights: number | null;
    total_amount: number | null;
    tax_percent: number | null;
    tax_amount: number | null;
    discount_percent: number | null;
    discount_amount: number | null;
    currency: string | null;
  }>;
  messages: Array<{
    id: string;
    customer_name: string | null;
    subject: string | null;
    last_message_at: string | null;
    created_at: string;
  }>;
};

// Single shared query — consumed by both NotificationsBell and useUnreadCounts.
// React Query dedupes by queryKey, so we only hit the DB once per 30s interval.
export const adminNotifsQuery = queryOptions({
  queryKey: ["admin-notifs-shared"],
  refetchInterval: 30_000,
  refetchOnWindowFocus: true,
  staleTime: 25_000,
  queryFn: async (): Promise<AdminNotifsPayload> => {
    const [leadsRes, bookingsRes, convosRes] = await Promise.all([
      supabase
        .from("leads")
        .select("id, name, subject, source, property_title, created_at")
        .order("created_at", { ascending: false })
        .limit(25),
      supabase
        .from("bookings")
        .select("id, customer_name, property_title, scheduled_date, created_at")
        .order("created_at", { ascending: false })
        .limit(25),
      supabase
        .from("conversations")
        .select("id, customer_name, subject, last_message_at, created_at")
        .order("last_message_at", { ascending: false })
        .limit(25),
    ]);
    return {
      leads: leadsRes.data ?? [],
      bookings: bookingsRes.data ?? [],
      messages: convosRes.data ?? [],
    };
  },
});
