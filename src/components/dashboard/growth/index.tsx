"use client";

import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SETS_GROWTH_MIN, type MuscleId } from "@/lib/muscles";
import type { WeeklyMuscleStats } from "@/lib/workout-stats";

import { GrowthCategoryGroup } from "./category-group";
import { GrowthRingGauge } from "./ring-gauge";
import { GrowthSummaryPills } from "./summary-pills";

export type WeeklyGrowthSummaryProps = {
  stats: WeeklyMuscleStats;
};

export function WeeklyGrowthSummary({ stats }: WeeklyGrowthSummaryProps) {
  const [expandedMuscle, setExpandedMuscle] = useState<MuscleId | null>(null);

  const {
    bucket,
    dailyBreakdown,
    growingCount,
    trainedCount,
    statusCounts,
    groups,
    isEmpty,
  } = stats;

  const hasAnyTrainedMuscle = !isEmpty;

  const toggleMuscle = (muscle: MuscleId) => {
    setExpandedMuscle((prev) => (prev === muscle ? null : muscle));
  };

  return (
    <Card className="border-border/80">
      <CardHeader className="space-y-3">
        <div className="flex items-start gap-4">
          {hasAnyTrainedMuscle ? (
            <GrowthRingGauge
              growingCount={growingCount}
              trainedCount={trainedCount}
            />
          ) : null}
          <div className="min-w-0 flex-1 space-y-2">
            <CardTitle>Weekly growth stimulus</CardTitle>
            <p className="text-sm text-muted-foreground">
              Effective working sets vs a {SETS_GROWTH_MIN}+ sets / week growth
              target per muscle you trained.
              {!hasAnyTrainedMuscle ? (
                <> No muscle-tagged working volume logged this week.</>
              ) : null}
            </p>
            {hasAnyTrainedMuscle ? (
              <GrowthSummaryPills statusCounts={statusCounts} />
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {!hasAnyTrainedMuscle ? (
          <p className="text-sm text-muted-foreground">
            Train with mapped exercises or import muscle labels to see breakdown
            by muscle.
          </p>
        ) : null}

        {hasAnyTrainedMuscle ? (
          <div key={bucket.weekStart} className="space-y-5">
            {groups.map((group, i) => (
              <GrowthCategoryGroup
                key={group.id}
                group={group}
                groupIndex={i}
                bucket={bucket}
                dailyBreakdown={dailyBreakdown}
                expandedMuscle={expandedMuscle}
                onToggleMuscle={toggleMuscle}
              />
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
