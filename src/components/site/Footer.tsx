import { Link } from "@tanstack/react-router";
import { Home, Mail, MapPin, Phone, Plane } from "lucide-react";
import qatarPlaneAsset from "@/assets/qatar-airways-plane.png.asset.json";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useSiteMenus } from "@/hooks/useSiteMenus";

export function Footer() {
  const settings = useSiteSettings();
  const { footer: footerMenu } = useSiteMenus();
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
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-6 h-[280px] md:inset-0 md:top-0 md:h-auto">
        <svg
          viewBox="0 0 800 300"
          preserveAspectRatio="xMidYMin slice"
          className="h-full w-full"
        >
          <defs>
            <linearGradient id="trail-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="oklch(0.85 0.14 85)" stopOpacity="0" />
              <stop offset="100%" stopColor="oklch(0.92 0.16 85)" stopOpacity="1" />
            </linearGradient>
            <path id="flight-path" d="M60,250 Q200,140 360,170 T740,80" />
          </defs>

          {/* Dotted flight path */}
          <use
            href="#flight-path"
            fill="none"
            stroke="oklch(0.9 0.15 85)"
            strokeWidth="1.8"
            strokeDasharray="3 6"
            opacity="0.9"
          />

          {/* Plane trail */}
          <use
            href="#flight-path"
            fill="none"
            stroke="url(#trail-grad)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="80 1000"
            className="footer-plane-trail"
          />

          {/* Origin & destination dots */}
          <g>
            <circle cx="60" cy="250" r="4" fill="oklch(0.9 0.15 85)" />
            <circle cx="60" cy="250" r="10" fill="none" stroke="oklch(0.9 0.15 85)" strokeWidth="1.2" opacity="0.7" />
            <circle cx="740" cy="80" r="4" fill="oklch(0.9 0.15 85)" />
            <circle cx="740" cy="80" r="10" fill="none" stroke="oklch(0.9 0.15 85)" strokeWidth="1.2" opacity="0.7" />
          </g>

          {/* Qatar Airways plane image animated along the SVG path */}
          <image
            href={qatarPlaneAsset.url}
            width="140"
            height="70"
            x="-70"
            y="-35"
            style={{ filter: "drop-shadow(0 0 10px oklch(0.9 0.15 85 / 0.55)) drop-shadow(0 6px 14px rgba(0,0,0,0.55))" }}
          >
            <animateMotion
              dur="9s"
              repeatCount="indefinite"
              rotate="auto"
              path="M60,250 Q200,140 360,170 T740,80"
            />
          </image>
        </svg>
      </div>



      <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 text-center sm:px-6 lg:grid-cols-3 lg:text-left lg:px-8">
        <div>
          <Link to="/" className="inline-flex items-center gap-3">
            {settings.site_logo_url ? (
              <img
                src={settings.site_logo_url}
                alt={settings.site_title}
                className="h-12 w-12 rounded-xl object-cover shadow-[var(--shadow-soft)]"
              />
            ) : (
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary text-primary-foreground shadow-[var(--shadow-soft)]">
                <Home className="h-5 w-5" />
              </span>
            )}
            <span className="flex flex-col leading-tight text-left">
              <span className="font-display text-2xl font-semibold text-white">
                {settings.site_title}
              </span>
              <span className="text-[10px] uppercase tracking-[0.25em] text-gold">
                {settings.site_tagline}
              </span>
            </span>
          </Link>
          <p className="mx-auto mt-4 max-w-sm text-sm text-white/70 lg:mx-0">
            {settings.footer_about}
          </p>
        </div>

        {/* Centerpiece overlay card */}
        <div className="flex justify-center">
          <div className="rounded-2xl border border-white/15 bg-white/[0.04] px-7 py-5 text-center backdrop-blur-xl">
            <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.4em] text-gold">
              <span className="h-px w-6 bg-gold/60" />
              <Plane className="h-3 w-3" />
              <span>{settings.footer_center_eyebrow}</span>
              <span className="h-px w-6 bg-gold/60" />
            </div>
            <p className="mt-2 font-display text-xl font-medium text-white">
              {settings.footer_center_title}
            </p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-white/50">
              {settings.footer_center_subtitle}
            </p>
          </div>
        </div>

        <div className="flex justify-center lg:block lg:justify-self-end">
          <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-white/[0.06] p-6 text-left shadow-[0_8px_30px_rgba(0,0,0,0.25)] backdrop-blur-xl">
            <h4 className="flex items-center justify-center gap-2 text-sm font-semibold uppercase tracking-[0.25em] text-gold lg:justify-start">

              <span className="h-px w-5 bg-gold/60" />
              {settings.footer_contact_heading}
            </h4>
            <ul className="mt-4 space-y-3 text-sm text-white/80">
              {settings.footer_address && (
                <li className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                  {settings.footer_address}
                </li>
              )}
              {settings.footer_phone && (
                <li className="flex items-start gap-2.5">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                  {settings.footer_phone}
                </li>
              )}
              {settings.footer_email && (
                <li className="flex items-start gap-2.5">
                  <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                  {settings.footer_email}
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {footerMenu.length > 0 && (
        <div className="relative border-t border-white/10">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 text-center sm:grid-cols-2 sm:px-6 sm:text-left lg:grid-cols-4 lg:px-8">
            {footerMenu.map((group, gi) => (
              <div key={gi}>
                <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-gold">
                  {group.heading}
                </h4>
                <ul className="space-y-2 text-sm text-white/75">
                  {group.items.map((item, ii) => (
                    <li key={ii}>
                      <Link
                        to={item.to as never}
                        className="transition-colors hover:text-white"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}




      <div className="relative border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-3 px-4 py-5 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.3em] text-gold shadow-[0_0_24px_oklch(0.85_0.14_85/0.18)] backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-gold shadow-[0_0_8px_oklch(0.85_0.14_85)]" />
            Licensed real estate brokerage · Qatar
            <span className="h-1.5 w-1.5 rounded-full bg-gold shadow-[0_0_8px_oklch(0.85_0.14_85)]" />
          </span>
          <p className="text-xs text-white/60">
            © {new Date().getFullYear()} {settings.site_title}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

