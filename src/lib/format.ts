import { format as fnsFormat } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { useSiteSettings } from "@/hooks/useSiteSettings";

export type WeekStart = "sunday" | "monday" | "saturday";

export function useFormatters() {
  const s = useSiteSettings();
  const tz = s.site_timezone || "UTC";
  const dateFmt = s.date_format || "MMMM d, yyyy";
  const timeFmt = s.time_format || "h:mm a";

  const toLocal = (d: Date | string | number) => {
    const date = d instanceof Date ? d : new Date(d);
    return toZonedTime(date, tz);
  };

  const formatDate = (d: Date | string | number) => fnsFormat(toLocal(d), dateFmt);
  const formatTime = (d: Date | string | number) => fnsFormat(toLocal(d), timeFmt);
  const formatDateTime = (d: Date | string | number) => `${formatDate(d)} · ${formatTime(d)}`;

  return {
    timezone: tz,
    dateFormat: dateFmt,
    timeFormat: timeFmt,
    weekStartsOn: (s.week_starts_on || "monday") as WeekStart,
    formatDate,
    formatTime,
    formatDateTime,
  };
}

export function weekStartsOnIndex(v: WeekStart): 0 | 1 | 6 {
  if (v === "sunday") return 0;
  if (v === "saturday") return 6;
  return 1;
}
