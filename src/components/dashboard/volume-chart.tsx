"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartMountGate } from "@/components/dashboard/chart-mount-gate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { filterSessions, weeklyVolume } from "@/lib/workout-stats";
import type { UserFilter } from "@/lib/workout-stats";
import type { WorkoutSession } from "@/types";

type VolumeChartProps = {
  sessions: WorkoutSession[];
  user: UserFilter;
};

export function VolumeChart({ sessions, user }: VolumeChartProps) {
  const scoped = filterSessions(sessions, user);
  const data = weeklyVolume(scoped, 12).map((w) => ({
    label: w.weekStart.slice(5),
    volume: Math.round(w.volume),
    sessions: w.sessions,
  }));

  return (
    <Card className="border-border/80 bg-card/60 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Weekly volume</CardTitle>
      </CardHeader>
      <CardContent className="h-72 min-h-72 min-w-0 text-primary">
        <ChartMountGate className="h-72 min-h-72 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis width={40} tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ borderRadius: 8 }}
                formatter={(value, name) => [
                  value,
                  name === "volume" ? "Volume" : "Sessions",
                ]}
              />
              <Bar dataKey="volume" fill="currentColor" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartMountGate>
      </CardContent>
    </Card>
  );
}
