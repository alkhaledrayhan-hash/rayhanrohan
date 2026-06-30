import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { ThemedSelect } from "@/components/ui/themed-select";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
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
import { AgentSettingsPanel } from "@/components/admin/AgentSettingsPanel";
import { MessagesPanel } from "@/components/admin/MessagesPanel";
import { MediaPanel } from "@/components/admin/MediaPanel";
import { PostsManager } from "@/components/admin/PostsManager";
import { BookingsPanel } from "@/components/admin/BookingsPanel";
import { CalendarPanel } from "@/components/admin/CalendarPanel";
import { UsersManager } from "@/components/admin/UsersManager";
import { PopupsManager } from "@/components/admin/PopupsManager";
import { EmailChangeRequestsPanel } from "@/components/admin/EmailChangeRequestsPanel";
import { NotificationsBell } from "@/components/admin/NotificationsBell";
import { useUnreadCounts, type UnreadSection } from "@/hooks/use-unread-counts";
import {
  Building2,
  Calendar,
  ChevronDown,
  ChevronRight,
  FileText,
  Home,
  Info,
  LayoutDashboard,
  LogOut,
  Image,
  Mail,
  MapPin,
  MessageSquare,
  Newspaper,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,

  Phone,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  UserPlus,
  Users,
  X,
  BadgePercent,
  Sparkles,
} from "lucide-react";



export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin Dashboard · Ayesha Maison Qatar" }] }),
  beforeLoad: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) throw redirect({ to: "/auth" });
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", u.user.id);
    const allowed = (roles ?? []).some((r) => r.role === "admin" || r.role === "agent");
    if (!allowed) throw redirect({ to: "/dashboard" });
  },
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
    "overview" | "properties" | "pages" | "agents" | "add-agent" | "users" | "email-requests" | "leads" | "bookings" | "messages" | "media" | "posts" | "calendar" | "popups" | "settings"
  >("overview");
  const [pageSlug, setPageSlug] = useState<string>("home");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [desktopCollapsed, setDesktopCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("admin:sidebar:collapsed") === "1";
  });
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("admin:sidebar:collapsed", desktopCollapsed ? "1" : "0");
    }
  }, [desktopCollapsed]);
  const closeMobileNav = () => setMobileNavOpen(false);

  const { counts: unread, markRead } = useUnreadCounts();
  // Wrap setSection so picking an item on mobile also closes the drawer, and
  // mark the corresponding section read so its badge clears.
  const goSection = (s: typeof section) => {
    setSection(s);
    closeMobileNav();
    if (s === "leads" || s === "bookings" || s === "messages") markRead(s as UnreadSection);
  };

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
    <SidebarCollapsedContext.Provider value={desktopCollapsed}>
    <div className="flex min-h-screen bg-[#f5f7fa]">
      {/* Mobile overlay */}
      {mobileNavOpen && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={closeMobileNav}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      )}

      {/* Sidebar — drawer on mobile, static on md+ */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] shrink-0 flex-col border-r border-border bg-white transition-[transform,width] duration-200 md:static md:z-auto md:max-w-none md:translate-x-0 ${
          desktopCollapsed ? "md:w-16" : "md:w-64"
        } ${mobileNavOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className={`flex items-center border-b border-border py-4 md:py-5 ${desktopCollapsed ? "md:justify-center md:px-2" : "justify-between px-4 md:px-6"}`}>
          <Link to="/" className="flex items-center gap-2" onClick={closeMobileNav} title="Ayesha Qatar">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
              <Home className="h-4 w-4" />
            </span>
            <div className={`flex-col leading-tight ${desktopCollapsed ? "hidden" : "flex"}`}>
              <span className="font-display text-sm font-semibold">
                Ayesha <span className="text-gold">Qatar</span>
              </span>
              <span className="text-[10px] uppercase tracking-[0.15em] text-muted-foreground">
                {roleLabel} Panel
              </span>
            </div>
          </Link>
          <button
            type="button"
            onClick={closeMobileNav}
            aria-label="Close menu"
            className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-muted md:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>


        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3 text-sm">
          <NavGroup label="Main" />
          <NavItem icon={LayoutDashboard} label="Dashboard" active={section === "overview"} onClick={() => goSection("overview")} />
          <NavItem icon={Building2} label="Properties" active={section === "properties"} onClick={() => goSection("properties")} />
          {isAdmin && (
            <NavGroupExpandable
              icon={FileText}
              label="Pages"
              active={section === "pages"}
              defaultOpen={section === "pages"}
            >
              {[
                { slug: "home", label: "Home", icon: Home },
                { slug: "properties", label: "Properties", icon: Building2 },
                { slug: "offers", label: "Offers", icon: BadgePercent },
                { slug: "agents", label: "Our Agents", icon: Users },
                { slug: "about", label: "About", icon: Info },
                { slug: "news", label: "News", icon: Newspaper },
                { slug: "contact", label: "Contact", icon: Phone },

              ].map((p) => (
                <SubNavItem
                  key={p.slug}
                  icon={p.icon}
                  label={p.label}
                  active={section === "pages" && pageSlug === p.slug}
                  onClick={() => { setSection("pages"); setPageSlug(p.slug); closeMobileNav(); }}
                />
              ))}
            </NavGroupExpandable>
          )}
          {isAdmin && (
            <NavItem icon={Users} label="Agents" active={section === "agents"} onClick={() => goSection("agents")} />
          )}
          {isAdmin && (
            <NavItem icon={UserPlus} label="Add Agent" active={section === "add-agent"} onClick={() => goSection("add-agent")} />
          )}
          {isAdmin && (
            <NavItem icon={ShieldCheck} label="Users" active={section === "users"} onClick={() => goSection("users")} />
          )}

          {isAdmin && (
            <NavItem icon={Mail} label="Email Requests" active={section === "email-requests"} onClick={() => goSection("email-requests")} />
          )}

          <NavGroup label="Operations" />
          <NavItem icon={Mail} label="Leads" active={section === "leads"} onClick={() => goSection("leads")} badge={unread.leads ? String(unread.leads) : undefined} />
          <NavItem icon={FileText} label="Bookings" active={section === "bookings"} onClick={() => goSection("bookings")} badge={unread.bookings ? String(unread.bookings) : undefined} />
          <NavItem icon={MessageSquare} label="Messages" active={section === "messages"} onClick={() => goSection("messages")} badge={unread.messages ? String(unread.messages) : undefined} />
          <NavItem icon={Calendar} label="Calendar" active={section === "calendar"} onClick={() => goSection("calendar")} />

          <NavGroup label="Content" />
          <NavItem icon={Image} label="Media" active={section === "media"} onClick={() => goSection("media")} />
          <NavItem icon={Newspaper} label="News & Blogs" active={section === "posts"} onClick={() => goSection("posts")} />

          <NavGroup label="System" />
          <NavItem icon={Settings} label="Settings" active={section === "settings"} onClick={() => goSection("settings")} />
        </nav>

        <div className="border-t border-border p-3">
          <button
            onClick={handleSignOut}
            title="Sign out"
            className={`flex w-full items-center gap-3 rounded-lg py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground ${desktopCollapsed ? "md:justify-center md:px-0" : "px-3"}`}
          >
            <LogOut className="h-4 w-4" /> <span className={desktopCollapsed ? "md:hidden" : ""}>Sign out</span>
          </button>

        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="flex items-center gap-3 border-b border-border bg-white px-4 py-3 md:px-6">
          <button
            type="button"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open menu"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border bg-white text-muted-foreground hover:text-foreground md:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setDesktopCollapsed((c) => !c)}
            aria-label={desktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={desktopCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="hidden h-9 w-9 shrink-0 place-items-center rounded-md border border-border bg-white text-muted-foreground hover:text-foreground md:grid"
          >
            {desktopCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>

          <div className="hidden w-full max-w-md md:block">
            <AdminSearch onJump={(s) => goSection(s)} />
          </div>
          <div className="ml-auto flex items-center gap-2 md:gap-3">
            <Link
              to="/"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-white px-3 text-xs font-medium text-muted-foreground transition hover:text-foreground"
            >
              <Home className="h-4 w-4" /> <span className="hidden sm:inline">Home</span>
            </Link>
            <Link
              to="/dashboard"
              title="Go to user dashboard"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-white px-3 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <LayoutDashboard className="h-4 w-4" /> <span className="hidden sm:inline">User Dashboard</span>
            </Link>
            <NotificationsBell onNavigate={(s) => goSection(s)} />
            <AccountMenu
              initials={initials}
              fullName={profile?.full_name || "Account"}
              roleLabel={roleLabel}
              onSettings={() => goSection("settings")}
              onSignOut={handleSignOut}
            />

          </div>
        </header>

        {/* Page */}
        <main className="flex-1 p-4 md:p-6">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-semibold">{sectionTitle(section)}</h1>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Home className="h-3 w-3" /> Home <ChevronRight className="h-3 w-3" />{" "}
                {sectionTitle(section)}
              </p>
            </div>
          </div>

          {section === "overview" && <Overview name={profile?.full_name?.split(" ")[0]} role={roleLabel} onJump={(s) => goSection(s as typeof section)} />}
          {section === "properties" && <PropertiesManager isAdmin={!!isAdmin} />}
          {section === "pages" && isAdmin && <PagesManager pageSlug={pageSlug} onPageChange={setPageSlug} />}
          {section === "agents" && isAdmin && <AgentsPanel />}
          {section === "add-agent" && isAdmin && <AddAgentForm />}
          {section === "users" && (isAdmin ? <UsersManager /> : <PlaceholderCard icon={ShieldCheck} title="Users" desc="Only admins can manage users." />)}
          {section === "email-requests" && (isAdmin ? <EmailChangeRequestsPanel /> : <PlaceholderCard icon={Mail} title="Email Requests" desc="Only admins can review email change requests." />)}
          {section === "leads" && <LeadsPanel isAdmin={!!isAdmin} />}
          {section === "bookings" && <BookingsPanel isAdmin={!!isAdmin} />}
          {section === "messages" && <MessagesPanel isAdmin={!!isAdmin} />}
          {section === "calendar" && <CalendarPanel />}
          {section === "media" && (isAdmin ? <MediaPanel /> : <PlaceholderCard icon={Image} title="Media" desc="Only admins can manage media." />)}
          {section === "posts" && (isAdmin ? <PostsManager /> : <PlaceholderCard icon={Newspaper} title="News & Blogs" desc="Only admins can manage articles." />)}
          {section === "settings" && (isAdmin ? <SettingsPanel /> : <AgentSettingsPanel />)}
        </main>
      </div>
    </div>
    </SidebarCollapsedContext.Provider>
  );
}

const SidebarCollapsedContext = createContext(false);
const useSidebarCollapsed = () => useContext(SidebarCollapsedContext);


function sectionTitle(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function AccountMenu({
  initials,
  fullName,
  roleLabel,
  onSettings,
  onSignOut,
}: {
  initials: string;
  fullName: string;
  roleLabel: string;
  onSettings: () => void;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const scheduleClose = () => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  };
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);
  useEffect(() => () => cancelClose(), []);
  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => { cancelClose(); setOpen(true); }}
      onMouseLeave={scheduleClose}
      onFocus={() => { cancelClose(); setOpen(true); }}
      onBlur={(e) => {
        if (!ref.current?.contains(e.relatedTarget as Node)) scheduleClose();
      }}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-border bg-white py-1 pl-1 pr-2 transition hover:bg-muted sm:pr-3"
      >
        <span className="grid h-7 w-7 place-items-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {initials}
        </span>
        <span className="hidden flex-col text-left leading-tight sm:flex">
          <span className="text-xs font-semibold">{fullName}</span>
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {roleLabel}
          </span>
        </span>
        <ChevronDown className={`hidden h-3.5 w-3.5 text-muted-foreground transition-transform sm:block ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-white p-1 shadow-lg"
        >
          <div className="border-b border-border px-3 py-2.5">
            <p className="truncate text-sm font-semibold">{fullName}</p>
            <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{roleLabel}</p>
          </div>
          <Link
            to="/dashboard"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LayoutDashboard className="h-4 w-4" /> Profile
          </Link>
          <button
            type="button"
            onClick={() => { setOpen(false); onSettings(); }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Settings className="h-4 w-4" /> Settings
          </button>
          <div className="my-1 border-t border-border" />
          <button
            type="button"
            onClick={() => { setOpen(false); onSignOut(); }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 hover:bg-rose-50"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}


function NavGroup({ label }: { label: string }) {
  const collapsed = useSidebarCollapsed();
  if (collapsed) {
    return <div className="my-2 border-t border-border/60" aria-hidden="true" />;
  }
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
  const collapsed = useSidebarCollapsed();
  return (
    <button
      onClick={onClick}
      title={collapsed ? label : undefined}
      className={`relative flex w-full items-center gap-3 rounded-lg py-2 text-sm transition ${
        collapsed ? "justify-center px-0" : "justify-between px-3"
      } ${
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <span className={`flex items-center gap-3 ${collapsed ? "" : ""}`}>
        <Icon className="h-4 w-4" /> {!collapsed && label}
      </span>
      {badge && !collapsed && (
        <span
          className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
            active ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
          }`}
        >
          {badge}
        </span>
      )}
      {badge && collapsed && (
        <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
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
  const collapsed = useSidebarCollapsed();
  const [open, setOpen] = useState(!!defaultOpen);
  useEffect(() => { if (defaultOpen) setOpen(true); }, [defaultOpen]);
  if (collapsed) {
    return (
      <button
        type="button"
        title={label}
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center justify-center rounded-lg py-2 text-sm transition ${
          active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
      >
        <Icon className="h-4 w-4" />
      </button>
    );
  }
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

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function useAdminAnalytics() {
  return useQuery({
    queryKey: ["admin-analytics"],
    staleTime: 60_000,
    queryFn: async () => {
      const since = new Date();
      since.setMonth(since.getMonth() - 11);
      since.setDate(1);
      since.setHours(0, 0, 0, 0);
      const sinceIso = since.toISOString();
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      const prevWeek = new Date(Date.now() - 14 * 86400000).toISOString();

      const [props, leads, bookings, agents, clients, recent] = await Promise.all([
        supabase.from("properties").select("id, price, status, location, created_at, listing_status"),
        supabase.from("leads").select("id, name, property_title, status, created_at").gte("created_at", sinceIso),
        supabase.from("bookings").select("id, status, created_at, property_title").gte("created_at", sinceIso),
        supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "agent"),
        supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "user"),
        supabase.from("leads").select("id, name, property_title, status, created_at").order("created_at", { ascending: false }).limit(6),
      ]);

      const properties = props.data ?? [];
      const leadRows = leads.data ?? [];
      const bookingRows = bookings.data ?? [];

      // monthly aggregate of leads vs bookings (last 12 months)
      const buckets: { m: string; key: string; leads: number; bookings: number }[] = [];
      for (let i = 0; i < 12; i++) {
        const d = new Date(since);
        d.setMonth(since.getMonth() + i);
        buckets.push({
          m: MONTH_LABELS[d.getMonth()],
          key: `${d.getFullYear()}-${d.getMonth()}`,
          leads: 0,
          bookings: 0,
        });
      }
      const bucketByKey = new Map(buckets.map((b) => [b.key, b]));
      for (const r of leadRows) {
        const d = new Date(r.created_at as string);
        const b = bucketByKey.get(`${d.getFullYear()}-${d.getMonth()}`);
        if (b) b.leads += 1;
      }
      for (const r of bookingRows) {
        const d = new Date(r.created_at as string);
        const b = bucketByKey.get(`${d.getFullYear()}-${d.getMonth()}`);
        if (b) b.bookings += 1;
      }

      // monthly property listed value
      const valueBuckets = buckets.map((b) => ({ m: b.m, key: b.key, value: 0, count: 0 }));
      const valueByKey = new Map(valueBuckets.map((b) => [b.key, b]));
      for (const p of properties) {
        const d = new Date(p.created_at as string);
        const v = valueByKey.get(`${d.getFullYear()}-${d.getMonth()}`);
        if (v) {
          v.value += Number(p.price ?? 0);
          v.count += 1;
        }
      }

      // top locations
      const locCount = new Map<string, number>();
      for (const p of properties) {
        const loc = (p.location ?? "Unknown").toString();
        locCount.set(loc, (locCount.get(loc) ?? 0) + 1);
      }
      const palette = ["#7c1d2f", "#c2410c", "#0f766e", "#a16207", "#1d4ed8", "#7e22ce"];
      const totalLoc = Array.from(locCount.values()).reduce((a, b) => a + b, 0) || 1;
      const topLocations = Array.from(locCount.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count], i) => ({ name, value: Math.round((count / totalLoc) * 100), color: palette[i % palette.length] }));

      // KPIs and weekly delta
      const newPropsThisWeek = properties.filter((p) => (p.created_at as string) >= weekAgo).length;
      const newPropsPrevWeek = properties.filter(
        (p) => (p.created_at as string) >= prevWeek && (p.created_at as string) < weekAgo,
      ).length;
      const newLeadsThisWeek = leadRows.filter((l) => (l.created_at as string) >= weekAgo).length;
      const newLeadsPrevWeek = leadRows.filter(
        (l) => (l.created_at as string) >= prevWeek && (l.created_at as string) < weekAgo,
      ).length;

      const pct = (now: number, prev: number) => {
        if (prev === 0) return now > 0 ? 100 : 0;
        return Math.round(((now - prev) / prev) * 100);
      };

      const soldOrRented = properties.filter((p) => {
        const s = String(p.listing_status ?? "").toLowerCase();
        return s === "sold" || s === "rented" || s === "closed";
      }).length;

      const totalValue = valueBuckets.reduce((s, b) => s + b.value, 0);
      const lastBucket = valueBuckets[valueBuckets.length - 1]?.value ?? 0;
      const prevBucket = valueBuckets[valueBuckets.length - 2]?.value ?? 0;

      return {
        totalProperties: properties.length,
        soldOrRented,
        totalClients: clients.count ?? 0,
        totalAgents: agents.count ?? 0,
        totalLeads: leadRows.length,
        newLeadsThisWeek,
        leadsDelta: pct(newLeadsThisWeek, newLeadsPrevWeek),
        propsDelta: pct(newPropsThisWeek, newPropsPrevWeek),
        monthly: buckets.map((b) => ({ m: b.m, leads: b.leads, bookings: b.bookings })),
        monthlyValue: valueBuckets.map((b) => ({ m: b.m, value: b.value, count: b.count })),
        totalValue,
        valueDelta: pct(lastBucket, prevBucket),
        topLocations,
        recentLeads: (recent.data ?? []).map((l: any) => ({
          id: l.id as string,
          name: l.name || "Anonymous",
          property: l.property_title || "—",
          status: l.status || "New",
          time: relTime(l.created_at as string),
        })),
      };
    },
  });
}

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

function fmtCurrency(n: number) {
  if (n >= 1_000_000) return `QAR ${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `QAR ${(n / 1_000).toFixed(1)}K`;
  return `QAR ${n.toLocaleString()}`;
}

function Overview({ name, role, onJump }: { name: string | undefined; role: string; onJump: (s: string) => void }) {
  const { data, isLoading } = useAdminAnalytics();
  const a = data;
  const trendOf = (n: number): "up" | "down" => (n >= 0 ? "up" : "down");
  const fmtDelta = (n: number) => `${n >= 0 ? "+" : ""}${n}%`;

  return (
    <div className="space-y-5">
      {/* Hero + stats */}
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-[#4a0f1d] p-7 text-white shadow-sm lg:col-span-1">
          <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-gold/30 blur-2xl" />
          <div className="relative">
            <p className="text-sm">👋 Hello, {name || role}</p>
            <h2 className="mt-2 font-display text-2xl font-semibold leading-tight">
              Track property performance, availability & leads at a glance.
            </h2>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <MiniStat label="Total Properties" value={isLoading ? "…" : String(a?.totalProperties ?? 0)} delta={fmtDelta(a?.propsDelta ?? 0)} />
              <MiniStat label="Sold / Rented" value={isLoading ? "…" : String(a?.soldOrRented ?? 0)} delta={`${a?.totalProperties ? Math.round(((a?.soldOrRented ?? 0) / a.totalProperties) * 100) : 0}%`} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          <KPI label="Total Clients" value={String(a?.totalClients ?? 0)} delta={fmtDelta(0)} trend="up" color="#0d9488" />
          <KPI label="Total Leads" value={String(a?.totalLeads ?? 0)} delta={fmtDelta(a?.leadsDelta ?? 0)} trend={trendOf(a?.leadsDelta ?? 0)} color="#ea580c" />
          <KPI label="Active Agents" value={String(a?.totalAgents ?? 0)} delta={fmtDelta(0)} trend="up" color="#0ea5e9" />
          <KPI label="New Leads / wk" value={String(a?.newLeadsThisWeek ?? 0)} delta={fmtDelta(a?.leadsDelta ?? 0)} trend={trendOf(a?.leadsDelta ?? 0)} color="#a855f7" />
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Listing Value (12 mo)" headline={isLoading ? "—" : fmtCurrency(a?.totalValue ?? 0)} delta={fmtDelta(a?.valueDelta ?? 0)} trend={trendOf(a?.valueDelta ?? 0)}>
          {isLoading ? (
            <ChartSkeleton variant="area" />
          ) : !a?.monthlyValue?.some((b) => b.value > 0) ? (
            <ChartEmpty label="No listing value yet" hint="Add properties with a price to see trends here." />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={a?.monthlyValue ?? []}>
                <defs>
                  <linearGradient id="s1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" vertical={false} />
                <XAxis dataKey="m" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v: any, k) => k === "value" ? fmtCurrency(Number(v)) : v} />
                <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#s1)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </ChartCard>

        <ChartCard title="Leads vs Bookings" headline={isLoading ? "—" : String((a?.totalLeads ?? 0) + (a?.monthly?.reduce((s, m) => s + m.bookings, 0) ?? 0))} delta={fmtDelta(a?.leadsDelta ?? 0)} trend={trendOf(a?.leadsDelta ?? 0)}>
          {isLoading ? (
            <ChartSkeleton variant="bar" />
          ) : !a?.monthly?.some((b) => b.leads > 0 || b.bookings > 0) ? (
            <ChartEmpty label="No leads or bookings yet" hint="Activity from inquiries and bookings will appear here." />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={a?.monthly ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef0f3" vertical={false} />
                <XAxis dataKey="m" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="leads" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                <Bar dataKey="bookings" fill="#ea580c" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      {/* Bottom row */}
      <div className="grid gap-5 lg:grid-cols-3">
        <RecentLeads leads={a?.recentLeads ?? []} onSeeAll={() => onJump("leads")} />
        <TopLocations data={a?.topLocations ?? []} />
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
        <ThemedSelect className="h-6 rounded-md border border-input bg-white px-1.5 py-0 text-[10px] leading-none text-muted-foreground">
          <option>Today</option>
          <option>Week</option>
          <option>Month</option>
        </ThemedSelect>

      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function ChartSkeleton({ variant }: { variant: "area" | "bar" }) {
  const bars = [55, 70, 45, 80, 60, 75, 50, 90, 65, 72, 58, 82];
  return (
    <div className="relative h-[260px] w-full overflow-hidden rounded-lg bg-gradient-to-b from-muted/40 to-muted/10">
      <div className="absolute inset-0 flex items-end gap-2 px-3 pb-6 pt-3">
        {bars.map((h, i) => (
          <div
            key={i}
            className={`flex-1 rounded-t ${variant === "area" ? "bg-primary/15" : "bg-primary/20"} animate-pulse`}
            style={{ height: `${h}%`, animationDelay: `${i * 60}ms` }}
          />
        ))}
      </div>
      <div className="absolute inset-x-3 bottom-2 flex justify-between">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-2 w-6 rounded bg-muted-foreground/15" />
        ))}
      </div>
      <div className="pointer-events-none absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
    </div>
  );
}

function ChartEmpty({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="flex h-[260px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18" />
          <path d="M7 14l4-4 4 4 5-6" />
        </svg>
      </div>
      <p className="mt-3 text-sm font-medium text-foreground">{label}</p>
      {hint && <p className="mt-1 max-w-[260px] text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}




function RecentLeads({ leads, onSeeAll }: { leads: { id: string; name: string; property: string; status: string; time: string }[]; onSeeAll?: () => void }) {
  if (!leads.length) {
    return (
      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm lg:col-span-2">
        <h3 className="font-display text-base font-semibold">Recent Leads</h3>
        <p className="mt-3 text-sm text-muted-foreground">No leads yet.</p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-border bg-white p-5 shadow-sm lg:col-span-2">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold">Recent Leads</h3>
        <button onClick={onSeeAll} className="text-xs font-medium text-primary hover:underline">See all</button>
      </div>
      <div className="mt-4 divide-y divide-border">
        {leads.map((l) => (
          <div key={l.id} className="flex items-center justify-between py-3 text-sm">
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

function TopLocations({ data }: { data: { name: string; value: number; color: string }[] }) {
  if (!data.length) {
    return (
      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <h3 className="font-display text-base font-semibold">Top Locations</h3>
        <p className="mt-3 text-sm text-muted-foreground">No properties yet.</p>
      </div>
    );
  }
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
          <ThemedSelect className="rounded-md border border-input px-2 py-1">
            <option>All status</option>
            <option>Active</option>
            <option>Sold</option>
            <option>Reserved</option>
          </ThemedSelect>
          <ThemedSelect className="rounded-md border border-input px-2 py-1">
            <option>All types</option>
            <option>Rent</option>
            <option>Sale</option>
          </ThemedSelect>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="responsive-table w-full min-w-[720px] text-sm">
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

type AdminSection =
  | "overview" | "properties" | "pages" | "agents" | "add-agent" | "users"
  | "email-requests" | "leads" | "bookings" | "messages" | "media" | "posts"
  | "calendar" | "settings";

type SearchHit = {
  id: string;
  label: string;
  sub?: string;
  section: AdminSection;
  icon: React.ComponentType<{ className?: string }>;
};

function AdminSearch({ onJump }: { onJump: (s: AdminSection) => void }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = { cancelled: false };
    const t = setTimeout(async () => {
      try {
        const like = `%${term}%`;
        const [props, agents, leads, posts] = await Promise.all([
          supabase.from("properties").select("id,title,location").or(`title.ilike.${like},location.ilike.${like}`).limit(5),
          supabase.from("profiles").select("id,full_name,email").or(`full_name.ilike.${like},email.ilike.${like}`).limit(5),
          supabase.from("leads").select("id,name,email,phone").or(`name.ilike.${like},email.ilike.${like},phone.ilike.${like}`).limit(5),
          supabase.from("posts").select("id,title,slug").ilike("title", like).limit(5),
        ]);
        if (ctrl.cancelled) return;
        const out: SearchHit[] = [];
        (props.data ?? []).forEach((r: any) => out.push({ id: `p-${r.id}`, label: r.title, sub: r.location ?? "Property", section: "properties", icon: Building2 }));
        (agents.data ?? []).forEach((r: any) => out.push({ id: `a-${r.id}`, label: r.full_name || r.email, sub: r.email ?? "User", section: "agents", icon: Users }));
        (leads.data ?? []).forEach((r: any) => out.push({ id: `l-${r.id}`, label: r.name || r.email || r.phone, sub: r.email || r.phone || "Lead", section: "leads", icon: Mail }));
        (posts.data ?? []).forEach((r: any) => out.push({ id: `n-${r.id}`, label: r.title, sub: "News / Blog", section: "posts", icon: Newspaper }));
        setHits(out);
        setOpen(true);
      } finally {
        if (!ctrl.cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      ctrl.cancelled = true;
      clearTimeout(t);
    };
  }, [q]);

  return (
    <div ref={wrapRef} className="relative w-full">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onFocus={() => { if (hits.length) setOpen(true); }}
        placeholder="Search properties, agents, leads…"
        className="w-full rounded-full border border-input bg-muted/40 py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      {open && (loading || hits.length > 0 || q.trim().length >= 2) && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-auto rounded-xl border border-border bg-white shadow-lg">
          {loading && <div className="px-4 py-3 text-xs text-muted-foreground">Searching…</div>}
          {!loading && hits.length === 0 && (
            <div className="px-4 py-3 text-xs text-muted-foreground">No results for "{q}"</div>
          )}
          {!loading && hits.map((h) => {
            const Icon = h.icon;
            return (
              <button
                key={h.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onJump(h.section);
                  setOpen(false);
                  setQ("");
                }}
                className="flex w-full items-center gap-3 border-b border-border/60 px-3 py-2 text-left text-sm last:border-b-0 hover:bg-muted/60"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-foreground">{h.label}</span>
                  {h.sub && <span className="block truncate text-xs text-muted-foreground">{h.sub}</span>}
                </span>
                <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-primary">
                  {h.section}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

