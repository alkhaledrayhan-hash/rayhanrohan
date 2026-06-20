import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, MessageSquare, Send, X } from "lucide-react";
import { toast } from "sonner";
import { createConversation } from "@/lib/messages.functions";

export function MessageAgentDialog({
  agentId,
  agentName,
}: {
  agentId: string;
  agentName: string;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const start = useServerFn(createConversation);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2 || !email.includes("@") || body.trim().length < 2) {
      toast.error("Please add your name, email and a short message.");
      return;
    }
    setSubmitting(true);
    try {
      await start({
        data: {
          name,
          email,
          agent_id: agentId,
          subject: `Message for ${agentName}`,
          body,
        },
      });
      toast.success("Message sent", {
        description: `${agentName} will reply to ${email} shortly.`,
      });
      setName("");
      setEmail("");
      setBody("");
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Couldn't send the message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
      >
        <MessageSquare className="h-3.5 w-3.5" /> Message agent
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
          onClick={() => !submitting && setOpen(false)}
        >
          <form
            onSubmit={onSubmit}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-semibold">
                Message {agentName}
              </h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Send a direct message. The agent will reply to your email.
            </p>

            <div className="mt-4 grid gap-3">
              <Field label="Your name" value={name} onChange={setName} placeholder="Full name" />
              <Field label="Email" value={email} onChange={setEmail} placeholder="you@email.com" type="email" />
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Message
                </span>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  placeholder="Hello, I'd like to ask about…"
                  className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none ring-primary/30 focus:ring-2"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition hover:opacity-95 disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send message
            </button>
          </form>
        </div>
      ) : null}
    </>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none ring-primary/30 focus:ring-2"
      />
    </label>
  );
}
