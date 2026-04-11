"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  MUSCLE_CATEGORIES,
  MUSCLE_IDS,
  MUSCLE_LABELS,
  SETS_GROWTH_MIN,
  STATUS_LABELS,
  statusFromWeeklySets,
  type MuscleId,
  type TrainingStatus,
} from "@/lib/muscle-groups";
import type {
  DailyMuscleBreakdown,
  WeeklyMuscleBucket,
} from "@/lib/workout-stats";

type WeeklyGrowthSummaryProps = {
  bucket: WeeklyMuscleBucket;
  dailyBreakdown: DailyMuscleBreakdown;
};

function statusStyles(status: TrainingStatus): string {
  switch (status) {
    case "growing":
      return "text-fitness-growing border-fitness-growing/40 bg-fitness-growing/10";
    case "maintaining":
      return "text-fitness-maintaining border-fitness-maintaining/40 bg-fitness-maintaining/10";
    case "under":
      return "text-fitness-under border-fitness-under/40 bg-fitness-under/10";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function barFillClass(status: TrainingStatus): string {
  switch (status) {
    case "growing":
      return "bg-fitness-growing/80";
    case "maintaining":
      return "bg-fitness-maintaining/80";
    case "under":
      return "bg-fitness-under/70";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function formatSets(sets: number): string {
  return sets < 10 ? sets.toFixed(1) : String(Math.round(sets));
}

function MuscleDayDetail({
  muscle,
  dailyBreakdown,
}: {
  muscle: MuscleId;
  dailyBreakdown: DailyMuscleBreakdown;
}) {
  const daysWithWork = useMemo(() => {
    return dailyBreakdown
      .map((day) => {
        const cell = day.muscles[muscle];
        if (cell.sets <= 0) return null;
        const exercises = [...cell.exercises].sort(
          (a, b) => b.weightedSets - a.weightedSets,
        );
        return { ...day, cell: { ...cell, exercises } };
      })
      .filter(
        (row): row is NonNullable<typeof row> => row != null,
      );
  }, [dailyBreakdown, muscle]);

  if (daysWithWork.length === 0) return null;

  return (
    <div className="mt-2 space-y-2 rounded-md border border-border/50 bg-muted/20 p-2 text-xs">
      {daysWithWork.map(({ date, dayLabel, cell }) => (
        <div key={date}>
          <p className="font-semibold text-foreground">
            {dayLabel}{" "}
            <span className="font-normal tabular-nums text-muted-foreground">
              {date}
            </span>
            <span className="ml-1.5 tabular-nums text-muted-foreground">
              · {formatSets(cell.sets)} sets
            </span>
          </p>
          <ul className="mt-1 space-y-0.5 pl-2 text-muted-foreground">
            {cell.exercises.map((ex) => (
              <li key={ex.name} className="flex justify-between gap-2">
                <span className="min-w-0 truncate">{ex.name}</span>
                <span className="shrink-0 tabular-nums">
                  {formatSets(ex.weightedSets)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function WeeklyGrowthSummary({
  bucket,
  dailyBreakdown,
}: WeeklyGrowthSummaryProps) {
  const [expandedMuscle, setExpandedMuscle] = useState<MuscleId | null>(null);

  const trainedMuscleIds = useMemo(() => {
    return new Set(
      MUSCLE_IDS.filter((id) => bucket.muscles[id].sets > 0),
    );
  }, [bucket]);

  const { growingCount, trainedCount } = useMemo(() => {
    let growing = 0;
    let trained = 0;
    for (const id of MUSCLE_IDS) {
      const sets = bucket.muscles[id].sets;
      if (sets <= 0) continue;
      trained += 1;
      if (statusFromWeeklySets(sets) === "growing") growing += 1;
    }
    return { growingCount: growing, trainedCount: trained };
  }, [bucket]);

  const hasAnyTrainedMuscle = trainedCount > 0;

  return (
    <Card className="border-border/80">
      <CardHeader>
        <CardTitle>Weekly growth stimulus</CardTitle>
        <p className="text-sm text-muted-foreground">
          Effective working sets vs growth target ({SETS_GROWTH_MIN}+ sets / week
          per trained muscle).
          {hasAnyTrainedMuscle ? (
            <>
              {" "}
              {growingCount}/{trainedCount} trained muscles in the growth range.
            </>
          ) : (
            <> No muscle-tagged working volume logged this week.</>
          )}
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {!hasAnyTrainedMuscle ? (
          <p className="text-sm text-muted-foreground">
            Train with mapped exercises or import muscle labels to see breakdown
            by muscle.
          </p>
        ) : null}

        {MUSCLE_CATEGORIES.map((cat) => {
          const musclesInCat = cat.muscles.filter((m) => trainedMuscleIds.has(m));
          if (musclesInCat.length === 0) return null;

          return (
            <div key={cat.id}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {cat.label}
              </h3>
              <ul className="space-y-3">
                {musclesInCat.map((muscle) => {
                  const sets = bucket.muscles[muscle].sets;
                  const status = statusFromWeeklySets(sets);
                  const pct = Math.min(
                    100,
                    SETS_GROWTH_MIN > 0 ? (sets / SETS_GROWTH_MIN) * 100 : 0,
                  );
                  const expanded = expandedMuscle === muscle;

                  return (
                    <li key={muscle} className="rounded-lg border border-transparent">
                      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start sm:gap-4">
                        <div className="min-w-0 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-auto min-w-0 flex-1 justify-start gap-1.5 px-1 py-0.5 text-left font-medium"
                              aria-expanded={expanded}
                              aria-controls={`muscle-detail-${muscle}`}
                              id={`muscle-row-${muscle}`}
                              onClick={() =>
                                setExpandedMuscle((prev) =>
                                  prev === muscle ? null : muscle,
                                )
                              }
                            >
                              {expanded ? (
                                <ChevronUp className="size-4 shrink-0 opacity-70" />
                              ) : (
                                <ChevronDown className="size-4 shrink-0 opacity-70" />
                              )}
                              <span className="truncate">
                                {MUSCLE_LABELS[muscle]}
                              </span>
                            </Button>
                            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                              {formatSets(sets)} sets
                            </span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                barFillClass(status),
                              )}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          {expanded ? (
                            <div
                              id={`muscle-detail-${muscle}`}
                              role="region"
                              aria-labelledby={`muscle-row-${muscle}`}
                            >
                              <MuscleDayDetail
                                muscle={muscle}
                                dailyBreakdown={dailyBreakdown}
                              />
                            </div>
                          ) : null}
                        </div>
                        <span
                          className={cn(
                            "justify-self-start rounded-full border px-2 py-0.5 text-[10px] font-medium leading-tight sm:justify-self-end sm:pt-0.5",
                            statusStyles(status),
                          )}
                        >
                          {STATUS_LABELS[status]}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
