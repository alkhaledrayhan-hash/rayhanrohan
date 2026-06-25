import { useEffect, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { KeyRound, MailQuestion, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { listMyEmailChangeRequests, requestEmailChange } from "@/lib/email-change.functions";

export function AgentSettingsPanel() {
  const qc = useQueryClient();
  const { data: user } = useQuery({
    queryKey: ["auth", "user"],
    queryFn: async () => (await supabase.auth.getUser()).data.user,
  });
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, email, phone, username, avatar_url")
        .eq("id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setPhone(profile?.phone ?? "");
    setUsername((profile as any)?.username ?? "");
    setAvatarUrl(profile?.avatar_url ?? "");
  }, [profile?.full_name, profile?.phone, profile?.avatar_url, (profile as any)?.username]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!user?.id) return;
    if (!fullName.trim()) return toast.error("Please enter your name.");
    if (!/^[a-zA-Z0-9_]{3,30}$/.test(username.trim()))
      return toast.error("Username is required — 3–30 chars, letters/numbers/_ only.");
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim() || null,
        phone: phone.trim() || null,
        username: username.trim(),
        avatar_url: avatarUrl.trim() || null,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    qc.invalidateQueries({ queryKey: ["profile", user.id] });
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <Settings className="h-4 w-4" /> Profile settings
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Update your name, phone, username and avatar. Email changes require admin approval.
        </p>
        <form onSubmit={save} className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Full name *">
            <input required value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100} className={cls} />
          </Field>
          <Field label="Phone">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={30} className={cls} />
          </Field>
          <Field label="Username *">
            <input required pattern="^[a-zA-Z0-9_]{3,30}$" title="3–30 chars, letters/numbers/_" value={username} onChange={(e) => setUsername(e.target.value)} maxLength={30} placeholder="3–30 chars" className={cls} />
          </Field>
          <Field label="Avatar URL">
            <input value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} maxLength={500} placeholder="https://…" className={cls} />
          </Field>
          <Field label="Email (admin approval required to change)" className="sm:col-span-2">
            <input value={profile?.email ?? user?.email ?? ""} disabled className={cls + " bg-muted/40"} />
          </Field>
          <div className="sm:col-span-2">
            <button type="submit" disabled={saving} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>

      <PasswordCard />
      <EmailChangeCard currentEmail={profile?.email ?? user?.email ?? ""} />
    </div>
  );
}

function PasswordCard() {
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return toast.error("Password must be at least 8 characters.");
    if (pw !== confirm) return toast.error("Passwords do not match.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    setPw(""); setConfirm("");
  }
  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
        <KeyRound className="h-4 w-4" /> Change password
      </h2>
      <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="New password (min 8 chars)">
          <input required type="password" minLength={8} maxLength={72} value={pw} onChange={(e) => setPw(e.target.value)} className={cls} />
        </Field>
        <Field label="Confirm new password">
          <input required type="password" minLength={8} maxLength={72} value={confirm} onChange={(e) => setConfirm(e.target.value)} className={cls} />
        </Field>
        <div className="sm:col-span-2">
          <button type="submit" disabled={busy} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">
            {busy ? "Updating…" : "Update password"}
          </button>
        </div>
      </form>
    </div>
  );
}

function EmailChangeCard({ currentEmail }: { currentEmail: string }) {
  const qc = useQueryClient();
  const listFn = useServerFn(listMyEmailChangeRequests);
  const reqFn = useServerFn(requestEmailChange);
  const { data } = useQuery({
    queryKey: ["my-email-change-requests"],
    queryFn: () => listFn(),
  });
  const [newEmail, setNewEmail] = useState("");
  const [reason, setReason] = useState("");
  const mut = useMutation({
    mutationFn: () => reqFn({ data: { new_email: newEmail.trim(), reason: reason.trim() } }),
    onSuccess: () => {
      toast.success("Email change request submitted to admin");
      setNewEmail(""); setReason("");
      qc.invalidateQueries({ queryKey: ["my-email-change-requests"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to submit request"),
  });
  const requests = (data?.requests ?? []) as any[];
  const pending = requests.find((r) => r.status === "pending");

  return (
    <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
        <MailQuestion className="h-4 w-4" /> Request email change
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">Email changes need admin approval.</p>
      {pending ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          ⏳ Pending request for <strong>{pending.new_email}</strong> — waiting for admin approval.
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim())) return toast.error("Please enter a valid email.");
            mut.mutate();
          }}
          className="mt-6 grid gap-4 sm:grid-cols-2"
        >
          <Field label="Current email">
            <input value={currentEmail} disabled className={cls + " bg-muted/40"} />
          </Field>
          <Field label="New email *">
            <input required type="email" maxLength={255} value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className={cls} />
          </Field>
          <Field label="Reason (optional)" className="sm:col-span-2">
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} rows={2} className={cls} />
          </Field>
          <div className="sm:col-span-2">
            <button type="submit" disabled={mut.isPending} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60">
              {mut.isPending ? "Submitting…" : "Submit request"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

const cls = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";
function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`space-y-1.5 ${className}`}>
      <span className="block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
