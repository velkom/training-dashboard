import type { WorkoutExercise } from "@/types";

import {
  MUSCLE_IDS,
  MUSCLE_LABELS,
  SECONDARY_SET_WEIGHT,
  type MuscleAllocation,
  type MuscleId,
  type MuscleMapEntry,
} from "./constants";
import { lookupExerciseMap, normalizeExerciseName } from "./exercise-map";

/** Map free-text muscle labels from imports to MuscleId */
const IMPORT_MUSCLE_ALIASES: { pattern: RegExp; muscle: MuscleId }[] = [
  { pattern: /pect|chest/i, muscle: "chest" },
  { pattern: /front\s*del|anterior\s*del/i, muscle: "front_delts" },
  { pattern: /side\s*del|lateral\s*del|medial\s*del/i, muscle: "side_delts" },
  { pattern: /rear\s*del|posterior\s*del/i, muscle: "rear_delts" },
  { pattern: /tricep/i, muscle: "triceps" },
  { pattern: /bicep/i, muscle: "biceps" },
  { pattern: /forearm/i, muscle: "forearms" },
  { pattern: /lat(issimus)?|mid\s*back|midback/i, muscle: "upper_back_lats" },
  { pattern: /trap|upper\s*back|rhomb/i, muscle: "upper_back_traps" },
  { pattern: /lower\s*back|erector|spinal/i, muscle: "lower_back" },
  { pattern: /oblique/i, muscle: "obliques" },
  { pattern: /ab|core|rectus/i, muscle: "abs" },
  { pattern: /quad/i, muscle: "quads" },
  { pattern: /hamstring/i, muscle: "hamstrings" },
  { pattern: /glute/i, muscle: "glutes" },
  { pattern: /calf|gastroc|soleus/i, muscle: "calves" },
  { pattern: /shoulder|delt(?!oid)/i, muscle: "side_delts" },
  { pattern: /back(?!ground)/i, muscle: "upper_back_lats" },
];

function mapImportMuscleLabel(label: string): MuscleId | undefined {
  const n = label.trim();
  if (!n) return undefined;
  const key = normalizeExerciseName(n);
  for (const id of MUSCLE_IDS) {
    if (normalizeExerciseName(MUSCLE_LABELS[id]) === key) return id;
    if (id.replace(/_/g, " ") === key) return id;
  }
  for (const { pattern, muscle } of IMPORT_MUSCLE_ALIASES) {
    if (pattern.test(n)) return muscle;
  }
  return undefined;
}

/**
 * Resolved primary/secondary {@link MuscleId}s from structured import fields
 * (`importPrimaryMuscles` / `importSecondaryMuscles`), or null when none resolve.
 */
export function getStructuredImportMapEntry(
  exercise: WorkoutExercise,
): MuscleMapEntry | null {
  const primary = exercise.importPrimaryMuscles;
  if (!primary || primary.length === 0) return null;

  const secondary = exercise.importSecondaryMuscles ?? [];

  const resolvedPrimary: MuscleId[] = [];
  for (const label of primary) {
    const m = mapImportMuscleLabel(label);
    if (m) resolvedPrimary.push(m);
  }
  if (resolvedPrimary.length === 0) return null;

  const uniquePrimary = [...new Set(resolvedPrimary)];

  const resolvedSecondary: MuscleId[] = [];
  for (const label of secondary) {
    const m = mapImportMuscleLabel(label);
    if (m && !uniquePrimary.includes(m)) resolvedSecondary.push(m);
  }

  return {
    primary: uniquePrimary,
    secondary: [...new Set(resolvedSecondary)],
  };
}

/**
 * Working sets count (excludes warmup).
 */
export function countWorkingSets(exercise: WorkoutExercise): number {
  return exercise.sets.filter((s) => s.setType !== "warmup").length;
}

export function exerciseVolumeKg(exercise: WorkoutExercise): number {
  let vol = 0;
  for (const st of exercise.sets) {
    if (st.setType === "warmup") continue;
    if (st.weight != null && st.reps != null) {
      vol += st.weight * st.reps;
    }
  }
  return vol;
}

/**
 * Allocate weighted sets from a curated map entry (primary = full, secondary = half).
 */
export function allocateFromExerciseMapEntry(
  mapEntry: MuscleMapEntry,
  workingSets: number,
): MuscleAllocation[] {
  if (workingSets <= 0) return [];
  const allocs: MuscleAllocation[] = [];
  for (const m of mapEntry.primary) {
    allocs.push({ muscle: m, weightedSets: workingSets });
  }
  for (const m of mapEntry.secondary) {
    allocs.push({
      muscle: m,
      weightedSets: workingSets * SECONDARY_SET_WEIGHT,
    });
  }
  return allocs;
}

/**
 * Allocate working sets equally across muscles parsed from import labels.
 */
export function allocateFromImportMuscleLabels(
  muscleGroups: string[],
  workingSets: number,
): MuscleAllocation[] {
  if (workingSets <= 0) return [];
  const fromImport: MuscleId[] = [];
  for (const raw of muscleGroups) {
    const m = mapImportMuscleLabel(raw);
    if (m) fromImport.push(m);
  }
  if (fromImport.length === 0) return [];
  const unique = [...new Set(fromImport)];
  const perMuscle = workingSets / unique.length;
  return unique.map((muscle) => ({
    muscle,
    weightedSets: perMuscle,
  }));
}

/**
 * Allocate from structured import primary/secondary muscle data.
 * Uses the same 1.0/0.5 contribution model as the curated map.
 * Only activates when the exercise carries separate primary and secondary lists
 * from a source app (e.g. Daily Strength).
 */
export function allocateFromStructuredImportData(
  exercise: WorkoutExercise,
  workingSets: number,
): MuscleAllocation[] {
  const mapEntry = getStructuredImportMapEntry(exercise);
  if (!mapEntry) return [];
  return allocateFromExerciseMapEntry(mapEntry, workingSets);
}

/**
 * Resolve which muscles get credit for this exercise's working sets.
 *
 * Layer 1: Curated EXERCISE_MUSCLE_MAP (highest precision, always wins).
 * Layer 1.5: User-defined mappings (`userMappings`, keyed by {@link normalizeExerciseName}).
 * Layer 2: Structured import data (primary/secondary from source app, 1.0/0.5 model).
 * Layer 3: Unmapped — zero credit.
 */
export function resolveMuscleAllocations(
  exercise: WorkoutExercise,
  userMappings?: Record<string, MuscleMapEntry>,
): MuscleAllocation[] {
  const workingSets = countWorkingSets(exercise);
  if (workingSets === 0) return [];

  // Layer 1: Curated exercise map
  const mapped = lookupExerciseMap(exercise.name);
  if (mapped) {
    const allocs = allocateFromExerciseMapEntry(mapped, workingSets);
    if (allocs.length > 0) return allocs;
  }

  // Layer 1.5: User-defined exercise → muscle map
  const key = normalizeExerciseName(exercise.name);
  const userEntry = userMappings?.[key];
  if (userEntry && userEntry.primary.length > 0) {
    const fromUser = allocateFromExerciseMapEntry(userEntry, workingSets);
    if (fromUser.length > 0) return fromUser;
  }

  // Layer 2: Structured import data (primary/secondary from source app)
  const fromImport = allocateFromStructuredImportData(exercise, workingSets);
  if (fromImport.length > 0) return fromImport;

  // Layer 3: Unmapped — zero credit
  return [];
}
