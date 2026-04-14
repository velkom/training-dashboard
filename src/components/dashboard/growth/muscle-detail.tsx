"use client";

import { ArrowUp } from "lucide-react";

import { useMuscleExerciseRows } from "@/hooks/use-muscle-exercise-detail";
import {
  formatSets,
  SETS_GROWTH_MIN,
  type MuscleId,
  type TrainingStatus,
} from "@/lib/muscles";
import { cn } from "@/lib/utils";
import type { DailyMuscleBreakdown } from "@/lib/workout-stats";

export type MuscleExerciseDetailProps = {
  muscle: MuscleId;
  dailyBreakdown: DailyMuscleBreakdown;
  muscleWeeklySets: number;
  status: TrainingStatus;
};

export function MuscleExerciseDetail({
  muscle,
  dailyBreakdown,
  muscleWeeklySets,
  status,
}: MuscleExerciseDetailProps) {
  const rows = useMuscleExerciseRows(muscle, dailyBreakdown, muscleWeeklySets);
  const gapToGrowth =
    status !== "growing"
      ? Math.max(1, Math.ceil(SETS_GROWTH_MIN - muscleWeeklySets))
      : 0;

  if (rows.length === 0) return null;

  return (
    <div className="space-y-3 text-xs">
      <ul className="space-y-3">
        {rows.map((row) => (
          <li key={row.name} className="space-y-1.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
              <span className="min-w-0 font-semibold text-foreground">
                {row.name}
              </span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {Math.round(row.pctOfTotal)}% of week
              </span>
            </div>
            <p className="text-muted-foreground">
              {row.dayEntries
                .map(
                  (d) =>
                    `${d.dayLabel} · ${formatSets(d.sets)} set${Math.round(d.sets) === 1 ? "" : "s"}`,
                )
                .join(", ")}
            </p>
            <div className="h-1 w-full overflow-hidden rounded-full bg-muted/70">
              <div
                className="h-full rounded-full bg-primary/75 transition-[width] duration-200 ease-out"
                style={{ width: `${Math.min(100, row.pctOfTotal)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
      {status !== "growing" ? (
        <div
          className={cn(
            "mt-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium",
            status === "under"
              ? "border-fitness-under/20 bg-fitness-under/8 text-fitness-under"
              : "border-fitness-maintaining/20 bg-fitness-maintaining/8 text-fitness-maintaining",
          )}
        >
          <ArrowUp className="size-3.5 shrink-0 opacity-75" aria-hidden />
          Add ~{gapToGrowth} more set{gapToGrowth === 1 ? "" : "s"} to reach
          growth range
        </div>
      ) : null}
    </div>
  );
}
