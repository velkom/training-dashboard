"use client";

import {
  SETS_GROWTH_MIN,
  statusColorClasses,
  type TrainingStatus,
} from "@/lib/muscles";
import { cn } from "@/lib/utils";

/** Track width represents up to this many effective sets (150% of growth target). */
const BAR_SCALE_MAX_SETS = SETS_GROWTH_MIN * 1.5;

export type GrowthProgressBarProps = {
  sets: number;
  status: TrainingStatus;
};

export function GrowthProgressBar({ sets, status }: GrowthProgressBarProps) {
  const fillPct = Math.min(
    100,
    BAR_SCALE_MAX_SETS > 0 ? (sets / BAR_SCALE_MAX_SETS) * 100 : 0,
  );
  const tickPct =
    SETS_GROWTH_MIN > 0 && BAR_SCALE_MAX_SETS > 0
      ? (SETS_GROWTH_MIN / BAR_SCALE_MAX_SETS) * 100
      : 0;
  const colors = statusColorClasses(status);

  return (
    <div className="relative h-1.5 w-full">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted/60">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-200 ease-out",
            colors.barFill,
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
