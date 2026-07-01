import { useEffect, useRef, useState } from "react";
import { Share2, X, Facebook, Twitter, Linkedin, MessageCircle, Send, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

type Item = {
  key: string;
  label: string;
  href: string;
  color: string;
  Icon: React.ComponentType<{ className?: string }>;
};

export function ShareButton() {
  const [open, setOpen] = useState(false);
  const [pageUrl, setPageUrl] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setPageUrl(window.location.href);
  }, []);

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

  const enc = encodeURIComponent(pageUrl || (typeof window !== "undefined" ? window.location.href : ""));

  const items: Item[] = [
    { key: "facebook", label: "Facebook", color: "#1877F2", Icon: Facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${enc}` },
    { key: "twitter", label: "X / Twitter", color: "#0f1419", Icon: Twitter, href: `https://twitter.com/intent/tweet?url=${enc}` },
    { key: "linkedin", label: "LinkedIn", color: "#0A66C2", Icon: Linkedin, href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc}` },
    { key: "whatsapp", label: "WhatsApp", color: "#25D366", Icon: MessageCircle, href: `https://wa.me/?text=${enc}` },
    { key: "telegram", label: "Telegram", color: "#229ED9", Icon: Send, href: `https://t.me/share/url?url=${enc}` },
  ];

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      toast.success("Link copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  const cls = "right-3 top-1/2 -translate-y-1/2";
  const center = 180;
  const arcSpan = 160;

  const all = [
    ...items,
    { key: "__copy", label: "Copy link", color: "#334155", Icon: LinkIcon, href: "" },
  ];
  const total = all.length;
  const step = total > 1 ? Math.min(arcSpan / (total - 1), 42) : 0;
  const usedArc = step * (total - 1);
  const minRadius = total > 1 ? 26 / Math.sin((step * Math.PI) / 360) : 0;
  const radius = Math.max(96, Math.ceil(minRadius));
  const start = center - usedArc / 2;

  return (
    <div ref={ref} className={`fixed z-[70] ${cls}`} aria-live="polite">
      <div className="relative">
        {all.map((it, i) => {
          const deg = start + step * i;
          const rad = (deg * Math.PI) / 180;
          const x = Math.cos(rad) * radius;
          const y = Math.sin(rad) * radius;
          const isCopy = it.key === "__copy";
          const style: React.CSSProperties = open
            ? {
                transform: `translate(-50%, -50%) translate(${x}px, ${y}px) scale(1)`,
                opacity: 1,
                transitionDelay: `${i * 40}ms`,
                background: isCopy
                  ? "linear-gradient(135deg, rgba(71,85,105,0.92), rgba(30,41,59,0.82))"
                  : `linear-gradient(135deg, ${it.color}f2, ${it.color}bf)`,
                boxShadow: isCopy
                  ? "0 8px 24px -6px rgba(15,23,42,0.5), inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.2)"
                  : `0 8px 24px -6px ${it.color}66, inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -1px 0 rgba(0,0,0,0.15)`,
              }
            : { transform: "translate(-50%, -50%) scale(0.4)", opacity: 0, pointerEvents: "none" };
          const Icon = it.Icon;
          const cn = "ios-glass-btn absolute left-1/2 top-1/2 grid h-11 w-11 place-items-center rounded-full text-white transition-all duration-300 ease-out hover:scale-110";
          if (isCopy) {
            return (
              <button
                key="copy"
                type="button"
                onClick={() => { copyLink(); setOpen(false); }}
                aria-label="Copy link"
                title="Copy link"
                style={style}
                className={cn}
              >
                <LinkIcon className="h-5 w-5" />
              </button>
            );
          }
          return (
            <a
              key={it.key}
              href={it.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              aria-label={`Share on ${it.label}`}
              title={it.label}
              style={style}
              className={cn}
            >
              <Icon className="h-5 w-5" />
            </a>
          );
        })}

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close share menu" : "Open share menu"}
          className={`ios-glass-btn ios-glass-btn--primary relative grid h-12 w-12 place-items-center rounded-full text-white transition-transform hover:scale-110 ${open ? "rotate-90" : ""}`}
        >
          {open ? <X className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
