"use client";

import { STATUS_LABELS, type TrainingStatus } from "@/lib/muscles";
import type { WeeklyMuscleStats } from "@/lib/workout-stats";

const PILL_ORDER: TrainingStatus[] = [
  "insufficient",
  "minimal",
  "solid",
  "high",
  "very_high",
];

const PILL_STYLES: Record<
  TrainingStatus,
  { border: string; bg: string; text: string }
> = {
  insufficient: {
    border: "border-fitness-insufficient/20",
    bg: "bg-fitness-insufficient/8",
    text: "text-fitness-insufficient",
  },
  minimal: {
    border: "border-fitness-minimal/20",
    bg: "bg-fitness-minimal/8",
    text: "text-fitness-minimal",
  },
  solid: {
    border: "border-fitness-solid/20",
    bg: "bg-fitness-solid/8",
    text: "text-fitness-solid",
  },
  high: {
    border: "border-fitness-high/20",
    bg: "bg-fitness-high/8",
    text: "text-fitness-high",
  },
  very_high: {
    border: "border-fitness-very-high/20",
    bg: "bg-fitness-very-high/8",
    text: "text-fitness-very-high",
  },
};

export type GrowthSummaryPillsProps = {
  statusCounts: WeeklyMuscleStats["statusCounts"];
};

export function GrowthSummaryPills({ statusCounts }: GrowthSummaryPillsProps) {
  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {PILL_ORDER.map((status) => {
        const count = statusCounts[status];
        if (count <= 0) return null;
        const styles = PILL_STYLES[status];
        return (
          <span
            key={status}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium tabular-nums ${styles.border} ${styles.bg} ${styles.text}`}
          >
            <span className="font-semibold">{count}</span>
            {STATUS_LABELS[status]}
          </span>
        );
      })}
    </div>
  );
}
