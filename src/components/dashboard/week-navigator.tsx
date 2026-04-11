"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatWeekRangeDisplay, shiftWeekStart } from "@/lib/workout-stats";
import { cn } from "@/lib/utils";

export type WeekNavigatorProps = {
  selectedWeek: string;
  onWeekChange: (weekStart: string) => void;
  /** Monday ISO of the calendar week containing "today" */
  currentWeekMonday: string;
  hasWorkoutsInWeek: boolean;
};

export function WeekNavigator({
  selectedWeek,
  onWeekChange,
  currentWeekMonday,
  hasWorkoutsInWeek,
}: WeekNavigatorProps) {
  const isCurrentWeek = selectedWeek === currentWeekMonday;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border/80 bg-card/60 p-4 shadow-sm backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between",
        !hasWorkoutsInWeek && "border-dashed border-muted-foreground/30",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0"
          aria-label="Previous week"
          onClick={() => onWeekChange(shiftWeekStart(selectedWeek, -1))}
        >
          <ChevronLeft />
        </Button>
        <div className="min-w-0 flex-1 px-1 text-center sm:text-left">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Selected week
          </p>
          <p className="truncate text-sm font-semibold tabular-nums text-foreground">
            {formatWeekRangeDisplay(selectedWeek)}
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0"
          aria-label="Next week"
          onClick={() => onWeekChange(shiftWeekStart(selectedWeek, 1))}
        >
          <ChevronRight />
        </Button>
      </div>
      <div className="flex flex-col items-stretch gap-2 sm:items-end">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="w-full sm:w-auto"
          disabled={isCurrentWeek}
          onClick={() => onWeekChange(currentWeekMonday)}
        >
          This week
        </Button>
        {!hasWorkoutsInWeek ? (
          <p className="text-center text-xs text-muted-foreground sm:text-right">
            No logged workouts in this week for the selected profile.
          </p>
        ) : null}
      </div>
    </div>
  );
}
