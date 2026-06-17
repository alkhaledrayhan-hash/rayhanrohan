import { Link } from "@tanstack/react-router";
import { Home } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-primary text-primary-foreground shadow-[var(--shadow-soft)]">
            <Home className="h-4 w-4" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="font-display text-lg font-semibold text-foreground">
              Maison<span className="text-primary">Qatar</span>
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-gold">
              Premium Living
            </span>
          </span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          <Link to="/" className="hover:text-foreground transition-colors" activeProps={{ className: "text-foreground" }}>
            Home
          </Link>
          <Link
            to="/properties"
            search={{ status: "rent" }}
            className="hover:text-foreground transition-colors"
          >
            For Rent
          </Link>
          <Link
            to="/properties"
            search={{ status: "sale" }}
            className="hover:text-foreground transition-colors"
          >
            For Sale
          </Link>
          <Link to="/about" className="hover:text-foreground transition-colors" activeProps={{ className: "text-foreground" }}>
            About
          </Link>
          <Link to="/contact" className="hover:text-foreground transition-colors" activeProps={{ className: "text-foreground" }}>
            Contact
          </Link>
        </nav>
        <Link
          to="/properties"
          search={{ status: "rent" }}
          className="hidden rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-[var(--shadow-soft)] transition hover:opacity-90 md:inline-flex"
        >
          Browse Listings
        </Link>
      </div>
    </header>
  );
}
