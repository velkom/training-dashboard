"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  MUSCLE_IDS,
  MUSCLE_LABELS,
  SETS_GROWTH_MIN,
  SETS_MAINTENANCE_MIN,
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

/** Track width represents up to this many effective sets (150% of growth target). */
const BAR_SCALE_MAX_SETS = SETS_GROWTH_MIN * 1.5;

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
  return String(Math.round(sets));
}

function statusSortKey(status: TrainingStatus): number {
  switch (status) {
    case "under":
      return 0;
    case "maintaining":
      return 1;
    case "growing":
      return 2;
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

type ExerciseWeekRow = {
  name: string;
  totalSets: number;
  dayEntries: { dayLabel: string; sets: number }[];
  pctOfTotal: number;
};

function useMuscleExerciseRows(
  muscle: MuscleId,
  dailyBreakdown: DailyMuscleBreakdown,
  muscleWeeklySets: number,
): ExerciseWeekRow[] {
  return useMemo(() => {
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
            dayEntries: [
              { dayLabel: day.dayLabel, sets: ex.weightedSets },
            ],
          });
        }
      }
    }

    const total = muscleWeeklySets > 0 ? muscleWeeklySets : 1;
    const rows: ExerciseWeekRow[] = [...byName.entries()].map(
      ([name, data]) => ({
        name,
        totalSets: data.totalSets,
        dayEntries: data.dayEntries,
        pctOfTotal: (data.totalSets / total) * 100,
      }),
    );
    rows.sort((a, b) => b.totalSets - a.totalSets);
    return rows;
  }, [dailyBreakdown, muscle, muscleWeeklySets]);
}

function MuscleExerciseDetail({
  muscle,
  dailyBreakdown,
  muscleWeeklySets,
  status,
}: {
  muscle: MuscleId;
  dailyBreakdown: DailyMuscleBreakdown;
  muscleWeeklySets: number;
  status: TrainingStatus;
}) {
  const rows = useMuscleExerciseRows(muscle, dailyBreakdown, muscleWeeklySets);
  const gapToGrowth =
    status !== "growing"
      ? Math.max(1, Math.ceil(SETS_GROWTH_MIN - muscleWeeklySets))
      : 0;

  if (rows.length === 0) return null;

  return (
    <div className="mt-2 space-y-3 rounded-md border border-border/50 bg-muted/20 p-3 text-xs">
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
                className="h-full rounded-full bg-primary/75 transition-all"
                style={{ width: `${Math.min(100, row.pctOfTotal)}%` }}
              />
            </div>
          </li>
        ))}
      </ul>
      {status !== "growing" ? (
        <p
          className={cn(
            "border-t border-border/40 pt-3 text-xs leading-relaxed",
            status === "under"
              ? "text-fitness-under/90"
              : "text-fitness-maintaining/90",
          )}
        >
          Add ~{gapToGrowth} more set{gapToGrowth === 1 ? "" : "s"} this week to
          reach growth range.
        </p>
      ) : null}
    </div>
  );
}

function GrowthProgressBar({
  sets,
  status,
}: {
  sets: number;
  status: TrainingStatus;
}) {
  const fillPct = Math.min(
    100,
    BAR_SCALE_MAX_SETS > 0 ? (sets / BAR_SCALE_MAX_SETS) * 100 : 0,
  );
  const tickPct =
    SETS_GROWTH_MIN > 0 && BAR_SCALE_MAX_SETS > 0
      ? (SETS_GROWTH_MIN / BAR_SCALE_MAX_SETS) * 100
      : 0;

  return (
    <div className="relative h-1.5 w-full">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            barFillClass(status),
          )}
          style={{ width: `${fillPct}%` }}
        />
      </div>
      <div
        className="pointer-events-none absolute inset-y-0 z-10 w-px bg-foreground/60"
        style={{ left: `${tickPct}%`, transform: "translateX(-50%)" }}
        aria-hidden
      />
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

  const sortedTrainedMuscles = useMemo(() => {
    const ids = MUSCLE_IDS.filter((id) => trainedMuscleIds.has(id));
    return ids.sort((a, b) => {
      const sa = bucket.muscles[a].sets;
      const sb = bucket.muscles[b].sets;
      const sta = statusFromWeeklySets(sa);
      const stb = statusFromWeeklySets(sb);
      const ka = statusSortKey(sta);
      const kb = statusSortKey(stb);
      if (ka !== kb) return ka - kb;
      return sa - sb;
    });
  }, [bucket, trainedMuscleIds]);

  const hasAnyTrainedMuscle = trainedCount > 0;

  return (
    <Card className="border-border/80">
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <CardTitle>Weekly growth stimulus</CardTitle>
          {hasAnyTrainedMuscle ? (
            <Badge
              variant="outline"
              className="h-auto shrink-0 border-fitness-growing/30 bg-fitness-growing/15 px-2.5 py-1 text-xs font-semibold text-fitness-growing"
            >
              {growingCount} of {trainedCount} muscle
              {trainedCount === 1 ? "" : "s"} growing
            </Badge>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">
          Effective working sets vs a {SETS_GROWTH_MIN}+ sets / week growth
          target per muscle you trained.
          {!hasAnyTrainedMuscle ? (
            <> No muscle-tagged working volume logged this week.</>
          ) : null}
        </p>
        {hasAnyTrainedMuscle ? (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span
                className="size-2 shrink-0 rounded-full bg-fitness-growing"
                aria-hidden
              />
              <span>
                Growing: {SETS_GROWTH_MIN}+ sets
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="size-2 shrink-0 rounded-full bg-fitness-maintaining"
                aria-hidden
              />
              <span>
                Maintaining: {SETS_MAINTENANCE_MIN}–{SETS_GROWTH_MIN - 1} sets
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span
                className="size-2 shrink-0 rounded-full bg-fitness-under"
                aria-hidden
              />
              <span>Under-trained: &lt;{SETS_MAINTENANCE_MIN} sets</span>
            </span>
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-6">
        {!hasAnyTrainedMuscle ? (
          <p className="text-sm text-muted-foreground">
            Train with mapped exercises or import muscle labels to see breakdown
            by muscle.
          </p>
        ) : null}

        {hasAnyTrainedMuscle ? (
          <ul className="space-y-3">
            {sortedTrainedMuscles.map((muscle) => {
              const sets = bucket.muscles[muscle].sets;
              const status = statusFromWeeklySets(sets);
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
                      <GrowthProgressBar sets={sets} status={status} />
                      {expanded ? (
                        <div
                          id={`muscle-detail-${muscle}`}
                          role="region"
                          aria-labelledby={`muscle-row-${muscle}`}
                        >
                          <MuscleExerciseDetail
                            muscle={muscle}
                            dailyBreakdown={dailyBreakdown}
                            muscleWeeklySets={sets}
                            status={status}
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
        ) : null}
      </CardContent>
    </Card>
  );
}
