import type { WorkoutExercise, WorkoutSession } from "@/types";

import {
  allocateFromExerciseMapEntry,
  countWorkingSets,
  getStructuredImportMapEntry,
} from "./allocation";
import type { MuscleId, MuscleMapEntry } from "./constants";
import { lookupExerciseMap, normalizeExerciseName } from "./exercise-map";

export type MappingSource =
  | "curated_map"
  | "structured_import"
  | "user_mapping"
  | "unmapped";

export type ExerciseMappingInfo = {
  /** Original exercise name as it appears in import data */
  name: string;
  /** How it was resolved */
  source: MappingSource;
  /** Resolved primary muscles, empty if unmapped */
  primaryMuscles: MuscleId[];
  /** Resolved secondary muscles, empty if unmapped */
  secondaryMuscles: MuscleId[];
  /** Total working sets across all sessions in this import batch */
  totalSets: number;
  /** Number of distinct session dates this exercise appears in */
  sessionCount: number;
};

export type MappingAnalysisResult = {
  mapped: ExerciseMappingInfo[];
  unmapped: ExerciseMappingInfo[];
  totalExerciseTypes: number;
  /** Total working sets lost to unmapped */
  unmappedSetCount: number;
};

type AggregatedExercise = {
  displayName: string;
  representative: WorkoutExercise;
  totalSets: number;
  sessionDates: Set<string>;
};

function classifyMapping(
  exercise: WorkoutExercise,
  userMappings: Record<string, MuscleMapEntry>,
): Pick<
  ExerciseMappingInfo,
  "source" | "primaryMuscles" | "secondaryMuscles"
> {
  const curated = lookupExerciseMap(exercise.name);
  if (
    curated &&
    allocateFromExerciseMapEntry(curated, 1).length > 0
  ) {
    return {
      source: "curated_map",
      primaryMuscles: [...curated.primary],
      secondaryMuscles: [...curated.secondary],
    };
  }

  const key = normalizeExerciseName(exercise.name);
  const userEntry = userMappings[key];
  if (
    userEntry &&
    userEntry.primary.length > 0 &&
    allocateFromExerciseMapEntry(userEntry, 1).length > 0
  ) {
    return {
      source: "user_mapping",
      primaryMuscles: [...userEntry.primary],
      secondaryMuscles: [...userEntry.secondary],
    };
  }

  const structured = getStructuredImportMapEntry(exercise);
  if (
    structured &&
    allocateFromExerciseMapEntry(structured, 1).length > 0
  ) {
    return {
      source: "structured_import",
      primaryMuscles: [...structured.primary],
      secondaryMuscles: [...structured.secondary],
    };
  }

  return {
    source: "unmapped",
    primaryMuscles: [],
    secondaryMuscles: [],
  };
}

/**
 * Analyze unique exercises in a parsed import batch: mapping source, muscles, and usage.
 */
export function analyzeExerciseMappings(
  sessions: WorkoutSession[],
  userMappings: Record<string, MuscleMapEntry>,
): MappingAnalysisResult {
  const byNorm = new Map<string, AggregatedExercise>();

  for (const session of sessions) {
    const dateKey = session.startDate.slice(0, 10);
    for (const ex of session.exercises) {
      const norm = normalizeExerciseName(ex.name);
      const ws = countWorkingSets(ex);
      let row = byNorm.get(norm);
      if (!row) {
        row = {
          displayName: ex.name,
          representative: ex,
          totalSets: 0,
          sessionDates: new Set(),
        };
        byNorm.set(norm, row);
      }
      row.totalSets += ws;
      row.sessionDates.add(dateKey);
    }
  }

  const mapped: ExerciseMappingInfo[] = [];
  const unmapped: ExerciseMappingInfo[] = [];

  for (const row of byNorm.values()) {
    const { source, primaryMuscles, secondaryMuscles } = classifyMapping(
      row.representative,
      userMappings,
    );
    const info: ExerciseMappingInfo = {
      name: row.displayName,
      source,
      primaryMuscles,
      secondaryMuscles,
      totalSets: row.totalSets,
      sessionCount: row.sessionDates.size,
    };
    if (source === "unmapped") {
      unmapped.push(info);
    } else {
      mapped.push(info);
    }
  }

  const sortBySets = (a: ExerciseMappingInfo, b: ExerciseMappingInfo) =>
    b.totalSets - a.totalSets;
  mapped.sort(sortBySets);
  unmapped.sort(sortBySets);

  const unmappedSetCount = unmapped.reduce((s, u) => s + u.totalSets, 0);

  return {
    mapped,
    unmapped,
    totalExerciseTypes: mapped.length + unmapped.length,
    unmappedSetCount,
  };
}
