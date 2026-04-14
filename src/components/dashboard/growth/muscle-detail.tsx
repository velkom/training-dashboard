"use client";

import { ArrowUp } from "lucide-react";

import { useMuscleExerciseRows } from "@/hooks/use-muscle-exercise-detail";
import {
  formatSets,
  SETS_INSUFFICIENT_MAX,
  SETS_MINIMAL_MAX,
  statusColorClasses,
  type MuscleId,
  type TrainingStatus,
} from "@/lib/muscles";
import { cn } from "@/lib/utils";
import type { DailyMuscleBreakdown } from "@/lib/workout-stats";

const TARGET_MINIMAL_SETS = SETS_INSUFFICIENT_MAX + 1;
const TARGET_SOLID_SETS = SETS_MINIMAL_MAX + 1;

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

  const gapToMinimal =
    status === "insufficient"
      ? Math.max(1, Math.ceil(TARGET_MINIMAL_SETS - muscleWeeklySets))
      : 0;
  const gapToSolid =
    status === "minimal"
      ? Math.max(1, Math.ceil(TARGET_SOLID_SETS - muscleWeeklySets))
      : 0;

  if (rows.length === 0) return null;

  const zoneNote = (() => {
    switch (status) {
      case "insufficient":
      case "minimal":
        return null;
      case "solid":
        return (
          <p className="mt-3 text-muted-foreground">
            In solid growth range.
          </p>
        );
      case "high":
        return (
          <p className="mt-3 text-muted-foreground">
            High weekly volume — ensure recovery is adequate.
          </p>
        );
      case "very_high":
        return (
          <p className="mt-3 text-muted-foreground">
            Very high volume — likely does not need more work.
          </p>
        );
      default: {
        const _exhaustive: never = status;
        return _exhaustive;
      }
    }
  })();

  const nudgeColors = statusColorClasses(status);

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
      {status === "insufficient" ? (
        <div
          className={cn(
            "mt-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium",
            nudgeColors.border,
            nudgeColors.bg,
            nudgeColors.text,
          )}
        >
          <ArrowUp className="size-3.5 shrink-0 opacity-75" aria-hidden />
          Add ~{gapToMinimal} more set{gapToMinimal === 1 ? "" : "s"} to reach
          minimal growth stimulus
        </div>
      ) : null}
      {status === "minimal" ? (
        <div
          className={cn(
            "mt-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium",
            nudgeColors.border,
            nudgeColors.bg,
            nudgeColors.text,
          )}
        >
          <ArrowUp className="size-3.5 shrink-0 opacity-75" aria-hidden />
          Add ~{gapToSolid} more set{gapToSolid === 1 ? "" : "s"} to reach solid
          growth stimulus
        </div>
      ) : null}
      {zoneNote}
    </div>
  );
}
