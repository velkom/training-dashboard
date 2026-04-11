import type { UserId, WorkoutSession } from "@/types";

import { getWeekStart } from "./date-week";

export type UserFilter = UserId | "all";

export function filterSessions(
  sessions: WorkoutSession[],
  user: UserFilter,
): WorkoutSession[] {
  if (user === "all") return sessions;
  return sessions.filter((s) => s.userId === user);
}

/** Sessions with `startDate` in [weekStart, weekStart + 7 days) (Monday-aligned week). */
export function filterSessionsByWeek(
  sessions: WorkoutSession[],
  weekStart: string,
): WorkoutSession[] {
  const start = new Date(weekStart + "T00:00:00").getTime();
  const end = start + 7 * 86400000;
  return sessions.filter((s) => {
    const t = new Date(s.startDate).getTime();
    return t >= start && t < end;
  });
}

/** Distinct Monday week starts that contain at least one session, newest first. */
export function getWeeksWithData(sessions: WorkoutSession[]): string[] {
  const set = new Set<string>();
  for (const s of sessions) {
    set.add(getWeekStart(new Date(s.startDate)));
  }
  return [...set].sort((a, b) => b.localeCompare(a));
}
