"use client";

import {
  ArrowUp,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useMemo, useState } from "react";

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

/** Track width represents up to this many effective sets (150% of growth target). */
const BAR_SCALE_MAX_SETS = SETS_GROWTH_MIN * 1.5;

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
            "h-full rounded-full transition-[width] duration-200 ease-out",
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

function GrowthRingGauge({
  growingCount,
  trainedCount,
}: {
  growingCount: number;
  trainedCount: number;
}) {
  const ringPct =
    trainedCount > 0 ? (growingCount / trainedCount) * 100 : 0;
  const circumference = 100;
  const offset = circumference - ringPct;

  return (
    <div
      className="relative flex h-14 w-14 shrink-0 items-center justify-center"
      aria-label={`${growingCount} of ${trainedCount} trained muscles in growth range`}
    >
      <svg
        viewBox="0 0 36 36"
        className="absolute inset-0 size-full rotate-[-90deg]"
        aria-hidden
      >
        <circle
          cx="18"
          cy="18"
          r="15.915"
          fill="none"
          className="stroke-muted/20"
          strokeWidth={5}
        />
        <circle
          cx="18"
          cy="18"
          r="15.915"
          fill="none"
          className="stroke-fitness-growing"
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray="100"
          strokeDashoffset={offset}
          pathLength={100}
          style={{
            transition:
              "stroke-dashoffset 0.8s cubic-bezier(0.2, 0, 0, 1)",
          }}
        />
      </svg>
      <div className="pointer-events-none relative z-10 flex items-baseline justify-center gap-0.5 tabular-nums">
        <span className="text-[13px] font-bold leading-none text-foreground">
          {growingCount}
        </span>
        <span className="text-[10px] font-semibold leading-none text-muted-foreground">
          /{trainedCount}
        </span>
      </div>
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

  const statusCounts = useMemo(() => {
    let growing = 0;
    let maintaining = 0;
    let under = 0;
    for (const id of MUSCLE_IDS) {
      const sets = bucket.muscles[id].sets;
      if (sets <= 0) continue;
      const s = statusFromWeeklySets(sets);
      if (s === "growing") growing++;
      else if (s === "maintaining") maintaining++;
      else under++;
    }
    return { growing, maintaining, under };
  }, [bucket]);

  const groupedMuscles = useMemo(() => {
    const assigned = new Set<MuscleId>();
    const groups: { id: string; label: string; muscles: MuscleId[] }[] = [];

    for (const cat of MUSCLE_CATEGORIES) {
      const shortLabel =
        cat.id === "upper_push"
          ? "Push"
          : cat.id === "upper_pull"
            ? "Pull"
            : cat.label;
      const trained = cat.muscles.filter((m) => trainedMuscleIds.has(m));
      trained.sort((a, b) => {
        const sa = bucket.muscles[a].sets;
        const sb = bucket.muscles[b].sets;
        const ka = statusSortKey(statusFromWeeklySets(sa));
        const kb = statusSortKey(statusFromWeeklySets(sb));
        if (ka !== kb) return ka - kb;
        return sa - sb;
      });
      if (trained.length > 0) {
        groups.push({ id: cat.id, label: shortLabel, muscles: trained });
        for (const m of trained) assigned.add(m);
      }
    }

    const orphans = [...trainedMuscleIds].filter((m) => !assigned.has(m));
    if (orphans.length > 0) {
      groups.push({ id: "other", label: "Other", muscles: orphans });
    }

    return groups;
  }, [bucket, trainedMuscleIds]);

  const hasAnyTrainedMuscle = trainedCount > 0;

  return (
    <Card className="border-border/80">
      <CardHeader className="space-y-3">
        <div className="flex items-start gap-4">
          {hasAnyTrainedMuscle ? (
            <GrowthRingGauge
              growingCount={growingCount}
              trainedCount={trainedCount}
            />
          ) : null}
          <div className="min-w-0 flex-1 space-y-2">
            <CardTitle>Weekly growth stimulus</CardTitle>
            <p className="text-sm text-muted-foreground">
              Effective working sets vs a {SETS_GROWTH_MIN}+ sets / week growth
              target per muscle you trained.
              {!hasAnyTrainedMuscle ? (
                <> No muscle-tagged working volume logged this week.</>
              ) : null}
            </p>
            {hasAnyTrainedMuscle ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {statusCounts.growing > 0 ? (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full border border-fitness-growing/20 bg-fitness-growing/8 px-2.5 py-1 text-[11px] font-medium tabular-nums text-fitness-growing"
                  >
                    <span className="font-semibold">{statusCounts.growing}</span>
                    {STATUS_LABELS.growing}
                  </span>
                ) : null}
                {statusCounts.maintaining > 0 ? (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full border border-fitness-maintaining/20 bg-fitness-maintaining/8 px-2.5 py-1 text-[11px] font-medium tabular-nums text-fitness-maintaining"
                  >
                    <span className="font-semibold">
                      {statusCounts.maintaining}
                    </span>
                    {STATUS_LABELS.maintaining}
                  </span>
                ) : null}
                {statusCounts.under > 0 ? (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full border border-fitness-under/20 bg-fitness-under/8 px-2.5 py-1 text-[11px] font-medium tabular-nums text-fitness-under"
                  >
                    <span className="font-semibold">{statusCounts.under}</span>
                    {STATUS_LABELS.under}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {!hasAnyTrainedMuscle ? (
          <p className="text-sm text-muted-foreground">
            Train with mapped exercises or import muscle labels to see breakdown
            by muscle.
          </p>
        ) : null}

        {hasAnyTrainedMuscle ? (
          <div key={bucket.weekStart} className="space-y-5">
            {groupedMuscles.map((group, i) => {
              const catTotalSets = group.muscles.reduce(
                (sum, m) => sum + bucket.muscles[m].sets,
                0,
              );

              return (
                <div
                  key={group.id}
                  style={{
                    animation: `fadeSlideIn 350ms cubic-bezier(0.2, 0, 0, 1) ${i * 60}ms both`,
                  }}
                >
                  <div className="mb-2 flex items-center justify-between px-0.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {group.label}
                    </span>
                    <span className="text-[10px] tabular-nums text-muted-foreground">
                      {Math.round(catTotalSets)} total sets
                    </span>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-border/50 bg-card">
                    <div className="divide-y divide-border/50">
                      {group.muscles.map((muscle) => {
                        const sets = bucket.muscles[muscle].sets;
                        const status = statusFromWeeklySets(sets);
                        const expanded = expandedMuscle === muscle;

                        return (
                          <div key={muscle}>
                            <button
                              type="button"
                              id={`muscle-row-${muscle}`}
                              aria-expanded={expanded}
                              aria-controls={`muscle-detail-${muscle}`}
                              className={cn(
                                "grid w-full grid-cols-[1fr_auto_auto] items-center gap-3 px-3.5 py-2.5 text-left font-medium text-foreground transition-[background-color] duration-150",
                                "hover:bg-foreground/[0.03] active:bg-foreground/[0.05]",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                                expanded && "bg-foreground/[0.03]",
                              )}
                              onClick={() =>
                                setExpandedMuscle((prev) =>
                                  prev === muscle ? null : muscle,
                                )
                              }
                            >
                              <div className="min-w-0 space-y-1.5">
                                <div className="flex min-w-0 items-center gap-1.5">
                                  {expanded ? (
                                    <ChevronUp
                                      className="size-4 shrink-0 opacity-70"
                                      aria-hidden
                                    />
                                  ) : (
                                    <ChevronDown
                                      className="size-4 shrink-0 opacity-70"
                                      aria-hidden
                                    />
                                  )}
                                  <span className="truncate">
                                    {MUSCLE_LABELS[muscle]}
                                  </span>
                                  <span className="sr-only">
                                    {`, ${STATUS_LABELS[status]}`}
                                  </span>
                                </div>
                                <GrowthProgressBar sets={sets} status={status} />
                              </div>
                              <div className="shrink-0 whitespace-nowrap">
                                <span className="text-sm font-semibold tabular-nums">
                                  {formatSets(sets)}
                                </span>
                                <span className="ml-0.5 text-[10px] text-muted-foreground">
                                  sets
                                </span>
                              </div>
                              <span
                                className={cn(
                                  "size-2 shrink-0 rounded-full",
                                  status === "growing" &&
                                    "bg-fitness-growing shadow-[0_0_6px_var(--color-fitness-growing)]/20",
                                  status === "maintaining" &&
                                    "bg-fitness-maintaining shadow-[0_0_6px_var(--color-fitness-maintaining)]/20",
                                  status === "under" &&
                                    "bg-fitness-under shadow-[0_0_6px_var(--color-fitness-under)]/20",
                                )}
                                title={STATUS_LABELS[status]}
                                aria-hidden
                              />
                            </button>
                            {expanded ? (
                              <div
                                id={`muscle-detail-${muscle}`}
                                role="region"
                                aria-labelledby={`muscle-row-${muscle}`}
                                className="border-t border-border/50 bg-background/50 px-3.5 py-3"
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
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
