import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, Home, LayoutDashboard, LogOut, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useSiteMenus, type HeaderSubItem } from "@/hooks/useSiteMenus";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { getMenuIcon, guessMenuIcon } from "@/lib/menu-icons";

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
          {(() => {
            const mode = settings.brand_display_mode || "full";
            const showLogo = mode !== "text";
            const showText = mode !== "logo" || !settings.site_logo_url;
            return (
              <>
                {showLogo && (
                  settings.site_logo_url ? (
                    <img
                      src={settings.site_logo_url}
                      alt={settings.site_title}
                      className={`${mode === "logo" ? "h-10 w-auto max-w-[160px] object-contain" : "h-9 w-9 rounded-md object-cover"} shrink-0 shadow-[var(--shadow-soft)]`}
                    />
                  ) : (
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground shadow-[var(--shadow-soft)]">
                      <Home className="h-4 w-4" />
                    </span>
                  )
                )}
                {showText && (
                  <span className="flex min-w-0 flex-col leading-tight">
                    <span
                      className={`truncate font-display text-lg font-semibold transition-colors ${
                        scrolled ? "text-foreground" : "text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.4)]"
                      }`}
                    >
                      {settings.site_title}
                    </span>
                    {settings.site_tagline && (
                      <span className="truncate text-[10px] uppercase tracking-[0.2em] text-gold">
                        {settings.site_tagline}
                      </span>
                    )}
                  </span>
                )}
              </>
            );
          })()}
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
          <SheetContent
            side="right"
            className="w-[90vw] max-w-sm border-l border-border/60 bg-white text-slate-900 p-0"
          >
            <div className="flex h-full flex-col">
              {/* Brand header */}
              <div className="relative overflow-hidden border-b border-border/60 px-6 pb-6 pt-7">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-primary/25 via-gold/15 to-transparent blur-2xl"
                />
                <div className="relative flex items-center gap-3">
                  {(() => {
                    const mode = settings.brand_display_mode || "full";
                    const showLogo = mode !== "text";
                    const showText = mode !== "logo" || !settings.site_logo_url;
                    return (
                      <>
                        {showLogo && (
                          settings.site_logo_url ? (
                            <img
                              src={settings.site_logo_url}
                              alt=""
                              className={mode === "logo" ? "h-11 w-auto max-w-[170px] object-contain" : "h-10 w-10 rounded-xl object-cover ring-1 ring-border/60"}
                            />
                          ) : (
                            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-gold text-primary-foreground shadow-[var(--shadow-soft)]">
                              <Home className="h-5 w-5" />
                            </div>
                          )
                        )}
                        {showText && (
                          <div className="min-w-0">
                            <p className="truncate font-display text-lg font-semibold text-foreground">
                              {settings.site_title}
                            </p>
                            {settings.site_tagline && (
                              <p className="truncate text-[10px] uppercase tracking-[0.22em] text-gold">
                                {settings.site_tagline}
                              </p>
                            )}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-3 py-4 text-sm font-medium">
                <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/70">
                  Menu
                </p>
                {headerMenu.map((item, i) => (
                  <MobileMenuItem
                    key={i}
                    item={item}
                    onSelect={() => setOpen(false)}
                  />
                ))}
              </nav>

              {/* Footer actions */}
              <div className="space-y-2 border-t border-border/60 bg-background/80 px-4 py-4 backdrop-blur">
                {isAuthed ? (
                  <>
                    <Link
                      to="/dashboard"
                      onClick={() => setOpen(false)}
                      className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-secondary/40 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
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
                    className="flex w-full items-center justify-center rounded-full border border-border bg-secondary/40 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
                  >
                    Sign In
                  </Link>
                )}
                {cta.enabled && cta.label && cta.to && (
                  <Link
                    to={cta.to as never}
                    search={cta.search as never}
                    onClick={() => setOpen(false)}
                    className="flex w-full items-center justify-center rounded-full bg-gradient-to-r from-primary to-gold px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-soft)] transition-transform hover:scale-[1.02]"
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

function MobileMenuItem({
  item,
  onSelect,
}: {
  item: { label: string; to: string; search?: Record<string, unknown>; icon?: string | null; children?: HeaderSubItem[] };
  onSelect: () => void;
}) {
  const hasChildren = !!(item.children && item.children.length > 0);
  const [expanded, setExpanded] = useState(false);
  const Icon = getMenuIcon(item.icon) ?? guessMenuIcon(item.label);

  return (
    <div className="rounded-2xl border border-transparent transition-colors hover:border-border/60 hover:bg-secondary/40">
      <div className="flex items-stretch">
        <Link
          to={item.to as never}
          search={item.search as never}
          onClick={onSelect}
          className="flex min-w-0 flex-1 items-center gap-3 px-3 py-3 text-foreground"
          activeProps={{ className: "text-primary" }}
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary/70 text-foreground/80 ring-1 ring-border/40">
            {Icon ? <Icon className="h-4 w-4" /> : <span className="h-1.5 w-1.5 rounded-full bg-gold" />}
          </span>
          <span className="truncate text-[15px] font-medium">{item.label}</span>
        </Link>
        {hasChildren && (
          <button
            type="button"
            aria-label={expanded ? "Collapse" : "Expand"}
            aria-expanded={expanded}
            onClick={() => setExpanded((v) => !v)}
            className="grid w-11 shrink-0 place-items-center rounded-r-2xl text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
            />
          </button>
        )}
      </div>
      {hasChildren && (
        <div
          className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out ${
            expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="min-h-0">
            <div className="mb-2 ml-6 mr-3 flex flex-col gap-0.5 border-l border-border/60 pl-3 pt-1">
              {item.children!.map((c, ci) => (
                <Link
                  key={ci}
                  to={c.to as never}
                  search={c.search as never}
                  onClick={onSelect}
                  className="group flex items-center gap-2 rounded-lg px-3 py-2 text-[13.5px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  activeProps={{ className: "bg-secondary text-foreground" }}
                >
                  <ChevronRight className="h-3 w-3 text-gold/70 transition-transform group-hover:translate-x-0.5" />
                  <span className="truncate">{c.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
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

function NavDropdown({
  item,
  scrolled,
}: {
  item: { label: string; to: string; search?: Record<string, unknown>; children?: HeaderSubItem[] };
  scrolled: boolean;
}) {
  const [open, setOpen] = useState(false);
  let closeTimer: ReturnType<typeof setTimeout> | undefined;
  const onEnter = () => { if (closeTimer) clearTimeout(closeTimer); setOpen(true); };
  const onLeave = () => { closeTimer = setTimeout(() => setOpen(false), 150); };

  const triggerHover = scrolled
    ? "hover:text-foreground hover:bg-background/60"
    : "hover:text-white hover:bg-white/15";

  return (
    <div className="relative" onMouseEnter={onEnter} onMouseLeave={onLeave}>
      <Link
        to={item.to as never}
        search={item.search as never}
        className={`relative inline-flex items-center gap-1 rounded-full px-4 py-1.5 transition-colors duration-300 ease-out ${triggerHover}`}
      >
        {item.label}
        <ChevronDown className="h-3 w-3 opacity-70" />
      </Link>
      {open && item.children && item.children.length > 0 && (
        <>
          <div className="absolute left-0 right-0 top-full h-2" />
          <div
            className="absolute left-1/2 top-full z-50 mt-2 w-56 -translate-x-1/2 overflow-hidden rounded-2xl border border-white/20 p-1.5 shadow-[0_18px_40px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.14)] backdrop-blur-2xl backdrop-saturate-150 animate-in fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200"
            style={{ backgroundColor: "color-mix(in oklab, var(--primary) 28%, rgba(15,12,14,0.94))" }}
          >
            <div
              className="pointer-events-none absolute -top-10 -right-10 h-24 w-24 rounded-full blur-3xl"
              style={{ background: "color-mix(in oklab, var(--gold) 55%, transparent)" }}
            />
            <div className="relative flex flex-col gap-0.5">
              {item.children.map((c, i) => {
                const Resolved = getMenuIcon(c.icon) || guessMenuIcon(c.label);
                const tone = i % 2 === 0 ? "gold" : "primary";
                return (
                  <Link
                    key={i}
                    to={c.to as never}
                    search={c.search as never}
                    className="group/item flex items-center gap-2.5 rounded-xl p-1.5 transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/10"
                    onClick={() => setOpen(false)}
                  >
                    <span
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border transition-colors duration-300 ${
                        tone === "gold"
                          ? "border-gold/30 bg-gold/15 text-gold group-hover/item:bg-gold group-hover/item:text-gold-foreground group-hover/item:border-gold"
                          : "border-primary/40 bg-primary/15 text-primary-foreground/90 group-hover/item:bg-primary group-hover/item:text-primary-foreground group-hover/item:border-primary"
                      }`}
                    >
                      <Resolved className="h-4 w-4" />
                    </span>
                    <span className="truncate flex-1 text-[13px] font-medium text-white/90 group-hover/item:text-white">
                      {c.label}
                    </span>
                    <ChevronRight className="h-3 w-3 -translate-x-1 text-white/20 opacity-0 transition-all duration-300 group-hover/item:translate-x-0 group-hover/item:text-gold group-hover/item:opacity-100" />
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

