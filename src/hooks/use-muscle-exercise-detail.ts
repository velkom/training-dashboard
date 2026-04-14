"use client";

import { useMemo } from "react";

import type { MuscleId } from "@/lib/muscles";
import {
  buildMuscleExerciseRows,
  type DailyMuscleBreakdown,
  type ExerciseWeekRow,
} from "@/lib/workout-stats";

export function useMuscleExerciseRows(
  muscle: MuscleId,
  dailyBreakdown: DailyMuscleBreakdown,
  muscleWeeklySets: number,
): ExerciseWeekRow[] {
  return useMemo(
    () => buildMuscleExerciseRows(muscle, dailyBreakdown, muscleWeeklySets),
    [dailyBreakdown, muscle, muscleWeeklySets],
  );
}
