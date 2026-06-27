import logo1 from "@/assets/logo-1.png";
import logo2 from "@/assets/logo-2.png";
import logo3 from "@/assets/logo-3.png";
import logo4 from "@/assets/logo-4.png";
import logo5 from "@/assets/logo-5.png";
import logo6 from "@/assets/logo-6.png";

const MAP: Record<string, string> = {
  "/src/assets/logo-1.png": logo1,
  "/src/assets/logo-2.png": logo2,
  "/src/assets/logo-3.png": logo3,
  "/src/assets/logo-4.png": logo4,
  "/src/assets/logo-5.png": logo5,
  "/src/assets/logo-6.png": logo6,
};

const FALLBACKS = [logo1, logo2, logo3, logo4, logo5, logo6];

export function resolveLogo(src: string | null | undefined, seed?: string): string {
  if (src && MAP[src]) return MAP[src];
  if (src && /^(https?:|data:|blob:)/.test(src)) return src;
  if (src && src.startsWith("/") && !src.startsWith("/src/")) return src;
  const key = seed || src || "";
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return FALLBACKS[h % FALLBACKS.length];
}
