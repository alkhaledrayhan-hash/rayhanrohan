import { Link } from "@tanstack/react-router";
import { Home, Mail, MapPin, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer id="contact" className="relative mt-24 overflow-hidden border-t border-border bg-gradient-to-b from-secondary/40 to-secondary/70">
      {/* Qatar map silhouette + flying plane backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.18]">
        <svg
          viewBox="0 0 800 300"
          preserveAspectRatio="xMidYMid slice"
          className="h-full w-full"
        >
          <defs>
            <linearGradient id="qatar-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="oklch(0.55 0.16 20)" />
              <stop offset="100%" stopColor="oklch(0.42 0.14 22)" />
            </linearGradient>
            <linearGradient id="trail-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="oklch(0.74 0.12 85)" stopOpacity="0" />
              <stop offset="100%" stopColor="oklch(0.74 0.12 85)" stopOpacity="0.9" />
            </linearGradient>
          </defs>

          {/* Stylised Qatar peninsula */}
          <path
            d="M420,40 C460,42 488,60 502,92 C516,124 520,158 516,184 C512,212 498,236 478,250 C458,264 432,272 408,268 C384,264 366,252 358,232 C350,212 348,190 354,168 C360,146 372,124 384,104 C394,86 400,68 404,52 C406,44 412,40 420,40 Z"
            fill="url(#qatar-grad)"
          />

          {/* Dotted flight path */}
          <path
            id="flight-path"
            d="M60,250 Q200,140 360,170 T740,80"
            fill="none"
            stroke="oklch(0.74 0.12 85)"
            strokeWidth="1.5"
            strokeDasharray="3 6"
            opacity="0.55"
          />

          {/* Plane trail */}
          <path
            d="M60,250 Q200,140 360,170 T740,80"
            fill="none"
            stroke="url(#trail-grad)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="80 1000"
            className="footer-plane-trail"
          />

          {/* Plane icon following the same path */}
          <g className="footer-plane">
            <path
              d="M-12,-2 L8,-2 L14,-7 L18,-7 L13,-1 L18,4 L14,4 L8,2 L-12,2 Z"
              fill="oklch(0.18 0.01 60)"
            />
          </g>
        </svg>
      </div>

      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4 lg:px-8">
        <div className="md:col-span-2">
          <Link to="/" className="inline-flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[var(--shadow-soft)]">
              <Home className="h-5 w-5" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="font-display text-2xl font-semibold text-foreground">
                Maison<span className="text-primary">Qatar</span>
              </span>
              <span className="text-[10px] uppercase tracking-[0.25em] text-gold">
                Premium Living · Doha
              </span>
            </span>
          </Link>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            A curated portfolio of premium residences across Doha, The Pearl, Lusail, West Bay and Al Waab —
            tailored for the discerning resident.
          </p>
          <p className="mt-4 text-xs uppercase tracking-[0.25em] text-gold">
            Licensed real estate brokerage · Qatar
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground">Explore</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/properties" search={{ status: "rent" }} className="transition hover:text-primary">
                For Rent
              </Link>
            </li>
            <li>
              <Link to="/properties" search={{ status: "sale" }} className="transition hover:text-primary">
                For Sale
              </Link>
            </li>
            <li>
              <Link to="/about" className="transition hover:text-primary">About</Link>
            </li>
            <li>
              <Link to="/contact" className="transition hover:text-primary">Contact</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-foreground">Contact</h4>
          <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              West Bay, Doha — Qatar
            </li>
            <li className="flex items-start gap-2">
              <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              +974 4000 0000
            </li>
            <li className="flex items-start gap-2">
              <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              hello@maisonqatar.qa
            </li>
          </ul>
        </div>
      </div>

      <div className="relative border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} MaisonQatar. All rights reserved.
      </div>
    </footer>
  );
}
