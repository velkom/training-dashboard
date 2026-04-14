"use client";

import { useMemo } from "react";

import {
  computeWeeklyMuscleStats,
  type WeeklyMuscleStats,
} from "@/lib/workout-stats";
import type { WorkoutSession } from "@/types";

export function useWeeklyMuscleStats(
  scopedSessions: WorkoutSession[],
  selectedWeek: string,
): WeeklyMuscleStats {
  return useMemo(
    () => computeWeeklyMuscleStats(scopedSessions, selectedWeek),
    [scopedSessions, selectedWeek],
  );
}
