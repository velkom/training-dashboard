import type { WorkoutSession } from "@/types";

import { toLocalDateString } from "./date-week";

export function currentStreakDays(sessions: WorkoutSession[]): number {
  const days = new Set(sessions.map((s) => s.startDate.slice(0, 10)));
  if (days.size === 0) return 0;
  const latest = [...days].sort((a, b) => b.localeCompare(a))[0]!;
  const cursor = new Date(`${latest}T12:00:00`);
  let streak = 0;
  while (days.has(toLocalDateString(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export type ExercisePoint = { date: string; maxWeight: number };

export function exerciseProgression(
  sessions: WorkoutSession[],
  exerciseName: string,
): ExercisePoint[] {
  const points: ExercisePoint[] = [];
  for (const s of sessions) {
    const ex = s.exercises.find(
      (e) => e.name.toLowerCase() === exerciseName.toLowerCase(),
    );
    if (!ex) continue;
    const weights = ex.sets
      .map((st) => st.weight)
      .filter((w): w is number => typeof w === "number" && w > 0);
    if (weights.length === 0) continue;
    const maxWeight = Math.max(...weights);
    points.push({ date: s.startDate.slice(0, 10), maxWeight });
  }
  const byDay = new Map<string, number>();
  for (const p of points) {
    byDay.set(p.date, Math.max(byDay.get(p.date) ?? 0, p.maxWeight));
  }
  return [...byDay.entries()]
    .map(([date, maxWeight]) => ({ date, maxWeight }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function topExercisesByFrequency(
  sessions: WorkoutSession[],
  limit = 8,
): { name: string; count: number }[] {
  const map = new Map<string, number>();
  for (const s of sessions) {
    for (const ex of s.exercises) {
      map.set(ex.name, (map.get(ex.name) ?? 0) + 1);
    }
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/** Average workout duration in minutes (sessions with duration > 0 only). */
export function averageDurationMinutes(sessions: WorkoutSession[]): number {
  const withDur = sessions.filter((s) => s.durationSeconds > 0);
  if (withDur.length === 0) return 0;
  const totalSec = withDur.reduce((a, s) => a + s.durationSeconds, 0);
  return totalSec / withDur.length / 60;
}
