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

  it("matches converging chest press via exact map entry", () => {
    const e = lookupExerciseMap("Converging Chest Press");
    expect(e?.primary).toContain("chest");
  });

  it("token match: Standing Overhead Tricep Extension finds overhead tricep extension", () => {
    const e = lookupExerciseMap("Standing Overhead Tricep Extension");
    expect(e).toBeDefined();
    expect(e?.primary).toContain("triceps");
  });

  it("token match: Smith Machine Barbell Back Squat finds barbell back squat (most specific)", () => {
    const e = lookupExerciseMap("Smith Machine Barbell Back Squat");
    expect(e).toBeDefined();
    expect(e?.primary).toEqual(
      expect.arrayContaining(["quads", "glutes"]),
    );
  });

  it("does not false-positive on token matching for single-token map keys", () => {
    expect(lookupExerciseMap("Resistance Band Stretch Routine")).toBeUndefined();
  });

  it("returns undefined for completely unknown exercise", () => {
    expect(lookupExerciseMap("Underwater Basket Weaving")).toBeUndefined();
  });
});
