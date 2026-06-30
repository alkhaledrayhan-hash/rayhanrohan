import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

const PricingSchema = z.object({
  checkIn: z.string().optional().or(z.literal("")),
  checkOut: z.string().optional().or(z.literal("")),
  nights: z.number().int().min(0).optional(),
  expectedUnitPrice: z.number().nonnegative().optional(),
  expectedSubtotal: z.number().nonnegative().optional(),
  expectedTaxPercent: z.number().nonnegative().optional(),
  expectedTaxAmount: z.number().nonnegative().optional(),
  expectedTotal: z.number().nonnegative().optional(),
}).partial();

const BookingSchema = z.object({
  propertyId: z.string().min(1),
  propertyTitle: z.string().min(1).max(200),
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(6).max(30),
  email: z.string().trim().email().max(200).optional().or(z.literal("")),
  date: z.string().min(1).max(40),
  time: z.string().min(1).max(20),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  pricing: PricingSchema.optional(),
});

type Breakdown = {
  checkIn: string | null;
  checkOut: string | null;
  nights: number;
  unitPrice: number;
  units: number;
  baseSubtotal: number;
  discountPercent: number;
  discountAmount: number;
  subtotal: number;
  taxPercent: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  isRent: boolean;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadSettings(admin: any) {
  const { data } = await admin.from("site_settings").select("key, value");
  const map = new Map<string, string>();
  for (const r of (data ?? []) as { key: string; value: string }[]) map.set(r.key, r.value);
  return map;
}

async function computeBreakdown(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  property: {
    price: number;
    status: string;
    offer_discount?: number | null;
    offer_ends?: string | null;
  },
  pricing: z.infer<typeof PricingSchema> | undefined,
): Promise<Breakdown> {
  const isRent = property.status === "rent";
  const settings = await loadSettings(admin as never);
  const currency = (settings.get("site_currency") || "QAR").trim() || "QAR";
  const taxPct = Math.max(
    0,
    Number(settings.get(isRent ? "rent_tax_percent" : "sale_tax_percent")) || 0,
  );
  const nights = isRent ? Math.max(0, Number(pricing?.nights) || 0) : 0;
  const discount = Math.max(0, Math.min(100, Number(property.offer_discount) || 0));
  const offerActive =
    discount > 0 &&
    (!property.offer_ends || new Date(property.offer_ends).getTime() > Date.now());
  const effDiscount = offerActive ? discount : 0;
  const basePrice = Number(property.price) || 0;
  const unitPrice = round2(basePrice * (1 - effDiscount / 100));
  const units = isRent ? nights : 1;
  const baseSubtotal = round2(basePrice * units);
  const subtotal = round2(unitPrice * units);
  const discountAmount = round2(baseSubtotal - subtotal);
  const taxAmount = round2(subtotal * (taxPct / 100));
  const totalAmount = round2(subtotal + taxAmount);
  return {
    checkIn: pricing?.checkIn || null,
    checkOut: pricing?.checkOut || null,
    nights,
    unitPrice,
    units,
    baseSubtotal,
    discountPercent: effDiscount,
    discountAmount,
    subtotal,
    taxPercent: taxPct,
    taxAmount,
    totalAmount,
    currency,
    isRent,
  };
}

function patchFromBreakdown(b: Breakdown) {
  return {
    check_in: b.checkIn,
    check_out: b.checkOut,
    nights: b.nights,
    unit_price: b.unitPrice,
    subtotal: b.subtotal,
    discount_percent: b.discountPercent,
    discount_amount: b.discountAmount,
    tax_percent: b.taxPercent,
    tax_amount: b.taxAmount,
    total_amount: b.totalAmount,
    currency: b.currency,
  };
}

function breakdownNotes(b: Breakdown, title: string) {
  const money = (n: number) => `${b.currency} ${n.toFixed(2)}`;
  const lines: string[] = [`Property: ${title}`];
  if (b.isRent && b.checkIn && b.checkOut) {
    lines.push(`Rent period: ${b.checkIn} → ${b.checkOut} (${b.nights} night${b.nights === 1 ? "" : "s"})`);
    lines.push(`Rate: ${money(b.unitPrice)} / night${b.discountPercent ? ` (${b.discountPercent}% offer)` : ""}`);
    lines.push(`Subtotal: ${money(b.unitPrice)} × ${b.nights} = ${money(b.subtotal)}`);
  } else {
    lines.push(`Price: ${money(b.unitPrice)}${b.discountPercent ? ` (${b.discountPercent}% offer)` : ""}`);
    lines.push(`Subtotal: ${money(b.subtotal)}`);
  }
  if (b.discountAmount > 0) lines.push(`Offer discount: − ${money(b.discountAmount)}`);
  if (b.taxPercent > 0) lines.push(`VAT (${b.taxPercent}%): ${money(b.taxAmount)}`);
  lines.push(`Total: ${money(b.totalAmount)}`);
  return lines.join("\n");
}

export type BookingInput = z.infer<typeof BookingSchema>;

function serverClient() {
  return createClient<Database>(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
  );
}

export const createBooking = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => BookingSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Resolve property by UUID or by slug (frontend uses slug as Property.id)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      data.propertyId,
    );
    const q = supabaseAdmin
      .from("properties")
      .select("id, title, status, price, offer_discount, offer_ends, assigned_agent_id, created_by");
    const { data: prop } = isUuid
      ? await q.eq("id", data.propertyId).maybeSingle()
      : await q.eq("slug", data.propertyId).maybeSingle();
    if (!prop) throw new Error("Property not found");
    const propertyUuid = (prop as { id: string }).id;
    const resolvedTitle = (prop as { title: string }).title;
    const agentId =
      (prop as { assigned_agent_id?: string | null }).assigned_agent_id ??
      (prop as { created_by?: string | null }).created_by ??
      null;

    const breakdown = await computeBreakdown(
      supabaseAdmin,
      prop as { price: number; status: string; offer_discount?: number | null; offer_ends?: string | null },
      data.pricing,
    );
    const computedNotes = breakdownNotes(breakdown, resolvedTitle ?? data.propertyTitle);
    const finalNotes = data.notes ? `${data.notes}\n\n${computedNotes}` : computedNotes;

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
        notes: finalNotes,
        source: "website",
        status: "pending",
        ...patchFromBreakdown(breakdown),
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: inserted.id, receivedAt: new Date().toISOString(), breakdown };
  });

// Authenticated booking creation — links booking to the signed-in user
// so it shows up in their personal dashboard. Same shape as createBooking.
export const createBookingAsUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => BookingSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      data.propertyId,
    );
    const q = supabaseAdmin
      .from("properties")
      .select("id, title, status, price, offer_discount, offer_ends, assigned_agent_id, created_by");
    const { data: prop } = isUuid
      ? await q.eq("id", data.propertyId).maybeSingle()
      : await q.eq("slug", data.propertyId).maybeSingle();
    if (!prop) throw new Error("Property not found");
    const propertyUuid = (prop as { id: string }).id;
    const resolvedTitle = (prop as { title: string }).title;
    const agentId =
      (prop as { assigned_agent_id?: string | null }).assigned_agent_id ??
      (prop as { created_by?: string | null }).created_by ??
      null;
    const email =
      (context.claims as { email?: string } | undefined)?.email || data.email || null;

    const breakdown = await computeBreakdown(
      supabaseAdmin,
      prop as { price: number; status: string; offer_discount?: number | null; offer_ends?: string | null },
      data.pricing,
    );
    const computedNotes = breakdownNotes(breakdown, resolvedTitle ?? data.propertyTitle);
    const finalNotes = data.notes ? `${data.notes}\n\n${computedNotes}` : computedNotes;

    const { data: inserted, error } = await supabaseAdmin
      .from("bookings")
      .insert({
        property_id: propertyUuid,
        property_title: resolvedTitle ?? data.propertyTitle,
        agent_id: agentId,
        customer_user_id: context.userId,
        customer_name: data.name,
        customer_phone: data.phone,
        customer_email: email,
        scheduled_date: data.date,
        scheduled_time: data.time,
        notes: finalNotes,
        source: "website",
        status: "pending",
        ...patchFromBreakdown(breakdown),
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, id: inserted.id, receivedAt: new Date().toISOString(), breakdown };
  });

export const listMyBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email =
      (context.claims as { email?: string } | undefined)?.email?.toLowerCase() || "";
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let query = supabaseAdmin
      .from("bookings")
      .select("*, properties:property_id (id, slug, price, location, image)")
      .order("scheduled_date", { ascending: false });
    if (email) {
      query = query.or(`customer_user_id.eq.${context.userId},customer_email.ilike.${email}`);
    } else {
      query = query.eq("customer_user_id", context.userId);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return data ?? [];
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
      ? (data.agentId || (prop as { created_by?: string | null }).created_by || context.userId)
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
    const q = supabaseAdmin
      .from("properties")
      .select("id, title, assigned_agent_id, created_by");
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
