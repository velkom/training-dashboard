"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { filterSessions } from "@/lib/workout-stats";
import type { UserFilter } from "@/lib/workout-stats";
import { cn } from "@/lib/utils";
import type { UserId, WorkoutSession } from "@/types";

const USER_LABEL: Record<UserId, string> = {
  ilya: "Ilya",
  nastya: "Nastya",
};

type RecentWorkoutsProps = {
  sessions: WorkoutSession[];
  user: UserFilter;
  limit?: number;
};

export function RecentWorkouts({
  sessions,
  user,
  limit = 8,
}: RecentWorkoutsProps) {
  const scoped = filterSessions(sessions, user)
    .slice()
    .sort(
      (a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
    )
    .slice(0, limit);

  return (
    <Card className="border-border/80 bg-card/60 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Recent workouts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {scoped.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Import data from the Import page to see sessions here.
          </p>
        ) : (
          scoped.map((s, i) => (
            <div key={s.id}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium leading-tight">{s.name}</p>
                {user === "all" ? (
                  <span
                    className={cn(
                      "rounded-md px-1.5 py-0.5 text-xs",
                      s.userId === "ilya"
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {USER_LABEL[s.userId]}
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(s.startDate).toLocaleString("en-US")} ·{" "}
                {s.exercises.length} exercises
              </p>
              {i < scoped.length - 1 ? <Separator className="mt-3" /> : null}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
