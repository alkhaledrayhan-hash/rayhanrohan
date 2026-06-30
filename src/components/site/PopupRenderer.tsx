import { useEffect, useState, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";

type Popup = {
  id: string;
  name: string;
  template: string;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  image_url: string | null;
  cta_label: string | null;
  cta_url: string | null;
  secondary_cta_label: string | null;
  secondary_cta_url: string | null;
  collect_email: boolean;
  email_placeholder: string | null;
  target_type: string;
  target_value: string | null;
  trigger_type: string;
  scroll_threshold: number;
  device_target: string;
  visitor_target: string;
  delay_seconds: number;
  frequency: string;
  position: string;
  bg_color: string | null;
  text_color: string | null;
  accent_color: string | null;
  overlay_color: string | null;
  overlay_opacity: number;
  overlay_blur: number;
  animation: string;
  border_radius: number;
  shadow: string;
  font_family: string | null;
  title_size: number;
  body_size: number;
  variant_b: any;
  ab_split: number;
  priority: number;
};

const RETURNING_KEY = "lovable:hasVisited";

function matchesTarget(p: Popup, pathname: string) {
  if (p.target_type === "all") return true;
  if (!p.target_value) return false;
  if (p.target_type === "route") return pathname === p.target_value;
  if (p.target_type === "prefix") return pathname.startsWith(p.target_value);
  return false;
}

function matchesDevice(p: Popup) {
  if (!p.device_target || p.device_target === "all") return true;
  const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
  if (p.device_target === "mobile") return isMobile;
  if (p.device_target === "desktop") return !isMobile;
  return true;
}

function matchesVisitor(p: Popup) {
  if (!p.visitor_target || p.visitor_target === "all") return true;
  try {
    const hasVisited = localStorage.getItem(RETURNING_KEY) === "1";
    if (p.visitor_target === "new") return !hasVisited;
    if (p.visitor_target === "returning") return hasVisited;
  } catch {}
  return true;
}

function wasShown(p: Popup) {
  if (p.frequency === "always") return false;
  const key = `popup:${p.id}:${p.frequency}`;
  try {
    if (p.frequency === "session") return sessionStorage.getItem(key) === "1";
    if (p.frequency === "once") return localStorage.getItem(key) === "1";
  } catch {}
  return false;
}

function markShown(p: Popup) {
  const key = `popup:${p.id}:${p.frequency}`;
  try {
    if (p.frequency === "session") sessionStorage.setItem(key, "1");
    else if (p.frequency === "once") localStorage.setItem(key, "1");
  } catch {}
}

function sessionId() {
  try {
    let id = sessionStorage.getItem("lovable:sessionId");
    if (!id) { id = Math.random().toString(36).slice(2); sessionStorage.setItem("lovable:sessionId", id); }
    return id;
  } catch { return "anon"; }
}

async function logEvent(popupId: string, eventType: "view" | "click" | "dismiss" | "conversion", variant: "a" | "b") {
  try {
    await supabase.from("popup_events").insert({ popup_id: popupId, event_type: eventType, variant, session_id: sessionId() });
  } catch {}
}

function pickVariant(p: Popup): "a" | "b" {
  if (!p.ab_split || p.ab_split <= 0) return "a";
  return Math.random() * 100 < p.ab_split ? "b" : "a";
}

const SHADOW_MAP: Record<string, string> = {
  none: "none",
  sm: "0 1px 2px rgba(0,0,0,.08)",
  md: "0 4px 12px rgba(0,0,0,.1)",
  lg: "0 10px 25px rgba(0,0,0,.15)",
  xl: "0 25px 50px -12px rgba(0,0,0,.25)",
  "2xl": "0 35px 60px -15px rgba(0,0,0,.35)",
};

const ANIMATION_MAP: Record<string, string> = {
  fade: "popup-fade",
  zoom: "popup-zoom",
  "slide-up": "popup-slide-up",
  "slide-down": "popup-slide-down",
  bounce: "popup-bounce",
  none: "",
};

export function PopupRenderer() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [popup, setPopup] = useState<Popup | null>(null);
  const [variant, setVariant] = useState<"a" | "b">("a");
  const [visible, setVisible] = useState(false);
  const triggerCleanupRef = useRef<(() => void) | null>(null);

  // mark returning visitor
  useEffect(() => {
    try { localStorage.setItem(RETURNING_KEY, "1"); } catch {}
  }, []);

  useEffect(() => {
    // Don't show in admin/dashboard/auth
    if (pathname.startsWith("/admin") || pathname.startsWith("/dashboard") || pathname.startsWith("/auth")) {
      setPopup(null); setVisible(false);
      return;
    }
    let cancelled = false;
    triggerCleanupRef.current?.();
    triggerCleanupRef.current = null;

    (async () => {
      const { data, error } = await supabase
        .from("popups")
        .select("*")
        .eq("is_active", true)
        .order("priority", { ascending: false })
        .limit(30);
      if (cancelled || error || !data) return;
      const candidate = (data as Popup[]).find(
        (p) => matchesTarget(p, pathname) && matchesDevice(p) && matchesVisitor(p) && !wasShown(p),
      );
      if (!candidate) return;

      const show = () => {
        if (cancelled) return;
        const v = pickVariant(candidate);
        setPopup(candidate);
        setVariant(v);
        setVisible(true);
        markShown(candidate);
        logEvent(candidate.id, "view", v);
      };

      const trigger = candidate.trigger_type || "time";
      let timer: ReturnType<typeof setTimeout> | null = null;
      let scrollListener: (() => void) | null = null;
      let exitListener: ((e: MouseEvent) => void) | null = null;
      let scrollHit = false;
      let timeHit = false;

      const maybeFire = () => {
        if (trigger === "time_and_scroll") {
          if (scrollHit && timeHit) show();
        } else {
          show();
        }
      };

      if (trigger === "time" || trigger === "time_and_scroll") {
        timer = setTimeout(() => { timeHit = true; maybeFire(); }, Math.max(0, (candidate.delay_seconds ?? 0) * 1000));
      }
      if (trigger === "scroll" || trigger === "time_and_scroll") {
        scrollListener = () => {
          const h = document.documentElement;
          const scrolled = (h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight)) * 100;
          if (scrolled >= (candidate.scroll_threshold ?? 50)) {
            scrollHit = true;
            maybeFire();
            if (scrollListener) window.removeEventListener("scroll", scrollListener);
          }
        };
        window.addEventListener("scroll", scrollListener, { passive: true });
      }
      if (trigger === "exit_intent") {
        exitListener = (e: MouseEvent) => {
          if (e.clientY <= 0) {
            show();
            if (exitListener) document.removeEventListener("mouseout", exitListener);
          }
        };
        document.addEventListener("mouseout", exitListener);
      }

      triggerCleanupRef.current = () => {
        if (timer) clearTimeout(timer);
        if (scrollListener) window.removeEventListener("scroll", scrollListener);
        if (exitListener) document.removeEventListener("mouseout", exitListener);
      };
    })();

    return () => {
      cancelled = true;
      triggerCleanupRef.current?.();
      triggerCleanupRef.current = null;
    };
  }, [pathname]);

  if (!popup || !visible) return null;

  // Merge variant B overrides
  const vb = variant === "b" && popup.variant_b ? popup.variant_b : {};
  const title = vb.title ?? popup.title;
  const body = vb.body ?? popup.body;
  const ctaLabel = vb.cta_label ?? popup.cta_label;
  const accent = vb.accent_color || popup.accent_color || "hsl(var(--primary))";

  const bg = popup.bg_color || "hsl(var(--background))";
  const text = popup.text_color || "hsl(var(--foreground))";
  const radius = popup.border_radius ?? 16;
  const shadowVal = SHADOW_MAP[popup.shadow || "xl"] ?? SHADOW_MAP.xl;
  const animClass = ANIMATION_MAP[popup.animation || "fade"] || "";

  const positionClass =
    popup.position === "bottom-right" ? "items-end justify-end p-4 sm:p-6"
      : popup.position === "bottom" ? "items-end justify-center pb-4 sm:pb-6"
        : popup.position === "top" ? "items-start justify-center pt-10 sm:pt-16"
          : "items-center justify-center p-4";

  const isCorner = popup.position === "bottom-right";
  const isBanner = popup.position === "bottom" || popup.position === "top";

  const close = (asDismiss = true) => {
    if (asDismiss) logEvent(popup.id, "dismiss", variant);
    setVisible(false);
  };

  const onCta = (url?: string | null) => {
    logEvent(popup.id, "click", variant);
    setVisible(false);
    if (url) window.location.href = url;
  };

  const onEmailSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "");
    if (!email) return;
    logEvent(popup.id, "conversion", variant);
    // Store opt-in as a lead
    supabase.from("leads").insert({ name: "Popup signup", email, message: `Subscribed via popup "${popup.name}"`, source: "popup" }).then(() => {}, () => {});
    setVisible(false);
    if (popup.cta_url) window.location.href = popup.cta_url;
  };

  const overlayBg = popup.position === "center"
    ? hexWithAlpha(popup.overlay_color || "#000000", popup.overlay_opacity ?? 50)
    : "transparent";

  return (
    <div
      className={`fixed inset-0 z-[100] flex ${positionClass}`}
      style={{
        background: overlayBg,
        backdropFilter: popup.position === "center" && (popup.overlay_blur ?? 0) > 0 ? `blur(${popup.overlay_blur}px)` : undefined,
      }}
      onClick={popup.position === "center" ? () => close(true) : undefined}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`relative overflow-hidden ${animClass} ${isCorner ? "w-full max-w-sm" : isBanner ? "w-full max-w-3xl" : popup.template === "split-image" ? "w-full max-w-2xl" : "w-full max-w-lg"}`}
        style={{
          background: popup.template === "gradient-hero"
            ? `linear-gradient(135deg, ${accent}, ${shiftColor(accent, -40)})`
            : popup.template === "glass-card"
              ? `linear-gradient(135deg, ${withAlpha(accent, 0.15)}, ${withAlpha(accent, 0.05)}), ${bg}`
              : bg,
          color: text,
          borderRadius: radius,
          boxShadow: shadowVal,
          fontFamily: popup.font_family || undefined,
          backdropFilter: popup.template === "glass-card" ? "blur(20px) saturate(140%)" : undefined,
          border: popup.template === "glass-card" ? `1px solid ${withAlpha(accent, 0.25)}` : undefined,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => close(true)}
          className="absolute right-3 top-3 z-10 rounded-full bg-black/10 p-1.5 text-current transition hover:bg-black/20"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Decorative blobs for gradient-hero & glass-card */}
        {(popup.template === "gradient-hero" || popup.template === "glass-card") && (
          <>
            <div className="pointer-events-none absolute -left-12 -top-12 h-40 w-40 rounded-full opacity-40 blur-3xl" style={{ background: shiftColor(accent, 60) }} />
            <div className="pointer-events-none absolute -bottom-16 -right-10 h-48 w-48 rounded-full opacity-30 blur-3xl" style={{ background: shiftColor(accent, -30) }} />
            <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)", backgroundSize: "18px 18px" }} />
          </>
        )}

        {popup.template === "split-image" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2">
            <div className="relative min-h-[180px] sm:min-h-[260px]">
              {popup.image_url ? (
                <img src={popup.image_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${accent}, ${shiftColor(accent, -40)})` }} />
              )}
            </div>
            <PopupBody popup={popup} title={title} body={body} ctaLabel={ctaLabel} accent={accent} onCta={onCta} onEmailSubmit={onEmailSubmit} close={close} />
          </div>
        ) : popup.template === "video" && body?.startsWith("http") ? (
          <>
            <div className="aspect-video w-full"><iframe src={body} className="h-full w-full" allowFullScreen title="popup-video" /></div>
            <PopupBody popup={popup} title={title} body={body} ctaLabel={ctaLabel} accent={accent} onCta={onCta} onEmailSubmit={onEmailSubmit} close={close} />
          </>
        ) : (
          <>
            {popup.image_url && popup.template !== "gradient-hero" && popup.template !== "glass-card" ? (
              <img src={popup.image_url} alt="" className={`w-full object-cover ${isCorner ? "h-32" : "h-44 sm:h-56"}`} />
            ) : null}

            {(popup.template === "hot-news" || popup.template === "offer") && (
              <div className="relative px-5 pt-5">
                <span className="inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide" style={{ background: accent, color: "#fff" }}>
                  {popup.template === "hot-news" ? "Hot News" : "Special Offer"}
                </span>
              </div>
            )}
            <PopupBody popup={popup} title={title} body={body} ctaLabel={ctaLabel} accent={accent} onCta={onCta} onEmailSubmit={onEmailSubmit} close={close} />
          </>
        )}
      </div>


      <style>{`
        @keyframes popup-fade-kf { from { opacity: 0 } to { opacity: 1 } }
        @keyframes popup-zoom-kf { from { opacity: 0; transform: scale(.92) } to { opacity: 1; transform: scale(1) } }
        @keyframes popup-slide-up-kf { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes popup-slide-down-kf { from { opacity: 0; transform: translateY(-24px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes popup-bounce-kf { 0% { opacity: 0; transform: scale(.6) } 60% { opacity: 1; transform: scale(1.05) } 100% { transform: scale(1) } }
        .popup-fade { animation: popup-fade-kf .25s ease-out }
        .popup-zoom { animation: popup-zoom-kf .3s cubic-bezier(.22,1,.36,1) }
        .popup-slide-up { animation: popup-slide-up-kf .35s cubic-bezier(.22,1,.36,1) }
        .popup-slide-down { animation: popup-slide-down-kf .35s cubic-bezier(.22,1,.36,1) }
        .popup-bounce { animation: popup-bounce-kf .5s cubic-bezier(.34,1.56,.64,1) }
      `}</style>
    </div>
  );
}

function hexWithAlpha(hex: string, opacity: number) {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(0,0,0,${opacity / 100})`;
  return `rgba(${r},${g},${b},${opacity / 100})`;
}

function withAlpha(color: string, alpha: number) {
  if (color.startsWith("#")) return hexWithAlpha(color, alpha * 100);
  return color;
}

function shiftColor(color: string, amount: number) {
  // amount: -100..100, shifts each channel toward 0 (negative) or 255 (positive)
  if (!color.startsWith("#")) return color;
  const clean = color.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return color;
  const shift = (v: number) => Math.max(0, Math.min(255, v + amount));
  const hex = (n: number) => shift(n).toString(16).padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

type PopupBodyProps = {
  popup: Popup;
  title: string | null;
  body: string | null;
  ctaLabel: string | null;
  accent: string;
  onCta: (url?: string | null) => void;
  onEmailSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  close: (asDismiss?: boolean) => void;
};

function PopupBody({ popup, title, body, ctaLabel, accent, onCta, onEmailSubmit, close }: PopupBodyProps) {
  const isSplit = popup.template === "split-image";
  return (
    <div className={`relative ${isSplit ? "flex flex-col justify-center p-5 sm:p-6" : "p-5 sm:p-6"}`} style={{ fontSize: popup.body_size ?? 14 }}>
      {popup.subtitle && (
        <div className="mb-1 text-xs font-medium uppercase tracking-wider opacity-70">{popup.subtitle}</div>
      )}
      {title && <h3 className="font-display font-semibold leading-tight" style={{ fontSize: popup.title_size ?? 24 }}>{title}</h3>}
      {body && popup.template !== "video" && <p className="mt-2 opacity-80 whitespace-pre-line">{body}</p>}

      {popup.collect_email ? (
        <form className="mt-4 space-y-2" onSubmit={onEmailSubmit}>
          <input
            type="email" name="email" required
            placeholder={popup.email_placeholder || "you@example.com"}
            className="w-full rounded-md border border-current/20 bg-white/90 px-3 py-2 text-sm text-slate-900"
          />
          <div className="flex flex-wrap gap-2">
            <button type="submit" className="inline-flex flex-1 items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90" style={{ background: accent }}>
              {ctaLabel || "Subscribe"}
            </button>
            {popup.secondary_cta_label && (
              <button type="button" onClick={() => close(true)} className="rounded-md border border-current/30 px-4 py-2.5 text-sm font-semibold">
                {popup.secondary_cta_label}
              </button>
            )}
          </div>
        </form>
      ) : (
        (ctaLabel || popup.secondary_cta_label) && (
          <div className="mt-5 flex flex-wrap gap-2">
            {ctaLabel && (
              <button onClick={() => onCta(popup.cta_url)} className="inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90" style={{ background: accent }}>
                {ctaLabel}
              </button>
            )}
            {popup.secondary_cta_label && (
              <button onClick={() => popup.secondary_cta_url ? onCta(popup.secondary_cta_url) : close(true)} className="inline-flex items-center justify-center rounded-md border border-current/30 px-5 py-2.5 text-sm font-semibold">
                {popup.secondary_cta_label}
              </button>
            )}
          </div>
        )
      )}
    </div>
  );
}

