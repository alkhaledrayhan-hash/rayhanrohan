import { Link } from "@tanstack/react-router";
import { Home, Mail, MapPin, Phone, Plane } from "lucide-react";
import qatarPlaneAsset from "@/assets/qatar-airways-plane.png.asset.json";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export function Footer() {
  const settings = useSiteSettings();
  return (
    <footer
      id="footer"
      className="relative overflow-hidden text-white/85"
      style={{
        background:
          "linear-gradient(180deg, oklch(0.28 0.13 18) 0%, oklch(0.20 0.07 22) 55%, oklch(0.12 0.03 25) 100%)",
      }}
    >
      {/* Soft radial glow centerpiece */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 80% at 50% 40%, oklch(0.55 0.16 22 / 0.35) 0%, transparent 70%)",
        }}
      />

      {/* Flight path + Qatar Airways plane backdrop */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <svg
          viewBox="0 0 800 300"
          preserveAspectRatio="xMidYMid slice"
          className="h-full w-full"
        >
          <defs>
            <linearGradient id="trail-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="oklch(0.85 0.14 85)" stopOpacity="0" />
              <stop offset="100%" stopColor="oklch(0.85 0.14 85)" stopOpacity="1" />
            </linearGradient>
          </defs>

          {/* Dotted flight path */}
          <path
            d="M60,250 Q200,140 360,170 T740,80"
            fill="none"
            stroke="oklch(0.85 0.14 85)"
            strokeWidth="1.5"
            strokeDasharray="3 6"
            opacity="0.7"
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

          {/* Origin & destination dots */}
          <g>
            <circle cx="60" cy="250" r="4" fill="oklch(0.85 0.14 85)" />
            <circle cx="60" cy="250" r="9" fill="none" stroke="oklch(0.85 0.14 85)" strokeWidth="1" opacity="0.5" />
            <circle cx="740" cy="80" r="4" fill="oklch(0.85 0.14 85)" />
            <circle cx="740" cy="80" r="9" fill="none" stroke="oklch(0.85 0.14 85)" strokeWidth="1" opacity="0.5" />
          </g>

          {/* Qatar Airways plane image following the path */}
          <image
            href={qatarPlaneAsset.url}
            width="120"
            height="60"
            x="-60"
            y="-30"
            className="footer-plane"
            style={{ filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.45))" }}
          />
        </svg>
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <Link to="/" className="inline-flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[var(--shadow-soft)]">
              <Home className="h-5 w-5" />
            </span>
            <span className="flex flex-col leading-tight">
              <span className="font-display text-2xl font-semibold text-white">
                {settings.site_title}
              </span>
              <span className="text-[10px] uppercase tracking-[0.25em] text-gold">
                {settings.site_tagline}
              </span>
            </span>
          </Link>
          <p className="mt-4 max-w-sm text-sm text-white/70">
            A curated portfolio of premium residences across Doha, The Pearl, Lusail, West Bay and Al Waab —
            tailored for the discerning resident.
          </p>
        </div>

        {/* Centerpiece overlay card */}
        <div className="flex justify-center">
          <div className="rounded-2xl border border-white/15 bg-white/[0.04] px-7 py-5 text-center backdrop-blur-xl">
            <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.4em] text-gold">
              <span className="h-px w-6 bg-gold/60" />
              <Plane className="h-3 w-3" />
              <span>Doha → World</span>
              <span className="h-px w-6 bg-gold/60" />
            </div>
            <p className="mt-2 font-display text-xl font-medium text-white">
              From Qatar, with intent.
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-white/50">
              25.2854° N · 51.5310° E
            </p>
          </div>
        </div>

        <div className="md:justify-self-end">
          <div className="rounded-2xl border border-white/15 bg-white/[0.06] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.25)] backdrop-blur-xl">
            <h4 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.25em] text-gold">
              <span className="h-px w-5 bg-gold/60" />
              Contact
            </h4>
            <ul className="mt-4 space-y-3 text-sm text-white/80">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                West Bay, Doha — Qatar
              </li>
              <li className="flex items-start gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                +974 4000 0000
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                hello@maisonqatar.qa
              </li>
            </ul>
          </div>
        </div>
      </div>


      <div className="relative border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-5 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-gold shadow-[0_0_24px_oklch(0.85_0.14_85/0.18)] backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-gold shadow-[0_0_8px_oklch(0.85_0.14_85)]" />
            Licensed real estate brokerage · Qatar
            <span className="h-1.5 w-1.5 rounded-full bg-gold shadow-[0_0_8px_oklch(0.85_0.14_85)]" />
          </span>
          <p className="text-xs text-white/60">
            © {new Date().getFullYear()} Ayesha Maison Qatar. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

