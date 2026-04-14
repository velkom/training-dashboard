import { describe, expect, it } from "vitest";

import {
  allocateFromExerciseMapEntry,
  allocateFromImportMuscleLabels,
  resolveMuscleAllocations,
  SECONDARY_SET_WEIGHT,
} from "@/lib/muscles";
import { createExercise } from "@/test-utils/factories";

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

  it("falls back to equal split from import labels when exercise is not in map", () => {
    const ex = createExercise({
      name: "Obscure Gym Machine 9000",
      muscleGroups: ["Chest", "Triceps"],
      sets: [
        { setNumber: 1, setType: "normal" },
        { setNumber: 2, setType: "normal" },
      ],
    });
    expect(resolveMuscleAllocations(ex)).toEqual([
      { muscle: "chest", weightedSets: 1 },
      { muscle: "triceps", weightedSets: 1 },
    ]);
  });

  it("returns empty when there is no map match and no resolvable import labels", () => {
    const ex = createExercise({
      name: "Totally Unknown Movement",
      muscleGroups: ["", "nope"],
      sets: [{ setNumber: 1, setType: "normal" }],
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
});
