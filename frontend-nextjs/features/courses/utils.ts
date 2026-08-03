/** Format seconds → "Xg Yp" or "Yp" */
export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h}g ${m}p`;
  if (h > 0) return `${h}g`;
  if (m > 0) return `${m}p`;
  return `${seconds}s`;
}

/** Format VND price */
export function formatPrice(amount: number): string {
  return amount.toLocaleString("vi-VN") + "đ";
}

/** Days remaining until a date (returns null if date is past) */
export function daysUntil(isoDate: string): number | null {
  const diff = new Date(isoDate).getTime() - Date.now();
  if (diff <= 0) return null;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/** e.g. "2026-03-01T00:00:00Z" → "03/2026" */
export function formatMonthYear(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("vi-VN", {
    month: "2-digit",
    year: "numeric",
  });
}

/** Sum total duration of a flat lesson list */
export function totalLessonsDuration(lessons: { duration: number }[]): number {
  return lessons.reduce((acc, l) => acc + l.duration, 0);
}

/** Get initials from first+last name */
export function getInitials(firstName: string, lastName: string): string {
  return `${lastName.trim()[0] ?? ""}${firstName.trim()[0] ?? ""}`.toUpperCase();
}

/** Parse "HH:MM:SS.mmm" or "HH:MM:SS" duration string from backend into seconds */
export function parseHHMMSS(duration: string | null | undefined): number {
  if (!duration) return 0;
  const parts = duration.split(":");
  if (parts.length < 3) return 0;
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  const s = parseFloat(parts[2]) || 0;
  return h * 3600 + m * 60 + Math.floor(s);
}
