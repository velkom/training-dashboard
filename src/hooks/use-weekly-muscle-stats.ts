"use client";

import { useMemo } from "react";

import {
  computeWeeklyMuscleStats,
  type WeeklyMuscleStats,
} from "@/lib/workout-stats";
import { useUserExerciseMappingsStore } from "@/stores/user-exercise-mappings";
import type { WorkoutSession } from "@/types";

export function useWeeklyMuscleStats(
  scopedSessions: WorkoutSession[],
  selectedWeek: string,
): WeeklyMuscleStats {
  const userMappings = useUserExerciseMappingsStore((s) => s.mappings);
  return useMemo(
    () =>
      computeWeeklyMuscleStats(scopedSessions, selectedWeek, userMappings),
    [scopedSessions, selectedWeek, userMappings],
  );
}
