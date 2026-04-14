import {
  MUSCLE_CATEGORIES,
  MUSCLE_IDS,
  statusFromWeeklySets,
  statusSortKey,
  type MuscleId,
} from "@/lib/muscles";
import type { WorkoutSession } from "@/types";

import { dailyMuscleSetsForWeek, weeklyMuscleBucketForWeek } from "./muscle-week-stats";
import type { DailyMuscleBreakdown, WeeklyMuscleBucket } from "./muscle-week-stats";

export type ExerciseWeekRow = {
  name: string;
  totalSets: number;
  dayEntries: { dayLabel: string; sets: number }[];
  pctOfTotal: number;
};

export type MuscleGroupSummary = {
  id: string;
  label: string;
  muscles: readonly MuscleId[];
  totalSets: number;
  growingCount: number;
  maintainingCount: number;
  underCount: number;
};

export type WeeklyMuscleStats = {
  bucket: WeeklyMuscleBucket;
  dailyBreakdown: DailyMuscleBreakdown;
  trainedMuscleIds: ReadonlySet<MuscleId>;
  growingCount: number;
  trainedCount: number;
  statusCounts: Readonly<{
    growing: number;
    maintaining: number;
    under: number;
  }>;
  groups: readonly MuscleGroupSummary[];
  isEmpty: boolean;
};

function categoryShortLabel(catId: string, fallback: string): string {
  if (catId === "upper_push") return "Push";
  if (catId === "upper_pull") return "Pull";
  return fallback;
}

export function buildMuscleExerciseRows(
  muscle: MuscleId,
  dailyBreakdown: DailyMuscleBreakdown,
  muscleWeeklySets: number,
): ExerciseWeekRow[] {
  const byName = new Map<
    string,
    { totalSets: number; dayEntries: { dayLabel: string; sets: number }[] }
  >();

  for (const day of dailyBreakdown) {
    const cell = day.muscles[muscle];
    if (cell.sets <= 0) continue;
    for (const ex of cell.exercises) {
      const existing = byName.get(ex.name);
      if (existing) {
        existing.totalSets += ex.weightedSets;
        existing.dayEntries.push({
          dayLabel: day.dayLabel,
          sets: ex.weightedSets,
        });
      } else {
        byName.set(ex.name, {
          totalSets: ex.weightedSets,
          dayEntries: [{ dayLabel: day.dayLabel, sets: ex.weightedSets }],
        });
      }
    }
  }

  const total = muscleWeeklySets > 0 ? muscleWeeklySets : 1;
  const rows: ExerciseWeekRow[] = [...byName.entries()].map(([name, data]) => ({
    name,
    totalSets: data.totalSets,
    dayEntries: data.dayEntries,
    pctOfTotal: (data.totalSets / total) * 100,
  }));
  rows.sort((a, b) => b.totalSets - a.totalSets);
  return rows;
}

export function computeWeeklyMuscleStats(
  sessions: WorkoutSession[],
  selectedWeek: string,
): WeeklyMuscleStats {
  const bucket = weeklyMuscleBucketForWeek(sessions, selectedWeek);
  const dailyBreakdown = dailyMuscleSetsForWeek(sessions, selectedWeek);

  const trainedMuscleIds = new Set<MuscleId>(
    MUSCLE_IDS.filter((id) => bucket.muscles[id].sets > 0),
  );

  let trainedCount = 0;
  let growing = 0;
  let maintaining = 0;
  let under = 0;

  for (const id of MUSCLE_IDS) {
    const sets = bucket.muscles[id].sets;
    if (sets <= 0) continue;
    trainedCount += 1;
    const s = statusFromWeeklySets(sets);
    if (s === "growing") growing += 1;
    else if (s === "maintaining") maintaining += 1;
    else under += 1;
  }

  const assigned = new Set<MuscleId>();
  const groups: MuscleGroupSummary[] = [];

  for (const cat of MUSCLE_CATEGORIES) {
    const trained = cat.muscles.filter((m) => trainedMuscleIds.has(m));
    const sorted = [...trained].sort((a, b) => {
      const sa = bucket.muscles[a].sets;
      const sb = bucket.muscles[b].sets;
      const ka = statusSortKey(statusFromWeeklySets(sa));
      const kb = statusSortKey(statusFromWeeklySets(sb));
      if (ka !== kb) return ka - kb;
      return sa - sb;
    });
    if (sorted.length === 0) continue;

    let gC = 0;
    let mC = 0;
    let uC = 0;
    let totalSets = 0;
    for (const m of sorted) {
      totalSets += bucket.muscles[m].sets;
      const st = statusFromWeeklySets(bucket.muscles[m].sets);
      if (st === "growing") gC += 1;
      else if (st === "maintaining") mC += 1;
      else uC += 1;
    }

    groups.push({
      id: cat.id,
      label: categoryShortLabel(cat.id, cat.label),
      muscles: sorted,
      totalSets,
      growingCount: gC,
      maintainingCount: mC,
      underCount: uC,
    });
    for (const m of sorted) assigned.add(m);
  }

  const orphans = [...trainedMuscleIds].filter((m) => !assigned.has(m));
  if (orphans.length > 0) {
    let gC = 0;
    let mC = 0;
    let uC = 0;
    let totalSets = 0;
    for (const m of orphans) {
      totalSets += bucket.muscles[m].sets;
      const st = statusFromWeeklySets(bucket.muscles[m].sets);
      if (st === "growing") gC += 1;
      else if (st === "maintaining") mC += 1;
      else uC += 1;
    }
    groups.push({
      id: "other",
      label: "Other",
      muscles: orphans,
      totalSets,
      growingCount: gC,
      maintainingCount: mC,
      underCount: uC,
    });
  }

  return {
    bucket,
    dailyBreakdown,
    trainedMuscleIds,
    growingCount: growing,
    trainedCount,
    statusCounts: { growing, maintaining, under },
    groups,
    isEmpty: trainedCount === 0,
  };
}
