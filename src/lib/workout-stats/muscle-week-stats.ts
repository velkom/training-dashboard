import {
  emptyMuscleRecord,
  exerciseVolumeKg,
  MUSCLE_IDS,
  resolveMuscleAllocations,
  type MuscleId,
  type MuscleSetsRecord,
} from "@/lib/muscles";
import type { WorkoutSession } from "@/types";

import { toLocalDateString, getWeekStart } from "./date-week";
import { filterSessionsByWeek } from "./session-scope";

export type WeeklyMuscleBucket = {
  weekStart: string;
  muscles: MuscleSetsRecord;
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
    dates.push(toLocalDateString(d));
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
    const start = toLocalDateString(d);
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
