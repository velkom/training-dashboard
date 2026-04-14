import {
  MUSCLE_IDS,
  SETS_GROWTH_MIN,
  SETS_MAINTENANCE_MIN,
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

export function statusFromWeeklySets(weeklyEffectiveSets: number): TrainingStatus {
  if (weeklyEffectiveSets >= SETS_GROWTH_MIN) return "growing";
  if (weeklyEffectiveSets >= SETS_MAINTENANCE_MIN) return "maintaining";
  return "under";
}

export const STATUS_LABELS: Record<TrainingStatus, string> = {
  growing: "Growing",
  maintaining: "Maintaining",
  under: "Under-trained",
};
