"use client";

import { ArrowUp } from "lucide-react";

import { useMuscleExerciseRows } from "@/hooks/use-muscle-exercise-detail";
import {
  formatSets,
  SECONDARY_SET_WEIGHT,
  SETS_INSUFFICIENT_MAX,
  SETS_MINIMAL_MAX,
  statusColorClasses,
  type MuscleId,
  type TrainingStatus,
} from "@/lib/muscles";
import { cn } from "@/lib/utils";
import type { DailyMuscleBreakdown, ExerciseWeekRow } from "@/lib/workout-stats";

const TARGET_MINIMAL_SETS = SETS_INSUFFICIENT_MAX + 1;
const TARGET_SOLID_SETS = SETS_MINIMAL_MAX + 1;

function ExerciseRow({
  row,
  isSecondary = false,
}: {
  row: ExerciseWeekRow;
  isSecondary?: boolean;
}) {
  return (
    <li className="space-y-1.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
        <span
          className={cn(
            "min-w-0 font-semibold",
            isSecondary ? "text-muted-foreground" : "text-foreground",
          )}
        >
          {row.name}
        </span>
        <span className="shrink-0 tabular-nums text-muted-foreground">
          {Math.round(row.pctOfTotal)}% of week
        </span>
      </div>
      <p className="text-muted-foreground">
        {row.dayEntries
          .map((d) => {
            const setsLabel = `${formatSets(d.sets)} set${Math.round(d.sets) === 1 ? "" : "s"}`;
            if (isSecondary) {
              const actualPerDay = Math.round(d.sets / SECONDARY_SET_WEIGHT);
              return `${d.dayLabel} · ${setsLabel} (${actualPerDay} actual × 0.5)`;
            }
            return `${d.dayLabel} · ${setsLabel}`;
          })
          .join(", ")}
      </p>
      <div className="h-1 w-full overflow-hidden rounded-full bg-muted/70">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-200 ease-out",
            isSecondary ? "bg-muted-foreground/30" : "bg-primary/75",
          )}
          style={{ width: `${Math.min(100, row.pctOfTotal)}%` }}
        />
      </div>
    </li>
  );
}

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
  const primaryRows = rows.filter((r) => r.role === "primary");
  const secondaryRows = rows.filter((r) => r.role === "secondary");
  const primaryTotalSets = primaryRows.reduce((sum, r) => sum + r.totalSets, 0);
  const secondaryTotalSets = secondaryRows.reduce((sum, r) => sum + r.totalSets, 0);
  const weekDenom = muscleWeeklySets > 0 ? muscleWeeklySets : 1;

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
      {primaryRows.length > 0 ? (
        <div>
          {secondaryRows.length > 0 ? (
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Direct exercises
              </span>
              <span className="text-[10px] tabular-nums text-muted-foreground">
                {formatSets(primaryTotalSets)} sets ·{" "}
                {Math.round((primaryTotalSets / weekDenom) * 100)}%
              </span>
            </div>
          ) : null}
          <ul className="space-y-3">
            {primaryRows.map((row) => (
              <ExerciseRow key={row.name} row={row} />
            ))}
          </ul>
        </div>
      ) : null}

      {secondaryRows.length > 0 ? (
        <div
          className={cn(
            primaryRows.length > 0 && "mt-4 border-t border-border/40 pt-3",
          )}
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Secondary contribution
            </span>
            <span className="text-[10px] tabular-nums text-muted-foreground">
              {formatSets(secondaryTotalSets)} sets ·{" "}
              {Math.round((secondaryTotalSets / weekDenom) * 100)}%
            </span>
          </div>
          <p className="mb-3 text-[10px] text-muted-foreground">
            Counted at 50% — these exercises primarily target other muscles
          </p>
          <ul className="space-y-3">
            {secondaryRows.map((row) => (
              <ExerciseRow key={row.name} row={row} isSecondary />
            ))}
          </ul>
        </div>
      ) : null}
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
