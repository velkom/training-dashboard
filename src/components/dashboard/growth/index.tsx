"use client";

import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MuscleId } from "@/lib/muscles";
import type { WeeklyMuscleStats } from "@/lib/workout-stats";

import { GrowthCategoryGroup } from "./category-group";
import { GrowthRingGauge } from "./ring-gauge";
import { StimulusInfoDialog } from "./stimulus-info-dialog";
import { GrowthSummaryPills } from "./summary-pills";
import { UnmappedExercisesList } from "./unmapped-exercises";

export type WeeklyGrowthSummaryProps = {
  stats: WeeklyMuscleStats;
};

export function WeeklyGrowthSummary({ stats }: WeeklyGrowthSummaryProps) {
  const [expandedMuscle, setExpandedMuscle] = useState<MuscleId | null>(null);

  const {
    bucket,
    dailyBreakdown,
    solidOrBetterCount,
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
              solidOrBetterCount={solidOrBetterCount}
              trainedCount={trainedCount}
            />
          ) : null}
          <div className="min-w-0 flex-1 space-y-2">
            <CardTitle className="flex items-center gap-1.5">
              Weekly growth stimulus
              <StimulusInfoDialog />
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Weekly effective sets per muscle — classified into stimulus zones.
              {!hasAnyTrainedMuscle ? (
                <> No mapped working volume logged this week.</>
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
            Train with exercises in the app map to see breakdown by muscle.
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

        {bucket.unmappedExercises.length > 0 ? (
          <UnmappedExercisesList exercises={bucket.unmappedExercises} />
        ) : null}
      </CardContent>
    </Card>
  );
}
