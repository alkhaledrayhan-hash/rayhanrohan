import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { MessagesPanel } from "@/components/admin/MessagesPanel";
import {
  Building2,
  Heart,
  Home,
  LayoutDashboard,
  LogOut,
  Mail,
  Settings,
  ShieldCheck,
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

function useIsAdmin(userId: string | undefined) {
  return useQuery({
    queryKey: ["roles", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId!);
      if (error) throw error;
      return (data ?? []).some((r) => r.role === "admin");
    },
  });
}

function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: user } = useCurrentUser();
  const { data: profile } = useProfile(user?.id);
  const { data: isAdmin } = useIsAdmin(user?.id);
  const [active, setActive] = useState<"overview" | "profile" | "saved" | "messages" | "admin">(
    "overview",
  );

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
          {isAdmin && (
            <Link
              to="/admin"
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <ShieldCheck className="h-4 w-4" /> Admin Panel
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
        <header className="flex items-center justify-between border-b border-border bg-background px-6 py-4">
          <div>
            <h1 className="font-display text-xl font-semibold text-foreground">
              Welcome back, {profile?.full_name?.split(" ")[0] || "there"}
            </h1>
            <p className="text-xs text-muted-foreground">Your Ayesha Maison Qatar account</p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-xs font-medium text-muted-foreground transition hover:text-foreground"
            >
              <Home className="h-4 w-4" /> <span className="hidden sm:inline">Home</span>
            </Link>
            {isAdmin && (
              <Link
                to="/admin"
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-background px-3 text-xs font-medium text-muted-foreground transition hover:text-foreground"
              >
                <ShieldCheck className="h-4 w-4" /> <span className="hidden sm:inline">Admin</span>
              </Link>
            )}
            {isAdmin && (
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-primary">
                Admin
              </span>
            )}
            <div className="grid h-10 w-10 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
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
  const stats = [
    { label: "Saved Properties", value: 0, icon: Heart },
    { label: "Active Enquiries", value: 0, icon: Mail },
    { label: "Viewings", value: 0, icon: Building2 },
  ];
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-background p-5">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
              <s.icon className="h-4 w-4 text-primary" />
            </div>
            <p className="mt-3 font-display text-3xl font-semibold">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-background p-6">
        <h2 className="font-display text-lg font-semibold">Account</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <Row label="Name" value={profile?.full_name || "—"} />
          <Row label="Email" value={profile?.email || user?.email || "—"} />
          <Row label="Phone" value={profile?.phone || "—"} />
          <Row label="Role" value={isAdmin ? "Admin" : "User"} />
        </dl>
      </div>

      <div className="rounded-xl border border-border bg-background p-6">
        <h2 className="font-display text-lg font-semibold">Quick actions</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild variant="default">
            <Link to="/properties" search={{ status: "rent" }}>Browse Rentals</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/properties" search={{ status: "sale" }}>Browse Sales</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/contact">Contact agent</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium text-foreground">{value}</dd>
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

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setPhone(profile?.phone ?? "");
  }, [profile?.full_name, profile?.phone]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim() || null, phone: phone.trim() || null })
      .eq("id", userId);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    queryClient.invalidateQueries({ queryKey: ["profile", userId] });
  }

  return (
    <div className="max-w-2xl rounded-xl border border-border bg-background p-6">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
        <Settings className="h-4 w-4" /> Profile settings
      </h2>
      <form onSubmit={handleSave} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Full name</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            maxLength={100}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Phone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            maxLength={30}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Email</label>
          <input
            value={profile?.email ?? ""}
            disabled
            className="w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground"
          />
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </form>
    </div>
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
