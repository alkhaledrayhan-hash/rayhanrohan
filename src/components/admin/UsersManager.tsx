import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Eye, KeyRound, Pencil, Plus, Search, ShieldCheck, Trash2, UserCircle2 } from "lucide-react";
import {
  createUser,
  deleteUser,
  listUsers,
  setUserPassword,
  updateUser,
} from "@/lib/users.functions";

type Role = "admin" | "agent" | "user";

type Row = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
  role: Role;
  roles: Role[];
};

const fieldCls =
  "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

const roleBadge: Record<Role, string> = {
  admin: "bg-rose-50 text-rose-700 border-rose-200",
  agent: "bg-amber-50 text-amber-700 border-amber-200",
  user: "bg-slate-100 text-slate-700 border-slate-200",
};

export function UsersManager() {
  const listFn = useServerFn(listUsers);
  const { data, isLoading } = useQuery({ queryKey: ["all-users"], queryFn: () => listFn() });

  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");
  const [editing, setEditing] = useState<Row | null>(null);
  const [viewing, setViewing] = useState<Row | null>(null);
  const [creating, setCreating] = useState(false);
  const [resetting, setResetting] = useState<Row | null>(null);


  const rows = (data?.users ?? []) as Row[];
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (roleFilter !== "all" && r.role !== roleFilter) return false;
      if (!needle) return true;
      return (
        (r.full_name ?? "").toLowerCase().includes(needle) ||
        (r.email ?? "").toLowerCase().includes(needle) ||
        (r.username ?? "").toLowerCase().includes(needle)
      );
    });
  }, [rows, q, roleFilter]);

  const counts = useMemo(() => {
    return {
      total: rows.length,
      admin: rows.filter((r) => r.role === "admin").length,
      agent: rows.filter((r) => r.role === "agent").length,
      user: rows.filter((r) => r.role === "user").length,
    };
  }, [rows]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total users" value={counts.total} />
        <StatCard label="Admins" value={counts.admin} tone="rose" />
        <StatCard label="Agents" value={counts.agent} tone="amber" />
        <StatCard label="Customers" value={counts.user} tone="slate" />
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-white p-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, email, username…"
            className="w-full rounded-full border border-input bg-muted/40 py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as any)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="all">All roles</option>
          <option value="admin">Admins</option>
          <option value="agent">Agents</option>
          <option value="user">Customers</option>
        </select>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
        >
          <Plus className="h-4 w-4" /> Add user
        </button>
      </div>

      <div className="responsive-table-wrap overflow-x-auto rounded-2xl border border-border bg-white">
        <table className="responsive-table w-full min-w-[720px] text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  Loading users…
                </td>
              </tr>
            )}
            {!isLoading && !filtered.length && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  <UserCircle2 className="mx-auto mb-2 h-8 w-8" /> No users match your filters.
                </td>
              </tr>
            )}
            {filtered.map((u) => {
              const initials = (u.full_name || u.email || "U")
                .split(" ")
                .map((s) => s[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();
              return (
                <tr
                  key={u.id}
                  onClick={() => setViewing(u)}
                  className="cursor-pointer border-t border-border transition hover:bg-muted/40"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center overflow-hidden rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          initials
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{u.full_name || "—"}</p>
                        {u.username && (
                          <p className="text-xs text-muted-foreground">@{u.username}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.phone || "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${roleBadge[u.role]}`}
                    >
                      {u.role === "admin" && <ShieldCheck className="h-3 w-3" />}
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-end gap-1.5">
                      <button
                        onClick={() => setViewing(u)}
                        title="View"
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-muted"
                      >
                        <Eye className="h-3 w-3" /> View
                      </button>
                      <button
                        onClick={() => setResetting(u)}
                        title="Set new password"
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-muted"
                      >
                        <KeyRound className="h-3 w-3" /> Password
                      </button>
                      <button
                        onClick={() => setEditing(u)}
                        title="Edit"
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-muted"
                      >
                        <Pencil className="h-3 w-3" /> Edit
                      </button>
                      <DeleteButton user={u} />
                    </div>
                  </td>
                </tr>

              );
            })}
          </tbody>
        </table>
      </div>

      {creating && <CreateDialog onClose={() => setCreating(false)} />}
      {editing && <EditDialog user={editing} onClose={() => setEditing(null)} />}
      {viewing && (
        <ViewDialog
          user={viewing}
          onClose={() => setViewing(null)}
          onEdit={() => { setEditing(viewing); setViewing(null); }}
          onPassword={() => { setResetting(viewing); setViewing(null); }}
        />
      )}
      {resetting && <PasswordDialog user={resetting} onClose={() => setResetting(null)} />}
    </div>
  );
}


function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "rose" | "amber" | "slate";
}) {
  const toneCls =
    tone === "rose"
      ? "text-rose-600"
      : tone === "amber"
      ? "text-amber-600"
      : tone === "slate"
      ? "text-slate-600"
      : "text-primary";
  return (
    <div className="rounded-2xl border border-border bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={`mt-1 font-display text-2xl font-semibold ${toneCls}`}>{value}</p>
    </div>
  );
}

function DeleteButton({ user }: { user: Row }) {
  const delFn = useServerFn(deleteUser);
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: () => delFn({ data: { id: user.id } }),
    onSuccess: () => {
      toast.success("User removed");
      qc.invalidateQueries({ queryKey: ["all-users"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to remove user"),
  });
  return (
    <button
      disabled={mut.isPending}
      onClick={() => {
        if (confirm(`Delete ${user.full_name || user.email}? This cannot be undone.`)) mut.mutate();
      }}
      className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-600 hover:bg-rose-100 disabled:opacity-60"
    >
      <Trash2 className="h-3 w-3" /> {mut.isPending ? "…" : "Delete"}
    </button>
  );
}

function CreateDialog({ onClose }: { onClose: () => void }) {
  const createFn = useServerFn(createUser);
  const qc = useQueryClient();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    phone: "",
    username: "",
    role: "user" as Role,
  });
  const mut = useMutation({
    mutationFn: () => createFn({ data: form }),
    onSuccess: () => {
      toast.success("User created");
      qc.invalidateQueries({ queryKey: ["all-users"] });
      onClose();
    },
    onError: (e: any) => toast.error(e.message || "Failed to create user"),
  });
  return (
    <Modal title="Add new user" onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mut.mutate();
        }}
        className="grid gap-4 sm:grid-cols-2"
      >
        <Field label="Full name *">
          <input
            required
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            className={fieldCls}
          />
        </Field>
        <Field label="Email *">
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={fieldCls}
          />
        </Field>
        <Field label="Password *">
          <input
            required
            type="text"
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className={fieldCls}
          />
        </Field>
        <Field label="Role *">
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
            className={fieldCls}
          >
            <option value="user">Customer</option>
            <option value="agent">Agent</option>
            <option value="admin">Admin</option>
          </select>
        </Field>
        <Field label="Phone">
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className={fieldCls}
          />
        </Field>
        <Field label="Username *">
          <input
            required
            pattern="^[a-zA-Z0-9_]{3,30}$"
            title="3–30 chars, letters/numbers/_"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder="unique handle"
            className={fieldCls}
          />
        </Field>
        <div className="sm:col-span-2 flex justify-end gap-2 border-t border-border pt-4">
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
            {mut.isPending ? "Creating…" : "Create user"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EditDialog({ user, onClose }: { user: Row; onClose: () => void }) {
  const updateFn = useServerFn(updateUser);
  const qc = useQueryClient();
  const [form, setForm] = useState({
    full_name: user.full_name ?? "",
    phone: user.phone ?? "",
    username: user.username ?? "",
    role: user.role,
  });
  const mut = useMutation({
    mutationFn: () => updateFn({ data: { id: user.id, ...form } }),
    onSuccess: () => {
      toast.success("User updated");
      qc.invalidateQueries({ queryKey: ["all-users"] });
      onClose();
    },
    onError: (e: any) => toast.error(e.message || "Failed to update user"),
  });
  return (
    <Modal title={`Edit ${user.full_name || user.email}`} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mut.mutate();
        }}
        className="grid gap-4 sm:grid-cols-2"
      >
        <Field label="Full name *">
          <input
            required
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            className={fieldCls}
          />
        </Field>
        <Field label="Role *">
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
            className={fieldCls}
          >
            <option value="user">Customer</option>
            <option value="agent">Agent</option>
            <option value="admin">Admin</option>
          </select>
        </Field>
        <Field label="Phone">
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className={fieldCls}
          />
        </Field>
        <Field label="Username *">
          <input
            required
            pattern="^[a-zA-Z0-9_]{3,30}$"
            title="3–30 chars, letters/numbers/_"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className={fieldCls}
          />
        </Field>
        <Field label="Email (read only)" className="sm:col-span-2">
          <input value={user.email ?? ""} disabled className={fieldCls + " bg-muted/40"} />
        </Field>
        <div className="sm:col-span-2 flex justify-end gap-2 border-t border-border pt-4">
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
    </Modal>
  );
}

function PasswordDialog({ user, onClose }: { user: Row; onClose: () => void }) {
  const fn = useServerFn(setUserPassword);
  const [pw, setPw] = useState("");
  const mut = useMutation({
    mutationFn: () => fn({ data: { id: user.id, password: pw } }),
    onSuccess: () => {
      toast.success("Password updated");
      onClose();
    },
    onError: (e: any) => toast.error(e.message || "Failed to update password"),
  });
  return (
    <Modal title={`Set new password for ${user.full_name || user.email}`} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mut.mutate();
        }}
        className="space-y-4"
      >
        <Field label="New password (min 8 chars)">
          <input
            required
            type="text"
            minLength={8}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className={fieldCls}
            placeholder="Enter a strong password"
          />
        </Field>
        <p className="text-xs text-muted-foreground">
          The user will be able to sign in immediately with this new password.
        </p>
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
            {mut.isPending ? "Saving…" : "Update password"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ViewDialog({
  user,
  onClose,
  onEdit,
  onPassword,
}: {
  user: Row;
  onClose: () => void;
  onEdit: () => void;
  onPassword: () => void;
}) {
  const initials = (user.full_name || user.email || "U")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const created = new Date(user.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  return (
    <Modal title="User profile" onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-center gap-4 rounded-xl border border-border bg-muted/30 p-4">
          <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-primary/10 text-base font-semibold text-primary">
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-lg font-semibold">
              {user.full_name || "—"}
            </p>
            {user.username && (
              <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
            )}
            <span
              className={`mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium capitalize ${roleBadge[user.role]}`}
            >
              {user.role === "admin" && <ShieldCheck className="h-3 w-3" />}
              {user.role}
            </span>
          </div>
        </div>
        <dl className="grid gap-3 sm:grid-cols-2">
          <InfoRow label="Email" value={user.email} />
          <InfoRow label="Phone" value={user.phone} />
          <InfoRow label="Username" value={user.username} />
          <InfoRow label="Joined" value={created} />
          <InfoRow label="All roles" value={user.roles.join(", ") || user.role} />
          <InfoRow label="User ID" value={user.id} mono />
        </dl>
        <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onPassword}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted"
          >
            <KeyRound className="h-3.5 w-3.5" /> Set password
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
        </div>
      </div>
    </Modal>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string | null; mono?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-white p-3">
      <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className={`mt-0.5 break-words text-sm ${mono ? "font-mono text-xs" : ""}`}>
        {value || "—"}
      </dd>
    </div>
  );
}


function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl space-y-4 rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`space-y-1.5 ${className}`}>
      <span className="block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
