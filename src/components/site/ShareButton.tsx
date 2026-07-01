import { useEffect, useRef, useState } from "react";
import { Share2, X, Facebook, Twitter, Instagram, Linkedin, Youtube, MessageCircle, Music2, Send, Link as LinkIcon } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { toast } from "sonner";

type Item = {
  key: string;
  label: string;
  href: string;
  color: string;
  Icon: React.ComponentType<{ className?: string }>;
};

export function ShareButton() {
  const s = useSiteSettings();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if ((s as any).share_button_enabled !== "true") return null;

  const pageUrl = typeof window !== "undefined" ? window.location.href : (s.site_url || "");
  const raw = (k: string) => ((s as any)[k] || "").toString().trim();


  // Only show icons that the admin explicitly configured with a URL.
  // Blank field = hidden on the frontend (no auto share-intent fallback).
  const items: Item[] = [
    { key: "facebook", label: "Facebook", color: "#1877F2", Icon: Facebook, href: raw("share_facebook_url") },
    { key: "twitter", label: "X / Twitter", color: "#0f1419", Icon: Twitter, href: raw("share_twitter_url") },
    { key: "linkedin", label: "LinkedIn", color: "#0A66C2", Icon: Linkedin, href: raw("share_linkedin_url") },
    { key: "whatsapp", label: "WhatsApp", color: "#25D366", Icon: MessageCircle, href: raw("share_whatsapp_url") },
    { key: "telegram", label: "Telegram", color: "#229ED9", Icon: Send, href: raw("share_telegram_url") },
    { key: "instagram", label: "Instagram", color: "#E4405F", Icon: Instagram, href: raw("share_instagram_url") },
    { key: "youtube", label: "YouTube", color: "#FF0000", Icon: Youtube, href: raw("share_youtube_url") },
    { key: "tiktok", label: "TikTok", color: "#000000", Icon: Music2, href: raw("share_tiktok_url") },
  ].filter((i) => !!i.href);

  if (items.length === 0 && !pageUrl) return null;


  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      toast.success("Link copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  return (
    <div
      ref={ref}
      className="fixed right-3 top-1/2 z-[70] -translate-y-1/2"
      aria-live="polite"
    >
      <div className="relative">
        {/* Radial icons */}
        {items.map((it, i) => {
          // Fan out to the LEFT of the button in a quarter/half arc.
          const total = items.length + 1; // + copy link
          const startDeg = 150; // upper-left
          const endDeg = 210;   // lower-left
          const step = total > 1 ? (endDeg - startDeg) / (total - 1) : 0;
          const deg = startDeg + step * i;
          const rad = (deg * Math.PI) / 180;
          const radius = 96;
          const x = Math.cos(rad) * radius;
          const y = Math.sin(rad) * radius;
          const style: React.CSSProperties = open
            ? { transform: `translate(${x}px, ${y}px) scale(1)`, opacity: 1, transitionDelay: `${i * 40}ms` }
            : { transform: "translate(0,0) scale(0.4)", opacity: 0, pointerEvents: "none" };
          const Icon = it.Icon;
          return (
            <a
              key={it.key}
              href={it.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              aria-label={`Share on ${it.label}`}
              title={it.label}
              style={{ ...style, backgroundColor: it.color }}
              className="absolute right-0 top-0 grid h-11 w-11 place-items-center rounded-full text-white shadow-lg ring-1 ring-black/10 transition-all duration-300 ease-out hover:scale-110"
            >
              <Icon className="h-5 w-5" />
            </a>
          );
        })}

        {/* Copy link (last radial slot) */}
        {(() => {
          const total = items.length + 1;
          const i = items.length;
          const startDeg = 150;
          const endDeg = 210;
          const step = total > 1 ? (endDeg - startDeg) / (total - 1) : 0;
          const deg = startDeg + step * i;
          const rad = (deg * Math.PI) / 180;
          const radius = 96;
          const x = Math.cos(rad) * radius;
          const y = Math.sin(rad) * radius;
          const style: React.CSSProperties = open
            ? { transform: `translate(${x}px, ${y}px) scale(1)`, opacity: 1, transitionDelay: `${i * 40}ms` }
            : { transform: "translate(0,0) scale(0.4)", opacity: 0, pointerEvents: "none" };
          return (
            <button
              type="button"
              onClick={() => { copyLink(); setOpen(false); }}
              aria-label="Copy link"
              title="Copy link"
              style={{ ...style, backgroundColor: "#334155" }}
              className="absolute right-0 top-0 grid h-11 w-11 place-items-center rounded-full text-white shadow-lg ring-1 ring-black/10 transition-all duration-300 ease-out hover:scale-110"
            >
              <LinkIcon className="h-5 w-5" />
            </button>
          );
        })()}

        {/* Main toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close share menu" : "Open share menu"}
          className={`relative grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-xl ring-1 ring-primary/40 transition-transform hover:scale-110 ${open ? "rotate-90" : ""}`}
        >
          {open ? <X className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
