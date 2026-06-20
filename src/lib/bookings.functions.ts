import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

const BookingSchema = z.object({
  propertyId: z.string().min(1),
  propertyTitle: z.string().min(1).max(200),
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(6).max(30),
  email: z.string().trim().email().max(200).optional().or(z.literal("")),
  date: z.string().min(1).max(40),
  time: z.string().min(1).max(20),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type BookingInput = z.infer<typeof BookingSchema>;

function serverClient() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

export const createBooking = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => BookingSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Resolve property by UUID or by slug (frontend uses slug as Property.id)
    let propertyUuid: string | null = null;
    let agentId: string | null = null;
    let resolvedTitle: string | null = null;
    if (data.propertyId) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        data.propertyId,
      );
      const q = supabaseAdmin.from("properties").select("id, title, assigned_agent_id, created_by");
      const { data: prop } = isUuid
        ? await q.eq("id", data.propertyId).maybeSingle()
        : await q.eq("slug", data.propertyId).maybeSingle();
      if (prop) {
        propertyUuid = (prop as { id: string }).id;
        resolvedTitle = (prop as { title: string }).title;
        agentId =
          (prop as { assigned_agent_id?: string | null }).assigned_agent_id ??
          (prop as { created_by?: string | null }).created_by ??
          null;
      }
    }
    if (!propertyUuid) throw new Error("Property not found");

    const { data: inserted, error } = await supabaseAdmin
      .from("bookings")
      .insert({
        property_id: propertyUuid,
        property_title: resolvedTitle ?? data.propertyTitle,
        agent_id: agentId,
        customer_name: data.name,
        customer_phone: data.phone,
        customer_email: data.email || null,
        scheduled_date: data.date,
        scheduled_time: data.time,
        notes: data.notes || null,
        source: "website",
        status: "pending",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: inserted.id, receivedAt: new Date().toISOString() };
  });

export const listBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("bookings")
      .select("*")
      .order("scheduled_date", { ascending: false })
      .order("scheduled_time", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

const ManualBookingSchema = z.object({
  propertyId: z.string().min(1),
  customerName: z.string().trim().min(2).max(100),
  customerPhone: z.string().trim().min(6).max(30),
  customerEmail: z.string().trim().email().max(200).optional().or(z.literal("")),
  scheduledDate: z.string().min(1),
  scheduledTime: z.string().min(1),
  agentId: z.string().uuid().optional().or(z.literal("")),
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]).default("pending"),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const createManualBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ManualBookingSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    const { data: isAgent } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "agent",
    });
    if (!isAdmin && !isAgent) throw new Error("Forbidden");

    const { data: prop } = await context.supabase
      .from("properties")
      .select("title, created_by")
      .eq("id", data.propertyId)
      .maybeSingle();
    if (!prop) throw new Error("Property not found");

    const agentId = isAdmin
      ? data.agentId || (prop as { created_by?: string | null }).created_by || context.userId
      : context.userId;

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: inserted, error } = await supabaseAdmin
      .from("bookings")
      .insert({
        property_id: data.propertyId,
        property_title: (prop as { title: string }).title,
        agent_id: agentId,
        customer_name: data.customerName,
        customer_phone: data.customerPhone,
        customer_email: data.customerEmail || null,
        scheduled_date: data.scheduledDate,
        scheduled_time: data.scheduledTime,
        status: data.status,
        source: "manual",
        notes: data.notes || null,
        created_by: context.userId,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return inserted;
  });

const UpdateBookingSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]).optional(),
  scheduledDate: z.string().optional(),
  scheduledTime: z.string().optional(),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  agentId: z.string().uuid().optional().or(z.literal("")),
});

export const updateBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpdateBookingSchema.parse(d))
  .handler(async ({ data, context }) => {
    const patch: {
      status?: string;
      scheduled_date?: string;
      scheduled_time?: string;
      notes?: string | null;
      agent_id?: string | null;
    } = {};
    if (data.status) patch.status = data.status;
    if (data.scheduledDate) patch.scheduled_date = data.scheduledDate;
    if (data.scheduledTime) patch.scheduled_time = data.scheduledTime;
    if (data.notes !== undefined) patch.notes = data.notes || null;
    if (data.agentId !== undefined) patch.agent_id = data.agentId || null;
    const { error } = await context.supabase.from("bookings").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("bookings").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ----- Enquiry & Contact (unchanged) -----
const EnquirySchema = z.object({
  propertyId: z.string().min(1),
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(6).max(30),
  email: z.string().trim().email().max(200),
  message: z.string().trim().min(2).max(1000),
});

export const createEnquiry = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => EnquirySchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Resolve the property (id is slug from frontend)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      data.propertyId,
    );
    const q = supabaseAdmin.from("properties").select("id, title, assigned_agent_id, created_by");
    const { data: prop } = isUuid
      ? await q.eq("id", data.propertyId).maybeSingle()
      : await q.eq("slug", data.propertyId).maybeSingle();
    const propertyUuid = (prop as { id?: string } | null)?.id ?? null;
    const propertyTitle = (prop as { title?: string } | null)?.title ?? null;
    const agentId =
      (prop as { assigned_agent_id?: string | null } | null)?.assigned_agent_id ??
      (prop as { created_by?: string | null } | null)?.created_by ??
      null;

    const { data: inserted, error } = await supabaseAdmin
      .from("leads")
      .insert({
        name: data.name,
        email: data.email,
        phone: data.phone,
        subject: propertyTitle ? `Enquiry · ${propertyTitle}` : "Property enquiry",
        message: data.message,
        source: "property",
        property_id: propertyUuid,
        property_title: propertyTitle,
        agent_id: agentId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: inserted.id };
  });

const ContactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(6).max(30).optional().or(z.literal("")),
  subject: z.string().trim().min(2).max(120),
  message: z.string().trim().min(5).max(2000),
});

export const createContact = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => ContactSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: inserted, error } = await supabaseAdmin
      .from("leads")
      .insert({
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        subject: data.subject,
        message: data.message,
        source: "contact",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: inserted.id };
  });

// Re-export for compatibility with serverClient unused warning
void serverClient;
