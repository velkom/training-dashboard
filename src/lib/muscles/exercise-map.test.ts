import { describe, expect, it } from "vitest";

import { lookupExerciseMap, normalizeExerciseName } from "./exercise-map";

describe("normalizeExerciseName", () => {
  it("lowercases and collapses punctuation to spaces", () => {
    expect(normalizeExerciseName("  Barbell   Bench-Press!  ")).toBe(
      "barbell bench press",
    );
  });

  it("strips diacritics", () => {
    expect(normalizeExerciseName("Préss")).toBe("press");
  });

  it("trims edges", () => {
    expect(normalizeExerciseName("deadlift")).toBe("deadlift");
  });
});

describe("lookupExerciseMap", () => {
  it("returns exact normalized match", () => {
    const e = lookupExerciseMap("Barbell Bench Press");
    expect(e?.primary).toContain("chest");
  });

  it("returns fuzzy match when name contains map key", () => {
    const e = lookupExerciseMap("Paused High-Bar Back Squat");
    expect(e?.primary).toEqual(
      expect.arrayContaining(["quads", "glutes"]),
    );
  });

  it("returns undefined for unknown exercise with no substring match", () => {
    expect(lookupExerciseMap("xyzabc unknown qqq")).toBeUndefined();
  });
});
