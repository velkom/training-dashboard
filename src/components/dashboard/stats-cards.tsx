"use client";

import { Activity, Clock, Flame, Layers } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  averageDurationMinutes,
  currentStreakDays,
  filterSessions,
  totalVolumeKg,
} from "@/lib/workout-stats";
import type { UserFilter } from "@/lib/workout-stats";
import type { WorkoutSession } from "@/types";

type StatsCardsProps = {
  sessions: WorkoutSession[];
  user: UserFilter;
  /** When true, hints refer to the selected week; `sessions` should be that week only. */
  weeklyScope?: boolean;
  /** Streak is computed from these sessions (e.g. all-time for the profile). */
  streakSourceSessions?: WorkoutSession[];
};

function formatVolumeKg(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(Math.round(n));
}

function formatDurationMinutes(min: number): string {
  if (!Number.isFinite(min) || min <= 0) return "—";
  const totalSec = Math.round(min * 60);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function StatsCards({
  sessions,
  user,
  weeklyScope = false,
  streakSourceSessions,
}: StatsCardsProps) {
  const scoped = filterSessions(sessions, user);
  const volume = totalVolumeKg(scoped);
  const streakScoped = filterSessions(
    streakSourceSessions ?? sessions,
    user,
  );
  const streak = currentStreakDays(streakScoped);
  const avgMin = averageDurationMinutes(scoped);

  const items = [
    {
      title: "Workouts",
      value: String(scoped.length),
      icon: Activity,
      hint: weeklyScope
        ? user === "all"
          ? "This week · all profiles"
          : "This week"
        : user === "all"
          ? "All profiles"
          : undefined,
    },
    {
      title: "Volume (kg×reps)",
      value: formatVolumeKg(volume),
      icon: Layers,
      hint: weeklyScope ? "This week" : "Sum across all working sets",
    },
    {
      title: "Day streak",
      value: String(streak),
      icon: Flame,
      hint: weeklyScope
        ? "All-time · consecutive days from last workout"
        : "Consecutive days from last workout",
    },
    {
      title: "Avg duration",
      value: formatDurationMinutes(avgMin),
      icon: Clock,
      hint: weeklyScope
        ? "This week · per session when duration is recorded"
        : "Per session (when duration is recorded)",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card
          key={item.title}
          className="border-border/80 bg-card/60 shadow-sm backdrop-blur-sm"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
            <item.icon className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">{item.value}</div>
            {item.hint ? (
              <p className="text-xs text-muted-foreground">{item.hint}</p>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
