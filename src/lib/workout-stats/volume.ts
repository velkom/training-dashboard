import type { WorkoutSession } from "@/types";

import { toLocalDateString } from "./date-week";

export function sessionVolumeKg(session: WorkoutSession): number {
  let vol = 0;
  for (const ex of session.exercises) {
    for (const st of ex.sets) {
      if (st.weight != null && st.reps != null) {
        vol += st.weight * st.reps;
      }
    }
  }
  return vol;
}

export function totalVolumeKg(sessions: WorkoutSession[]): number {
  return sessions.reduce((acc, s) => acc + sessionVolumeKg(s), 0);
}

export function workoutDates(sessions: WorkoutSession[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const s of sessions) {
    const day = s.startDate.slice(0, 10);
    map.set(day, (map.get(day) ?? 0) + 1);
  }
  return map;
}

export type WeekBucket = { weekStart: string; volume: number; sessions: number };

export function weeklyVolume(
  sessions: WorkoutSession[],
  weeks = 12,
): WeekBucket[] {
  const now = new Date();
  const buckets: WeekBucket[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i * 7);
    const day = d.getDay();
    const diff = (day + 6) % 7;
    const monday = new Date(d);
    monday.setDate(d.getDate() - diff);
    monday.setHours(0, 0, 0, 0);
    const start = toLocalDateString(monday);
    buckets.push({ weekStart: start, volume: 0, sessions: 0 });
  }

  for (const s of sessions) {
    const t = new Date(s.startDate).getTime();
    for (const b of buckets) {
      const start = new Date(b.weekStart + "T00:00:00").getTime();
      const end = start + 7 * 86400000;
      if (t >= start && t < end) {
        b.volume += sessionVolumeKg(s);
        b.sessions += 1;
        break;
      }
    }
  }
  return buckets;
}
