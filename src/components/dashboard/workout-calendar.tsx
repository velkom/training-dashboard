"use client";

import { useMemo } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { filterSessions, workoutDates } from "@/lib/workout-stats";
import type { UserFilter } from "@/lib/workout-stats";
import { cn } from "@/lib/utils";
import type { WorkoutSession } from "@/types";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type WorkoutCalendarProps = {
  sessions: WorkoutSession[];
  user: UserFilter;
  weeks?: number;
};

export function WorkoutCalendar({
  sessions,
  user,
  weeks = 16,
}: WorkoutCalendarProps) {
  const scoped = filterSessions(sessions, user);
  const counts = workoutDates(scoped);

  const { columns, maxCount } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setDate(start.getDate() - (weeks * 7 - 1));
    const mondayOffset = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - mondayOffset);
    const anchor = start.getTime();
    const dayMs = 86400000;

    const cols: { date: string; count: number }[][] = [];
    let max = 0;
    for (let w = 0; w < weeks; w++) {
      const col: { date: string; count: number }[] = [];
      for (let d = 0; d < 7; d++) {
        const cell = new Date(anchor + (w * 7 + d) * dayMs);
        const key = cell.toISOString().slice(0, 10);
        const count = counts.get(key) ?? 0;
        max = Math.max(max, count);
        col.push({ date: key, count });
      }
      cols.push(col);
    }
    return { columns: cols, maxCount: max || 1 };
  }, [counts, weeks]);

  return (
    <Card className="border-border/80 bg-card/60 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 overflow-x-auto">
        <div className="flex min-w-[520px] gap-1">
          <div className="flex w-8 flex-col justify-end gap-1 pb-6 text-[10px] text-muted-foreground">
            {WEEKDAY_LABELS.map((d) => (
              <div key={d} className="h-3 leading-3">
                {d}
              </div>
            ))}
          </div>
          <div className="flex flex-1 gap-1">
            {columns.map((col, wi) => (
              <div key={wi} className="flex flex-1 flex-col gap-1">
                <div className="h-4 text-center text-[10px] text-muted-foreground">
                  {wi % 4 === 0
                    ? new Date(col[0]!.date + "T12:00:00").toLocaleDateString(
                        "en-US",
                        { day: "numeric", month: "short" },
                      )
                    : ""}
                </div>
                {col.map((cell) => (
                  <div
                    key={cell.date}
                    title={`${cell.date}: ${cell.count} workout(s)`}
                    className={cn(
                      "h-3 w-full rounded-sm border border-transparent",
                      cell.count === 0 && "bg-muted/50",
                      cell.count > 0 &&
                        "border-primary/25 bg-primary/25 dark:bg-primary/35",
                    )}
                    style={{
                      opacity:
                        cell.count === 0
                          ? undefined
                          : 0.35 + (0.65 * cell.count) / maxCount,
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Intensity = number of workouts logged that day.
        </p>
      </CardContent>
    </Card>
  );
}
