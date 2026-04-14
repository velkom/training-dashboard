"use client";

import {
  SETS_MINIMAL_MAX,
  statusColorClasses,
  type TrainingStatus,
} from "@/lib/muscles";
import { cn } from "@/lib/utils";

/** Track width represents up to this many effective sets (slightly above the 20+ zone). */
const BAR_SCALE_MAX_SETS = 25;

/** Zone boundary ticks on the bar (effective sets). */
const ZONE_TICK_SETS = [6, 10, 15, 20] as const;

const SOLID_THRESHOLD_SETS = SETS_MINIMAL_MAX + 1;

export type GrowthProgressBarProps = {
  sets: number;
  status: TrainingStatus;
};

export function GrowthProgressBar({ sets, status }: GrowthProgressBarProps) {
  const fillPct = Math.min(
    100,
    BAR_SCALE_MAX_SETS > 0 ? (sets / BAR_SCALE_MAX_SETS) * 100 : 0,
  );
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
      {ZONE_TICK_SETS.map((tickSets) => {
        const leftPct =
          BAR_SCALE_MAX_SETS > 0 ? (tickSets / BAR_SCALE_MAX_SETS) * 100 : 0;
        const isSolid = tickSets === SOLID_THRESHOLD_SETS;
        return (
          <div
            key={tickSets}
            className={cn(
              "pointer-events-none absolute inset-y-0 z-10 w-px bg-foreground/60",
              isSolid && "w-0.5 bg-foreground/75",
            )}
            style={{ left: `${leftPct}%`, transform: "translateX(-50%)" }}
            aria-hidden
          />
        );
      })}
    </div>
  );
}
