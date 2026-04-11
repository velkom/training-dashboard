/** Format a local Date as YYYY-MM-DD without UTC conversion (avoids toISOString timezone shift). */
export function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Human-readable Mon–Sun range for a Monday `weekStart` (YYYY-MM-DD). */
export function formatWeekRangeDisplay(weekStart: string): string {
  const start = new Date(weekStart + "T12:00:00");
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const y = start.getFullYear();
  return `${start.toLocaleDateString("en-US", opts)} — ${end.toLocaleDateString("en-US", opts)}, ${y}`;
}

/** Monday ISO date (YYYY-MM-DD) for the week containing `date`, same alignment as `weeklyVolume`. */
export function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 6) % 7;
  const monday = new Date(d);
  monday.setDate(d.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  return toLocalDateString(monday);
}

/** Move a Monday ISO week start by `deltaWeeks` (negative = past). */
export function shiftWeekStart(weekStart: string, deltaWeeks: number): string {
  const d = new Date(weekStart + "T00:00:00");
  d.setDate(d.getDate() + deltaWeeks * 7);
  return getWeekStart(d);
}
