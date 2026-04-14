import { describe, expect, it } from "vitest";

import {
  allocateFromExerciseMapEntry,
  allocateFromImportMuscleLabels,
  allocateFromStructuredImportData,
  MUSCLE_IDS,
  resolveMuscleAllocations,
  SECONDARY_SET_WEIGHT,
  statusFromWeeklySets,
  type MuscleMapEntry,
} from "@/lib/muscles";
import { weeklyMuscleBucketForWeek } from "@/lib/workout-stats";
import { createExercise, createSession, createSet } from "@/test-utils/factories";

describe("allocateFromExerciseMapEntry", () => {
  it("returns empty when workingSets is zero", () => {
    expect(
      allocateFromExerciseMapEntry(
        { primary: ["chest"], secondary: ["triceps"] },
        0,
      ),
    ).toEqual([]);
  });

  it("gives primary muscles full sets and secondary half", () => {
    expect(
      allocateFromExerciseMapEntry(
        { primary: ["chest"], secondary: ["triceps", "front_delts"] },
        4,
      ),
    ).toEqual([
      { muscle: "chest", weightedSets: 4 },
      { muscle: "triceps", weightedSets: 4 * SECONDARY_SET_WEIGHT },
      { muscle: "front_delts", weightedSets: 4 * SECONDARY_SET_WEIGHT },
    ]);
  });
});

describe("allocateFromImportMuscleLabels", () => {
  it("returns empty when no labels resolve", () => {
    expect(allocateFromImportMuscleLabels(["nope", "zzz"], 3)).toEqual([]);
  });

  it("splits working sets equally across unique resolved muscles", () => {
    expect(allocateFromImportMuscleLabels(["Chest", "Biceps"], 4)).toEqual([
      { muscle: "chest", weightedSets: 2 },
      { muscle: "biceps", weightedSets: 2 },
    ]);
  });

  it("dedupes duplicate labels before splitting", () => {
    expect(allocateFromImportMuscleLabels(["Chest", "Pectorals", "chest"], 6)).toEqual([
      { muscle: "chest", weightedSets: 6 },
    ]);
  });
});

describe("allocateFromStructuredImportData", () => {
  it("returns empty when no importPrimaryMuscles", () => {
    const ex = createExercise({
      name: "Unknown",
      sets: [createSet({ setNumber: 1, setType: "normal" })],
    });
    expect(allocateFromStructuredImportData(ex, 3)).toEqual([]);
  });

  it("returns empty when importPrimaryMuscles is empty array", () => {
    const ex = createExercise({
      name: "Unknown",
      importPrimaryMuscles: [],
      sets: [createSet({ setNumber: 1, setType: "normal" })],
    });
    expect(allocateFromStructuredImportData(ex, 3)).toEqual([]);
  });

  it("allocates primary at 1.0 and secondary at 0.5", () => {
    const ex = createExercise({
      name: "My Custom Press Thing",
      importPrimaryMuscles: ["Chest"],
      importSecondaryMuscles: ["Triceps"],
      sets: Array.from({ length: 4 }, (_, i) =>
        createSet({ setNumber: i + 1, setType: "normal" }),
      ),
    });
    expect(allocateFromStructuredImportData(ex, 4)).toEqual([
      { muscle: "chest", weightedSets: 4 },
      { muscle: "triceps", weightedSets: 2 },
    ]);
  });

  it("works with primary only, no secondary", () => {
    const ex = createExercise({
      name: "Weird Curl Machine",
      importPrimaryMuscles: ["Biceps"],
      importSecondaryMuscles: [],
      sets: Array.from({ length: 3 }, (_, i) =>
        createSet({ setNumber: i + 1, setType: "normal" }),
      ),
    });
    expect(allocateFromStructuredImportData(ex, 3)).toEqual([
      { muscle: "biceps", weightedSets: 3 },
    ]);
  });

  it("dedupes overlapping primary/secondary labels", () => {
    const ex = createExercise({
      name: "Overlap Exercise",
      importPrimaryMuscles: ["Chest"],
      importSecondaryMuscles: ["Chest", "Triceps"],
      sets: [createSet({ setNumber: 1, setType: "normal" })],
    });
    const allocs = allocateFromStructuredImportData(ex, 4);
    expect(allocs).toEqual([
      { muscle: "chest", weightedSets: 4 },
      { muscle: "triceps", weightedSets: 2 },
    ]);
  });
});

describe("resolveMuscleAllocations", () => {
  it("uses exercise map when matched: primary full sets, secondary half", () => {
    const ex = createExercise({
      name: "Squat",
      muscleGroups: ["shoulders"],
      sets: [
        { setNumber: 1, setType: "normal" },
        { setNumber: 2, setType: "normal" },
        { setNumber: 3, setType: "normal" },
        { setNumber: 4, setType: "normal" },
      ],
    });
    expect(resolveMuscleAllocations(ex)).toEqual([
      { muscle: "quads", weightedSets: 4 },
      { muscle: "glutes", weightedSets: 4 },
      { muscle: "lower_back", weightedSets: 2 },
      { muscle: "hamstrings", weightedSets: 2 },
    ]);
  });

  it("user mapping resolves when not in curated map", () => {
    const ex = createExercise({
      name: "Custom Press",
      sets: Array.from({ length: 4 }, (_, i) =>
        createSet({ setNumber: i + 1, setType: "normal" }),
      ),
    });
    const userMappings: Record<string, MuscleMapEntry> = {
      "custom press": { primary: ["chest"], secondary: ["triceps"] },
    };
    expect(resolveMuscleAllocations(ex, userMappings)).toEqual([
      { muscle: "chest", weightedSets: 4 },
      { muscle: "triceps", weightedSets: 4 * SECONDARY_SET_WEIGHT },
    ]);
  });

  it("curated map still wins over user mapping", () => {
    const ex = createExercise({
      name: "Barbell Bench Press",
      sets: Array.from({ length: 3 }, (_, i) =>
        createSet({ setNumber: i + 1, setType: "normal" }),
      ),
    });
    const userMappings: Record<string, MuscleMapEntry> = {
      "barbell bench press": { primary: ["quads"], secondary: [] },
    };
    const allocs = resolveMuscleAllocations(ex, userMappings);
    expect(allocs).toEqual(
      expect.arrayContaining([
        { muscle: "chest", weightedSets: 3 },
        { muscle: "front_delts", weightedSets: 1.5 },
        { muscle: "triceps", weightedSets: 1.5 },
      ]),
    );
    expect(allocs).toHaveLength(3);
    expect(allocs.some((a) => a.muscle === "quads")).toBe(false);
  });

  it("user mapping wins over structured import data", () => {
    const ex = createExercise({
      name: "Custom Thing",
      importPrimaryMuscles: ["Shoulders"],
      importSecondaryMuscles: [],
      sets: Array.from({ length: 3 }, (_, i) =>
        createSet({ setNumber: i + 1, setType: "normal" }),
      ),
    });
    const userMappings: Record<string, MuscleMapEntry> = {
      "custom thing": { primary: ["chest"], secondary: [] },
    };
    expect(resolveMuscleAllocations(ex, userMappings)).toEqual([
      { muscle: "chest", weightedSets: 3 },
    ]);
  });

  it("Layer 1 wins over import data: curated map beats importPrimaryMuscles", () => {
    const ex = createExercise({
      name: "Barbell Bench Press",
      importPrimaryMuscles: ["Legs"],
      importSecondaryMuscles: [],
      sets: [
        { setNumber: 1, setType: "normal" },
        { setNumber: 2, setType: "normal" },
      ],
    });
    const allocs = resolveMuscleAllocations(ex);
    expect(allocs).toEqual(
      expect.arrayContaining([
        { muscle: "chest", weightedSets: 2 },
      ]),
    );
    expect(allocs.some((a) => a.muscle === "quads")).toBe(false);
  });

  it("Layer 2: falls back to structured import data when not in curated map", () => {
    const ex = createExercise({
      name: "My Custom Press Thing",
      importPrimaryMuscles: ["Chest"],
      importSecondaryMuscles: ["Triceps"],
      sets: Array.from({ length: 4 }, (_, i) =>
        createSet({ setNumber: i + 1, setType: "normal" }),
      ),
    });
    expect(resolveMuscleAllocations(ex)).toEqual([
      { muscle: "chest", weightedSets: 4 },
      { muscle: "triceps", weightedSets: 2 },
    ]);
  });

  it("Layer 3: returns empty with no map match and no import data", () => {
    const ex = createExercise({
      name: "Underwater Basket Weaving",
      sets: Array.from({ length: 5 }, (_, i) =>
        createSet({ setNumber: i + 1, setType: "normal" }),
      ),
    });
    expect(resolveMuscleAllocations(ex)).toEqual([]);
  });

  it("Layer 3: returns empty with no map match and empty import data", () => {
    const ex = createExercise({
      name: "Mystery Exercise",
      importPrimaryMuscles: [],
      importSecondaryMuscles: [],
      sets: Array.from({ length: 5 }, (_, i) =>
        createSet({ setNumber: i + 1, setType: "normal" }),
      ),
    });
    expect(resolveMuscleAllocations(ex)).toEqual([]);
  });

  it("returns empty when not in map even with resolvable muscleGroups but no import fields (Hevy)", () => {
    const ex = createExercise({
      name: "Obscure Gym Machine 9000",
      muscleGroups: ["Chest", "Triceps"],
      sets: [
        { setNumber: 1, setType: "normal" },
        { setNumber: 2, setType: "normal" },
      ],
    });
    expect(resolveMuscleAllocations(ex)).toEqual([]);
  });

  it("excludes warmup sets from working set count (all warmups yields empty)", () => {
    const ex = createExercise({
      name: "Squat",
      sets: [
        { setNumber: 1, setType: "warmup" },
        { setNumber: 2, setType: "warmup" },
      ],
    });
    expect(resolveMuscleAllocations(ex)).toEqual([]);
  });

  it("counts only non-warmup sets when mixed", () => {
    const ex = createExercise({
      name: "Squat",
      sets: [
        { setNumber: 1, setType: "warmup" },
        { setNumber: 2, setType: "normal" },
        { setNumber: 3, setType: "normal" },
      ],
    });
    expect(resolveMuscleAllocations(ex)).toEqual([
      { muscle: "quads", weightedSets: 2 },
      { muscle: "glutes", weightedSets: 2 },
      { muscle: "lower_back", weightedSets: 1 },
      { muscle: "hamstrings", weightedSets: 1 },
    ]);
  });

  it("allocates barbell bench press: chest full, front delts and triceps half per set", () => {
    const ex = createExercise({
      name: "Barbell Bench Press",
      sets: Array.from({ length: 3 }, (_, i) =>
        createSet({ setNumber: i + 1, setType: "normal" }),
      ),
    });
    const allocs = resolveMuscleAllocations(ex);
    expect(allocs).toEqual(
      expect.arrayContaining([
        { muscle: "chest", weightedSets: 3 },
        { muscle: "front_delts", weightedSets: 1.5 },
        { muscle: "triceps", weightedSets: 1.5 },
      ]),
    );
    expect(allocs).toHaveLength(3);
  });

  it("allocates lateral raise: side delts full, front delts half", () => {
    const ex = createExercise({
      name: "Lateral Raise",
      sets: Array.from({ length: 4 }, (_, i) =>
        createSet({ setNumber: i + 1, setType: "normal" }),
      ),
    });
    expect(resolveMuscleAllocations(ex)).toEqual([
      { muscle: "side_delts", weightedSets: 4 },
      { muscle: "front_delts", weightedSets: 2 },
    ]);
  });

  it("allocates dips: triceps primary, chest and front delts secondary", () => {
    const ex = createExercise({
      name: "Dip",
      sets: Array.from({ length: 4 }, (_, i) =>
        createSet({ setNumber: i + 1, setType: "normal" }),
      ),
    });
    expect(resolveMuscleAllocations(ex)).toEqual([
      { muscle: "triceps", weightedSets: 4 },
      { muscle: "chest", weightedSets: 2 },
      { muscle: "front_delts", weightedSets: 2 },
    ]);
  });
});

describe("weekly bucket with allocations", () => {
  const week = "2024-01-01";

  it("does not inflate any muscle for fully unmapped exercise without import data", () => {
    const sessions = [
      createSession({
        startDate: "2024-01-02T12:00:00",
        exercises: [
          createExercise({
            name: "underwater basket weaving",
            muscleGroups: [],
            sets: Array.from({ length: 5 }, (_, i) =>
              createSet({ setNumber: i + 1, setType: "normal" }),
            ),
          }),
        ],
      }),
    ];
    const bucket = weeklyMuscleBucketForWeek(sessions, week);
    for (const id of MUSCLE_IDS) {
      expect(bucket.muscles[id].sets).toBe(0);
    }
  });

  it("tracks unmapped exercises with set counts", () => {
    const sessions = [
      createSession({
        startDate: "2024-01-02T12:00:00",
        exercises: [
          createExercise({
            name: "underwater basket weaving",
            muscleGroups: [],
            sets: Array.from({ length: 5 }, (_, i) =>
              createSet({ setNumber: i + 1, setType: "normal" }),
            ),
          }),
        ],
      }),
    ];
    const bucket = weeklyMuscleBucketForWeek(sessions, week);
    expect(bucket.unmappedExercises).toEqual([
      { name: "underwater basket weaving", sets: 5 },
    ]);
  });

  it("Layer 2 import data credits muscles from structured import fields", () => {
    const sessions = [
      createSession({
        startDate: "2024-01-02T12:00:00",
        exercises: [
          createExercise({
            name: "My Custom Chest Thingy",
            importPrimaryMuscles: ["Chest"],
            importSecondaryMuscles: ["Triceps"],
            sets: Array.from({ length: 3 }, (_, i) =>
              createSet({ setNumber: i + 1, setType: "normal" }),
            ),
          }),
        ],
      }),
    ];
    const bucket = weeklyMuscleBucketForWeek(sessions, week);
    expect(bucket.muscles.chest.sets).toBe(3);
    expect(bucket.muscles.triceps.sets).toBe(1.5);
    expect(bucket.unmappedExercises).toEqual([]);
  });

  it("mixed week: Layer 1 + Layer 2 + Layer 3", () => {
    const sessions = [
      createSession({
        startDate: "2024-01-02T12:00:00",
        exercises: [
          createExercise({
            name: "Barbell Bench Press",
            sets: Array.from({ length: 4 }, (_, i) =>
              createSet({ setNumber: i + 1, setType: "normal" }),
            ),
          }),
          createExercise({
            name: "My Custom Chest Thingy",
            importPrimaryMuscles: ["Chest"],
            sets: Array.from({ length: 3 }, (_, i) =>
              createSet({ setNumber: i + 1, setType: "normal" }),
            ),
          }),
          createExercise({
            name: "Unknown Thing",
            sets: Array.from({ length: 2 }, (_, i) =>
              createSet({ setNumber: i + 1, setType: "normal" }),
            ),
          }),
        ],
      }),
    ];
    const bucket = weeklyMuscleBucketForWeek(sessions, week);
    expect(bucket.muscles.chest.sets).toBe(7);
    expect(bucket.unmappedExercises).toEqual([
      { name: "Unknown Thing", sets: 2 },
    ]);
  });

  it("mixed push week yields expected effective sets and zones", () => {
    const sessions = [
      createSession({
        startDate: "2024-01-02T12:00:00",
        exercises: [
          createExercise({
            name: "Barbell Bench Press",
            sets: Array.from({ length: 4 }, (_, i) =>
              createSet({ setNumber: i + 1, setType: "normal" }),
            ),
          }),
          createExercise({
            name: "Dumbbell Fly",
            sets: Array.from({ length: 3 }, (_, i) =>
              createSet({ setNumber: i + 1, setType: "normal" }),
            ),
          }),
          createExercise({
            name: "Lateral Raise",
            sets: Array.from({ length: 3 }, (_, i) =>
              createSet({ setNumber: i + 1, setType: "normal" }),
            ),
          }),
        ],
      }),
    ];
    const bucket = weeklyMuscleBucketForWeek(sessions, week);
    expect(bucket.muscles.chest.sets).toBeCloseTo(7, 5);
    expect(statusFromWeeklySets(bucket.muscles.chest.sets)).toBe("minimal");
    expect(bucket.muscles.front_delts.sets).toBeCloseTo(5, 5);
    expect(statusFromWeeklySets(bucket.muscles.front_delts.sets)).toBe(
      "insufficient",
    );
    expect(bucket.muscles.triceps.sets).toBeCloseTo(2, 5);
    expect(statusFromWeeklySets(bucket.muscles.triceps.sets)).toBe("insufficient");
    expect(bucket.muscles.side_delts.sets).toBeCloseTo(3, 5);
    expect(statusFromWeeklySets(bucket.muscles.side_delts.sets)).toBe(
      "insufficient",
    );
  });
});
