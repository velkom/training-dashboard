"use client";

import { useCallback, useMemo, useState } from "react";
import { Check, ChevronDown, Info, User } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  analyzeExerciseMappings,
  MUSCLE_LABELS,
  normalizeExerciseName,
  type ExerciseMappingInfo,
  type MappingSource,
  type MuscleId,
  type MuscleMapEntry,
} from "@/lib/muscles";
import { useUserExerciseMappingsStore } from "@/stores/user-exercise-mappings";
import type { WorkoutSession } from "@/types";
import { cn } from "@/lib/utils";

import { MuscleMultiSelect } from "./muscle-multi-select";

type MappingReviewProps = {
  sessions: WorkoutSession[];
  pendingMappings: Record<string, MuscleMapEntry>;
  setPendingMappings: React.Dispatch<
    React.SetStateAction<Record<string, MuscleMapEntry>>
  >;
  onBack: () => void;
  onSkip: () => Promise<void>;
  onConfirm: () => Promise<void>;
  isSaving?: boolean;
};

function sourceLabel(source: MappingSource): { text: string; icon?: "user" } {
  switch (source) {
    case "curated_map":
      return { text: "curated map" };
    case "structured_import":
      return { text: "import data" };
    case "user_mapping":
      return { text: "user mapping", icon: "user" };
    case "unmapped":
      return { text: "unmapped" };
  }
}

export function MappingReview({
  sessions,
  pendingMappings,
  setPendingMappings,
  onBack,
  onSkip,
  onConfirm,
  isSaving,
}: MappingReviewProps) {
  const savedMappings = useUserExerciseMappingsStore((s) => s.mappings);
  const [autoMappedOpen, setAutoMappedOpen] = useState(false);

  /**
   * Section membership uses only persisted user mappings so the unmapped list
   * stays stable while the user toggles pills (pending edits are merged only for
   * chip state via `entryForExerciseName`, not for re-running classification).
   */
  const sectionAnalysis = useMemo(
    () => analyzeExerciseMappings(sessions, savedMappings),
    [sessions, savedMappings],
  );

  const firstStructuredIdx = sectionAnalysis.mapped.findIndex(
    (m) => m.source === "structured_import",
  );

  function entryForExerciseName(name: string): MuscleMapEntry {
    const key = normalizeExerciseName(name);
    return (
      pendingMappings[key] ??
      savedMappings[key] ?? { primary: [], secondary: [] }
    );
  }

  const updateEntry = useCallback(
    (name: string, patch: Partial<MuscleMapEntry>) => {
      const key = normalizeExerciseName(name);
      setPendingMappings((prev) => {
        const current =
          prev[key] ?? savedMappings[key] ?? { primary: [], secondary: [] };
        const primary = patch.primary ?? current.primary;
        let secondary = patch.secondary ?? current.secondary;
        if (patch.primary !== undefined) {
          secondary = secondary.filter((s) => !primary.includes(s));
        }
        return { ...prev, [key]: { primary, secondary } };
      });
    },
    [savedMappings, setPendingMappings],
  );

  return (
    <Card className="border-border/80 bg-card/60 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Exercise Mapping Review</CardTitle>
        <CardDescription>
          Check how exercises map to muscles before saving to your library.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="font-medium text-green-600 dark:text-green-500">
            <Check className="mr-1 inline size-3.5 align-text-bottom" />
            {sectionAnalysis.mapped.length} exercise
            {sectionAnalysis.mapped.length === 1 ? "" : "s"} mapped
          </span>
          <span className="text-muted-foreground">·</span>
          <span
            className={cn(
              "font-medium",
              sectionAnalysis.unmapped.length > 0
                ? "text-amber-600 dark:text-amber-400"
                : "text-muted-foreground",
            )}
          >
            {sectionAnalysis.unmapped.length} unmapped
            {sectionAnalysis.unmappedSetCount > 0 ? (
              <span className="text-muted-foreground font-normal">
                {" "}
                ({sectionAnalysis.unmappedSetCount} sets not counted)
              </span>
            ) : null}
          </span>
        </div>

        {sectionAnalysis.unmapped.length > 0 ? (
          <div className="space-y-3">
            <div className="rounded-md border border-amber-500/25 bg-amber-500/5 px-3 py-2 text-sm">
              <p className="font-medium text-amber-800 dark:text-amber-200">
                Unmapped exercises
              </p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                These exercises won&apos;t count toward any muscle until you assign
                muscles below, or skip to import as-is.
              </p>
            </div>

            <div className="space-y-3">
              {sectionAnalysis.unmapped.map((row) => (
                <UnmappedExerciseCard
                  key={normalizeExerciseName(row.name)}
                  row={row}
                  entry={entryForExerciseName(row.name)}
                  onPrimaryChange={(ids) => updateEntry(row.name, { primary: ids })}
                  onSecondaryChange={(ids) =>
                    updateEntry(row.name, { secondary: ids })
                  }
                />
              ))}
            </div>
          </div>
        ) : null}

        <div className="border-border/60 border-t pt-2">
          <button
            type="button"
            onClick={() => setAutoMappedOpen((o) => !o)}
            className="flex w-full items-center justify-between gap-2 py-2 text-left text-sm font-medium"
            aria-expanded={autoMappedOpen}
          >
            <span>
              Auto-mapped exercises ({sectionAnalysis.mapped.length})
              <span className="text-muted-foreground ml-2 font-normal">
                — click to {autoMappedOpen ? "collapse" : "expand"}
              </span>
            </span>
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform",
                autoMappedOpen && "rotate-180",
              )}
            />
          </button>
          {autoMappedOpen ? (
            <div className="divide-border/60 mt-1 divide-y rounded-md border border-border/60">
              {sectionAnalysis.mapped.map((row, idx) => (
                <MappedExerciseRow
                  key={normalizeExerciseName(row.name) + idx}
                  row={row}
                  showImportDataNote={
                    row.source === "structured_import" &&
                    idx === firstStructuredIdx
                  }
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border/60 pt-4">
          <Button type="button" variant="outline" onClick={onBack} disabled={isSaving}>
            Back
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => void onSkip()}
            disabled={isSaving}
          >
            Skip
          </Button>
          <Button type="button" onClick={() => void onConfirm()} disabled={isSaving}>
            {isSaving ? "Saving…" : "Import"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function UnmappedExerciseCard({
  row,
  entry,
  onPrimaryChange,
  onSecondaryChange,
}: {
  row: ExerciseMappingInfo;
  entry: MuscleMapEntry;
  onPrimaryChange: (ids: MuscleId[]) => void;
  onSecondaryChange: (ids: MuscleId[]) => void;
}) {
  const highImpact = row.totalSets >= 6;
  return (
    <div className="space-y-3 rounded-lg border border-y border-r border-border/60 border-l-2 border-l-amber-400 bg-card p-4 shadow-sm">
      <div>
        <p className="font-semibold">{row.name}</p>
        <p
          className={cn(
            "mt-0.5 text-sm text-muted-foreground",
            highImpact && "font-semibold text-amber-700 dark:text-amber-300",
          )}
        >
          {row.totalSets} sets · {row.sessionCount} session
          {row.sessionCount === 1 ? "" : "s"}
        </p>
      </div>
      <MuscleMultiSelect
        label="Primary muscles"
        selected={entry.primary}
        onChange={onPrimaryChange}
      />
      <MuscleMultiSelect
        label="Secondary muscles"
        selected={entry.secondary}
        exclude={entry.primary}
        onChange={onSecondaryChange}
      />
    </div>
  );
}

function MappedExerciseRow({
  row,
  showImportDataNote,
}: {
  row: ExerciseMappingInfo;
  showImportDataNote: boolean;
}) {
  const src = sourceLabel(row.source);
  return (
    <div className="flex flex-col gap-1 px-3 py-2.5 text-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-medium">{row.name}</span>
        <span className="text-xs text-muted-foreground">
          {row.totalSets} sets · {row.sessionCount}d
        </span>
      </div>
      <div className="text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
        <span>
          {row.primaryMuscles.map((m) => (
            <span key={m} className="mr-2 inline">
              <span className="text-foreground">●</span> {MUSCLE_LABELS[m]}
            </span>
          ))}
        </span>
        {row.secondaryMuscles.length > 0 ? (
          <span>
            {row.secondaryMuscles.map((m) => (
              <span key={m} className="mr-2 inline">
                <span className="text-foreground">○</span> {MUSCLE_LABELS[m]}
              </span>
            ))}
          </span>
        ) : null}
      </div>
      <div className="text-muted-foreground flex flex-wrap items-center gap-x-1.5 text-[11px]">
        <span>via: {src.text}</span>
        {src.icon === "user" ? (
          <User className="size-3.5 shrink-0 opacity-70" aria-hidden />
        ) : null}
        {showImportDataNote ? (
          <span className="inline-flex items-center gap-0.5 text-[10px]">
            <Info className="size-3 shrink-0" aria-hidden />
            Muscle data from your fitness app
          </span>
        ) : null}
      </div>
    </div>
  );
}
