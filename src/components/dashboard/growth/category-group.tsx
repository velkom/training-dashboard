"use client";

import { ChevronDown, ChevronUp } from "lucide-react";

import {
  formatSets,
  MUSCLE_LABELS,
  STATUS_LABELS,
  statusFromWeeklySets,
  type MuscleId,
} from "@/lib/muscles";
import { cn } from "@/lib/utils";
import type {
  DailyMuscleBreakdown,
  MuscleGroupSummary,
  WeeklyMuscleBucket,
} from "@/lib/workout-stats";

import { GrowthProgressBar } from "./progress-bar";
import { MuscleExerciseDetail } from "./muscle-detail";
import { StatusDot } from "./status-dot";

export type GrowthCategoryGroupProps = {
  group: MuscleGroupSummary;
  groupIndex: number;
  bucket: WeeklyMuscleBucket;
  dailyBreakdown: DailyMuscleBreakdown;
  expandedMuscle: MuscleId | null;
  onToggleMuscle: (muscle: MuscleId) => void;
};

export function GrowthCategoryGroup({
  group,
  groupIndex,
  bucket,
  dailyBreakdown,
  expandedMuscle,
  onToggleMuscle,
}: GrowthCategoryGroupProps) {
  return (
    <div
      style={{
        animation: `fadeSlideIn 350ms cubic-bezier(0.2, 0, 0, 1) ${groupIndex * 60}ms both`,
      }}
    >
      <div className="mb-2 flex items-center justify-between px-0.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {group.label}
        </span>
        <span className="text-[10px] tabular-nums text-muted-foreground">
          {Math.round(group.totalSets)} total sets
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
                  onClick={() => onToggleMuscle(muscle)}
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
                      <span className="truncate">{MUSCLE_LABELS[muscle]}</span>
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
                  <StatusDot status={status} />
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
}
