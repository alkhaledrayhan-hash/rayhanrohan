import { useState, type FormEvent } from "react";
import { Mail, Phone, Send, CheckCircle2 } from "lucide-react";
import { submitLead } from "@/lib/leads";

export function HomeContact() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      name: String(fd.get("name") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      phone: String(fd.get("phone") || "").trim(),
      subject: String(fd.get("subject") || "General enquiry").trim(),
      message: String(fd.get("message") || "").trim(),
    };
    setStatus("loading");
    setError(null);
    try {
      await submitLead({ ...data, source: "home_contact" });
      setStatus("success");
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <section
      id="contact"
      className="relative overflow-hidden bg-gradient-to-b from-primary via-primary to-[oklch(0.28_0.13_18)] py-20 text-primary-foreground"
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 60%, white 1px, transparent 1px)",
          backgroundSize: "48px 48px, 64px 64px",
        }}
      />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:px-8">
        <div className="flex flex-col justify-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-gold">
            Talk to a specialist
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold sm:text-4xl">
            Have a question? We'd love to hear from you.
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-primary-foreground/80">
            Whether you're searching for your next home, listing a property, or just exploring the
            market — our advisors respond within one business hour.
          </p>
          <div className="mt-8 space-y-4 text-sm">
            <a
              href="tel:+97440000000"
              className="flex items-center gap-3 text-primary-foreground/90 transition hover:text-gold"
            >
              <span className="grid h-10 w-10 place-items-center rounded-full bg-white/10 backdrop-blur">
                <Phone className="h-4 w-4" />
              </span>
              +974 4000 0000
            </a>
            <a
              href="mailto:hello@maisonqatar.com"
              className="flex items-center gap-3 text-primary-foreground/90 transition hover:text-gold"
            >
              <span className="grid h-10 w-10 place-items-center rounded-full bg-white/10 backdrop-blur">
                <Mail className="h-4 w-4" />
              </span>
              hello@maisonqatar.com
            </a>
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="rounded-3xl border border-white/15 bg-white/10 p-6 shadow-[var(--shadow-soft)] backdrop-blur-xl sm:p-8"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Full name"
              name="name"
              required
              minLength={2}
              maxLength={100}
              placeholder="Your name"
            />
            <Field
              label="Email"
              name="email"
              type="email"
              required
              maxLength={200}
              placeholder="you@email.com"
            />
            <Field label="Phone" name="phone" type="tel" maxLength={30} placeholder="+974 …" />
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary-foreground/70">
                Topic
              </label>
              <select
                name="subject"
                defaultValue="General enquiry"
                className="h-11 rounded-md border border-white/20 bg-white/10 px-3 text-sm text-primary-foreground backdrop-blur-xl outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/30"
              >
                <option className="text-foreground">General enquiry</option>
                <option className="text-foreground">Buying a property</option>
                <option className="text-foreground">Renting a property</option>
                <option className="text-foreground">List my property</option>
                <option className="text-foreground">Investment advice</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-1.5">
            <label className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary-foreground/70">
              Message
            </label>
            <textarea
              name="message"
              required
              minLength={5}
              maxLength={2000}
              rows={4}
              placeholder="Tell us a little about what you're looking for…"
              className="rounded-md border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-primary-foreground placeholder:text-primary-foreground/50 backdrop-blur-xl outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/30"
            />
          </div>

          {status === "success" ? (
            <p className="mt-4 flex items-center gap-2 rounded-md bg-emerald-500/15 px-3 py-2 text-sm text-emerald-100">
              <CheckCircle2 className="h-4 w-4" />
              Thank you — we'll be in touch shortly.
            </p>
          ) : null}
          {status === "error" ? (
            <p className="mt-4 rounded-md bg-red-500/15 px-3 py-2 text-sm text-red-100">{error}</p>
          ) : null}

          <button
            type="submit"
            disabled={status === "loading"}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md bg-gold px-5 py-3 text-sm font-semibold text-gold-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
          >
            <Send className="h-4 w-4" />
            {status === "loading" ? "Sending…" : "Send message"}
          </button>
        </form>
      </div>
    </section>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary-foreground/70">
        {label}
      </label>
      <input
        {...props}
        className="h-11 rounded-md border border-white/20 bg-white/10 px-3 text-sm text-primary-foreground placeholder:text-primary-foreground/50 backdrop-blur-xl outline-none transition focus:border-gold focus:ring-2 focus:ring-gold/30"
      />
    </div>
  );
}
