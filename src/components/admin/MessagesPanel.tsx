import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Send, MessageSquare, Search } from "lucide-react";
import { toast } from "sonner";

type Conversation = {
  id: string;
  customer_name: string;
  customer_email: string;
  subject: string | null;
  status: string;
  property_id: string | null;
  assigned_agent_id: string | null;
  last_message_at: string;
  created_at: string;
};

type Message = {
  id: string;
  sender_role: "customer" | "agent" | "admin";
  sender_name: string | null;
  body: string;
  created_at: string;
};

type AgentOption = { id: string; full_name: string | null; email: string };

export function MessagesPanel({ isAdmin }: { isAdmin: boolean }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [agentFilter, setAgentFilter] = useState<string>("all"); // all | unassigned | <agentId>
  const qc = useQueryClient();

  const { data: agents } = useQuery({
    queryKey: ["messages", "agent-options"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data: roles, error: rolesErr } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "agent");
      if (rolesErr) throw rolesErr;
      const ids = (roles ?? []).map((r) => r.user_id);
      if (ids.length === 0) return [] as AgentOption[];
      const { data: profs, error: pErr } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", ids);
      if (pErr) throw pErr;
      return ((profs ?? []) as AgentOption[]).sort((a, b) =>
        (a.full_name || a.email).localeCompare(b.full_name || b.email),
      );
    },
  });


  const { data: convos, isLoading } = useQuery({
    queryKey: ["messages", "conversations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select(
          "id, customer_name, customer_email, subject, status, property_id, assigned_agent_id, last_message_at, created_at",
        )
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Conversation[];
    },
  });

  // realtime: invalidate list on any conversation/message change
  useEffect(() => {
    const ch = supabase
      .channel("inbox")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => qc.invalidateQueries({ queryKey: ["messages", "conversations"] }),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => qc.invalidateQueries({ queryKey: ["messages", "conversations"] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [qc]);

  const filtered = useMemo(() => {
    if (!convos) return [];
    const s = search.trim().toLowerCase();
    if (!s) return convos;
    return convos.filter(
      (c) =>
        c.customer_name.toLowerCase().includes(s) ||
        c.customer_email.toLowerCase().includes(s) ||
        (c.subject ?? "").toLowerCase().includes(s),
    );
  }, [convos, search]);

  useEffect(() => {
    if (!selectedId && filtered.length > 0) setSelectedId(filtered[0].id);
  }, [filtered, selectedId]);

  return (
    <div className="grid h-[calc(100vh-220px)] min-h-[500px] grid-cols-1 gap-0 overflow-hidden rounded-xl border border-border bg-background md:grid-cols-[320px_1fr]">
      {/* List */}
      <aside className="flex min-h-0 flex-col border-r border-border">
        <div className="border-b border-border p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email…"
              className="w-full rounded-full border border-input bg-muted/40 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="grid h-full place-items-center text-xs text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="grid h-full place-items-center p-6 text-center text-xs text-muted-foreground">
              <div>
                <MessageSquare className="mx-auto mb-2 h-8 w-8 opacity-40" />
                No conversations yet.
              </div>
            </div>
          ) : (
            filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedId(c.id)}
                className={`flex w-full flex-col items-start gap-1 border-b border-border px-4 py-3 text-left transition ${
                  selectedId === c.id ? "bg-primary/5" : "hover:bg-muted/50"
                }`}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold">{c.customer_name}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(c.last_message_at).toLocaleDateString()}
                  </span>
                </div>
                <span className="truncate text-xs text-muted-foreground">{c.customer_email}</span>
                {c.subject && (
                  <span className="truncate text-xs text-foreground/80">{c.subject}</span>
                )}
                {c.status === "closed" && (
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                    Closed
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </aside>

      {/* Thread */}
      <section className="flex min-h-0 flex-col">
        {selectedId ? (
          <Thread conversationId={selectedId} isAdmin={isAdmin} />
        ) : (
          <div className="grid flex-1 place-items-center text-sm text-muted-foreground">
            Select a conversation
          </div>
        )}
      </section>
    </div>
  );
}

function Thread({ conversationId, isAdmin }: { conversationId: string; isAdmin: boolean }) {
  const qc = useQueryClient();
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: convo } = useQuery({
    queryKey: ["messages", "conversation", conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .maybeSingle();
      if (error) throw error;
      return data as Conversation | null;
    },
  });

  const { data: messages, isLoading } = useQuery({
    queryKey: ["messages", "thread", conversationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("id, sender_role, sender_name, body, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Message[];
    },
  });

  useEffect(() => {
    const ch = supabase
      .channel(`thread:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => qc.invalidateQueries({ queryKey: ["messages", "thread", conversationId] }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [conversationId, qc]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages?.length]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) {
      setSending(false);
      return toast.error("Not signed in");
    }
    const senderRole = isAdmin ? "admin" : "agent";
    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      sender_role: senderRole,
      sender_user_id: u.user.id,
      sender_name: u.user.email ?? null,
      body: reply.trim(),
    });
    setSending(false);
    if (error) return toast.error(error.message);
    setReply("");
    qc.invalidateQueries({ queryKey: ["messages", "thread", conversationId] });
    qc.invalidateQueries({ queryKey: ["messages", "conversations"] });
  }

  async function handleToggleStatus() {
    if (!convo) return;
    const next = convo.status === "closed" ? "open" : "closed";
    const { error } = await supabase
      .from("conversations")
      .update({ status: next })
      .eq("id", conversationId);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["messages", "conversation", conversationId] });
    qc.invalidateQueries({ queryKey: ["messages", "conversations"] });
  }

  return (
    <>
      <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-3">
        <div>
          <h3 className="font-display text-base font-semibold">{convo?.customer_name}</h3>
          <p className="text-xs text-muted-foreground">{convo?.customer_email}</p>
          {convo?.subject && (
            <p className="mt-0.5 text-xs text-foreground/80">{convo.subject}</p>
          )}
        </div>
        <button
          onClick={handleToggleStatus}
          className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          {convo?.status === "closed" ? "Reopen" : "Close"}
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto bg-muted/20 p-4">
        {isLoading ? (
          <div className="grid h-full place-items-center text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : (
          (messages ?? []).map((m) => {
            const isCustomer = m.sender_role === "customer";
            return (
              <div key={m.id} className={`flex ${isCustomer ? "justify-start" : "justify-end"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                    isCustomer
                      ? "border border-border bg-background"
                      : "bg-primary text-primary-foreground"
                  }`}
                >
                  <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wide opacity-70">
                    {m.sender_role === "customer" ? m.sender_name || "Customer" : m.sender_role}
                  </p>
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={`mt-1 text-[10px] ${isCustomer ? "text-muted-foreground" : "opacity-70"}`}>
                    {new Date(m.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={handleSend} className="flex items-end gap-2 border-t border-border p-3">
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Type your reply…"
          rows={2}
          maxLength={4000}
          disabled={convo?.status === "closed"}
          className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend(e as unknown as React.FormEvent);
            }
          }}
        />
        <button
          type="submit"
          disabled={sending || !reply.trim() || convo?.status === "closed"}
          className="grid h-10 w-10 place-items-center rounded-md bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
    </>
  );
}
