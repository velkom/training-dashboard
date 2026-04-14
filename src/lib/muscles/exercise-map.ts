import {
  MUSCLE_IDS,
  type MuscleId,
  type MuscleMapEntry,
} from "./constants";

const MUSCLE_ID_SET = new Set<string>(MUSCLE_IDS);

function entry(
  primary: MuscleId[],
  secondary: MuscleId[] = [],
): MuscleMapEntry {
  return { primary, secondary };
}

type ExerciseMuscleMapSection = Record<string, MuscleMapEntry>;

function assertValidMuscleMapEntry(exerciseKey: string, e: MuscleMapEntry): void {
  for (const m of e.primary) {
    if (!MUSCLE_ID_SET.has(m)) {
      throw new Error(`Invalid MuscleId in primary for "${exerciseKey}": ${String(m)}`);
    }
  }
  for (const m of e.secondary) {
    if (!MUSCLE_ID_SET.has(m)) {
      throw new Error(`Invalid MuscleId in secondary for "${exerciseKey}": ${String(m)}`);
    }
  }
}

/** Merge contributor sections; throws on duplicate keys or invalid muscle ids. */
function mergeExerciseMuscleMapSections(
  sections: Record<string, ExerciseMuscleMapSection>,
): Record<string, MuscleMapEntry> {
  const out: Record<string, MuscleMapEntry> = {};
  for (const [sectionName, block] of Object.entries(sections)) {
    for (const [key, value] of Object.entries(block)) {
      if (out[key] !== undefined) {
        throw new Error(
          `Duplicate exercise muscle map key "${key}" (section "${sectionName}" overlaps an earlier section)`,
        );
      }
      assertValidMuscleMapEntry(key, value);
      out[key] = value;
    }
  }
  return out;
}

/**
 * Normalized exercise name keys → primary/secondary muscles.
 * Keys are produced by `normalizeExerciseName`.
 */
const EXERCISE_MUSCLE_MAP_RAW = mergeExerciseMuscleMapSections({
  chest: {
    "barbell bench press": entry(["chest"], ["front_delts", "triceps"]),
    "dumbbell bench press": entry(["chest"], ["front_delts", "triceps"]),
    "incline barbell bench press": entry(["chest"], ["front_delts", "triceps"]),
    "incline dumbbell bench press": entry(["chest"], ["front_delts", "triceps"]),
    "decline bench press": entry(["chest"], ["triceps"]),
    "chest press machine": entry(["chest"], ["triceps"]),
    "push up": entry(["chest"], ["triceps", "front_delts"]),
    pushup: entry(["chest"], ["triceps", "front_delts"]),
    dip: entry(["chest", "triceps"], ["front_delts"]),
    "chest dip": entry(["chest", "triceps"], ["front_delts"]),
    "cable crossover": entry(["chest"], ["front_delts"]),
    "pec deck": entry(["chest"], ["front_delts"]),
    fly: entry(["chest"], ["front_delts"]),
    "dumbbell fly": entry(["chest"], ["front_delts"]),
    "cable fly": entry(["chest"], ["front_delts"]),
  },
  shoulders: {
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
  },
  arms: {
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
  },
  back: {
    deadlift: entry(
      ["lower_back", "glutes", "hamstrings", "upper_back_traps"],
      ["upper_back_lats", "forearms"],
    ),
    "sumo deadlift": entry(
      ["glutes", "hamstrings", "quads", "lower_back"],
      ["upper_back_lats", "upper_back_traps"],
    ),
    "romanian deadlift": entry(["hamstrings", "glutes"], ["lower_back", "forearms"]),
    rdl: entry(["hamstrings", "glutes"], ["lower_back", "forearms"]),
    "rack pull": entry(["upper_back_traps", "lower_back"], ["forearms"]),
    "pull up": entry(["upper_back_lats", "biceps"], ["rear_delts"]),
    pullup: entry(["upper_back_lats", "biceps"], ["rear_delts"]),
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
    shrugs: entry(["upper_back_traps"], ["forearms"]),
    "barbell shrug": entry(["upper_back_traps"], ["forearms"]),
    "dumbbell shrug": entry(["upper_back_traps"], ["forearms"]),
    hyperextension: entry(["lower_back", "hamstrings", "glutes"], []),
    "back extension": entry(["lower_back", "hamstrings"], []),
    "good morning": entry(["hamstrings", "lower_back", "glutes"], []),
  },
  core: {
    plank: entry(["abs"], ["obliques"]),
    "hanging leg raise": entry(["abs"], ["forearms"]),
    "cable crunch": entry(["abs"], ["obliques"]),
    "ab wheel": entry(["abs"], ["front_delts", "lower_back"]),
    crunch: entry(["abs"], []),
    "russian twist": entry(["obliques"], ["abs"]),
    "wood chop": entry(["obliques"], ["abs"]),
    "pallof press": entry(["abs", "obliques"], ["forearms"]),
  },
  legs: {
    squat: entry(["quads", "glutes"], ["lower_back", "hamstrings"]),
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
    lunge: entry(["quads", "glutes"], ["hamstrings"]),
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
  },
});

export const EXERCISE_MUSCLE_MAP: Readonly<Record<string, MuscleMapEntry>> =
  Object.freeze(EXERCISE_MUSCLE_MAP_RAW);

export function normalizeExerciseName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

export function lookupExerciseMap(name: string): MuscleMapEntry | undefined {
  const key = normalizeExerciseName(name);
  if (EXERCISE_MUSCLE_MAP[key]) return EXERCISE_MUSCLE_MAP[key];
  for (const [k, v] of Object.entries(EXERCISE_MUSCLE_MAP)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return undefined;
}
