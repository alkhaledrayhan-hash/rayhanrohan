import prop1 from "@/assets/prop-1.jpg";
import prop2 from "@/assets/prop-2.jpg";
import prop3 from "@/assets/prop-3.jpg";
import prop4 from "@/assets/prop-4.jpg";
import prop5 from "@/assets/prop-5.jpg";
import prop6 from "@/assets/prop-6.jpg";

export type Status = "rent" | "sale";
export type PropertyType = "Apartment" | "Villa" | "Studio" | "Penthouse" | "Townhouse";
export const LOCATIONS = ["Doha", "The Pearl", "Lusail", "West Bay", "Al Waab"] as const;
export type Location = (typeof LOCATIONS)[number];

export interface Property {
  id: string;
  title: string;
  location: Location;
  address: string;
  type: PropertyType;
  status: Status;
  price: number; // QAR
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
}

export const PROPERTIES: Property[] = [
  {
    id: "pearl-marina-residence",
    title: "Marina View Residence",
    location: "The Pearl",
    address: "Porto Arabia, The Pearl-Qatar",
    type: "Apartment",
    status: "rent",
    price: 18500,
    bedrooms: 3,
    bathrooms: 3,
    sqft: 2150,
    image: prop1,
    description:
      "An exceptional waterfront residence with panoramic marina views, marble flooring, and floor-to-ceiling windows in the heart of Porto Arabia.",
    features: ["Sea View", "Maid's Room", "Private Balcony", "Gym & Pool", "24/7 Concierge"],
  },
  {
    id: "al-waab-signature-villa",
    title: "Signature Garden Villa",
    location: "Al Waab",
    address: "Al Waab Street, Doha",
    type: "Villa",
    status: "sale",
    price: 8750000,
    bedrooms: 6,
    bathrooms: 7,
    sqft: 6800,
    image: prop2,
    description:
      "A landmark contemporary villa with private pool, mature gardens and refined interior craftsmanship in a serene Al Waab compound.",
    features: ["Private Pool", "Landscaped Garden", "Driver's Room", "Smart Home", "2-Car Garage"],
  },
  {
    id: "lusail-sky-penthouse",
    title: "Lusail Sky Penthouse",
    location: "Lusail",
    address: "Marina District, Lusail City",
    type: "Penthouse",
    status: "sale",
    price: 12400000,
    bedrooms: 4,
    bathrooms: 5,
    sqft: 4520,
    image: prop3,
    description:
      "A duplex penthouse crowning the Marina District — wraparound terraces, private elevator and uninterrupted views of the Lusail skyline.",
    features: ["Private Elevator", "Rooftop Terrace", "Skyline View", "Designer Finishes"],
  },
  {
    id: "west-bay-studio",
    title: "West Bay Executive Studio",
    location: "West Bay",
    address: "Diplomatic District, West Bay",
    type: "Studio",
    status: "rent",
    price: 6800,
    bedrooms: 1,
    bathrooms: 1,
    sqft: 720,
    image: prop4,
    description:
      "A fully-furnished executive studio steps from the diplomatic district — ideal for professionals seeking a turnkey home in West Bay.",
    features: ["Fully Furnished", "City View", "Gym Access", "Walk to Corniche"],
  },
  {
    id: "pearl-canal-townhouse",
    title: "Canal-Side Townhouse",
    location: "The Pearl",
    address: "Qanat Quartier, The Pearl-Qatar",
    type: "Townhouse",
    status: "sale",
    price: 6450000,
    bedrooms: 4,
    bathrooms: 5,
    sqft: 3980,
    image: prop5,
    description:
      "Pastel Venetian-inspired townhouse on the canal with a private mooring, courtyard and rooftop majlis.",
    features: ["Canal View", "Rooftop Majlis", "Private Mooring", "Courtyard"],
  },
  {
    id: "lusail-marina-apartment",
    title: "Lusail Marina Apartment",
    location: "Lusail",
    address: "Marina Towers, Lusail",
    type: "Apartment",
    status: "rent",
    price: 14200,
    bedrooms: 2,
    bathrooms: 3,
    sqft: 1640,
    image: prop6,
    description:
      "Elegantly finished two-bedroom residence with gold-accented interiors and marina-facing terrace.",
    features: ["Marina View", "Gold Accents", "Marble Kitchen", "Pool & Spa"],
  },
];

export interface PropertyFilters {
  status?: Status;
  location?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  q?: string;
}

export function filterProperties(items: Property[], f: PropertyFilters): Property[] {
  return items.filter((p) => {
    if (f.status && p.status !== f.status) return false;
    if (f.location && f.location !== "all" && p.location !== f.location) return false;
    if (f.type && f.type !== "all" && p.type !== f.type) return false;
    if (f.minPrice != null && p.price < f.minPrice) return false;
    if (f.maxPrice != null && p.price > f.maxPrice) return false;
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
}

export function formatPrice(p: Property): string {
  const num = new Intl.NumberFormat("en-US").format(p.price);
  return p.status === "rent" ? `QAR ${num}/mo` : `QAR ${num}`;
}

export function getProperty(id: string): Property | undefined {
  return PROPERTIES.find((p) => p.id === id);
}
