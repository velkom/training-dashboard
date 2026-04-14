/** Canonical muscle ids used for stats and UI */
export const MUSCLE_IDS = [
  "chest",
  "front_delts",
  "side_delts",
  "rear_delts",
  "triceps",
  "biceps",
  "forearms",
  "upper_back_lats",
  "upper_back_traps",
  "lower_back",
  "abs",
  "obliques",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
] as const;

export type MuscleId = (typeof MUSCLE_IDS)[number];

export const MUSCLE_LABELS: Record<MuscleId, string> = {
  chest: "Chest",
  front_delts: "Front delts",
  side_delts: "Side delts",
  rear_delts: "Rear delts",
  triceps: "Triceps",
  biceps: "Biceps",
  forearms: "Forearms",
  upper_back_lats: "Upper back (lats)",
  upper_back_traps: "Upper back (traps)",
  lower_back: "Lower back",
  abs: "Abs",
  obliques: "Obliques",
  quads: "Quads",
  hamstrings: "Hamstrings",
  glutes: "Glutes",
  calves: "Calves",
};

export type MuscleCategoryId =
  | "upper_push"
  | "upper_pull"
  | "core"
  | "legs";

export const MUSCLE_CATEGORIES: {
  id: MuscleCategoryId;
  label: string;
  muscles: MuscleId[];
}[] = [
  {
    id: "upper_push",
    label: "Upper body push",
    muscles: ["chest", "front_delts", "side_delts", "triceps"],
  },
  {
    id: "upper_pull",
    label: "Upper body pull",
    muscles: [
      "upper_back_lats",
      "upper_back_traps",
      "rear_delts",
      "biceps",
      "forearms",
    ],
  },
  {
    id: "core",
    label: "Core",
    muscles: ["abs", "obliques", "lower_back"],
  },
  {
    id: "legs",
    label: "Legs",
    muscles: ["quads", "hamstrings", "glutes", "calves"],
  },
];

/** Secondary muscles receive this fraction of each working set */
export const SECONDARY_SET_WEIGHT = 0.5;

export type MuscleAllocation = {
  muscle: MuscleId;
  /** Effective sets (e.g. 3 working sets × 1.0 or × 0.5) */
  weightedSets: number;
};

export type MuscleMapEntry = {
  primary: MuscleId[];
  secondary: MuscleId[];
};

export type MuscleSetsRecord = Record<
  MuscleId,
  { sets: number; volume: number }
>;

export type TrainingStatus =
  | "insufficient"
  | "minimal"
  | "solid"
  | "high"
  | "very_high";

/** Zone boundaries: weekly effective sets (max inclusive per zone name) */
export const SETS_INSUFFICIENT_MAX = 5;
export const SETS_MINIMAL_MAX = 9;
export const SETS_SOLID_MAX = 14;
export const SETS_HIGH_MAX = 20;
