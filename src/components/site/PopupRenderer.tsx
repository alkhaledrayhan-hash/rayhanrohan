import { useEffect, useState } from "react";
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
  target_type: string;
  target_value: string | null;
  delay_seconds: number;
  frequency: string;
  position: string;
  bg_color: string | null;
  text_color: string | null;
  accent_color: string | null;
  priority: number;
};

function matchesTarget(p: Popup, pathname: string) {
  if (p.target_type === "all") return true;
  if (!p.target_value) return false;
  if (p.target_type === "route") return pathname === p.target_value;
  if (p.target_type === "prefix") return pathname.startsWith(p.target_value);
  return false;
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

export function PopupRenderer() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [popup, setPopup] = useState<Popup | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Don't show in admin/dashboard
    if (pathname.startsWith("/admin") || pathname.startsWith("/dashboard") || pathname.startsWith("/auth")) {
      setPopup(null);
      setVisible(false);
      return;
    }
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    (async () => {
      const { data, error } = await supabase
        .from("popups")
        .select("*")
        .eq("is_active", true)
        .order("priority", { ascending: false })
        .limit(20);
      if (cancelled || error || !data) return;
      const candidate = (data as Popup[]).find((p) => matchesTarget(p, pathname) && !wasShown(p));
      if (!candidate) return;
      timer = setTimeout(() => {
        if (cancelled) return;
        setPopup(candidate);
        setVisible(true);
        markShown(candidate);
      }, Math.max(0, (candidate.delay_seconds ?? 0) * 1000));
    })();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [pathname]);

  if (!popup || !visible) return null;

  const bg = popup.bg_color || "hsl(var(--background))";
  const text = popup.text_color || "hsl(var(--foreground))";
  const accent = popup.accent_color || "hsl(var(--primary))";

  const positionClass =
    popup.position === "bottom-right"
      ? "items-end justify-end p-4 sm:p-6"
      : popup.position === "top"
        ? "items-start justify-center pt-10 sm:pt-16"
        : "items-center justify-center p-4";

  const panelClass =
    popup.position === "bottom-right"
      ? "w-full max-w-sm rounded-xl shadow-2xl"
      : "w-full max-w-lg rounded-2xl shadow-2xl";

  const close = () => setVisible(false);

  return (
    <div
      className={`fixed inset-0 z-[100] flex ${positionClass} ${popup.position === "center" ? "bg-black/50 backdrop-blur-sm" : ""}`}
      onClick={popup.position === "center" ? close : undefined}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`relative overflow-hidden ${panelClass} animate-in fade-in zoom-in-95`}
        style={{ background: bg, color: text }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={close}
          className="absolute right-3 top-3 z-10 rounded-full bg-black/10 p-1.5 text-current transition hover:bg-black/20"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {popup.template === "promotional" && popup.image_url && (
          <img src={popup.image_url} alt="" className="h-44 w-full object-cover sm:h-56" />
        )}

        {popup.template === "hot-news" && (
          <div className="px-5 pt-5">
            <span
              className="inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
              style={{ background: accent, color: "#fff" }}
            >
              Hot News
            </span>
          </div>
        )}

        {popup.template === "offer" && (
          <div className="px-5 pt-5">
            <span
              className="inline-block rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
              style={{ background: accent, color: "#fff" }}
            >
              Special Offer
            </span>
          </div>
        )}

        {popup.template === "real-estate" && popup.image_url && (
          <img src={popup.image_url} alt="" className="h-48 w-full object-cover" />
        )}

        <div className="p-5 sm:p-6">
          {popup.subtitle && (
            <div className="mb-1 text-xs font-medium uppercase tracking-wider opacity-70">{popup.subtitle}</div>
          )}
          {popup.title && <h3 className="font-display text-xl font-semibold sm:text-2xl">{popup.title}</h3>}
          {popup.body && <p className="mt-2 text-sm opacity-80 whitespace-pre-line">{popup.body}</p>}

          {popup.cta_label && popup.cta_url && (
            <div className="mt-5">
              <a
                href={popup.cta_url}
                onClick={close}
                className="inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
                style={{ background: accent }}
              >
                {popup.cta_label}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
