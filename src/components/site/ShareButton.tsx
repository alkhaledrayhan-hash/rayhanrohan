import { useEffect, useState } from "react";
import { Facebook, Twitter, Instagram, Linkedin, Youtube, MessageCircle, Music2, Send, Link as LinkIcon, Check, Share2 } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

type Item = {
  key: string;
  label: string;
  href: string;
  color: string;
  Icon: React.ComponentType<{ className?: string }>;
};

export function ShareButton() {
  const s = useSiteSettings();
  const [pageUrl, setPageUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setPageUrl(window.location.href);
  }, []);

  if ((s as any).share_button_enabled !== "true") return null;

  const raw = (k: string) => ((s as any)[k] || "").toString().trim();
  void pageUrl;

  const items: Item[] = [
    { key: "facebook", label: "Facebook", color: "#1877F2", Icon: Facebook, href: raw("share_facebook_url") },
    { key: "twitter", label: "X / Twitter", color: "#0f1419", Icon: Twitter, href: raw("share_twitter_url") },
    { key: "linkedin", label: "LinkedIn", color: "#0A66C2", Icon: Linkedin, href: raw("share_linkedin_url") },
    { key: "whatsapp", label: "WhatsApp", color: "#25D366", Icon: MessageCircle, href: raw("share_whatsapp_url") },
    { key: "telegram", label: "Telegram", color: "#229ED9", Icon: Send, href: raw("share_telegram_url") },
    { key: "instagram", label: "Instagram", color: "#E4405F", Icon: Instagram, href: raw("share_instagram_url") },
    { key: "youtube", label: "YouTube", color: "#FF0000", Icon: Youtube, href: raw("share_youtube_url") },
    { key: "tiktok", label: "TikTok", color: "#111111", Icon: Music2, href: raw("share_tiktok_url") },
  ].filter((i) => !!i.href);

  const position = ((s as any).share_button_position || "right-middle") as
    | "right-middle" | "right-top" | "right-bottom"
    | "left-middle" | "left-top" | "left-bottom";

  const side: "right" | "left" = position.startsWith("left") ? "left" : "right";

  const containerCls = (() => {
    const v = position.split("-")[1];
    const vertical =
      v === "top" ? "top-24" :
      v === "bottom" ? "bottom-8" :
      "top-1/2 -translate-y-1/2";
    const horizontal = side === "left" ? "left-3" : "right-3";
    return `${vertical} ${horizontal}`;
  })();

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl || window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {}
  };

  const rowDir = side === "left" ? "flex-row" : "flex-row-reverse";

  return (
    <aside
      className={`fixed z-[70] ${containerCls} flex ${rowDir} items-center gap-2`}
      aria-label="Share this page"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Share"
        aria-expanded={open}
        className="grid place-items-center h-12 w-12 rounded-full text-white shadow-[0_10px_30px_-8px_rgba(15,23,42,0.5)] ring-1 ring-black/10 backdrop-blur-md transition-transform duration-300 hover:scale-105"
        style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.75))" }}
      >
        <Share2 className="h-5 w-5" />
      </button>

      {/* Expanding panel */}
      <div
        className={`flex ${rowDir} items-center gap-2 transition-all duration-300 ease-out ${
          open ? "opacity-100 translate-x-0 pointer-events-auto" : "opacity-0 pointer-events-none " + (side === "left" ? "-translate-x-3" : "translate-x-3")
        }`}
      >
        {items.map((it, idx) => {
          const Icon = it.Icon;
          return (
            <a
              key={it.key}
              href={it.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Share on ${it.label}`}
              title={it.label}
              className="grid place-items-center h-10 w-10 rounded-full text-white shadow-md ring-1 ring-black/10 transition-transform duration-300 hover:scale-110"
              style={{
                background: it.color,
                transitionDelay: open ? `${idx * 40}ms` : "0ms",
              }}
            >
              <Icon className="h-[16px] w-[16px]" />
            </a>
          );
        })}
        <button
          type="button"
          onClick={copyLink}
          aria-label="Copy link"
          title={copied ? "Copied!" : "Copy link"}
          className="grid place-items-center h-10 w-10 rounded-full text-white shadow-md ring-1 ring-black/10 transition-transform duration-300 hover:scale-110"
          style={{
            background: "#334155",
            transitionDelay: open ? `${items.length * 40}ms` : "0ms",
          }}
        >
          {copied ? <Check className="h-[16px] w-[16px]" /> : <LinkIcon className="h-[16px] w-[16px]" />}
        </button>
      </div>
    </aside>
  );
}
