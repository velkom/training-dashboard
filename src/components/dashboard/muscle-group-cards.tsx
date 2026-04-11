"use client";

import { useMemo } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  MUSCLE_IDS,
  MUSCLE_LABELS,
  STATUS_LABELS,
  statusFromWeeklySets,
  type TrainingStatus,
} from "@/lib/muscle-groups";
import {
  filterSessions,
  weeklyMuscleSetsEndingAt,
} from "@/lib/workout-stats";
import type { UserFilter } from "@/lib/workout-stats";
import type { WorkoutSession } from "@/types";

type MuscleGroupCardsProps = {
  sessions: WorkoutSession[];
  user: UserFilter;
  /** Monday ISO; muscle counts and sparkline end on this week */
  selectedWeek: string;
  /** Heading line, e.g. from `formatWeekRangeDisplay(selectedWeek)` */
  weekLabel: string;
  /** Weeks of history for sparkline (incl. selected week) */
  sparkWeeks?: number;
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

export function MuscleGroupCards({
  sessions,
  user,
  selectedWeek,
  weekLabel,
  sparkWeeks = 8,
}: MuscleGroupCardsProps) {
  const scoped = filterSessions(sessions, user);
  const buckets = useMemo(
    () =>
      weeklyMuscleSetsEndingAt(
        scoped,
        selectedWeek,
        Math.max(12, sparkWeeks),
      ),
    [scoped, selectedWeek, sparkWeeks],
  );

  const currentIdx = buckets.length - 1;
  const sliceStart = Math.max(0, buckets.length - sparkWeeks);

  const cardData = useMemo(() => {
    return MUSCLE_IDS.map((muscle) => {
      const currentSets =
        currentIdx >= 0 ? buckets[currentIdx]!.muscles[muscle].sets : 0;
      const status = statusFromWeeklySets(currentSets);
      const spark = buckets.slice(sliceStart).map((b) => b.muscles[muscle].sets);
      const maxSpark = Math.max(...spark, 0.0001);
      return {
        muscle,
        label: MUSCLE_LABELS[muscle],
        currentSets,
        status,
        spark,
        maxSpark,
      };
    });
  }, [buckets, currentIdx, sliceStart]);

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">
          Muscle focus ({weekLabel})
        </h2>
        <p className="text-sm text-muted-foreground">
          Effective working sets per muscle. Scroll sideways to compare.
        </p>
      </div>
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [-webkit-overflow-scrolling:touch]">
        {cardData.map(({ muscle, ...row }) => (
          <MuscleMiniCard key={muscle} {...row} />
        ))}
      </div>
    </div>
  );
}

function MuscleMiniCard({
  label,
  currentSets,
  status,
  spark,
  maxSpark,
}: {
  label: string;
  currentSets: number;
  status: TrainingStatus;
  spark: number[];
  maxSpark: number;
}) {
  return (
    <Card
      className={cn(
        "w-[10.75rem] shrink-0 snap-start overflow-hidden border bg-card/90 p-3 shadow-sm backdrop-blur-sm",
        "border-border/80 transition-transform hover:border-primary/30",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
            {currentSets < 10 ? currentSets.toFixed(1) : Math.round(currentSets)}
          </p>
          <p className="text-[10px] text-muted-foreground">sets / week</p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium leading-tight",
            statusStyles(status),
          )}
        >
          {STATUS_LABELS[status]}
        </span>
      </div>
      <div className="mt-3 flex h-7 items-end gap-0.5">
        {spark.map((v, i) => {
          const pct = Math.min(100, (v / maxSpark) * 100);
          return (
            <div
              key={i}
              className="flex h-full min-w-[6px] flex-1 flex-col justify-end rounded-sm bg-muted/50"
              title={`${v.toFixed(1)} sets`}
            >
              <div
                className="w-full rounded-sm bg-primary/85"
                style={{ height: `${pct}%` }}
              />
            </div>
          );
        })}
      </div>
    </Card>
  );
}
