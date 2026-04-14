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
    "chest press": entry(["chest"], ["front_delts", "triceps"]),
    "converging chest press": entry(["chest"], ["front_delts", "triceps"]),
    "machine chest press": entry(["chest"], ["front_delts", "triceps"]),
    "smith machine bench press": entry(["chest"], ["front_delts", "triceps"]),
    "incline chest press": entry(["chest"], ["front_delts", "triceps"]),
    "incline machine press": entry(["chest"], ["front_delts", "triceps"]),
    "push up": entry(["chest"], ["triceps", "front_delts"]),
    pushup: entry(["chest"], ["triceps", "front_delts"]),
    dip: entry(["triceps"], ["chest", "front_delts"]),
    "chest dip": entry(["triceps"], ["chest", "front_delts"]),
    "cable crossover": entry(["chest"], ["front_delts"]),
    "pec deck": entry(["chest"], ["front_delts"]),
    fly: entry(["chest"], ["front_delts"]),
    "dumbbell fly": entry(["chest"], ["front_delts"]),
    "cable fly": entry(["chest"], ["front_delts"]),
    "incline fly": entry(["chest"], ["front_delts"]),
    "incline dumbbell fly": entry(["chest"], ["front_delts"]),
    "machine fly": entry(["chest"], ["front_delts"]),
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
    "machine shoulder press": entry(["front_delts", "side_delts"], ["triceps"]),
    "seated overhead press": entry(["front_delts", "side_delts"], ["triceps"]),
    "lateral raise": entry(["side_delts"], ["front_delts"]),
    "side lateral raise": entry(["side_delts"], ["front_delts"]),
    "dumbbell lateral raise": entry(["side_delts"], ["front_delts"]),
    "cable lateral raise": entry(["side_delts"], ["front_delts"]),
    "cable one arm lateral raise": entry(["side_delts"], []),
    "machine lateral raise": entry(["side_delts"], ["front_delts"]),
    "front raise": entry(["front_delts"], ["side_delts"]),
    "rear delt fly": entry(["rear_delts"], ["upper_back_traps"]),
    "reverse fly": entry(["rear_delts"], ["upper_back_traps"]),
    "reverse pec deck": entry(["rear_delts"], ["upper_back_traps"]),
    "rear delt machine": entry(["rear_delts"], ["upper_back_traps"]),
    "face pull": entry(["rear_delts", "upper_back_traps"], ["biceps"]),
    "cable face pull": entry(["rear_delts", "upper_back_traps"], ["biceps"]),
    "upright row": entry(["side_delts", "upper_back_traps"], ["biceps"]),
  },
  arms: {
    "tricep pushdown": entry(["triceps"], ["forearms"]),
    "triceps pushdown": entry(["triceps"], ["forearms"]),
    "cable tricep pushdown": entry(["triceps"], ["forearms"]),
    "rope pushdown": entry(["triceps"], ["forearms"]),
    "skull crusher": entry(["triceps"], ["forearms"]),
    "lying tricep extension": entry(["triceps"], ["forearms"]),
    "overhead tricep extension": entry(["triceps"], ["forearms"]),
    "dumbbell tricep extension": entry(["triceps"], ["forearms"]),
    "dumbbell standing triceps extension": entry(["triceps"], ["forearms"]),
    "seated dumbbell triceps extension": entry(["triceps"], ["forearms"]),
    "standing overhead barbell triceps extension": entry(["triceps"], ["forearms"]),
    "close grip bench press": entry(["triceps", "chest"], ["front_delts"]),
    "barbell curl": entry(["biceps"], ["forearms"]),
    "dumbbell curl": entry(["biceps"], ["forearms"]),
    "ez bar curl": entry(["biceps"], ["forearms"]),
    "incline dumbbell curl": entry(["biceps"], ["forearms"]),
    "dumbbell incline curl": entry(["biceps"], ["forearms"]),
    "spider curl": entry(["biceps"], ["forearms"]),
    "machine curl": entry(["biceps"], ["forearms"]),
    "machine preacher curl": entry(["biceps"], ["forearms"]),
    "bayesian curl": entry(["biceps"], ["forearms"]),
    "hammer curl": entry(["biceps", "forearms"], []),
    "dumbbell hammer curls": entry(["biceps", "forearms"], []),
    "preacher curl": entry(["biceps"], ["forearms"]),
    "concentration curl": entry(["biceps"], ["forearms"]),
    "cable curl": entry(["biceps"], ["forearms"]),
    "reverse curl": entry(["forearms", "biceps"], []),
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
    "stiff leg deadlift": entry(["hamstrings", "glutes"], ["lower_back", "forearms"]),
    "trap bar deadlift": entry(
      ["lower_back", "glutes", "hamstrings", "upper_back_traps"],
      ["quads", "forearms"],
    ),
    "rack pull": entry(["upper_back_traps", "lower_back"], ["forearms"]),
    "pull up": entry(["upper_back_lats", "biceps"], ["rear_delts"]),
    pullup: entry(["upper_back_lats", "biceps"], ["rear_delts"]),
    "chin up": entry(["upper_back_lats", "biceps"], ["rear_delts"]),
    "assisted pull up": entry(["upper_back_lats", "biceps"], ["rear_delts"]),
    "band assisted chin up": entry(["upper_back_lats", "biceps"], ["rear_delts"]),
    "lat pulldown": entry(["upper_back_lats"], ["biceps", "rear_delts"]),
    "wide grip lat pulldown": entry(["upper_back_lats"], ["biceps", "rear_delts"]),
    "cable wide grip lat pulldown": entry(["upper_back_lats"], ["biceps", "rear_delts"]),
    "close grip lat pulldown": entry(["upper_back_lats"], ["biceps"]),
    "straight arm pulldown": entry(["upper_back_lats"], ["rear_delts"]),
    "cable pulldown": entry(["upper_back_lats"], ["biceps"]),
    "barbell row": entry(["upper_back_lats", "upper_back_traps"], ["biceps", "rear_delts"]),
    "pendlay row": entry(["upper_back_lats", "upper_back_traps"], ["biceps"]),
    "dumbbell row": entry(["upper_back_lats", "upper_back_traps"], ["biceps", "rear_delts"]),
    "one arm dumbbell row": entry(["upper_back_lats"], ["biceps", "rear_delts"]),
    "cable row": entry(["upper_back_lats", "upper_back_traps"], ["biceps", "rear_delts"]),
    "seated cable row": entry(["upper_back_lats"], ["biceps", "rear_delts"]),
    "chest supported row": entry(["upper_back_lats", "upper_back_traps"], ["biceps", "rear_delts"]),
    "chest supported dumbbell row": entry(["upper_back_lats", "upper_back_traps"], ["biceps", "rear_delts"]),
    "machine row": entry(["upper_back_lats", "upper_back_traps"], ["biceps"]),
    "inverted row": entry(["upper_back_lats", "upper_back_traps"], ["biceps", "rear_delts"]),
    "t bar row": entry(["upper_back_lats", "upper_back_traps"], ["biceps"]),
    "meadows row": entry(["upper_back_lats"], ["biceps", "rear_delts"]),
    shrugs: entry(["upper_back_traps"], ["forearms"]),
    "barbell shrug": entry(["upper_back_traps"], ["forearms"]),
    "dumbbell shrug": entry(["upper_back_traps"], ["forearms"]),
    "farmer walk": entry(["forearms", "upper_back_traps"], ["glutes"]),
    "farmers carry": entry(["forearms", "upper_back_traps"], ["glutes"]),
    hyperextension: entry(["lower_back", "hamstrings", "glutes"], []),
    "back extension": entry(["lower_back", "hamstrings"], []),
    "good morning": entry(["hamstrings", "lower_back", "glutes"], []),
  },
  core: {
    plank: entry(["abs"], ["obliques"]),
    "hanging leg raise": entry(["abs"], ["forearms"]),
    "leg raise": entry(["abs"], []),
    "flat bench leg raises": entry(["abs"], []),
    "bent knee hip raise": entry(["abs"], []),
    "cable crunch": entry(["abs"], ["obliques"]),
    "decline crunch": entry(["abs"], []),
    "ab wheel": entry(["abs"], ["front_delts", "lower_back"]),
    crunch: entry(["abs"], []),
    "bicycle crunch": entry(["abs", "obliques"], []),
    "cross body crunch": entry(["obliques"], ["abs"]),
    "sit up": entry(["abs"], []),
    "russian twist": entry(["obliques"], ["abs"]),
    "wood chop": entry(["obliques"], ["abs"]),
    "pallof press": entry(["abs", "obliques"], ["forearms"]),
    "dead bug": entry(["abs"], ["obliques"]),
    "side plank": entry(["obliques"], ["abs"]),
  },
  legs: {
    squat: entry(["quads", "glutes"], ["lower_back", "hamstrings"]),
    "barbell back squat": entry(["quads", "glutes"], ["lower_back", "hamstrings"]),
    "smith machine squat": entry(["quads", "glutes"], ["lower_back", "hamstrings"]),
    "front squat": entry(["quads"], ["glutes", "abs", "upper_back_traps"]),
    "goblet squat": entry(["quads", "glutes"], ["abs"]),
    "leg press": entry(["quads", "glutes"], ["hamstrings"]),
    "machine leg press": entry(["quads", "glutes"], ["hamstrings"]),
    "single leg press": entry(["quads", "glutes"], ["hamstrings"]),
    "hack squat": entry(["quads"], ["glutes"]),
    "leg extension": entry(["quads"], []),
    "leg curl": entry(["hamstrings"], ["calves"]),
    "lying leg curl": entry(["hamstrings"], []),
    "seated leg curl": entry(["hamstrings"], []),
    "nordic curl": entry(["hamstrings"], []),
    "romanian deadlift dumbbell": entry(["hamstrings", "glutes"], ["lower_back"]),
    lunge: entry(["quads", "glutes"], ["hamstrings"]),
    "walking lunge": entry(["quads", "glutes"], ["hamstrings"]),
    "reverse lunge": entry(["quads", "glutes"], ["hamstrings"]),
    "dumbbell lunge": entry(["quads", "glutes"], ["hamstrings"]),
    "bulgarian split squat": entry(["quads", "glutes"], ["hamstrings"]),
    "split squat": entry(["quads", "glutes"], ["hamstrings"]),
    "dumbell glute dominant bulgarian split squat": entry(["glutes", "quads"], ["hamstrings"]),
    "step up": entry(["quads", "glutes"], ["hamstrings"]),
    "hip thrust": entry(["glutes"], ["hamstrings", "quads"]),
    "barbell hip thrust": entry(["glutes"], ["hamstrings", "quads"]),
    "glute bridge": entry(["glutes"], ["hamstrings"]),
    "glute ham raise": entry(["hamstrings", "glutes"], ["lower_back"]),
    "cable kickback": entry(["glutes"], ["hamstrings"]),
    "lever seated hip abduction": entry(["glutes"], []),
    "hip abduction": entry(["glutes"], []),
    "abductor machine": entry(["glutes"], []),
    "hip adduction": entry(["glutes"], []),
    "adductor machine": entry(["glutes"], []),
    "lever seated hip adduction": entry(["glutes"], []),
    "calf raise": entry(["calves"], []),
    "standing calf raise": entry(["calves"], []),
    "standing calf raise machine": entry(["calves"], []),
    "seated calf raise": entry(["calves"], []),
    "seated calf raise machine": entry(["calves"], []),
    "donkey calf raise": entry(["calves"], []),
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

  // Priority 1: exact match
  if (EXERCISE_MUSCLE_MAP[key]) return EXERCISE_MUSCLE_MAP[key];

  // Priority 2: substring match (either direction)
  for (const [k, v] of Object.entries(EXERCISE_MUSCLE_MAP)) {
    if (key.includes(k) || k.includes(key)) return v;
  }

  // Priority 3: token containment — all tokens of a 2+ token map key
  // appear in the import name. Pick the most specific (most tokens) match.
  const importTokens = new Set(key.split(" "));
  let bestMatch: MuscleMapEntry | undefined;
  let bestTokenCount = 1;

  for (const [k, v] of Object.entries(EXERCISE_MUSCLE_MAP)) {
    const mapTokens = k.split(" ");
    if (mapTokens.length <= 1) continue;
    if (mapTokens.every((t) => importTokens.has(t)) && mapTokens.length > bestTokenCount) {
      bestTokenCount = mapTokens.length;
      bestMatch = v;
    }
  }

  return bestMatch;
}
