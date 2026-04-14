import {
  MUSCLE_CATEGORIES,
  MUSCLE_IDS,
  SECONDARY_SET_WEIGHT,
  statusFromWeeklySets,
  statusSortKey,
  type MuscleId,
  type MuscleMapEntry,
  type TrainingStatus,
} from "@/lib/muscles";
import type { WorkoutSession } from "@/types";

import { dailyMuscleSetsForWeek, weeklyMuscleBucketForWeek } from "./muscle-week-stats";
import type { DailyMuscleBreakdown, WeeklyMuscleBucket } from "./muscle-week-stats";

export type ExerciseWeekRow = {
  name: string;
  totalSets: number;
  dayEntries: { dayLabel: string; sets: number }[];
  pctOfTotal: number;
  role: "primary" | "secondary";
  /** For secondary exercises: the actual working sets before the 0.5× multiplier */
  actualSets?: number;
};

export type MuscleGroupSummary = {
  id: string;
  label: string;
  muscles: readonly MuscleId[];
  totalSets: number;
  insufficientCount: number;
  minimalCount: number;
  solidCount: number;
  highCount: number;
  veryHighCount: number;
};

export type WeeklyMuscleStats = {
  bucket: WeeklyMuscleBucket;
  dailyBreakdown: DailyMuscleBreakdown;
  trainedMuscleIds: ReadonlySet<MuscleId>;
  solidOrBetterCount: number;
  trainedCount: number;
  statusCounts: Readonly<{
    insufficient: number;
    minimal: number;
    solid: number;
    high: number;
    very_high: number;
  }>;
  groups: readonly MuscleGroupSummary[];
  isEmpty: boolean;
};

function emptyStatusTally(): Record<TrainingStatus, number> {
  return {
    insufficient: 0,
    minimal: 0,
    solid: 0,
    high: 0,
    very_high: 0,
  };
}

function tallyForMuscles(
  muscles: readonly MuscleId[],
  bucket: WeeklyMuscleBucket,
): {
  tally: Record<TrainingStatus, number>;
  totalSets: number;
} {
  const tally = emptyStatusTally();
  let totalSets = 0;
  for (const m of muscles) {
    const sets = bucket.muscles[m].sets;
    totalSets += sets;
    const st = statusFromWeeklySets(sets);
    tally[st] += 1;
  }
  return { tally, totalSets };
}

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
    {
      totalSets: number;
      dayEntries: { dayLabel: string; sets: number }[];
      role: "primary" | "secondary";
    }
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
        if (ex.role === "primary") existing.role = "primary";
      } else {
        byName.set(ex.name, {
          totalSets: ex.weightedSets,
          dayEntries: [{ dayLabel: day.dayLabel, sets: ex.weightedSets }],
          role: ex.role,
        });
      }
    }
  }

  const total = muscleWeeklySets > 0 ? muscleWeeklySets : 1;
  const rows: ExerciseWeekRow[] = [...byName.entries()].map(([name, data]) => {
    const row: ExerciseWeekRow = {
      name,
      totalSets: data.totalSets,
      dayEntries: data.dayEntries,
      pctOfTotal: (data.totalSets / total) * 100,
      role: data.role,
    };
    if (data.role === "secondary") {
      row.actualSets = Math.round(data.totalSets / SECONDARY_SET_WEIGHT);
    }
    return row;
  });

  rows.sort((a, b) => {
    if (a.role !== b.role) return a.role === "primary" ? -1 : 1;
    return b.totalSets - a.totalSets;
  });
  return rows;
}

export function computeWeeklyMuscleStats(
  sessions: WorkoutSession[],
  selectedWeek: string,
  userMappings?: Record<string, MuscleMapEntry>,
): WeeklyMuscleStats {
  const bucket = weeklyMuscleBucketForWeek(
    sessions,
    selectedWeek,
    userMappings,
  );
  const dailyBreakdown = dailyMuscleSetsForWeek(
    sessions,
    selectedWeek,
    userMappings,
  );

  const trainedMuscleIds = new Set<MuscleId>(
    MUSCLE_IDS.filter((id) => bucket.muscles[id].sets > 0),
  );

  let trainedCount = 0;
  const globalTally = emptyStatusTally();

  for (const id of MUSCLE_IDS) {
    const sets = bucket.muscles[id].sets;
    if (sets <= 0) continue;
    trainedCount += 1;
    const s = statusFromWeeklySets(sets);
    globalTally[s] += 1;
  }

  const solidOrBetterCount =
    globalTally.solid + globalTally.high + globalTally.very_high;

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

    const { tally, totalSets } = tallyForMuscles(sorted, bucket);

    groups.push({
      id: cat.id,
      label: categoryShortLabel(cat.id, cat.label),
      muscles: sorted,
      totalSets,
      insufficientCount: tally.insufficient,
      minimalCount: tally.minimal,
      solidCount: tally.solid,
      highCount: tally.high,
      veryHighCount: tally.very_high,
    });
    for (const m of sorted) assigned.add(m);
  }

  const orphans = [...trainedMuscleIds].filter((m) => !assigned.has(m));
  if (orphans.length > 0) {
    const { tally, totalSets } = tallyForMuscles(orphans, bucket);
    groups.push({
      id: "other",
      label: "Other",
      muscles: orphans,
      totalSets,
      insufficientCount: tally.insufficient,
      minimalCount: tally.minimal,
      solidCount: tally.solid,
      highCount: tally.high,
      veryHighCount: tally.very_high,
    });
  }

  return {
    bucket,
    dailyBreakdown,
    trainedMuscleIds,
    solidOrBetterCount,
    trainedCount,
    statusCounts: {
      insufficient: globalTally.insufficient,
      minimal: globalTally.minimal,
      solid: globalTally.solid,
      high: globalTally.high,
      very_high: globalTally.very_high,
    },
    groups,
    isEmpty: trainedCount === 0,
  };
}
