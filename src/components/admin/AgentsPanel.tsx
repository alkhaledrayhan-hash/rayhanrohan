import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AtSign, Eye, Mail, Pencil, Phone, Trash2, UserCircle2, X } from "lucide-react";
import { deleteAgent, listAgents, updateAgent } from "@/lib/agents.functions";
import { AvatarUploader } from "@/components/admin/AddAgentForm";

type Agent = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  username: string | null;
  avatar_url: string | null;
};

export function AgentsPanel() {
  const listFn = useServerFn(listAgents);
  const { data, isLoading } = useQuery({
    queryKey: ["agents"],
    queryFn: () => listFn(),
  });

  const [editing, setEditing] = useState<Agent | null>(null);
  const [viewing, setViewing] = useState<Agent | null>(null);

  if (isLoading) {
    return <div className="rounded-2xl border border-border bg-white p-10 text-center text-sm text-muted-foreground">Loading agents…</div>;
  }

  const agents = (data?.agents ?? []) as Agent[];

  if (!agents.length) {
    return (
      <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-white p-16 text-center">
        <UserCircle2 className="h-10 w-10 text-muted-foreground" />
        <p className="mt-3 font-display text-lg font-semibold">No agents yet</p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Use the "Add Agent" submenu to create your first agent account.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {agents.map((a) => (
          <AgentCard
            key={a.id}
            agent={a}
            onView={() => setViewing(a)}
            onEdit={() => setEditing(a)}
          />
        ))}
      </div>
      {viewing && (
        <ViewAgentDialog
          agent={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => { setEditing(viewing); setViewing(null); }}
        />
      )}
      {editing && <EditAgentDialog agent={editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function AgentCard({ agent, onView, onEdit }: { agent: Agent; onView: () => void; onEdit: () => void }) {
  const delFn = useServerFn(deleteAgent);
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: () => delFn({ data: { id: agent.id } }),
    onSuccess: () => {
      toast.success("Agent removed");
      qc.invalidateQueries({ queryKey: ["agents"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to remove agent"),
  });

  const initials = (agent.full_name || agent.email || "A")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="group rounded-2xl border border-border bg-white p-5 text-center shadow-sm transition hover:border-primary/40 hover:shadow-md">
      <button
        type="button"
        onClick={onView}
        className="block w-full cursor-pointer text-center focus:outline-none"
        aria-label={`View ${agent.full_name || "agent"}`}
      >
        <div className="mx-auto h-20 w-20 overflow-hidden rounded-full bg-primary/10">
          {agent.avatar_url ? (
            <img src={agent.avatar_url} alt={agent.full_name ?? ""} className="h-full w-full object-cover" />
          ) : (
            <div className="grid h-full w-full place-items-center font-semibold text-primary">{initials}</div>
          )}
        </div>
        <p className="mt-3 font-display text-base font-semibold group-hover:text-primary">{agent.full_name || "Unnamed agent"}</p>
        {agent.username && <p className="text-xs text-muted-foreground">@{agent.username}</p>}
      </button>

      <div className="mt-3 space-y-1.5 text-left text-xs text-muted-foreground">
        {agent.email && (
          <p className="flex items-center gap-1.5 truncate"><Mail className="h-3 w-3 shrink-0" /> {agent.email}</p>
        )}
        {agent.phone && (
          <p className="flex items-center gap-1.5"><Phone className="h-3 w-3 shrink-0" /> {agent.phone}</p>
        )}
      </div>

      <div className="mt-4 flex gap-2 border-t border-border pt-3">
        <button
          onClick={onView}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted"
        >
          <Eye className="h-3 w-3" /> View
        </button>
        <button
          onClick={onEdit}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted"
        >
          <Pencil className="h-3 w-3" /> Edit
        </button>
        <button
          disabled={mut.isPending}
          onClick={() => {
            if (confirm(`Remove agent "${agent.full_name || agent.email}"? This cannot be undone.`)) mut.mutate();
          }}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-100 disabled:opacity-60"
          aria-label="Remove agent"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function ViewAgentDialog({ agent, onClose, onEdit }: { agent: Agent; onClose: () => void; onEdit: () => void }) {
  const initials = (agent.full_name || agent.email || "A")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className="relative bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-6 text-center">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/80 text-muted-foreground hover:bg-white hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="mx-auto h-24 w-24 overflow-hidden rounded-full border-4 border-white bg-primary/10 shadow">
            {agent.avatar_url ? (
              <img src={agent.avatar_url} alt={agent.full_name ?? ""} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-xl font-semibold text-primary">{initials}</div>
            )}
          </div>
          <h3 className="mt-3 font-display text-lg font-semibold">{agent.full_name || "Unnamed agent"}</h3>
          {agent.username && <p className="text-xs text-muted-foreground">@{agent.username}</p>}
          <span className="mt-2 inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary">Agent</span>
        </div>

        <div className="space-y-3 px-6 py-5 text-sm">
          <Detail icon={<Mail className="h-4 w-4" />} label="Email" value={agent.email} />
          <Detail icon={<Phone className="h-4 w-4" />} label="Phone" value={agent.phone} />
          <Detail icon={<AtSign className="h-4 w-4" />} label="Username" value={agent.username} />
          <Detail icon={<UserCircle2 className="h-4 w-4" />} label="Agent ID" value={agent.id} mono />
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-border bg-muted/30 p-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
        </div>
      </div>
    </div>
  );
}

function Detail({ icon, label, value, mono }: { icon: React.ReactNode; label: string; value: string | null; mono?: boolean }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className={`mt-0.5 break-words text-sm ${mono ? "font-mono text-xs" : ""}`}>
          {value || <span className="text-muted-foreground">—</span>}
        </p>
      </div>
    </div>
  );
}



function EditAgentDialog({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  const updateFn = useServerFn(updateAgent);
  const qc = useQueryClient();
  const [form, setForm] = useState({
    full_name: agent.full_name ?? "",
    phone: agent.phone ?? "",
    username: agent.username ?? "",
    avatar_url: agent.avatar_url ?? "",
  });

  const mut = useMutation({
    mutationFn: () => updateFn({ data: { id: agent.id, ...form } }),
    onSuccess: () => {
      toast.success("Agent updated");
      qc.invalidateQueries({ queryKey: ["agents"] });
      onClose();
    },
    onError: (e: any) => toast.error(e.message || "Failed to update agent"),
  });

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => { e.preventDefault(); mut.mutate(); }}
        className="w-full max-w-3xl space-y-5 rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">Edit Agent</h3>
          <button type="button" onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">Close</button>
        </div>

        <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
          <AvatarUploader value={form.avatar_url} onChange={(v) => setForm((f) => ({ ...f, avatar_url: v }))} />

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="block text-sm font-medium">Full name *</span>
              <input required value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} className={fieldCls} maxLength={100} />
            </label>
            <label className="space-y-1.5">
              <span className="block text-sm font-medium">Phone</span>
              <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className={fieldCls} maxLength={40} />
            </label>
            <label className="space-y-1.5 sm:col-span-2">
              <span className="block text-sm font-medium">Username</span>
              <input value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} className={fieldCls} maxLength={30} />
            </label>
            <label className="space-y-1.5 sm:col-span-2">
              <span className="block text-sm font-medium">Email (read only)</span>
              <input value={agent.email ?? ""} disabled className={fieldCls + " bg-muted/40"} />
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm">Cancel</button>
          <button type="submit" disabled={mut.isPending} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">
            {mut.isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

const fieldCls = "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";
