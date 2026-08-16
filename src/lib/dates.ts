import {
  addDays,
  addMonths,
  addQuarters,
  addWeeks,
  addYears,
  differenceInCalendarDays,
  endOfDay,
  endOfMonth,
  endOfQuarter,
  endOfWeek,
  endOfYear,
  format,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfQuarter,
  startOfWeek,
  startOfYear,
  subDays,
} from "date-fns";
import { fr } from "date-fns/locale";
import { formatInTimeZone, fromZonedTime, toZonedTime } from "date-fns-tz";
import { TIMEZONE } from "@/lib/format";

export type PeriodKey = "today" | "yesterday" | "week" | "month" | "quarter" | "year" | "custom";

export interface DateRange {
  from: Date;
  to: Date;
}

export function nowInConakry(): Date {
  return toZonedTime(new Date(), TIMEZONE);
}

export function businessDate(date: Date = new Date()): string {
  return formatInTimeZone(date, TIMEZONE, "yyyy-MM-dd");
}

export function formatDate(value: string | Date, pattern = "dd MMM yyyy"): string {
  const date = typeof value === "string" ? parseISO(value) : value;
  return format(date, pattern, { locale: fr });
}

export function formatDateTime(value: string | Date): string {
  const utcDate = typeof value === "string" ? parseISO(value) : value;
  return formatInTimeZone(utcDate, TIMEZONE, "dd MMM yyyy HH:mm", { locale: fr });
}

export function formatTime(value: string | Date): string {
  const utcDate = typeof value === "string" ? parseISO(value) : value;
  return formatInTimeZone(utcDate, TIMEZONE, "HH:mm");
}

export function monthLabel(value: string | Date): string {
  const date = typeof value === "string" ? parseISO(value) : value;
  return format(date, "MMMM yyyy", { locale: fr });
}

export function monthStart(value: Date = nowInConakry()): string {
  return format(startOfMonth(value), "yyyy-MM-dd");
}

export function parseDateParam(value: string | null | undefined): Date | null {
  if (!value) return null;
  try {
    return parseISO(value);
  } catch {
    return null;
  }
}

export function toUtcFromBusinessDate(dateStr: string, hours = 12, minutes = 0): string {
  return fromZonedTime(`${dateStr}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`, TIMEZONE).toISOString();
}

export function getPeriodRange(
  key: PeriodKey,
  customFrom?: string | null,
  customTo?: string | null,
): DateRange & { previousFrom: Date; previousTo: Date; label: string } {
  const today = startOfDay(nowInConakry());
  let from: Date;
  let to: Date;
  let label: string;

  switch (key) {
    case "yesterday":
      from = subDays(today, 1);
      to = endOfDay(from);
      label = "Hier";
      break;
    case "week":
      from = startOfWeek(today, { weekStartsOn: 1 });
      to = endOfWeek(today, { weekStartsOn: 1 });
      label = "Cette semaine";
      break;
    case "month":
      from = startOfMonth(today);
      to = endOfMonth(today);
      label = "Ce mois";
      break;
    case "quarter":
      from = startOfQuarter(today);
      to = endOfQuarter(today);
      label = "Ce trimestre";
      break;
    case "year":
      from = startOfYear(today);
      to = endOfYear(today);
      label = "Cette année";
      break;
    case "custom": {
      from = customFrom ? startOfDay(parseISO(customFrom)) : startOfMonth(today);
      to = customTo ? endOfDay(parseISO(customTo)) : endOfDay(today);
      label = "Période personnalisée";
      break;
    }
    default:
      from = today;
      to = endOfDay(today);
      label = "Aujourd'hui";
  }

  const length = differenceInCalendarDays(to, from) + 1;
  const previousTo = endOfDay(subDays(from, 1));
  const previousFrom = startOfDay(subDays(previousTo, length - 1));

  return { from, to, previousFrom, previousTo, label };
}

export function shiftRange(range: DateRange, direction: 1 | -1): DateRange {
  const days = differenceInCalendarDays(range.to, range.from) + 1;
  if (days <= 1) {
    return {
      from: addDays(range.from, direction),
      to: addDays(range.to, direction),
    };
  }
  if (days <= 7) {
    return {
      from: addWeeks(range.from, direction),
      to: addWeeks(range.to, direction),
    };
  }
  if (days <= 31) {
    return {
      from: addMonths(range.from, direction),
      to: addMonths(range.to, direction),
    };
  }
  if (days <= 92) {
    return {
      from: addQuarters(range.from, direction),
      to: addQuarters(range.to, direction),
    };
  }
  return {
    from: addYears(range.from, direction),
    to: addYears(range.to, direction),
  };
}

export function toIsoDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export const PERIOD_OPTIONS: { value: PeriodKey; label: string }[] = [
  { value: "today", label: "Aujourd'hui" },
  { value: "yesterday", label: "Hier" },
  { value: "week", label: "Semaine" },
  { value: "month", label: "Mois" },
  { value: "quarter", label: "Trimestre" },
  { value: "year", label: "Année" },
  { value: "custom", label: "Personnalisée" },
];
