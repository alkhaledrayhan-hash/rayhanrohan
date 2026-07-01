import { useEffect, useState } from "react";
import { Facebook, Twitter, Instagram, Linkedin, Youtube, MessageCircle, Music2, Send, Link as LinkIcon, Check } from "lucide-react";
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

  useEffect(() => {
    setPageUrl(window.location.href);
  }, []);

  if ((s as any).share_button_enabled !== "true") return null;

  const raw = (k: string) => ((s as any)[k] || "").toString().trim();

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
    const horizontal = side === "left" ? "left-0" : "right-0";
    return `${vertical} ${horizontal}`;
  })();

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl || window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {}
  };

  void side;
  const rowSide = side === "left" ? "flex-row" : "flex-row-reverse";
  const roundOf = (idx: number, total: number) => {
    const isFirst = idx === 0;
    const isLast = idx === total - 1;
    if (side === "left") {
      return `${isFirst ? "rounded-tr-2xl" : ""} ${isLast ? "rounded-br-2xl" : ""}`;
    }
    return `${isFirst ? "rounded-tl-2xl" : ""} ${isLast ? "rounded-bl-2xl" : ""}`;
  };
  const totalRows = items.length + 1;

  return (
    <aside
      className={`fixed z-[70] ${containerCls} w-max flex flex-col`}
      aria-label="Share this page"
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
            className={`group relative flex ${rowSide} items-center h-11 text-white ${roundOf(idx, totalRows)}`}
            style={{ background: it.color }}
          >
            <span className="grid w-11 h-11 shrink-0 place-items-center transition-transform duration-300 group-hover:scale-110">
              <Icon className="h-[18px] w-[18px]" />
            </span>
            <span
              className="max-w-0 opacity-0 whitespace-nowrap text-[13px] font-medium tracking-wide transition-[max-width,opacity,padding] duration-300 ease-out group-hover:max-w-[200px] group-hover:opacity-100 group-hover:pr-4 group-hover:pl-2"
            >

              {it.label}
            </span>
          </a>
        );
      })}
      <button
        type="button"
        onClick={copyLink}
        aria-label="Copy link"
        className={`group relative flex ${rowSide} items-center h-11 text-white ${roundOf(totalRows - 1, totalRows)}`}
        style={{ background: "#334155" }}
      >
        <span className="grid w-11 h-11 shrink-0 place-items-center transition-transform duration-300 group-hover:scale-110">
          {copied ? <Check className="h-[18px] w-[18px]" /> : <LinkIcon className="h-[18px] w-[18px]" />}
        </span>
        <span className="max-w-0 opacity-0 whitespace-nowrap text-[13px] font-medium tracking-wide transition-[max-width,opacity,padding] duration-300 ease-out group-hover:max-w-[180px] group-hover:opacity-100 group-hover:px-3">
          {copied ? "Copied!" : "Copy link"}
        </span>
      </button>

    </aside>
  );
}
