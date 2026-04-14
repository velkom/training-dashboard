"use client";

import { STATUS_LABELS } from "@/lib/muscles";
import type { WeeklyMuscleStats } from "@/lib/workout-stats";

export type GrowthSummaryPillsProps = {
  statusCounts: WeeklyMuscleStats["statusCounts"];
};

export function GrowthSummaryPills({ statusCounts }: GrowthSummaryPillsProps) {
  return (
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
          <span className="font-semibold">{statusCounts.maintaining}</span>
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
  );
}
