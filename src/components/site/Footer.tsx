import { Link } from "@tanstack/react-router";
import { Home, Mail, MapPin, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer
      id="contact"
      className="relative mt-24 overflow-hidden border-t border-white/10 text-white/85"
      style={{
        background:
          "linear-gradient(180deg, oklch(0.22 0.05 25) 0%, oklch(0.16 0.04 25) 60%, oklch(0.12 0.03 25) 100%)",
      }}
    >
      {/* Qatar map silhouette + flying plane backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.45]">
        <svg
          viewBox="0 0 800 300"
          preserveAspectRatio="xMidYMid slice"
          className="h-full w-full"
        >
          <defs>
            <linearGradient id="qatar-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="oklch(0.62 0.18 22)" />
              <stop offset="100%" stopColor="oklch(0.38 0.13 18)" />
            </linearGradient>
            <linearGradient id="trail-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="oklch(0.85 0.14 85)" stopOpacity="0" />
              <stop offset="100%" stopColor="oklch(0.85 0.14 85)" stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* Stylised Qatar peninsula */}
          <path
            d="M420,40 C460,42 488,60 502,92 C516,124 520,158 516,184 C512,212 498,236 478,250 C458,264 432,272 408,268 C384,264 366,252 358,232 C350,212 348,190 354,168 C360,146 372,124 384,104 C394,86 400,68 404,52 C406,44 412,40 420,40 Z"
            fill="url(#qatar-grad)"
            opacity="0.85"
          />

          {/* Dotted flight path */}
          <path
            id="flight-path"
            d="M60,250 Q200,140 360,170 T740,80"
            fill="none"
            stroke="oklch(0.85 0.14 85)"
            strokeWidth="1.5"
            strokeDasharray="3 6"
            opacity="0.8"
          />

          {/* Plane trail */}
          <path
            d="M60,250 Q200,140 360,170 T740,80"
            fill="none"
            stroke="url(#trail-grad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="80 1000"
            className="footer-plane-trail"
          />

          {/* Plane icon following the same path */}
          <g className="footer-plane">
            <path
              d="M-12,-2 L8,-2 L14,-7 L18,-7 L13,-1 L18,4 L14,4 L8,2 L-12,2 Z"
              fill="oklch(0.95 0.04 85)"
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
              <span className="font-display text-2xl font-semibold text-white">
                Maison<span className="text-gold">Qatar</span>
              </span>
              <span className="text-[10px] uppercase tracking-[0.25em] text-gold">
                Premium Living · Doha
              </span>
            </span>
          </Link>
          <p className="mt-4 max-w-sm text-sm text-white/70">
            A curated portfolio of premium residences across Doha, The Pearl, Lusail, West Bay and Al Waab —
            tailored for the discerning resident.
          </p>
          <p className="mt-4 text-xs uppercase tracking-[0.25em] text-gold">
            Licensed real estate brokerage · Qatar
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white">Explore</h4>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            <li>
              <Link to="/properties" search={{ status: "rent" }} className="transition hover:text-gold">
                For Rent
              </Link>
            </li>
            <li>
              <Link to="/properties" search={{ status: "sale" }} className="transition hover:text-gold">
                For Sale
              </Link>
            </li>
            <li>
              <Link to="/about" className="transition hover:text-gold">About</Link>
            </li>
            <li>
              <Link to="/contact" className="transition hover:text-gold">Contact</Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white">Contact</h4>
          <ul className="mt-3 space-y-2 text-sm text-white/70">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
              West Bay, Doha — Qatar
            </li>
            <li className="flex items-start gap-2">
              <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
              +974 4000 0000
            </li>
            <li className="flex items-start gap-2">
              <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
              hello@maisonqatar.qa
            </li>
          </ul>
        </div>
      </div>

      <div className="relative border-t border-white/10 py-5 text-center text-xs text-white/60">
        © {new Date().getFullYear()} MaisonQatar. All rights reserved.
      </div>
    </footer>
  );
}

