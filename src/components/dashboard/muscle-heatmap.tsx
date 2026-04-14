"use client";

import { Fragment, useMemo } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MUSCLE_CATEGORIES, MUSCLE_LABELS, type MuscleId } from "@/lib/muscles";
import { filterSessions, weeklyMuscleSets } from "@/lib/workout-stats";
import type { UserFilter } from "@/lib/workout-stats";
import type { WorkoutSession } from "@/types";

type MuscleHeatmapProps = {
  sessions: WorkoutSession[];
  user: UserFilter;
  weeks?: number;
};

function cellStyle(sets: number): string {
  if (sets <= 0) return "bg-muted/40 text-muted-foreground";
  if (sets < 6) return "bg-fitness-insufficient/25 text-foreground";
  if (sets < 10) return "bg-fitness-minimal/25 text-foreground";
  if (sets < 15) return "bg-fitness-solid/30 text-foreground";
  if (sets <= 20) return "bg-fitness-high/35 text-foreground";
  return "bg-fitness-very-high/40 text-foreground";
}

export function MuscleHeatmap({
  sessions,
  user,
  weeks = 12,
}: MuscleHeatmapProps) {
  const scoped = filterSessions(sessions, user);
  const buckets = useMemo(() => weeklyMuscleSets(scoped, weeks), [scoped, weeks]);

  const weekLabels = useMemo(
    () =>
      buckets.map((b) => {
        const d = new Date(b.weekStart + "T12:00:00");
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      }),
    [buckets],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly sets by muscle</CardTitle>
        <p className="text-sm text-muted-foreground">
          Effective sets per week. Color reflects stimulus zone (insufficient
          through very high).
        </p>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-[1] bg-card py-2 pr-3 text-left text-xs font-medium text-muted-foreground">
                Muscle
              </th>
              {weekLabels.map((lab, i) => (
                <th
                  key={buckets[i]!.weekStart}
                  className="px-1 py-2 text-center text-[10px] font-medium text-muted-foreground"
                >
                  {lab}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MUSCLE_CATEGORIES.map((cat) => (
              <Fragment key={cat.id}>
                <tr className="border-t border-border/60">
                  <td
                    colSpan={buckets.length + 1}
                    className="bg-muted/30 py-1.5 pl-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {cat.label}
                  </td>
                </tr>
                {cat.muscles.map((muscle: MuscleId) => (
                  <tr key={muscle} className="border-t border-border/40">
                    <td className="sticky left-0 z-[1] bg-card py-1.5 pr-3 text-xs font-medium">
                      {MUSCLE_LABELS[muscle]}
                    </td>
                    {buckets.map((b) => {
                      const sets = b.muscles[muscle].sets;
                      return (
                        <td
                          key={`${muscle}-${b.weekStart}`}
                          className={cn(
                            "p-1 text-center text-[11px] font-medium tabular-nums",
                            cellStyle(sets),
                          )}
                          title={`${MUSCLE_LABELS[muscle]}: ${sets.toFixed(1)} sets`}
                        >
                          {sets > 0
                            ? sets < 10
                              ? sets.toFixed(1)
                              : Math.round(sets)
                            : "—"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
