import { useEffect, useState } from "react";
import { Tag, Timer } from "lucide-react";

type Props = {
  endsAt: string;
  discount?: number;
  tag?: string;
};

function diff(target: number) {
  const ms = Math.max(0, target - Date.now());
  const s = Math.floor(ms / 1000);
  return {
    expired: ms === 0,
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

export function OfferCountdown({ endsAt, discount, tag }: Props) {
  const target = new Date(endsAt).getTime();
  const [t, setT] = useState(() => diff(target));

  useEffect(() => {
    if (Number.isNaN(target)) return;
    const id = setInterval(() => setT(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (Number.isNaN(target)) return null;

  const cell = (n: number, label: string) => (
    <div className="flex min-w-[58px] flex-col items-center rounded-lg bg-background/95 px-3 py-2 text-foreground shadow-sm">
      <span className="font-display text-2xl font-semibold leading-none tabular-nums sm:text-3xl">
        {String(n).padStart(2, "0")}
      </span>
      <span className="mt-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
    </div>
  );

  return (
    <div className="mt-5 overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Tag className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display text-lg font-semibold text-foreground">
                {tag || "Special Offer"}
              </span>
              {discount ? (
                <span className="rounded-md bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                  {discount}% OFF
                </span>
              ) : null}
            </div>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Timer className="h-3.5 w-3.5" />
              {t.expired ? "Offer ended" : "Hurry, limited-time offer ends in"}
            </p>
          </div>
        </div>
        {!t.expired && (
          <div className="flex flex-wrap items-center gap-2">
            {cell(t.days, "Days")}
            {cell(t.hours, "Hours")}
            {cell(t.minutes, "Mins")}
            {cell(t.seconds, "Secs")}
          </div>
        )}
      </div>
    </div>
  );
}
