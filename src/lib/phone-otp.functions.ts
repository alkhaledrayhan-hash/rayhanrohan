import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SendSchema = z.object({
  phone: z.string().trim().min(6).max(20).regex(/^\+?[0-9\s\-()]+$/, "Invalid phone"),
  channel: z.enum(["sms", "whatsapp"]),
});

const VerifySchema = z.object({
  phone: z.string().trim().min(6).max(20),
  code: z.string().trim().regex(/^\d{6}$/, "Code must be 6 digits"),
});

function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, "");
  if (!digits.startsWith("+")) return `+${digits}`;
  return digits;
}

async function sha256(input: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function ensureChannelEnabled(channel: "sms" | "whatsapp") {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const key = channel === "sms" ? "auth_phone_sms_enabled" : "auth_phone_whatsapp_enabled";
  const { data } = await supabaseAdmin.from("site_settings").select("value").eq("key", key).maybeSingle();
  const enabled = (data?.value ?? "false") === "true";
  if (!enabled) throw new Error(`${channel === "sms" ? "SMS" : "WhatsApp"} sign-in is disabled`);
}

async function sendTwilio(to: string, body: string, channel: "sms" | "whatsapp") {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const smsFrom = process.env.TWILIO_SMS_FROM;
  const waFrom = process.env.TWILIO_WHATSAPP_FROM;
  if (!sid || !token) throw new Error("Twilio credentials not configured");
  const from = channel === "whatsapp" ? `whatsapp:${(waFrom || "").replace(/^whatsapp:/, "")}` : smsFrom;
  const dest = channel === "whatsapp" ? `whatsapp:${to}` : to;
  if (!from) throw new Error(`Twilio ${channel} sender not configured`);

  const params = new URLSearchParams({ To: dest, From: from, Body: body });
  const auth = btoa(`${sid}:${token}`);
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });
  if (!res.ok) {
    const text = await res.text();
    console.error("Twilio send failed", res.status, text);
    throw new Error("Failed to send code. Please try again.");
  }
}

export const sendPhoneOtp = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => SendSchema.parse(d))
  .handler(async ({ data }) => {
    await ensureChannelEnabled(data.channel);
    const phone = normalizePhone(data.phone);
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const code_hash = await sha256(`${phone}:${code}`);
    const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Invalidate previous unconsumed codes for this phone
    await supabaseAdmin.from("phone_otps").update({ consumed_at: new Date().toISOString() })
      .eq("phone", phone).is("consumed_at", null);

    const { error } = await supabaseAdmin.from("phone_otps").insert({
      phone, channel: data.channel, code_hash, expires_at,
    });
    if (error) throw new Error("Could not create code");

    await sendTwilio(phone, `Your verification code is ${code}. Expires in 10 minutes.`, data.channel);
    return { ok: true };
  });

export const verifyPhoneOtp = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => VerifySchema.parse(d))
  .handler(async ({ data }) => {
    const phone = normalizePhone(data.phone);
    const code_hash = await sha256(`${phone}:${data.code}`);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin.from("phone_otps")
      .select("id, code_hash, expires_at, consumed_at, attempts")
      .eq("phone", phone)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!row) throw new Error("No active code. Please request a new one.");
    if (new Date(row.expires_at).getTime() < Date.now()) throw new Error("Code expired. Request a new one.");
    if (row.attempts >= 5) throw new Error("Too many attempts. Request a new code.");
    if (row.code_hash !== code_hash) {
      await supabaseAdmin.from("phone_otps").update({ attempts: row.attempts + 1 }).eq("id", row.id);
      throw new Error("Invalid code");
    }

    await supabaseAdmin.from("phone_otps").update({ consumed_at: new Date().toISOString() }).eq("id", row.id);

    // Find or create user by phone — use synthetic email to fit Supabase Auth
    const emailAlias = `phone_${phone.replace(/[^\d]/g, "")}@phone.maisonqatar.local`;
    let userId: string | null = null;
    const list = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const existing = list.data.users.find((u) => u.phone === phone.replace(/^\+/, "") || u.email === emailAlias);
    if (existing) {
      userId = existing.id;
    } else {
      const created = await supabaseAdmin.auth.admin.createUser({
        email: emailAlias,
        phone: phone.replace(/^\+/, ""),
        email_confirm: true,
        phone_confirm: true,
        user_metadata: { signup_method: "phone" },
      });
      if (created.error || !created.data.user) throw new Error("Could not create account");
      userId = created.data.user.id;
      await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "user" }).select();
    }

    // Generate a magiclink the client can exchange for a session
    const link = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: emailAlias,
    });
    if (link.error || !link.data.properties?.hashed_token) {
      throw new Error("Could not finalize sign-in");
    }
    return {
      ok: true,
      email: emailAlias,
      token_hash: link.data.properties.hashed_token,
    };
  });
