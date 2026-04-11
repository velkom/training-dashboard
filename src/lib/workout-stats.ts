import {
  emptyMuscleRecord,
  exerciseVolumeKg,
  MUSCLE_IDS,
  resolveMuscleAllocations,
  type MuscleId,
} from "@/lib/muscle-groups";
import type { UserId, WorkoutSession } from "@/types";

export type UserFilter = UserId | "all";

export function filterSessions(
  sessions: WorkoutSession[],
  user: UserFilter,
): WorkoutSession[] {
  if (user === "all") return sessions;
  return sessions.filter((s) => s.userId === user);
}

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
  return monday.toISOString().slice(0, 10);
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
    const start = monday.toISOString().slice(0, 10);
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

export function currentStreakDays(sessions: WorkoutSession[]): number {
  const days = new Set(sessions.map((s) => s.startDate.slice(0, 10)));
  if (days.size === 0) return 0;
  const latest = [...days].sort((a, b) => b.localeCompare(a))[0]!;
  const cursor = new Date(`${latest}T12:00:00`);
  let streak = 0;
  while (days.has(cursor.toISOString().slice(0, 10))) {
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

export type WeeklyMuscleBucket = {
  weekStart: string;
  muscles: Record<MuscleId, { sets: number; volume: number }>;
};

function addSessionToWeeklyMuscleBucket(
  bucket: WeeklyMuscleBucket,
  session: WorkoutSession,
): void {
  for (const ex of session.exercises) {
    const vol = exerciseVolumeKg(ex);
    const allocs = resolveMuscleAllocations(ex);
    if (allocs.length === 0) continue;
    const totalWeighted = allocs.reduce((a, x) => a + x.weightedSets, 0);
    for (const { muscle, weightedSets } of allocs) {
      const cell = bucket.muscles[muscle];
      if (!cell) continue;
      cell.sets += weightedSets;
      if (totalWeighted > 0 && vol > 0) {
        cell.volume += (weightedSets / totalWeighted) * vol;
      }
    }
  }
}

/** Effective sets and volume per muscle for a single Monday-aligned week. */
export function weeklyMuscleBucketForWeek(
  sessions: WorkoutSession[],
  weekStart: string,
): WeeklyMuscleBucket {
  const bucket: WeeklyMuscleBucket = {
    weekStart,
    muscles: emptyMuscleRecord(),
  };
  const scoped = filterSessionsByWeek(sessions, weekStart);
  for (const s of scoped) {
    addSessionToWeeklyMuscleBucket(bucket, s);
  }
  return bucket;
}

export type DailyMuscleDayExercise = { name: string; weightedSets: number };

export type DailyMuscleDayCell = {
  sets: number;
  exercises: DailyMuscleDayExercise[];
};

export type DailyMuscleBreakdownDay = {
  date: string;
  dayLabel: string;
  muscles: Record<MuscleId, DailyMuscleDayCell>;
};

/** Seven calendar rows (Mon–Sun) for `weekStart`, with per-muscle effective sets and exercise splits per day. */
export type DailyMuscleBreakdown = DailyMuscleBreakdownDay[];

function emptyDailyMuscleRecord(): Record<MuscleId, DailyMuscleDayCell> {
  const r = {} as Record<MuscleId, DailyMuscleDayCell>;
  for (const id of MUSCLE_IDS) {
    r[id] = { sets: 0, exercises: [] };
  }
  return r;
}

function addExerciseToMuscleDayCell(
  cell: DailyMuscleDayCell,
  exerciseName: string,
  weightedSets: number,
): void {
  cell.sets += weightedSets;
  const existing = cell.exercises.find((e) => e.name === exerciseName);
  if (existing) {
    existing.weightedSets += weightedSets;
  } else {
    cell.exercises.push({ name: exerciseName, weightedSets });
  }
}

export function dailyMuscleSetsForWeek(
  sessions: WorkoutSession[],
  weekStart: string,
): DailyMuscleBreakdown {
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart + "T12:00:00");
    d.setDate(d.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }

  const rows: DailyMuscleBreakdownDay[] = dates.map((date) => ({
    date,
    dayLabel: new Date(date + "T12:00:00").toLocaleDateString("en-US", {
      weekday: "short",
    }),
    muscles: emptyDailyMuscleRecord(),
  }));
  const byDate = new Map(rows.map((r) => [r.date, r]));

  for (const s of filterSessionsByWeek(sessions, weekStart)) {
    const date = s.startDate.slice(0, 10);
    const row = byDate.get(date);
    if (!row) continue;

    for (const ex of s.exercises) {
      const allocs = resolveMuscleAllocations(ex);
      if (allocs.length === 0) continue;
      for (const { muscle, weightedSets } of allocs) {
        const cell = row.muscles[muscle];
        if (!cell) continue;
        addExerciseToMuscleDayCell(cell, ex.name, weightedSets);
      }
    }
  }

  return rows;
}

/**
 * Monday-aligned weeks ending at `endWeekStart` (inclusive), oldest first.
 * Same per-muscle rules as `weeklyMuscleSets`.
 */
export function weeklyMuscleSetsEndingAt(
  sessions: WorkoutSession[],
  endWeekStart: string,
  weeks: number,
): WeeklyMuscleBucket[] {
  const endMonday = new Date(endWeekStart + "T00:00:00");
  const buckets: WeeklyMuscleBucket[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const d = new Date(endMonday);
    d.setDate(endMonday.getDate() - i * 7);
    d.setHours(0, 0, 0, 0);
    const start = d.toISOString().slice(0, 10);
    buckets.push({ weekStart: start, muscles: emptyMuscleRecord() });
  }

  for (const s of sessions) {
    const t = new Date(s.startDate).getTime();
    for (const b of buckets) {
      const start = new Date(b.weekStart + "T00:00:00").getTime();
      const end = start + 7 * 86400000;
      if (t >= start && t < end) {
        addSessionToWeeklyMuscleBucket(b, s);
        break;
      }
    }
  }
  return buckets;
}

/** Move a Monday ISO week start by `deltaWeeks` (negative = past). */
export function shiftWeekStart(weekStart: string, deltaWeeks: number): string {
  const d = new Date(weekStart + "T00:00:00");
  d.setDate(d.getDate() + deltaWeeks * 7);
  return getWeekStart(d);
}

/**
 * Monday-aligned weeks (same logic as `weeklyVolume`).
 * Per muscle: sums weighted working sets and distributes exercise volume by allocation share.
 */
export function weeklyMuscleSets(
  sessions: WorkoutSession[],
  weeks = 12,
): WeeklyMuscleBucket[] {
  return weeklyMuscleSetsEndingAt(sessions, getWeekStart(new Date()), weeks);
}
