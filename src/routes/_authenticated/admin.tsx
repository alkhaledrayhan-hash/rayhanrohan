import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PropertiesManager } from "@/components/admin/PropertiesManager";
import { PagesManager } from "@/components/admin/PagesManager";
import { AddAgentForm } from "@/components/admin/AddAgentForm";
import { AgentsPanel } from "@/components/admin/AgentsPanel";
import { LeadsPanel } from "@/components/admin/LeadsPanel";
import { SettingsPanel } from "@/components/admin/SettingsPanel";
import { MessagesPanel } from "@/components/admin/MessagesPanel";
import { MediaPanel } from "@/components/admin/MediaPanel";
import { PostsManager } from "@/components/admin/PostsManager";
import { BookingsPanel } from "@/components/admin/BookingsPanel";
import { CalendarPanel } from "@/components/admin/CalendarPanel";
import {
  Bell,
  Building2,
  Calendar,
  ChevronDown,
  ChevronRight,
  FileText,
  Home,
  LayoutDashboard,
  LogOut,
  Image,
  Mail,
  MessageSquare,
  Newspaper,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard · Ayesha Maison Qatar" }] }),
  component: AdminDashboard,
});

type Role = "admin" | "agent" | "user";

function useRoles() {
  return useQuery({
    queryKey: ["my-roles"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return { roles: [] as Role[], user: null };
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", u.user.id);
      return {
        roles: (data ?? []).map((r) => r.role as Role),
        user: u.user,
      };
    },
  });
}

function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, email, avatar_url")
        .eq("id", userId!)
        .maybeSingle();
      return data;
    },
  });
}

function AdminDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: roleData, isLoading } = useRoles();
  const { data: profile } = useProfile(roleData?.user?.id);
  const [section, setSection] = useState<
    "overview" | "properties" | "pages" | "agents" | "add-agent" | "leads" | "bookings" | "messages" | "media" | "posts" | "calendar" | "settings"
  >("overview");
  const [pageSlug, setPageSlug] = useState<string>("home");

  const isAdmin = roleData?.roles.includes("admin");
  const isAgent = roleData?.roles.includes("agent");
  const allowed = isAdmin || isAgent;

  useEffect(() => {
    if (!isLoading && !allowed) {
      toast.error("You don't have access to the admin area.");
      navigate({ to: "/dashboard" });
    }
  }, [isLoading, allowed, navigate]);

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (isLoading || !allowed) {
    return (
      <div className="grid min-h-screen place-items-center bg-muted/30 text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  const roleLabel = isAdmin ? "Admin" : "Agent";
  const initials = (profile?.full_name || roleData?.user?.email || "A")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-[#f5f7fa]">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-white md:flex">
        <Link to="/" className="flex items-center gap-2 border-b border-border px-6 py-5">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground">
            <Home className="h-4 w-4" />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="font-display text-sm font-semibold">
              Ayesha <span className="text-gold">Qatar</span>
            </span>
            <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
              {roleLabel} Panel
            </span>
          </div>
        </Link>

        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3 text-sm">
          <NavGroup label="Main" />
          <NavItem icon={LayoutDashboard} label="Dashboard" active={section === "overview"} onClick={() => setSection("overview")} />
          <NavItem icon={Building2} label="Properties" active={section === "properties"} onClick={() => setSection("properties")} />
          {isAdmin && (
            <NavGroupExpandable
              icon={FileText}
              label="Pages"
              active={section === "pages"}
              defaultOpen={section === "pages"}
            >
              {[
                { slug: "home", label: "Home" },
                { slug: "properties", label: "Properties" },
                { slug: "agents", label: "Our Agents" },
                { slug: "about", label: "About" },
                { slug: "news", label: "News" },
                { slug: "contact", label: "Contact" },
              ].map((p) => (
                <SubNavItem
                  key={p.slug}
                  label={p.label}
                  active={section === "pages" && pageSlug === p.slug}
                  onClick={() => { setSection("pages"); setPageSlug(p.slug); }}
                />
              ))}
            </NavGroupExpandable>
          )}
          {isAdmin && (
            <NavGroupExpandable
              icon={Users}
              label="Agents"
              active={section === "agents" || section === "add-agent"}
              defaultOpen={section === "agents" || section === "add-agent"}
              action={
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setSection("add-agent"); }}
                  title="Add Agent"
                  className="grid h-5 w-5 place-items-center rounded-md bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  <Plus className="h-3 w-3" />
                </button>
              }
            >
              <SubNavItem label="All Agents" active={section === "agents"} onClick={() => setSection("agents")} />
              <SubNavItem icon={UserPlus} label="Add Agent" active={section === "add-agent"} onClick={() => setSection("add-agent")} />
            </NavGroupExpandable>
          )}

          <NavGroup label="Operations" />
          <NavItem icon={Mail} label="Leads" active={section === "leads"} onClick={() => setSection("leads")} badge="12" />
          <NavItem icon={FileText} label="Bookings" active={section === "bookings"} onClick={() => setSection("bookings")} />
          <NavItem icon={MessageSquare} label="Messages" active={section === "messages"} onClick={() => setSection("messages")} />
          <NavItem icon={Calendar} label="Calendar" active={section === "calendar"} onClick={() => setSection("calendar")} />

          <NavGroup label="Content" />
          <NavItem icon={Image} label="Media" active={section === "media"} onClick={() => setSection("media")} />
          <NavItem icon={Newspaper} label="News & Blogs" active={section === "posts"} onClick={() => setSection("posts")} />




          <NavGroup label="System" />
          <NavItem icon={Settings} label="Settings" active={section === "settings"} onClick={() => setSection("settings")} />
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
      <div className="flex flex-1 flex-col">
        {/* Top bar */}
        <header className="flex items-center justify-between gap-4 border-b border-border bg-white px-6 py-3">
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search properties, agents, leads…"
              className="w-full rounded-full border border-input bg-muted/40 py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-white px-3 text-xs font-medium text-muted-foreground transition hover:text-foreground"
            >
              <Home className="h-4 w-4" /> <span className="hidden sm:inline">Home</span>
            </Link>
            <Link
              to="/dashboard"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-white px-3 text-xs font-medium text-muted-foreground transition hover:text-foreground"
            >
              <LayoutDashboard className="h-4 w-4" /> <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <button className="grid h-9 w-9 place-items-center rounded-full border border-border bg-white text-muted-foreground transition hover:text-foreground">
              <Bell className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2 rounded-full border border-border bg-white py-1 pl-1 pr-3">
              <div className="grid h-7 w-7 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {initials}
              </div>
              <div className="hidden flex-col leading-tight sm:flex">
                <span className="text-xs font-semibold">{profile?.full_name || "Account"}</span>
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {roleLabel}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 p-6">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-semibold">{sectionTitle(section)}</h1>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Home className="h-3 w-3" /> Home <ChevronRight className="h-3 w-3" />{" "}
                {sectionTitle(section)}
              </p>
            </div>
          </div>

          {section === "overview" && <Overview name={profile?.full_name?.split(" ")[0]} role={roleLabel} />}
          {section === "properties" && <PropertiesManager isAdmin={!!isAdmin} />}
          {section === "pages" && isAdmin && <PagesManager pageSlug={pageSlug} onPageChange={setPageSlug} />}
          {section === "agents" && isAdmin && <AgentsPanel />}
          {section === "add-agent" && isAdmin && <AddAgentForm />}
          {section === "leads" && <LeadsPanel isAdmin={!!isAdmin} />}
          {section === "bookings" && <BookingsPanel isAdmin={!!isAdmin} />}
          {section === "messages" && <MessagesPanel isAdmin={!!isAdmin} />}
          {section === "calendar" && <CalendarPanel />}
          {section === "media" && (isAdmin ? <MediaPanel /> : <PlaceholderCard icon={Image} title="Media" desc="Only admins can manage media." />)}
          {section === "posts" && (isAdmin ? <PostsManager /> : <PlaceholderCard icon={Newspaper} title="News & Blogs" desc="Only admins can manage articles." />)}
          {section === "settings" && (isAdmin ? <SettingsPanel /> : <PlaceholderCard icon={Settings} title="Settings" desc="Only admins can edit website settings." />)}
        </main>
      </div>
    </div>
  );
}

function sectionTitle(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function NavGroup({ label }: { label: string }) {
  return (
    <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/70">
      {label}
    </p>
  );
}

function NavItem({
  icon: Icon,
  label,
  active,
  onClick,
  badge,
}: {
  icon: typeof Home;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition ${
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <span className="flex items-center gap-3">
        <Icon className="h-4 w-4" /> {label}
      </span>
      {badge && (
        <span
          className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
            active ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
          }`}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

function NavGroupExpandable({
  icon: Icon,
  label,
  active,
  defaultOpen,
  action,
  children,
}: {
  icon: typeof Home;
  label: string;
  active: boolean;
  defaultOpen?: boolean;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  useEffect(() => { if (defaultOpen) setOpen(true); }, [defaultOpen]);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition ${
          active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
      >
        <span className="flex items-center gap-3">
          <Icon className="h-4 w-4" /> {label}
        </span>
        <span className="flex items-center gap-1.5">
          {action}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
      {open && <div className="mt-0.5 space-y-0.5 pl-7">{children}</div>}
    </div>
  );
}

function SubNavItem({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon?: typeof Home;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-sm transition ${
        active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {Icon ? <Icon className="h-3.5 w-3.5" /> : <span className="h-1.5 w-1.5 rounded-full bg-current opacity-40" />}
      {label}
    </button>
  );
}

/* ---------- Overview ---------- */

const salesData = [
  { m: "Jan", sales: 4200, exp: 1800 },
  { m: "Feb", sales: 6800, exp: 2400 },
  { m: "Mar", sales: 5200, exp: 2100 },
  { m: "Apr", sales: 8900, exp: 3200 },
  { m: "May", sales: 7400, exp: 2800 },
  { m: "Jun", sales: 9800, exp: 3400 },
  { m: "Jul", sales: 11200, exp: 3900 },
  { m: "Aug", sales: 10400, exp: 3600 },
  { m: "Sep", sales: 12100, exp: 4100 },
  { m: "Oct", sales: 11800, exp: 4000 },
  { m: "Nov", sales: 13500, exp: 4400 },
  { m: "Dec", sales: 15200, exp: 4800 },
];

const revenueData = [
  { m: "Jan", revenue: 38, expenses: 12, profit: 18 },
  { m: "Feb", revenue: 28, expenses: 18, profit: 16 },
  { m: "Mar", revenue: 30, expenses: 14, profit: 16 },
  { m: "Apr", revenue: 26, expenses: 36, profit: 22 },
  { m: "May", revenue: 12, expenses: 12, profit: 12 },
  { m: "Jun", revenue: 8, expenses: 38, profit: 18 },
  { m: "Jul", revenue: 22, expenses: 28, profit: 10 },
  { m: "Aug", revenue: 24, expenses: 30, profit: 12 },
  { m: "Sep", revenue: 28, expenses: 14, profit: 18 },
];

function Overview({ name, role }: { name: string | undefined; role: string }) {
  return (
    <div className="space-y-5">
      {/* Hero + stats */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-[#4a0f1d] p-7 text-white shadow-sm lg:col-span-1">
          <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-gold/30 blur-2xl" />
          <div className="relative">
            <p className="text-sm">👋 Hello, {name || role}</p>
            <h2 className="mt-2 font-display text-2xl font-semibold leading-tight">
              Track property performance, availability & leads at a glance.
            </h2>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <MiniStat label="Total Properties" value="1,245" delta="+8%" />
              <MiniStat label="Sold Properties" value="324" delta="+2.3%" />
            </div>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          <KPI label="Total Clients" value="1,175" delta="+8%" trend="up" color="#0d9488" />
          <KPI label="Total Leads" value="1,024" delta="+5%" trend="up" color="#ea580c" />
          <KPI label="Active Agents" value="42" delta="-5%" trend="down" color="#0ea5e9" />
          <KPI label="New This Week" value="86" delta="-2.1%" trend="down" color="#a855f7" />
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Property Sales" headline="$345,783" delta="+12.34%" trend="up">
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={salesData}>
              <defs>
                <linearGradient id="s1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="s2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ea580c" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#ea580c" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" vertical={false} />
              <XAxis dataKey="m" tickLine={false} axisLine={false} fontSize={11} />
              <YAxis tickLine={false} axisLine={false} fontSize={11} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#s1)" />
              <Area type="monotone" dataKey="exp" stroke="#ea580c" strokeWidth={2} fill="url(#s2)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Revenue Overview" headline="$236,423" delta="-10.34%" trend="down">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" vertical={false} />
              <XAxis dataKey="m" tickLine={false} axisLine={false} fontSize={11} />
              <YAxis tickLine={false} axisLine={false} fontSize={11} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
              <Bar dataKey="expenses" fill="#ea580c" radius={[3, 3, 0, 0]} />
              <Bar dataKey="profit" fill="#0f172a" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Bottom row */}
      <div className="grid gap-5 lg:grid-cols-3">
        <RecentLeads />
        <TopLocations />
      </div>
    </div>
  );
}

function MiniStat({ label, value, delta }: { label: string; value: string; delta: string }) {
  return (
    <div className="rounded-xl bg-white/10 p-3 backdrop-blur">
      <p className="text-[11px] uppercase tracking-wider text-white/70">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold">{value}</p>
      <span className="mt-1 inline-block rounded-full bg-gold/30 px-2 py-0.5 text-[10px] font-semibold text-gold">
        {delta}
      </span>
    </div>
  );
}

function KPI({
  label,
  value,
  delta,
  trend,
  color,
}: {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down";
  color: string;
}) {
  const Trend = trend === "up" ? TrendingUp : TrendingDown;
  const trendColor = trend === "up" ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50";
  const spark = useMemo(
    () => Array.from({ length: 12 }, (_, i) => ({ x: i, y: Math.sin(i / 2) * 10 + 20 + Math.random() * 8 })),
    [],
  );

  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${trendColor}`}>
          {delta}
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between gap-3">
        <div>
          <p className="font-display text-3xl font-semibold">{value}</p>
          <span className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Trend className="h-3 w-3" /> vs last week
          </span>
        </div>
        <div className="h-12 w-24">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={spark}>
              <Area type="monotone" dataKey="y" stroke={color} strokeWidth={2} fill={color} fillOpacity={0.15} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  headline,
  delta,
  trend,
  children,
}: {
  title: string;
  headline: string;
  delta: string;
  trend: "up" | "down";
  children: React.ReactNode;
}) {
  const trendColor = trend === "up" ? "text-emerald-600" : "text-rose-600";
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-1 font-display text-2xl font-semibold">
            {headline} <span className={`ml-1 text-xs font-semibold ${trendColor}`}>{delta}</span>
          </p>
        </div>
        <select className="rounded-md border border-input bg-white px-2 py-1 text-xs text-muted-foreground">
          <option>Today</option>
          <option>This week</option>
          <option>This month</option>
        </select>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function RecentLeads() {
  const leads = [
    { name: "Ethan Brown", property: "Lusail Marina Penthouse", status: "New", time: "2m" },
    { name: "Aisha Khan", property: "Pearl Qanat Quartier 2BR", status: "Contacted", time: "1h" },
    { name: "Omar Saeed", property: "West Bay Tower 3BR", status: "Viewing", time: "3h" },
    { name: "Sara Al-Mansoori", property: "Al Waab Villa", status: "Negotiating", time: "1d" },
    { name: "Mohammed N.", property: "Katara Hills Townhouse", status: "New", time: "1d" },
  ];
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm lg:col-span-2">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold">Recent Leads</h3>
        <button className="text-xs font-medium text-primary hover:underline">See all</button>
      </div>
      <div className="mt-4 divide-y divide-border">
        {leads.map((l) => (
          <div key={l.name} className="flex items-center justify-between py-3 text-sm">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {l.name
                  .split(" ")
                  .map((s) => s[0])
                  .join("")
                  .slice(0, 2)}
              </div>
              <div>
                <p className="font-medium text-foreground">{l.name}</p>
                <p className="text-xs text-muted-foreground">{l.property}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColor(l.status)}`}>
                {l.status}
              </span>
              <span className="text-xs text-muted-foreground">{l.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function statusColor(s: string) {
  switch (s) {
    case "New":
      return "bg-sky-50 text-sky-700";
    case "Contacted":
      return "bg-amber-50 text-amber-700";
    case "Viewing":
      return "bg-violet-50 text-violet-700";
    case "Negotiating":
      return "bg-orange-50 text-orange-700";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function TopLocations() {
  const data = [
    { name: "The Pearl", value: 38, color: "#7c1d2f" },
    { name: "Lusail", value: 28, color: "#c2410c" },
    { name: "West Bay", value: 18, color: "#0f766e" },
    { name: "Al Waab", value: 16, color: "#a16207" },
  ];
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
      <h3 className="font-display text-base font-semibold">Top Locations</h3>
      <div className="mt-2 grid grid-cols-2 items-center">
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie data={data} dataKey="value" innerRadius={45} outerRadius={70} paddingAngle={3}>
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <ul className="space-y-2 text-sm">
          {data.map((d) => (
            <li key={d.name} className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                {d.name}
              </span>
              <span className="font-semibold text-foreground">{d.value}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ---------- Properties Table ---------- */

function PropertiesTable() {
  const rows = [
    { id: "P-1042", title: "Marina Penthouse", loc: "Lusail", price: "QAR 18,500/mo", status: "Active", type: "Rent" },
    { id: "P-1041", title: "Qanat Quartier 2BR", loc: "The Pearl", price: "QAR 12,000/mo", status: "Reserved", type: "Rent" },
    { id: "P-1038", title: "West Bay Tower 3BR", loc: "West Bay", price: "QAR 4.6M", status: "Active", type: "Sale" },
    { id: "P-1037", title: "Al Waab Villa", loc: "Al Waab", price: "QAR 9.2M", status: "Sold", type: "Sale" },
    { id: "P-1035", title: "Katara Hills Townhouse", loc: "Katara Hills", price: "QAR 22,000/mo", status: "Active", type: "Rent" },
    { id: "P-1031", title: "Lagoon View Apartment", loc: "The Pearl", price: "QAR 8,400/mo", status: "Pending", type: "Rent" },
  ];
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h3 className="font-display text-base font-semibold">All Properties</h3>
        <div className="flex items-center gap-2 text-xs">
          <select className="rounded-md border border-input px-2 py-1">
            <option>All status</option>
            <option>Active</option>
            <option>Sold</option>
            <option>Reserved</option>
          </select>
          <select className="rounded-md border border-input px-2 py-1">
            <option>All types</option>
            <option>Rent</option>
            <option>Sale</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-3">ID</th>
              <th className="px-5 py-3">Property</th>
              <th className="px-5 py-3">Location</th>
              <th className="px-5 py-3">Type</th>
              <th className="px-5 py-3">Price</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-muted/30">
                <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{r.id}</td>
                <td className="px-5 py-3 font-medium text-foreground">{r.title}</td>
                <td className="px-5 py-3 text-muted-foreground">{r.loc}</td>
                <td className="px-5 py-3">
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                    {r.type}
                  </span>
                </td>
                <td className="px-5 py-3 font-medium">{r.price}</td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusColor(r.status)}`}>
                    {r.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <button className="text-xs font-medium text-primary hover:underline">Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- Agents ---------- */




/* ---------- Leads ---------- */


function PlaceholderCard({
  icon: Icon,
  title,
  desc,
}: {
  icon: typeof Home;
  title: string;
  desc: string;
}) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-white p-16 text-center shadow-sm">
      <Icon className="h-10 w-10 text-muted-foreground" />
      <p className="mt-4 font-display text-lg font-semibold">{title}</p>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{desc}</p>
      <span className="mt-4 flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-primary">
        <ShieldCheck className="h-3 w-3" /> Coming Soon
      </span>
    </div>
  );
}
