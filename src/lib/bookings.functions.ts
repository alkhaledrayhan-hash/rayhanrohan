import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const BookingSchema = z.object({
  propertyId: z.string().min(1),
  propertyTitle: z.string().min(1).max(200),
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(6).max(30),
  date: z.string().min(1).max(40),
  time: z.string().min(1).max(20),
});

export type BookingInput = z.infer<typeof BookingSchema>;

export const createBooking = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => BookingSchema.parse(data))
  .handler(async ({ data }) => {
    // In a production deploy, persist this in DB and notify the agent.
    // For now we log the request server-side as a verifiable receipt.
    const id = `bk_${Date.now().toString(36)}`;
    console.log("[booking]", id, JSON.stringify(data));
    return {
      ok: true,
      id,
      receivedAt: new Date().toISOString(),
    };
  });

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
    const id = `enq_${Date.now().toString(36)}`;
    console.log("[enquiry]", id, JSON.stringify(data));
    return { ok: true, id };
  });
