import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency
 * CLP (Chilean Peso) does not use decimals
 * USD and other currencies show 2 decimal places
 */
export function formatCurrency(
  amount: number,
  currency: string = "CLP",
): string {
  const locale = currency === "CLP" ? "es-CL" : "en-US";
  const minimumFractionDigits = currency === "CLP" ? 0 : 2;
  const maximumFractionDigits = currency === "CLP" ? 0 : 2;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);
}

/**
 * Format date
 */
export function formatDate(
  date: string | Date,
  options?: Intl.DateTimeFormatOptions,
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  let d = new Date(date);
  // Prevent local timezone shifting when parsing a simple "YYYY-MM-DD" string
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    d = new Date(`${date}T12:00:00`);
  }

  return d.toLocaleDateString("es-MX", options || defaultOptions);
}

/**
 * Format time
 */
export function formatTime(date: string | Date): string {
  return new Date(date).toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format date and time
 */
export function formatDateTime(date: string | Date): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

/**
 * Get initials from name
 */
export function getInitials(firstName?: string, lastName?: string): string {
  const first = firstName?.charAt(0).toUpperCase() || "";
  const last = lastName?.charAt(0).toUpperCase() || "";
  return `${first}${last}` || "?";
}

/**
 * Slugify a string
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Generate time slots for a day (returns objects with start and end)
 */
export function generateTimeSlots(
  startTime: string | number = 7,
  endTime: string | number = 23,
  intervalMinutes: number = 60,
): { start: string; end: string }[] {
  const slots: { start: string; end: string }[] = [];

  // Parse start and end times
  let startHour: number,
    startMinute: number = 0;
  let endHour: number,
    endMinute: number = 0;

  if (typeof startTime === "string") {
    const [h, m] = startTime.split(":").map(Number);
    startHour = h;
    startMinute = m || 0;
  } else {
    startHour = startTime;
  }

  if (typeof endTime === "string") {
    const [h, m] = endTime.split(":").map(Number);
    endHour = h;
    endMinute = m || 0;
  } else {
    endHour = endTime;
  }

  let currentMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;

  while (currentMinutes < endMinutes) {
    const startH = Math.floor(currentMinutes / 60)
      .toString()
      .padStart(2, "0");
    const startM = (currentMinutes % 60).toString().padStart(2, "0");

    const nextMinutes = currentMinutes + intervalMinutes;
    const endH = Math.floor(nextMinutes / 60)
      .toString()
      .padStart(2, "0");
    const endM = (nextMinutes % 60).toString().padStart(2, "0");

    slots.push({
      start: `${startH}:${startM}`,
      end: `${endH}:${endM}`,
    });

    currentMinutes = nextMinutes;
  }

  return slots;
}

/**
 * Get days of the week starting from a date
 */
export function getWeekDays(startDate: Date = new Date()): Date[] {
  const days: Date[] = [];
  const start = new Date(startDate);
  start.setDate(start.getDate() - start.getDay()); // Start from Sunday

  for (let i = 0; i < 7; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    days.push(day);
  }
  return days;
}

/**
 * Check if two date ranges overlap
 */
export function doDateRangesOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date,
): boolean {
  return start1 < end2 && start2 < end1;
}

/**
 * Delay function for loading states
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get status color class
 */
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: "bg-warning/20 text-warning",
    confirmed: "bg-success/20 text-success",
    cancelled: "bg-destructive/20 text-destructive",
    completed: "bg-muted text-muted-foreground",
    no_show: "bg-destructive/20 text-destructive",
  };
  return colors[status] || "bg-muted text-muted-foreground";
}

/**
 * Day of week names
 */
export const DAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

/**
 * Short day names
 */
export const SHORT_DAY_NAMES = [
  "Dom",
  "Lun",
  "Mar",
  "Mié",
  "Jue",
  "Vie",
  "Sáb",
];
