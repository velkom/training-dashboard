"use client";

import { useMemo, useState } from "react";

import { ExerciseProgress } from "@/components/dashboard/exercise-progress";
import { MuscleGroupCards } from "@/components/dashboard/muscle-group-cards";
import { MuscleHeatmap } from "@/components/dashboard/muscle-heatmap";
import { RecentWorkouts } from "@/components/dashboard/recent-workouts";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { VolumeChart } from "@/components/dashboard/volume-chart";
import { WeekNavigator } from "@/components/dashboard/week-navigator";
import { WeeklyGrowthSummary } from "@/components/dashboard/weekly-growth-summary";
import { WorkoutCalendar } from "@/components/dashboard/workout-calendar";
import { useSelectedUser, useWorkoutStore } from "@/stores/workout-store";
import {
  dailyMuscleSetsForWeek,
  filterSessions,
  filterSessionsByWeek,
  formatWeekRangeDisplay,
  getWeekStart,
  weeklyMuscleBucketForWeek,
} from "@/lib/workout-stats";

export function DashboardView() {
  const sessions = useWorkoutStore((s) => s.sessions);
  const user = useSelectedUser();
  const [selectedWeek, setSelectedWeek] = useState(() =>
    getWeekStart(new Date()),
  );

  const currentWeekMonday = getWeekStart(new Date());

  const scopedSessions = useMemo(
    () => filterSessions(sessions, user),
    [sessions, user],
  );

  const weekSessions = useMemo(
    () => filterSessionsByWeek(scopedSessions, selectedWeek),
    [scopedSessions, selectedWeek],
  );

  const weekMuscleBucket = useMemo(
    () => weeklyMuscleBucketForWeek(scopedSessions, selectedWeek),
    [scopedSessions, selectedWeek],
  );

  const dailyBreakdown = useMemo(
    () => dailyMuscleSetsForWeek(scopedSessions, selectedWeek),
    [scopedSessions, selectedWeek],
  );

  const weekLabel = formatWeekRangeDisplay(selectedWeek);

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Training load, muscle balance, and trends.
        </p>
      </div>

      <WeekNavigator
        selectedWeek={selectedWeek}
        onWeekChange={setSelectedWeek}
        currentWeekMonday={currentWeekMonday}
        hasWorkoutsInWeek={weekSessions.length > 0}
      />

      <StatsCards
        sessions={weekSessions}
        user={user}
        weeklyScope
        streakSourceSessions={scopedSessions}
      />

      <WeeklyGrowthSummary
        key={selectedWeek}
        bucket={weekMuscleBucket}
        dailyBreakdown={dailyBreakdown}
      />

      <MuscleGroupCards
        sessions={sessions}
        user={user}
        selectedWeek={selectedWeek}
        weekLabel={weekLabel}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <VolumeChart sessions={sessions} user={user} />
        <WorkoutCalendar sessions={sessions} user={user} />
      </div>

      <MuscleHeatmap sessions={sessions} user={user} weeks={12} />

      <ExerciseProgress sessions={sessions} user={user} />

      <RecentWorkouts sessions={sessions} user={user} />
    </div>
  );
}
