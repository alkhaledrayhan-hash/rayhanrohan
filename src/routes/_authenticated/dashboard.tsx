import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MessagesPanel } from "@/components/admin/MessagesPanel";
import { MyBookingsPanel } from "@/components/dashboard/MyBookingsPanel";
import {
  listMyEmailChangeRequests,
  requestEmailChange,
} from "@/lib/email-change.functions";
import {
  ArrowRight,
  Building2,
  CalendarCheck,
  Heart,
  Home,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Mail,
  MailQuestion,
  Settings,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  User,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · Ayesha Maison Qatar" }] }),
  component: Dashboard,
});

type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
};

function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });
}

function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId!)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  });
}

function useRoles(userId: string | undefined) {
  return useQuery({
    queryKey: ["roles", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId!);
      if (error) throw error;
      const roles = (data ?? []).map((r) => r.role);
      return {
        isAdmin: roles.includes("admin"),
        isAgent: roles.includes("agent"),
      };
    },
  });
}

function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const { data: profile } = useProfile(user?.id);
  const { data: roles } = useRoles(user?.id);
  const isAdmin = !!roles?.isAdmin;
  const isAgent = !!roles?.isAgent;
  const canAccessAdmin = isAdmin || isAgent;
  const [active, setActive] = useState<
    "overview" | "profile" | "saved" | "bookings" | "messages" | "admin"
  >("overview");

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  }

  const initials = (profile?.full_name || user?.email || "U")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-background md:flex">
        <Link to="/" className="flex items-center gap-2 border-b border-border px-6 py-5">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
            <Home className="h-4 w-4" />
          </span>
          <span className="font-display text-base font-semibold">
            Ayesha Maison <span className="text-gold">Qatar</span>
          </span>
        </Link>

        <nav className="flex-1 space-y-1 p-3">
          <SideItem icon={LayoutDashboard} label="Overview" active={active === "overview"} onClick={() => setActive("overview")} />
          <SideItem icon={User} label="My Profile" active={active === "profile"} onClick={() => setActive("profile")} />
          <SideItem icon={Heart} label="Saved Properties" active={active === "saved"} onClick={() => setActive("saved")} />
          <SideItem icon={Mail} label="Messages" active={active === "messages"} onClick={() => setActive("messages")} />
          {canAccessAdmin && (
            <Link
              to="/admin"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <ShieldCheck className="h-4 w-4" /> {isAdmin ? "Admin Panel" : "Agent Panel"}
            </Link>
          )}
        </nav>

        <div className="border-t border-border p-3">
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-background px-4 py-3 sm:flex sm:px-6 sm:py-4">
          <div className="min-w-0">
            <h1 className="truncate font-display text-base font-semibold text-foreground sm:text-xl">
              Welcome back, {profile?.full_name?.split(" ")[0] || "there"}
            </h1>
            <p className="hidden text-xs text-muted-foreground sm:block">Your Ayesha Maison Qatar account</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <Link
              to="/"
              aria-label="Home"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-background px-2.5 text-xs font-medium text-muted-foreground transition hover:text-foreground sm:px-3"
            >
              <Home className="h-4 w-4" /> <span className="hidden sm:inline">Home</span>
            </Link>
            {canAccessAdmin && (
              <Link
                to="/admin"
                aria-label={isAdmin ? "Admin panel" : "Agent panel"}
                title={isAdmin ? "Go to admin panel" : "Go to agent panel"}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-background px-2.5 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground sm:px-3"
              >
                <ShieldCheck className="h-4 w-4" /> <span className="hidden sm:inline">{isAdmin ? "Admin Panel" : "Agent Panel"}</span>
              </Link>
            )}
            {(isAdmin || isAgent) && (
              <span className="hidden rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-primary sm:inline">
                {isAdmin ? "Admin" : "Agent"}
              </span>
            )}
            <div className="grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground sm:h-10 sm:w-10">
              {initials}
            </div>
          </div>
        </header>

        <div className="p-6">
          {active === "overview" && <Overview user={user} profile={profile} isAdmin={!!isAdmin} />}
          {active === "profile" && <ProfileSection userId={user?.id} profile={profile} />}
          {active === "saved" && <PlaceholderPanel icon={Heart} title="Saved Properties" desc="Properties you save will appear here." />}
          {active === "messages" && <MessagesPanel isAdmin={!!isAdmin} />}
          {active === "admin" && isAdmin && <AdminPanel />}
        </div>
      </main>
    </div>
  );
}

function SideItem({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof LayoutDashboard;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}

function Overview({
  user,
  profile,
  isAdmin,
}: {
  user: { email?: string | null } | null | undefined;
  profile: Profile | null | undefined;
  isAdmin: boolean;
}) {
  const firstName = profile?.full_name?.split(" ")[0] || "there";
  const initials = (profile?.full_name || user?.email || "U")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const activity = useMemo(
    () => [
      { d: "Mon", v: 4 },
      { d: "Tue", v: 9 },
      { d: "Wed", v: 6 },
      { d: "Thu", v: 14 },
      { d: "Fri", v: 11 },
      { d: "Sat", v: 18 },
      { d: "Sun", v: 13 },
    ],
    [],
  );
  const prefs = [
    { name: "Apartments", value: 42, color: "#6366f1" },
    { name: "Villas", value: 28, color: "#f59e0b" },
    { name: "Penthouses", value: 18, color: "#ef4444" },
    { name: "Studios", value: 12, color: "#10b981" },
  ];

  return (
    <div className="space-y-5">
      {/* Profile hero */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-[#4a0f1d] p-6 text-white shadow-sm lg:col-span-2">
          <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-gold/30 blur-2xl" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-white/15 text-2xl font-semibold backdrop-blur">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="h-full w-full rounded-2xl object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] backdrop-blur">
                <Sparkles className="h-3 w-3" /> {isAdmin ? "Admin" : "Member"}
              </p>
              <h2 className="mt-2 truncate font-display text-2xl font-semibold">
                Welcome back, {firstName}
              </h2>
              <p className="mt-1 text-sm text-white/80">
                Track your saved homes, enquiries and viewings — all in one place.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to="/properties"
                  search={{ status: "rent" }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-primary transition hover:bg-white/90"
                >
                  Browse rentals <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  to="/offers"
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-semibold backdrop-blur transition hover:bg-white/20"
                >
                  See offers
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Account snapshot */}
        <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
          <h3 className="font-display text-sm font-semibold text-muted-foreground">
            Account
          </h3>
          <dl className="mt-3 space-y-2.5 text-sm">
            <Row label="Email" value={profile?.email || user?.email || "—"} />
            <Row label="Phone" value={profile?.phone || "—"} />
            <Row label="Role" value={isAdmin ? "Admin" : "User"} />
          </dl>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <KpiCard label="Saved Properties" value="0" delta="+0%" icon={Heart} color="#ef4444" />
        <KpiCard label="Active Enquiries" value="0" delta="+0%" icon={Mail} color="#6366f1" />
        <KpiCard label="Upcoming Viewings" value="0" delta="+0%" icon={CalendarCheck} color="#f59e0b" />
      </div>

      {/* Activity + preferences */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-background p-5 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Browse activity</p>
              <p className="mt-1 font-display text-2xl font-semibold">
                75 <span className="ml-1 text-xs font-semibold text-emerald-600">+3.48%</span>
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
              This week
            </span>
          </div>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activity}>
                <defs>
                  <linearGradient id="user-activity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  fill="url(#user-activity)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
          <h3 className="font-display text-base font-semibold">Your preferences</h3>
          <p className="text-xs text-muted-foreground">Most browsed property types</p>
          <div className="mt-2 grid grid-cols-2 items-center">
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={prefs} dataKey="value" innerRadius={40} outerRadius={64} paddingAngle={3}>
                  {prefs.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <ul className="space-y-1.5 text-xs">
              {prefs.map((d) => (
                <li key={d.name} className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: d.color }} />
                    {d.name}
                  </span>
                  <span className="font-semibold text-foreground">{d.value}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="rounded-2xl border border-border bg-background p-6 shadow-sm">
        <h2 className="font-display text-base font-semibold">Quick actions</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/properties" search={{ status: "rent" }}>Browse Rentals</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/properties" search={{ status: "sale" }}>Browse Sales</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/agents">Meet agents</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/contact">Contact us</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  delta,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  delta: string;
  icon: typeof Heart;
  color: string;
}) {
  const spark = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        x: i,
        y: Math.sin(i / 1.5) * 8 + 18 + Math.random() * 6,
      })),
    [],
  );
  return (
    <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span
          className="grid h-9 w-9 place-items-center rounded-xl"
          style={{ background: `${color}1a`, color }}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <p className="font-display text-3xl font-semibold">{value}</p>
          <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
            <TrendingUp className="h-3 w-3" /> {delta}
          </span>
        </div>
        <div className="h-10 w-20">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={spark}>
              <Area
                type="monotone"
                dataKey="y"
                stroke={color}
                strokeWidth={2}
                fill={color}
                fillOpacity={0.15}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="truncate text-right font-medium text-foreground">{value}</dd>
    </div>
  );
}


function ProfileSection({
  userId,
  profile,
}: {
  userId: string | undefined;
  profile: Profile | null | undefined;
}) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setPhone(profile?.phone ?? "");
    setUsername((profile as any)?.username ?? "");
    setAvatarUrl(profile?.avatar_url ?? "");
  }, [profile?.full_name, profile?.phone, profile?.avatar_url, (profile as any)?.username]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    if (fullName.trim().length === 0 || fullName.length > 100)
      return toast.error("Please enter a valid name (1–100 chars).");
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
      .eq("id", userId);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    queryClient.invalidateQueries({ queryKey: ["profile", userId] });
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Profile details */}
      <div className="rounded-xl border border-border bg-background p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <Settings className="h-4 w-4" /> Profile settings
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Update your personal information. To change your email, submit a request below — an admin
          must approve it.
        </p>
        <form onSubmit={handleSave} className="mt-6 grid gap-4 sm:grid-cols-2">
          <Field label="Full name *">
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={100}
              className={fieldCls}
            />
          </Field>
          <Field label="Phone">
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={30}
              className={fieldCls}
            />
          </Field>
          <Field label="Username *">
            <input
              required
              pattern="^[a-zA-Z0-9_]{3,30}$"
              title="3–30 chars, letters/numbers/_"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={30}
              placeholder="3–30 chars, letters/numbers/_"
              className={fieldCls}
            />
          </Field>
          <Field label="Avatar URL">
            <input
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              maxLength={500}
              placeholder="https://…"
              className={fieldCls}
            />
          </Field>
          <Field label="Email (admin approval required to change)" className="sm:col-span-2">
            <input value={profile?.email ?? ""} disabled className={fieldCls + " bg-muted/40"} />
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </div>

      <PasswordChangeCard />
      <EmailChangeCard currentEmail={profile?.email ?? ""} />
    </div>
  );
}

function PasswordChangeCard() {
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
    setPw("");
    setConfirm("");
  }

  return (
    <div className="rounded-xl border border-border bg-background p-6">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
        <KeyRound className="h-4 w-4" /> Change password
      </h2>
      <form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2">
        <Field label="New password (min 8 chars)">
          <input
            required
            type="password"
            minLength={8}
            maxLength={72}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className={fieldCls}
          />
        </Field>
        <Field label="Confirm new password">
          <input
            required
            type="password"
            minLength={8}
            maxLength={72}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={fieldCls}
          />
        </Field>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={busy}>
            {busy ? "Updating…" : "Update password"}
          </Button>
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
      setNewEmail("");
      setReason("");
      qc.invalidateQueries({ queryKey: ["my-email-change-requests"] });
    },
    onError: (e: any) => toast.error(e.message || "Failed to submit request"),
  });

  const requests = (data?.requests ?? []) as any[];
  const pending = requests.find((r) => r.status === "pending");

  return (
    <div className="rounded-xl border border-border bg-background p-6">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
        <MailQuestion className="h-4 w-4" /> Request email change
      </h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Email changes require admin approval for security. Submit a request and an admin will
        review it.
      </p>

      {pending ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          ⏳ Pending request for <strong>{pending.new_email}</strong> — waiting for admin approval.
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail.trim()))
              return toast.error("Please enter a valid email.");
            mut.mutate();
          }}
          className="mt-6 grid gap-4 sm:grid-cols-2"
        >
          <Field label="Current email">
            <input value={currentEmail} disabled className={fieldCls + " bg-muted/40"} />
          </Field>
          <Field label="New email *">
            <input
              required
              type="email"
              maxLength={255}
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className={fieldCls}
            />
          </Field>
          <Field label="Reason (optional)" className="sm:col-span-2">
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={500}
              rows={2}
              className={fieldCls}
              placeholder="Why do you want to change your email?"
            />
          </Field>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={mut.isPending}>
              {mut.isPending ? "Submitting…" : "Submit request"}
            </Button>
          </div>
        </form>
      )}

      {requests.length > 0 && (
        <div className="mt-6 border-t border-border pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Recent requests
          </p>
          <ul className="space-y-2 text-sm">
            {requests.slice(0, 5).map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
              >
                <div>
                  <p className="font-medium">{r.new_email}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(r.created_at).toLocaleString()}
                    {r.admin_note ? ` · Admin: ${r.admin_note}` : ""}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${
                    r.status === "approved"
                      ? "bg-emerald-50 text-emerald-700"
                      : r.status === "rejected"
                      ? "bg-rose-50 text-rose-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {r.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const fieldCls =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

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

function AdminPanel() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-6">
        <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
          <ShieldCheck className="h-5 w-5 text-primary" /> Admin Panel
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage properties, leads, bookings and content from here.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Properties", value: "—", icon: Building2 },
          { label: "Leads", value: "—", icon: Mail },
          { label: "Users", value: "—", icon: User },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-background p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <s.icon className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-3 font-display text-3xl font-semibold">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlaceholderPanel({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof Heart;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-background p-10 text-center">
      <Icon className="mx-auto h-10 w-10 text-muted-foreground" />
      <h3 className="mt-3 font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}
