"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartMountGate } from "@/components/dashboard/chart-mount-gate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  exerciseProgression,
  filterSessions,
  topExercisesByFrequency,
} from "@/lib/workout-stats";
import type { UserFilter } from "@/lib/workout-stats";
import type { WorkoutSession } from "@/types";

type ExerciseProgressProps = {
  sessions: WorkoutSession[];
  user: UserFilter;
};

export function ExerciseProgress({ sessions, user }: ExerciseProgressProps) {
  const scoped = filterSessions(sessions, user);
  const top = useMemo(() => topExercisesByFrequency(scoped, 20), [scoped]);
  const [exercise, setExercise] = useState<string | null>(
    () => top[0]?.name ?? null,
  );

  useEffect(() => {
    if (top.length === 0) {
      setExercise(null);
      return;
    }
    if (!exercise || !top.some((t) => t.name === exercise)) {
      setExercise(top[0]!.name);
    }
  }, [top, exercise]);

  const selected = exercise ?? top[0]?.name ?? "";
  const data = useMemo(() => {
    if (!selected) return [];
    return exerciseProgression(scoped, selected).map((p) => ({
      date: p.date,
      kg: p.maxWeight,
    }));
  }, [scoped, selected]);

  if (top.length === 0) {
    return (
      <Card className="border-border/80 bg-card/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Exercise progression</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          No chart data yet. Import workouts to get started.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/80 bg-card/60 backdrop-blur-sm">
      <CardHeader className="space-y-3">
        <CardTitle>Exercise progression</CardTitle>
        <div className="grid gap-2">
          <Label htmlFor="exercise-select">Exercise</Label>
          <Select value={selected} onValueChange={(v) => setExercise(v)}>
            <SelectTrigger id="exercise-select" className="w-full max-w-md">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {top.map((t) => (
                <SelectItem key={t.name} value={t.name}>
                  {t.name} ({t.count}×)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="h-72 min-h-72 min-w-0 text-primary">
        <ChartMountGate className="h-72 min-h-72 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis width={44} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ borderRadius: 8 }}
                formatter={(v) => [`${v} kg`, "Top set"]}
              />
              <Line
                type="monotone"
                dataKey="kg"
                stroke="currentColor"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartMountGate>
      </CardContent>
    </Card>
  );
}
