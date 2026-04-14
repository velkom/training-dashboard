import {
  MUSCLE_IDS,
  SETS_HIGH_MAX,
  SETS_INSUFFICIENT_MAX,
  SETS_MINIMAL_MAX,
  SETS_SOLID_MAX,
  type MuscleSetsRecord,
  type TrainingStatus,
} from "./constants";

export function emptyMuscleRecord(): MuscleSetsRecord {
  const r = {} as MuscleSetsRecord;
  for (const id of MUSCLE_IDS) {
    r[id] = { sets: 0, volume: 0 };
  }
  return r;
}

/**
 * Weekly stimulus zones (effective sets per muscle per week).
 * Boundaries: insufficient below 6, minimal 6–9, solid 10–14, high 15–20, very high above 20.
 * Floats below the next zone stay in the lower zone (e.g. 5.9 → insufficient, 9.9 → minimal).
 */
export function statusFromWeeklySets(weeklyEffectiveSets: number): TrainingStatus {
  if (weeklyEffectiveSets > SETS_HIGH_MAX) return "very_high";
  if (weeklyEffectiveSets >= SETS_SOLID_MAX + 1) return "high";
  if (weeklyEffectiveSets >= SETS_MINIMAL_MAX + 1) return "solid";
  if (weeklyEffectiveSets >= SETS_INSUFFICIENT_MAX + 1) return "minimal";
  return "insufficient";
}

export const STATUS_LABELS: Record<TrainingStatus, string> = {
  insufficient: "Insufficient",
  minimal: "Minimal",
  solid: "Solid",
  high: "High",
  very_high: "Very high",
};
