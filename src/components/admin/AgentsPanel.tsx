import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Mail, Pencil, Phone, Trash2, UserCircle2 } from "lucide-react";
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

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-white p-10 text-center text-sm text-muted-foreground">
        Loading agents…
      </div>
    );
  }

  const agents = (data?.agents ?? []) as Agent[];

  if (!agents.length) {
    return (
      <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-white p-16 text-center">
        <UserCircle2 className="h-10 w-10 text-muted-foreground" />
        <p className="mt-3 font-display text-lg font-semibold">No agents yet</p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Use the “Add Agent” submenu to create your first agent account.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {agents.map((a) => (
          <AgentCard key={a.id} agent={a} onEdit={() => setEditing(a)} />
        ))}
      </div>
      {editing && <EditAgentDialog agent={editing} onClose={() => setEditing(null)} />}
    </>
  );
}

function AgentCard({ agent, onEdit }: { agent: Agent; onEdit: () => void }) {
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
    <div className="rounded-2xl border border-border bg-white p-5 text-center shadow-sm">
      <div className="mx-auto h-20 w-20 overflow-hidden rounded-full bg-primary/10">
        {agent.avatar_url ? (
          <img
            src={agent.avatar_url}
            alt={agent.full_name ?? ""}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="grid h-full w-full place-items-center font-semibold text-primary">
            {initials}
          </div>
        )}
      </div>
      <p className="mt-3 font-display text-base font-semibold">
        {agent.full_name || "Unnamed agent"}
      </p>
      {agent.username && <p className="text-xs text-muted-foreground">@{agent.username}</p>}

      <div className="mt-3 space-y-1.5 text-left text-xs text-muted-foreground">
        {agent.email && (
          <p className="flex items-center gap-1.5 truncate">
            <Mail className="h-3 w-3 shrink-0" /> {agent.email}
          </p>
        )}
        {agent.phone && (
          <p className="flex items-center gap-1.5">
            <Phone className="h-3 w-3 shrink-0" /> {agent.phone}
          </p>
        )}
      </div>

      <div className="mt-4 flex gap-2 border-t border-border pt-3">
        <button
          onClick={onEdit}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted"
        >
          <Pencil className="h-3 w-3" /> Edit
        </button>
        <button
          disabled={mut.isPending}
          onClick={() => {
            if (confirm(`Remove agent “${agent.full_name || agent.email}”? This cannot be undone.`))
              mut.mutate();
          }}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-100 disabled:opacity-60"
        >
          <Trash2 className="h-3 w-3" /> {mut.isPending ? "Removing…" : "Remove"}
        </button>
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
        onSubmit={(e) => {
          e.preventDefault();
          mut.mutate();
        }}
        className="w-full max-w-3xl space-y-5 rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">Edit Agent</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Close
          </button>
        </div>

        <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
          <AvatarUploader
            value={form.avatar_url}
            onChange={(v) => setForm((f) => ({ ...f, avatar_url: v }))}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="block text-sm font-medium">Full name *</span>
              <input
                required
                value={form.full_name}
                onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
                className={fieldCls}
                maxLength={100}
              />
            </label>
            <label className="space-y-1.5">
              <span className="block text-sm font-medium">Phone</span>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className={fieldCls}
                maxLength={40}
              />
            </label>
            <label className="space-y-1.5 sm:col-span-2">
              <span className="block text-sm font-medium">Username</span>
              <input
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                className={fieldCls}
                maxLength={30}
              />
            </label>
            <label className="space-y-1.5 sm:col-span-2">
              <span className="block text-sm font-medium">Email (read only)</span>
              <input value={agent.email ?? ""} disabled className={fieldCls + " bg-muted/40"} />
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mut.isPending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {mut.isPending ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

const fieldCls =
  "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";
