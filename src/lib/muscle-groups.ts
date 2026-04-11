import type { WorkoutExercise } from "@/types";

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

type MuscleMapEntry = {
  primary: MuscleId[];
  secondary: MuscleId[];
};

function entry(
  primary: MuscleId[],
  secondary: MuscleId[] = [],
): MuscleMapEntry {
  return { primary, secondary };
}

/**
 * Normalized exercise name keys → primary/secondary muscles.
 * Keys are produced by `normalizeExerciseName`.
 */
const EXERCISE_MUSCLE_MAP: Record<string, MuscleMapEntry> = {
  // Chest
  "barbell bench press": entry(["chest"], ["front_delts", "triceps"]),
  "dumbbell bench press": entry(["chest"], ["front_delts", "triceps"]),
  "incline barbell bench press": entry(["chest"], ["front_delts", "triceps"]),
  "incline dumbbell bench press": entry(["chest"], ["front_delts", "triceps"]),
  "decline bench press": entry(["chest"], ["triceps"]),
  "chest press machine": entry(["chest"], ["triceps"]),
  "push up": entry(["chest"], ["triceps", "front_delts"]),
  "pushup": entry(["chest"], ["triceps", "front_delts"]),
  "dip": entry(["chest", "triceps"], ["front_delts"]),
  "chest dip": entry(["chest", "triceps"], ["front_delts"]),
  "cable crossover": entry(["chest"], ["front_delts"]),
  "pec deck": entry(["chest"], ["front_delts"]),
  "fly": entry(["chest"], ["front_delts"]),
  "dumbbell fly": entry(["chest"], ["front_delts"]),
  "cable fly": entry(["chest"], ["front_delts"]),

  // Shoulders
  "overhead press": entry(["front_delts", "side_delts"], ["triceps"]),
  "barbell overhead press": entry(["front_delts", "side_delts"], ["triceps"]),
  "military press": entry(["front_delts", "side_delts"], ["triceps"]),
  "dumbbell shoulder press": entry(
    ["front_delts", "side_delts"],
    ["triceps"],
  ),
  "arnold press": entry(["front_delts", "side_delts"], ["triceps"]),
  "lateral raise": entry(["side_delts"], ["front_delts"]),
  "side lateral raise": entry(["side_delts"], ["front_delts"]),
  "dumbbell lateral raise": entry(["side_delts"], ["front_delts"]),
  "front raise": entry(["front_delts"], ["side_delts"]),
  "rear delt fly": entry(["rear_delts"], ["upper_back_traps"]),
  "reverse fly": entry(["rear_delts"], ["upper_back_traps"]),
  "face pull": entry(["rear_delts", "upper_back_traps"], ["biceps"]),
  "upright row": entry(["side_delts", "upper_back_traps"], ["biceps"]),

  // Arms
  "tricep pushdown": entry(["triceps"], ["forearms"]),
  "triceps pushdown": entry(["triceps"], ["forearms"]),
  "rope pushdown": entry(["triceps"], ["forearms"]),
  "skull crusher": entry(["triceps"], ["forearms"]),
  "lying tricep extension": entry(["triceps"], ["forearms"]),
  "overhead tricep extension": entry(["triceps"], ["forearms"]),
  "close grip bench press": entry(["triceps", "chest"], ["front_delts"]),
  "barbell curl": entry(["biceps"], ["forearms"]),
  "dumbbell curl": entry(["biceps"], ["forearms"]),
  "hammer curl": entry(["biceps", "forearms"], []),
  "preacher curl": entry(["biceps"], ["forearms"]),
  "concentration curl": entry(["biceps"], ["forearms"]),
  "cable curl": entry(["biceps"], ["forearms"]),
  "wrist curl": entry(["forearms"], []),

  // Back
  "deadlift": entry(
    ["lower_back", "glutes", "hamstrings", "upper_back_traps"],
    ["upper_back_lats", "forearms"],
  ),
  "sumo deadlift": entry(
    ["glutes", "hamstrings", "quads", "lower_back"],
    ["upper_back_lats", "upper_back_traps"],
  ),
  "romanian deadlift": entry(["hamstrings", "glutes"], ["lower_back", "forearms"]),
  "rdl": entry(["hamstrings", "glutes"], ["lower_back", "forearms"]),
  "rack pull": entry(["upper_back_traps", "lower_back"], ["forearms"]),
  "pull up": entry(["upper_back_lats", "biceps"], ["rear_delts"]),
  "pullup": entry(["upper_back_lats", "biceps"], ["rear_delts"]),
  "chin up": entry(["upper_back_lats", "biceps"], ["rear_delts"]),
  "lat pulldown": entry(["upper_back_lats"], ["biceps", "rear_delts"]),
  "cable pulldown": entry(["upper_back_lats"], ["biceps"]),
  "barbell row": entry(["upper_back_lats", "upper_back_traps"], ["biceps", "rear_delts"]),
  "pendlay row": entry(["upper_back_lats", "upper_back_traps"], ["biceps"]),
  "dumbbell row": entry(["upper_back_lats", "upper_back_traps"], ["biceps", "rear_delts"]),
  "one arm dumbbell row": entry(["upper_back_lats"], ["biceps", "rear_delts"]),
  "cable row": entry(["upper_back_lats", "upper_back_traps"], ["biceps", "rear_delts"]),
  "seated cable row": entry(["upper_back_lats"], ["biceps", "rear_delts"]),
  "t bar row": entry(["upper_back_lats", "upper_back_traps"], ["biceps"]),
  "meadows row": entry(["upper_back_lats"], ["biceps", "rear_delts"]),
  "shrugs": entry(["upper_back_traps"], ["forearms"]),
  "barbell shrug": entry(["upper_back_traps"], ["forearms"]),
  "dumbbell shrug": entry(["upper_back_traps"], ["forearms"]),
  "hyperextension": entry(["lower_back", "hamstrings", "glutes"], []),
  "back extension": entry(["lower_back", "hamstrings"], []),
  "good morning": entry(["hamstrings", "lower_back", "glutes"], []),

  // Core
  "plank": entry(["abs"], ["obliques"]),
  "hanging leg raise": entry(["abs"], ["forearms"]),
  "cable crunch": entry(["abs"], ["obliques"]),
  "ab wheel": entry(["abs"], ["front_delts", "lower_back"]),
  "crunch": entry(["abs"], []),
  "russian twist": entry(["obliques"], ["abs"]),
  "wood chop": entry(["obliques"], ["abs"]),
  "pallof press": entry(["abs", "obliques"], ["forearms"]),

  // Legs
  "squat": entry(["quads", "glutes"], ["lower_back", "hamstrings"]),
  "barbell back squat": entry(["quads", "glutes"], ["lower_back", "hamstrings"]),
  "front squat": entry(["quads"], ["glutes", "abs", "upper_back_traps"]),
  "goblet squat": entry(["quads", "glutes"], ["abs"]),
  "leg press": entry(["quads", "glutes"], ["hamstrings"]),
  "hack squat": entry(["quads"], ["glutes"]),
  "leg extension": entry(["quads"], []),
  "leg curl": entry(["hamstrings"], ["calves"]),
  "lying leg curl": entry(["hamstrings"], []),
  "seated leg curl": entry(["hamstrings"], []),
  "romanian deadlift dumbbell": entry(["hamstrings", "glutes"], ["lower_back"]),
  "lunge": entry(["quads", "glutes"], ["hamstrings"]),
  "walking lunge": entry(["quads", "glutes"], ["hamstrings"]),
  "bulgarian split squat": entry(["quads", "glutes"], ["hamstrings"]),
  "split squat": entry(["quads", "glutes"], ["hamstrings"]),
  "step up": entry(["quads", "glutes"], ["hamstrings"]),
  "hip thrust": entry(["glutes"], ["hamstrings", "quads"]),
  "glute bridge": entry(["glutes"], ["hamstrings"]),
  "calf raise": entry(["calves"], []),
  "standing calf raise": entry(["calves"], []),
  "seated calf raise": entry(["calves"], []),
  "sled push": entry(["quads", "glutes", "calves"], ["hamstrings"]),
  "box jump": entry(["quads", "glutes", "calves"], []),
};

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

export function normalizeExerciseName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

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

function lookupExerciseMap(name: string): MuscleMapEntry | undefined {
  const key = normalizeExerciseName(name);
  if (EXERCISE_MUSCLE_MAP[key]) return EXERCISE_MUSCLE_MAP[key];
  for (const [k, v] of Object.entries(EXERCISE_MUSCLE_MAP)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return undefined;
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
 * Resolve which muscles get credit for this exercise's working sets.
 */
export function resolveMuscleAllocations(
  exercise: WorkoutExercise,
): MuscleAllocation[] {
  const workingSets = countWorkingSets(exercise);
  if (workingSets === 0) return [];

  const fromImport: MuscleId[] = [];
  for (const raw of exercise.muscleGroups) {
    const m = mapImportMuscleLabel(raw);
    if (m) fromImport.push(m);
  }
  if (fromImport.length > 0) {
    const unique = [...new Set(fromImport)];
    const perMuscle = workingSets / unique.length;
    return unique.map((muscle) => ({
      muscle,
      weightedSets: perMuscle,
    }));
  }

  const mapped = lookupExerciseMap(exercise.name);
  if (!mapped) {
    return [];
  }

  const primaryW = 1;
  const secondaryW = SECONDARY_SET_WEIGHT;
  const weights: { muscle: MuscleId; w: number }[] = [];
  for (const m of mapped.primary) {
    weights.push({ muscle: m, w: primaryW });
  }
  for (const m of mapped.secondary) {
    weights.push({ muscle: m, w: secondaryW });
  }
  const sumW = weights.reduce((a, b) => a + b.w, 0);
  if (sumW <= 0) return [];

  return weights.map(({ muscle, w }) => ({
    muscle,
    weightedSets: (workingSets * w) / sumW,
  }));
}

export function emptyMuscleRecord(): Record<MuscleId, { sets: number; volume: number }> {
  const r = {} as Record<MuscleId, { sets: number; volume: number }>;
  for (const id of MUSCLE_IDS) {
    r[id] = { sets: 0, volume: 0 };
  }
  return r;
}

export type TrainingStatus = "growing" | "maintaining" | "under";

/** Thresholds: weekly effective sets */
export const SETS_MAINTENANCE_MIN = 6;
export const SETS_GROWTH_MIN = 10;
export const SETS_ADVANCED_MIN = 15;

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
