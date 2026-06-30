import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2 } from "lucide-react";

type Suggestion = {
  display_name: string;
  lat: string;
  lon: string;
  address?: Record<string, string>;
};

/**
 * Free location autocomplete powered by OpenStreetMap Nominatim.
 * No API key required. Biased toward Qatar but works worldwide.
 *
 * onPick receives:
 *  - value: short label (city / suburb / neighborhood) suitable for the
 *           Location field
 *  - fullAddress: full formatted address suitable for the Address field
 */
export function LocationAutocomplete({
  value,
  onChange,
  onPick,
  placeholder = "Start typing a location…",
  className,
  mode = "location",
}: {
  value: string;
  onChange: (v: string) => void;
  onPick?: (data: { value: string; fullAddress: string; lat: number; lon: number }) => void;
  placeholder?: string;
  className?: string;
  mode?: "location" | "address";
}) {
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const tRef = useRef<number | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (tRef.current) window.clearTimeout(tRef.current);
    if (!value || value.trim().length < 2) {
      setItems([]);
      return;
    }
    tRef.current = window.setTimeout(async () => {
      setLoading(true);
      try {
        const url = new URL("https://nominatim.openstreetmap.org/search");
        url.searchParams.set("q", value);
        url.searchParams.set("format", "json");
        url.searchParams.set("addressdetails", "1");
        url.searchParams.set("limit", "6");
        url.searchParams.set("countrycodes", "qa");
        const res = await fetch(url.toString(), {
          headers: { "Accept-Language": "en" },
        });
        const data = (await res.json()) as Suggestion[];
        setItems(Array.isArray(data) ? data : []);
        setOpen(true);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => {
      if (tRef.current) window.clearTimeout(tRef.current);
    };
  }, [value]);

  const shortLabel = (s: Suggestion) => {
    const a = s.address || {};
    return (
      a.neighbourhood ||
      a.suburb ||
      a.quarter ||
      a.village ||
      a.town ||
      a.city ||
      a.municipality ||
      a.state ||
      s.display_name.split(",")[0]
    );
  };

  return (
    <div ref={boxRef} className="relative">
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => items.length && setOpen(true)}
          placeholder={placeholder}
          className={className || "w-full rounded-md border border-input bg-background pl-8 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"}
          autoComplete="off"
        />
        {loading && <Loader2 className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
      </div>
      {open && items.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-md border border-border bg-popover text-sm shadow-lg">
          {items.map((s, i) => (
            <li key={`${s.lat}-${s.lon}-${i}`}>
              <button
                type="button"
                onClick={() => {
                  const picked = mode === "address" ? s.display_name : shortLabel(s);
                  onChange(picked);
                  onPick?.({
                    value: shortLabel(s),
                    fullAddress: s.display_name,
                    lat: Number(s.lat),
                    lon: Number(s.lon),
                  });
                  setOpen(false);
                }}
                className="block w-full px-3 py-2 text-left transition hover:bg-primary hover:text-primary-foreground"
              >
                <div className="font-medium">{shortLabel(s)}</div>
                <div className="truncate text-xs opacity-75">{s.display_name}</div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
