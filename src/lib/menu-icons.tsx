import {
  Sparkles,
  Building2,
  Key,
  Tag,
  Newspaper,
  FileText,
  Users,
  Phone,
  Info,
  MapPin,
  Briefcase,
  Settings as SettingsIcon,
  Heart,
  Calendar,
  Home,
  Star,
  ShieldCheck,
  KeyRound,
  Crown,
  Gem,
  type LucideIcon,
} from "lucide-react";

export const MENU_ICONS: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  building: Building2,
  key: Key,
  tag: Tag,
  news: Newspaper,
  blog: FileText,
  users: Users,
  phone: Phone,
  info: Info,
  map: MapPin,
  briefcase: Briefcase,
  settings: SettingsIcon,
  heart: Heart,
  calendar: Calendar,
  home: Home,
  star: Star,
  shield: ShieldCheck,
  keyround: KeyRound,
  crown: Crown,
  gem: Gem,
};

export const MENU_ICON_KEYS = Object.keys(MENU_ICONS);

export function getMenuIcon(name?: string | null): LucideIcon | null {
  if (!name) return null;
  return MENU_ICONS[name.toLowerCase()] || null;
}

/** Heuristic fallback by label keyword. */
export function guessMenuIcon(label: string): LucideIcon {
  const l = label.toLowerCase();
  if (/(buy|sale|sell|property|properties)/.test(l)) return Building2;
  if (/(rent|lease)/.test(l)) return Key;
  if (/(offer|deal|discount)/.test(l)) return Tag;
  if (/(news)/.test(l)) return Newspaper;
  if (/(blog|article)/.test(l)) return FileText;
  if (/(agent|team|people)/.test(l)) return Users;
  if (/(contact|call)/.test(l)) return Phone;
  if (/(about|info)/.test(l)) return Info;
  if (/(location|area|city|map)/.test(l)) return MapPin;
  if (/(service|career|job)/.test(l)) return Briefcase;
  if (/(setting|manage|admin)/.test(l)) return SettingsIcon;
  if (/(favorite|wishlist|saved)/.test(l)) return Heart;
  if (/(book|appointment|schedule|event)/.test(l)) return Calendar;
  if (/(home)/.test(l)) return Home;
  return Sparkles;
}
