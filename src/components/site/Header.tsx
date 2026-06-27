import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronDown, Home, LayoutDashboard, LogOut, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useSiteMenus } from "@/hooks/useSiteMenus";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const settings = useSiteSettings();
  const { header: headerMenu, cta } = useSiteMenus();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["auth", "user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });
  const isAuthed = !!user;

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    setOpen(false);
    navigate({ to: "/", replace: true });
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-500 ease-out ${
        scrolled
          ? "border-b border-white/15 bg-background/55 backdrop-blur-2xl backdrop-saturate-150 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.15)]"
          : "border-b border-white/10 bg-transparent backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="group flex min-w-0 items-center gap-2">
          {settings.site_logo_url ? (
            <img
              src={settings.site_logo_url}
              alt={settings.site_title}
              className="h-9 w-9 shrink-0 rounded-md object-cover shadow-[var(--shadow-soft)]"
            />
          ) : (
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground shadow-[var(--shadow-soft)]">
              <Home className="h-4 w-4" />
            </span>
          )}
          <span className="flex min-w-0 flex-col leading-tight">
            <span
              className={`truncate font-display text-lg font-semibold transition-colors ${
                scrolled ? "text-foreground" : "text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.4)]"
              }`}
            >
              {settings.site_title}
            </span>
            <span className="truncate text-[10px] uppercase tracking-[0.2em] text-gold">
              {settings.site_tagline}
            </span>
          </span>
        </Link>
        <nav
          className={`hidden items-center gap-1 rounded-full border p-1 text-sm font-medium backdrop-blur-xl transition-colors lg:flex ${
            scrolled
              ? "border-border/60 bg-background/40 text-muted-foreground"
              : "border-white/15 bg-white/10 text-white/85"
          }`}
        >
          {headerMenu.map((item, i) =>
            item.children && item.children.length > 0 ? (
              <NavDropdown key={i} item={item} scrolled={scrolled} />
            ) : (
              <NavPill key={i} to={item.to} search={item.search} scrolled={scrolled}>
                {item.label}
              </NavPill>
            )
          )}
        </nav>
        <div className="hidden items-center gap-2 lg:flex">
          {isAuthed ? (
            <>
              <Link
                to="/dashboard"
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                  scrolled ? "text-foreground hover:bg-secondary" : "text-white hover:bg-white/15"
                }`}
              >
                <LayoutDashboard className="h-4 w-4" /> Dashboard
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                  scrolled ? "text-foreground hover:bg-secondary" : "text-white hover:bg-white/15"
                }`}
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </>
          ) : (
            <Link
              to="/auth"
              className={`rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                scrolled ? "text-foreground hover:bg-secondary" : "text-white hover:bg-white/15"
              }`}
            >
              Sign In
            </Link>
          )}
          {cta.enabled && cta.label && cta.to && (
            <Link
              to={cta.to as never}
              search={cta.search as never}
              className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-[var(--shadow-soft)] transition-opacity hover:opacity-90"
            >
              {cta.label}
            </Link>
          )}
        </div>

        {/* Mobile + tablet menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label="Open menu"
              className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors lg:hidden ${
                scrolled
                  ? "border-border/60 bg-background/60 text-foreground hover:bg-secondary"
                  : "border-white/20 bg-white/10 text-white hover:bg-white/20"
              }`}
            >
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[88vw] max-w-sm p-0">
            <div className="flex h-full flex-col">
              <div className="border-b border-border px-6 py-5">
                <p className="font-display text-lg font-semibold text-foreground">
                  {settings.site_title}
                </p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-gold">
                  {settings.site_tagline}
                </p>
              </div>
              <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4 text-sm font-medium">
                {headerMenu.map((item, i) => (
                  <SheetLink key={i} to={item.to} search={item.search} onSelect={() => setOpen(false)}>
                    {item.label}
                  </SheetLink>
                ))}
              </nav>
              <div className="space-y-2 border-t border-border px-4 py-4">
                {isAuthed ? (
                  <>
                    <Link
                      to="/dashboard"
                      onClick={() => setOpen(false)}
                      className="flex w-full items-center justify-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                    >
                      <LayoutDashboard className="h-4 w-4" /> Dashboard
                    </Link>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="flex w-full items-center justify-center gap-2 rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                    >
                      <LogOut className="h-4 w-4" /> Logout
                    </button>
                  </>
                ) : (
                  <Link
                    to="/auth"
                    onClick={() => setOpen(false)}
                    className="flex w-full items-center justify-center rounded-full border border-border px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                  >
                    Sign In
                  </Link>
                )}
                {cta.enabled && cta.label && cta.to && (
                  <Link
                    to={cta.to as never}
                    search={cta.search as never}
                    onClick={() => setOpen(false)}
                    className="flex w-full items-center justify-center rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-[var(--shadow-soft)] transition-opacity hover:opacity-90"
                  >
                    {cta.label}
                  </Link>
                )}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

function SheetLink({
  to,
  search,
  onSelect,
  children,
}: {
  to: string;
  search?: Record<string, unknown>;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      to={to as never}
      search={search as never}
      onClick={onSelect}
      className="rounded-xl px-4 py-3 text-foreground transition-colors hover:bg-secondary"
      activeProps={{ className: "bg-secondary text-foreground" }}
    >
      {children}
    </Link>
  );
}

function NavPill({
  to,
  search,
  scrolled,
  children,
}: {
  to: string;
  search?: Record<string, unknown>;
  scrolled: boolean;
  children: React.ReactNode;
}) {
  const activeClass = scrolled
    ? "text-foreground bg-background/80 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.15)]"
    : "text-white bg-white/20 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.4)]";
  const hoverClass = scrolled
    ? "hover:text-foreground hover:bg-background/60"
    : "hover:text-white hover:bg-white/15";

  return (
    <Link
      to={to as never}
      search={search as never}
      className={`relative rounded-full px-4 py-1.5 transition-colors duration-300 ease-out ${hoverClass}`}
      activeProps={{ className: activeClass }}
    >
      {children}
    </Link>
  );
}
