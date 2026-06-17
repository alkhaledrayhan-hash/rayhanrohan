import { Link } from "@tanstack/react-router";
import { ChevronDown, Home, KeyRound, Tag } from "lucide-react";
import { useEffect, useState } from "react";

export function Header() {
  const [scrolled, setScrolled] = useState(false);

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
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="group flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground shadow-[var(--shadow-soft)]">
            <Home className="h-4 w-4" />
          </span>
          <span className="flex flex-col leading-tight">
            <span
              className={`font-display text-lg font-semibold transition-colors ${
                scrolled ? "text-foreground" : "text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.4)]"
              }`}
            >
              Ayesha Maison <span className={scrolled ? "text-primary" : "text-gold"}>Qatar</span>
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-gold">
              Premium Living
            </span>
          </span>
        </Link>
        <nav
          className={`hidden items-center gap-1 rounded-full border p-1 text-sm font-medium backdrop-blur-xl transition-colors md:flex ${
            scrolled
              ? "border-border/60 bg-background/40 text-muted-foreground"
              : "border-white/15 bg-white/10 text-white/85"
          }`}
        >
          <NavPill to="/" scrolled={scrolled}>Home</NavPill>
          <PropertiesDropdown scrolled={scrolled} />
          <NavPill to="/news" scrolled={scrolled}>News</NavPill>
          <NavPill to="/about" scrolled={scrolled}>About</NavPill>
          <NavPill to="/contact" scrolled={scrolled}>Contact</NavPill>
        </nav>
        <Link
          to="/properties"
          search={{ status: "rent" }}
          className="hidden rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-[var(--shadow-soft)] transition-opacity hover:opacity-90 md:inline-flex"
        >
          Browse Listings
        </Link>
      </div>
    </header>
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

function PropertiesDropdown({ scrolled }: { scrolled: boolean }) {
  const triggerHover = scrolled
    ? "hover:text-foreground hover:bg-background/60"
    : "hover:text-white hover:bg-white/15";

  return (
    <div className="group relative">
      <button
        type="button"
        className={`inline-flex items-center gap-1 rounded-full px-4 py-1.5 transition-colors duration-300 ease-out ${triggerHover}`}
      >
        Properties
        <ChevronDown className="h-3.5 w-3.5 transition-transform duration-300 group-hover:rotate-180" />
      </button>

      {/* bridge to prevent hover gap */}
      <div className="invisible absolute left-1/2 top-full z-50 w-56 -translate-x-1/2 pt-3 opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
        <div className="overflow-hidden rounded-2xl border border-border/60 bg-background/95 p-2 shadow-[0_18px_50px_-12px_rgba(0,0,0,0.25)] backdrop-blur-xl">
          <DropdownItem
            to="/properties"
            search={{ status: "rent" }}
            icon={<KeyRound className="h-4 w-4" />}
            label="For Rent"
            hint="Apartments, villas & more"
          />
          <DropdownItem
            to="/properties"
            search={{ status: "sale" }}
            icon={<Tag className="h-4 w-4" />}
            label="For Sale"
            hint="Buy your next home"
          />
        </div>
      </div>
    </div>
  );
}

function DropdownItem({
  to,
  search,
  icon,
  label,
  hint,
}: {
  to: string;
  search?: Record<string, unknown>;
  icon: React.ReactNode;
  label: string;
  hint: string;
}) {
  return (
    <Link
      to={to as never}
      search={search as never}
      className="group/item flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-secondary"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary transition group-hover/item:bg-primary group-hover/item:text-primary-foreground">
        {icon}
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="text-xs text-muted-foreground">{hint}</span>
      </span>
    </Link>
  );
}
