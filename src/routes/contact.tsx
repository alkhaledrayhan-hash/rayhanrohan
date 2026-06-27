import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { submitLead } from "@/lib/leads";
import {
  Building2,
  Clock,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { PageHero } from "@/components/site/PageHero";

import contactHero from "@/assets/qatar-corniche.jpg?w=1600&quality=70&format=webp";
import { PhoneInput } from "@/components/site/PhoneInput";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact MaisonQatar — Speak with a Doha Property Advisor" },
      {
        name: "description",
        content:
          "Get in touch with MaisonQatar's licensed advisors in Doha. Phone, WhatsApp, email and office address for viewings, valuations and listing enquiries.",
      },
      { property: "og:title", content: "Contact MaisonQatar" },
      {
        property: "og:description",
        content:
          "Speak with a licensed property advisor in Doha for viewings, valuations and listing enquiries.",
      },
    ],
  }),
  component: ContactPage,
});

const PHONE_DISPLAY = "+974 4444 0123";
const PHONE_E164 = "+97444440123";
const WHATSAPP_E164 = "97433330123";
const EMAIL = "hello@maisonqatar.qa";

function ContactPage() {

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "General enquiry",
    message: "",
  });
  const [dialCode, setDialCode] = useState("+974");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        phone: form.phone.trim() ? `${dialCode} ${form.phone.trim()}` : "",
      };
      const res = await submitLead({ ...payload, source: "contact_page" });
      toast.success("Message sent", {
        description: `Reference ${res.id}. We'll reply within one business hour.`,
      });
      setForm({ name: "", email: "", phone: "", subject: "General enquiry", message: "" });
    } catch (err) {
      console.error(err);
      toast.error("Please check your details and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <PageHero
        image={contactHero}
        eyebrow="Contact"
        title="Talk to a Doha property advisor."
        description="Viewings, valuations, off-market opportunities or listing your property — our team replies within one business hour, seven days a week."
        crumbs={[{ label: "Home", to: "/" }, { label: "Contact" }]}
      />

      {/* Quick contact tiles */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ContactTile
            icon={<Phone className="h-4 w-4" />}
            label="Call"
            value={PHONE_DISPLAY}
            href={`tel:${PHONE_E164}`}
          />
          <ContactTile
            icon={<MessageCircle className="h-4 w-4" />}
            label="WhatsApp"
            value="Chat now"
            href={`https://wa.me/${WHATSAPP_E164}`}
            external
          />
          <ContactTile
            icon={<Mail className="h-4 w-4" />}
            label="Email"
            value={EMAIL}
            href={`mailto:${EMAIL}`}
          />
          <ContactTile
            icon={<Clock className="h-4 w-4" />}
            label="Hours"
            value="Sat–Thu · 9am–8pm"
          />
        </div>
      </section>

      {/* Form + Office details */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          {/* Form */}
          <form
            onSubmit={onSubmit}
            className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] sm:p-8"
          >
            <h2 className="font-display text-2xl font-semibold">Send us a message</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Share a few details and the right advisor will be in touch.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <FormField
                label="Full name"
                value={form.name}
                onChange={(v) => setForm({ ...form, name: v })}
                required
                placeholder="Your name"
              />
              <FormField
                label="Email"
                type="email"
                value={form.email}
                onChange={(v) => setForm({ ...form, email: v })}
                required
                placeholder="you@example.com"
              />
              <FormField
                label="Phone (optional)"
                type="tel"
                value={form.phone}
                onChange={(v) => setForm({ ...form, phone: v })}
                placeholder="+974 …"
              />
              <FormSelect
                label="Subject"
                value={form.subject}
                onChange={(v) => setForm({ ...form, subject: v })}
                options={[
                  "General enquiry",
                  "Book a viewing",
                  "Sell or list a property",
                  "Property valuation",
                  "Press & partnerships",
                ]}
              />
              <label className="flex flex-col gap-1 sm:col-span-2">
                <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Message
                </span>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  rows={5}
                  required
                  maxLength={2000}
                  placeholder="Tell us about the area, budget or property you have in mind…"
                  className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none ring-primary/30 focus:ring-2"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-[var(--shadow-soft)] transition hover:opacity-95 disabled:opacity-60 sm:w-auto"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send message
            </button>
            <p className="mt-3 text-[12px] text-muted-foreground">
              By submitting, you agree to be contacted by MaisonQatar regarding your enquiry.
            </p>
          </form>

          {/* Office */}
          <aside className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <h3 className="font-display text-xl font-semibold">Head Office</h3>
              </div>
              <dl className="mt-4 space-y-3 text-sm">
                <Row icon={<MapPin className="h-4 w-4" />}>
                  Tower 2, Level 18, West Bay Business District
                  <br />
                  Al Corniche Street, Doha, Qatar
                </Row>
                <Row icon={<Phone className="h-4 w-4" />}>
                  <a href={`tel:${PHONE_E164}`} className="hover:text-primary">
                    {PHONE_DISPLAY}
                  </a>
                </Row>
                <Row icon={<Mail className="h-4 w-4" />}>
                  <a href={`mailto:${EMAIL}`} className="hover:text-primary">
                    {EMAIL}
                  </a>
                </Row>
                <Row icon={<Clock className="h-4 w-4" />}>
                  Sat–Thu · 9:00 AM – 8:00 PM
                  <br />
                  Friday · By appointment
                </Row>
              </dl>
              <div className="mt-5 grid grid-cols-2 gap-2 border-t border-border pt-4 text-[12px] text-muted-foreground">
                <div>
                  <p className="uppercase tracking-[0.16em]">License</p>
                  <p className="mt-0.5 font-mono text-foreground">QA-RE-2014-0387</p>
                </div>
                <div>
                  <p className="uppercase tracking-[0.16em]">CR No.</p>
                  <p className="mt-0.5 font-mono text-foreground">114532</p>
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="overflow-hidden rounded-2xl border border-border shadow-[var(--shadow-card)]">
              <iframe
                title="MaisonQatar head office on the map"
                src="https://www.google.com/maps?q=West+Bay+Doha+Qatar&output=embed"
                className="h-64 w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </aside>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function ContactTile({
  icon, label, value, href, external,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
  external?: boolean;
}) {
  const inner = (
    <>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </span>
        <span className="block truncate text-sm font-medium text-foreground">{value}</span>
      </span>
    </>
  );
  const className =
    "flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition hover:border-primary/40 hover:shadow-[var(--shadow-soft)]";
  if (!href) return <div className={className}>{inner}</div>;
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={className}
    >
      {inner}
    </a>
  );
}

function FormField({
  label, value, onChange, type = "text", required, placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        required={required}
        maxLength={200}
        placeholder={placeholder}
        className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none ring-primary/30 focus:ring-2"
      />
    </label>
  );
}

function FormSelect({
  label, value, onChange, options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none ring-primary/30 focus:ring-2"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function Row({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
        {icon}
      </span>
      <div className="text-foreground/90 leading-relaxed">{children}</div>
    </div>
  );
}
