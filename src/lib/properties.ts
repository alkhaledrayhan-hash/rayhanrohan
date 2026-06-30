import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import prop1 from "@/assets/prop-1.jpg?w=1200&quality=72&format=webp";
import prop2 from "@/assets/prop-2.jpg?w=1200&quality=72&format=webp";
import prop3 from "@/assets/prop-3.jpg?w=1200&quality=72&format=webp";
import prop4 from "@/assets/prop-4.jpg?w=1200&quality=72&format=webp";
import prop5 from "@/assets/prop-5.jpg?w=1200&quality=72&format=webp";
import prop6 from "@/assets/prop-6.jpg?w=1200&quality=72&format=webp";
import prop7 from "@/assets/prop-7.jpg?w=1200&quality=72&format=webp";

export type Status = "rent" | "sale";
export type PropertyType = "Apartment" | "Villa" | "Studio" | "Penthouse" | "Townhouse";
export const LOCATIONS = ["Doha", "The Pearl", "Lusail", "West Bay", "Al Waab"] as const;
export type Location = (typeof LOCATIONS)[number];

export interface Property {
  id: string; // slug
  title: string;
  location: Location;
  address: string;
  type: PropertyType;
  status: Status;
  price: number;
  bedrooms: number;
  bathrooms: number;
  rooms: number;
  sqft: number;
  yearBuilt: number;
  image: string;
  gallery: string[];
  description: string;
  features: string[];
  verified?: boolean;
  isOffer?: boolean;
  offerDiscount?: number;
  offerTag?: string;
  offerEnds?: string;
  assignedAgentId?: string | null;
}

const SEEDED_PROPERTY_IMAGES: Record<string, string> = {
  "/src/assets/prop-1.jpg": prop1,
  "/src/assets/prop-2.jpg": prop2,
  "/src/assets/prop-3.jpg": prop3,
  "/src/assets/prop-4.jpg": prop4,
  "/src/assets/prop-5.jpg": prop5,
  "/src/assets/prop-6.jpg": prop6,
  "/src/assets/prop-7.jpg": prop7,
};

const PROPERTY_IMAGE_FALLBACKS = [prop1, prop2, prop3, prop4, prop5, prop6, prop7];

export function resolvePropertyImage(src: string | null | undefined, seed?: string): string {
  if (src && SEEDED_PROPERTY_IMAGES[src]) return SEEDED_PROPERTY_IMAGES[src];
  if (src && /^(https?:|data:|blob:)/.test(src)) return src;

  // Map any path ending in prop-N.jpg/.png/.webp (e.g. /demo/prop-3.jpg) to bundled asset.
  if (src) {
    const m = src.match(/prop-([1-7])\.(jpg|jpeg|png|webp)$/i);
    if (m) return PROPERTY_IMAGE_FALLBACKS[Number(m[1]) - 1] ?? PROPERTY_IMAGE_FALLBACKS[0];
  }

  if (src && src.startsWith("/") && !src.startsWith("/src/") && !src.startsWith("/demo/")) return src;

  const key = seed || src || "property";
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return PROPERTY_IMAGE_FALLBACKS[h % PROPERTY_IMAGE_FALLBACKS.length];
}


function mapRow(r: any): Property {
  const rawGallery = Array.isArray(r.gallery) ? r.gallery : [];
  const gallery = rawGallery.map((src: string) => resolvePropertyImage(src, r.slug));
  const features = Array.isArray(r.features) ? r.features : [];
  return {
    id: r.slug,
    title: r.title,
    location: r.location as Location,
    address: r.address,
    type: r.type as PropertyType,
    status: r.status as Status,
    price: Number(r.price) || 0,
    bedrooms: r.bedrooms ?? 0,
    bathrooms: r.bathrooms ?? 0,
    rooms: r.rooms ?? 0,
    sqft: r.sqft ?? 0,
    yearBuilt: r.year_built ?? 0,
    image: resolvePropertyImage(r.image || rawGallery[0], r.slug),
    gallery,
    description: r.description || "",
    features,
    verified: !!r.verified,
    isOffer: !!r.is_offer,
    offerDiscount: Number(r.offer_discount) || 0,
    offerTag: r.offer_tag || "",
    offerEnds: r.offer_ends || "",
    assignedAgentId: r.assigned_agent_id ?? null,
  };
}

const PROPERTY_COLS = "slug,title,location,address,type,status,price,bedrooms,bathrooms,rooms,sqft,year_built,image,gallery,description,features,verified,is_offer,offer_discount,offer_tag,offer_ends,assigned_agent_id,created_at";


async function fetchProperties(): Promise<Property[]> {
  const { data, error } = await supabase
    .from("properties")
    .select(PROPERTY_COLS)
    .eq("listing_status", "approved")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(mapRow);
}

export function useOfferProperties() {
  return useQuery({
    queryKey: ["offer-properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select(PROPERTY_COLS)
        .eq("listing_status", "approved")
        .eq("is_offer", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map(mapRow);
    },
    staleTime: 60_000,
  });
}

export function useProperties() {
  return useQuery({
    queryKey: ["public-properties"],
    queryFn: fetchProperties,
    staleTime: 60_000,
  });
}

export function usePropertyBySlug(slug: string | undefined) {
  return useQuery({
    queryKey: ["public-property", slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase
        .from("properties")
        .select(PROPERTY_COLS)
        .eq("slug", slug)
        .eq("listing_status", "approved")
        .maybeSingle();
      if (error) throw error;
      return data ? mapRow(data) : null;
    },
    enabled: !!slug,
    staleTime: 60_000,
  });
}

export type SortKey = "newest" | "price-asc" | "price-desc" | "area-desc";

export interface PropertyFilters {
  status?: Status;
  location?: string;
  type?: string;
  beds?: number;
  baths?: number;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  q?: string;
  sort?: SortKey;
}

export function filterProperties(items: Property[], f: PropertyFilters): Property[] {
  const out = items.filter((p) => {
    if (f.status && p.status !== f.status) return false;
    if (f.location && f.location !== "all" && p.location !== f.location) return false;
    if (f.type && f.type !== "all" && p.type !== f.type) return false;
    if (f.beds != null && p.bedrooms < f.beds) return false;
    if (f.baths != null && p.bathrooms < f.baths) return false;
    if (f.minPrice != null && p.price < f.minPrice) return false;
    if (f.maxPrice != null && p.price > f.maxPrice) return false;
    if (f.minArea != null && p.sqft < f.minArea) return false;
    if (f.maxArea != null && p.sqft > f.maxArea) return false;
    if (f.q) {
      const q = f.q.toLowerCase();
      if (
        !p.title.toLowerCase().includes(q) &&
        !p.location.toLowerCase().includes(q) &&
        !p.address.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });
  switch (f.sort) {
    case "price-asc":
      return [...out].sort((a, b) => a.price - b.price);
    case "price-desc":
      return [...out].sort((a, b) => b.price - a.price);
    case "area-desc":
      return [...out].sort((a, b) => b.sqft - a.sqft);
    default:
      return out;
  }
}

export function formatPrice(p: Property): string {
  const num = new Intl.NumberFormat("en-US").format(p.price);
  return p.status === "rent" ? `QAR ${num}/mo` : `QAR ${num}`;
}
