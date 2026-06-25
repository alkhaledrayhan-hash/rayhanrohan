import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { MessageCircle, X, Send, Loader2, Home, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  createConversation,
  fetchGuestThread,
  replyAsGuest,
} from "@/lib/messages.functions";
import { listPublicAgents, type PublicAgent } from "@/lib/public-agents.functions";


const STORAGE_KEY = "maison_chat_thread";

type Stored = { id: string; token: string };
type Message = {
  id: string;
  sender_role: "customer" | "agent" | "admin";
  sender_name: string | null;
  body: string;
  created_at: string;
};
type Conversation = {
  id: string;
  customer_name: string;
  subject: string | null;
  status: string;
  property_title: string | null;
};

function loadStored(): Stored | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Stored) : null;
  } catch {
    return null;
  }
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [stored, setStored] = useState<Stored | null>(null);
  const [conv, setConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [reply, setReply] = useState("");

  // start form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  // "admin" or agent uuid
  const [recipient, setRecipient] = useState<string>("admin");

  const listAgentsFn = useServerFn(listPublicAgents);
  const { data: agentsData } = useQuery({
    queryKey: ["public-agents-chat"],
    queryFn: () => listAgentsFn({}),
    staleTime: 5 * 60_000,
  });
  const agents = useMemo<PublicAgent[]>(() => agentsData?.agents ?? [], [agentsData]);
  const selectedAgent = useMemo(
    () => (recipient === "admin" ? null : agents.find((a) => a.id === recipient) ?? null),
    [recipient, agents],
  );


  const createFn = useServerFn(createConversation);
  const fetchFn = useServerFn(fetchGuestThread);
  const replyFn = useServerFn(replyAsGuest);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setStored(loadStored());
  }, []);

  // load thread when opened
  useEffect(() => {
    if (!open || !stored) return;
    let cancel = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetchFn({ data: stored! });
        if (cancel) return;
        setConv(res.conversation as Conversation);
        setMessages(res.messages as Message[]);
      } catch (e) {
        if (!cancel) {
          // stale token / deleted thread → reset
          localStorage.removeItem(STORAGE_KEY);
          setStored(null);
          setConv(null);
          setMessages([]);
        }
      } finally {
        if (!cancel) setLoading(false);
      }
    }
    load();
    const t = setInterval(load, 4000);
    return () => {
      cancel = true;
      clearInterval(t);
    };
  }, [open, stored, fetchFn]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, open]);

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !body.trim()) return;
    setSending(true);
    try {
      const res = await createFn({
        data: {
          name: name.trim(),
          email: email.trim(),
          body: body.trim(),
          agent_id: recipient === "admin" ? null : recipient,
          subject: recipient === "admin" ? "Support request" : null,
        },
      });

      const next = { id: res.id, token: res.token };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setStored(next);
      setBody("");
      toast.success("Message sent — we'll reply shortly");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim() || !stored) return;
    setSending(true);
    try {
      await replyFn({ data: { ...stored, body: reply.trim() } });
      setReply("");
      // optimistic: refetch immediately
      const res = await fetchFn({ data: stored });
      setMessages(res.messages as Message[]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  }

  function handleNewConversation() {
    localStorage.removeItem(STORAGE_KEY);
    setStored(null);
    setConv(null);
    setMessages([]);
  }

  return (
    <>
      {/* Launcher */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat" : "Open chat"}
        className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-xl ring-4 ring-primary/20 transition hover:scale-105"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-6 w-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 right-5 z-50 flex h-[560px] w-[360px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-border bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex min-w-0 items-center gap-2.5">
              <ChatHeaderAvatar agent={selectedAgent} />
              <div className="flex min-w-0 flex-col leading-tight">
                <span className="truncate font-display text-sm font-semibold">
                  {selectedAgent ? selectedAgent.full_name || selectedAgent.username || "Agent" : "Chat With Our Team"}
                </span>
                <span className="truncate text-[11px] opacity-80">
                  {stored
                    ? "We'll reply here"
                    : selectedAgent
                    ? "Direct message · Agent"
                    : "Direct message · Support"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {stored && (
                <button
                  onClick={handleNewConversation}
                  className="rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-medium hover:bg-white/25"
                >
                  New
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                aria-label="Close chat"
                className="grid h-7 w-7 place-items-center rounded-full bg-white/15 transition hover:bg-white/25"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>



          {/* Body */}
          {!stored ? (
            <form onSubmit={handleStart} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
              <p className="text-xs text-muted-foreground">
                Choose who you'd like to chat with and leave your details.
              </p>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Chat with
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRecipient("admin")}
                    className={`flex items-center gap-2 rounded-md border px-2.5 py-2 text-left text-xs transition ${
                      recipient === "admin"
                        ? "border-primary bg-primary/5 ring-1 ring-primary/40"
                        : "border-input hover:border-primary/40"
                    }`}
                  >
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground">
                      <ShieldCheck className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-foreground">Support</span>
                      <span className="block truncate text-[10px] text-muted-foreground">Admin team</span>
                    </span>
                  </button>
                  <select
                    value={recipient === "admin" ? "" : recipient}
                    onChange={(e) => setRecipient(e.target.value || "admin")}
                    className={`rounded-md border bg-background px-2.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary ${
                      recipient !== "admin"
                        ? "border-primary ring-1 ring-primary/40"
                        : "border-input"
                    }`}
                  >
                    <option value="">Choose an agent…</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.full_name || a.username || "Agent"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                maxLength={100}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="Email"
                required
                maxLength={255}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="How can we help?"
                required
                rows={5}
                maxLength={4000}
                className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                disabled={sending}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send message
              </button>
            </form>
          ) : (
            <>
              <div
                ref={scrollRef}
                className="flex-1 space-y-2 overflow-y-auto bg-muted/30 p-3"
              >
                {loading && messages.length === 0 ? (
                  <div className="grid h-full place-items-center text-xs text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  messages.map((m) => (
                    <MessageBubble key={m.id} m={m} />
                  ))
                )}
              </div>
              <form onSubmit={handleReply} className="flex items-end gap-2 border-t border-border bg-background p-3">
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Type a reply…"
                  rows={2}
                  maxLength={4000}
                  className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleReply(e as unknown as React.FormEvent);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={sending || !reply.trim()}
                  className="grid h-10 w-10 place-items-center rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}

function MessageBubble({ m }: { m: Message }) {
  const isCustomer = m.sender_role === "customer";
  return (
    <div className={`flex ${isCustomer ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
          isCustomer
            ? "bg-primary text-primary-foreground"
            : "bg-background border border-border text-foreground"
        }`}
      >
        {!isCustomer && (
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide opacity-70">
            {m.sender_role === "admin" ? "Support" : "Agent"}
          </p>
        )}
        <p className="whitespace-pre-wrap break-words">{m.body}</p>
        <p className={`mt-1 text-[10px] ${isCustomer ? "opacity-70" : "text-muted-foreground"}`}>
          {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </div>
  );
}
