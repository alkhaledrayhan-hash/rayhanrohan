// Resolves legacy cover_image paths (e.g. "/src/assets/prop-1.jpg") stored in
// the posts table to real Vite-bundled URLs that work in production.
// Any other path (http(s), data:, /uploads/...) is returned unchanged.
import prop1 from "@/assets/prop-1.jpg?w=1200&quality=72&format=webp";
import prop2 from "@/assets/prop-2.jpg?w=1200&quality=72&format=webp";
import prop3 from "@/assets/prop-3.jpg?w=1200&quality=72&format=webp";
import prop4 from "@/assets/prop-4.jpg?w=1200&quality=72&format=webp";
import prop5 from "@/assets/prop-5.jpg?w=1200&quality=72&format=webp";
import prop6 from "@/assets/prop-6.jpg?w=1200&quality=72&format=webp";
import prop7 from "@/assets/prop-7.jpg?w=1200&quality=72&format=webp";

const SEED_MAP: Record<string, string> = {
  "/src/assets/prop-1.jpg": prop1,
  "/src/assets/prop-2.jpg": prop2,
  "/src/assets/prop-3.jpg": prop3,
  "/src/assets/prop-4.jpg": prop4,
  "/src/assets/prop-5.jpg": prop5,
  "/src/assets/prop-6.jpg": prop6,
  "/src/assets/prop-7.jpg": prop7,
};

const FALLBACKS = [prop1, prop2, prop3, prop4, prop5, prop6, prop7];

export function resolveCover(src: string | null | undefined, seed?: string): string {
  if (src && SEED_MAP[src]) return SEED_MAP[src];
  if (src && /^(https?:|data:|blob:)/.test(src)) return src;
  if (src && src.startsWith("/") && !src.startsWith("/src/")) return src;
  // Deterministic fallback so each post still shows an image
  const key = seed || src || "";
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return FALLBACKS[h % FALLBACKS.length];
}
