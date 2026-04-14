import { describe, expect, it } from "vitest";

import { normalizeExerciseName, type MuscleMapEntry } from "@/lib/muscles";
import { createExercise, createSession, createSet } from "@/test-utils/factories";

import {
  dailyMuscleSetsForWeek,
  weeklyMuscleBucketForWeek,
  weeklyMuscleSetsEndingAt,
} from "./muscle-week-stats";

/** Monday 2024-01-01 — use with sessions whose local calendar day falls in this week. */
const WEEK_2024_01_01 = "2024-01-01";

describe("weeklyMuscleBucketForWeek", () => {
  it("returns empty bucket when there are no sessions", () => {
    const b = weeklyMuscleBucketForWeek([], WEEK_2024_01_01);
    expect(b.weekStart).toBe(WEEK_2024_01_01);
    expect(b.muscles.quads.sets).toBe(0);
    expect(b.muscles.quads.volume).toBe(0);
  });

  it("excludes sessions outside the week window", () => {
    const before = createSession({
      startDate: "2023-12-24T12:00:00",
      exercises: [
        createExercise({
          name: "Squat",
          sets: [createSet({ setNumber: 1, setType: "normal" })],
        }),
      ],
    });
    const after = createSession({
      startDate: "2024-01-15T12:00:00",
      exercises: [
        createExercise({
          name: "Squat",
          sets: [createSet({ setNumber: 1, setType: "normal" })],
        }),
      ],
    });
    const b = weeklyMuscleBucketForWeek([before, after], WEEK_2024_01_01);
    expect(b.muscles.quads.sets).toBe(0);
  });

  it("counts only working sets (warmups only yields zero stimulus)", () => {
    const s = createSession({
      startDate: "2024-01-02T12:00:00.000Z",
      exercises: [
        createExercise({
          name: "Squat",
          sets: [
            createSet({ setNumber: 1, setType: "warmup" }),
            createSet({ setNumber: 2, setType: "warmup" }),
          ],
        }),
      ],
    });
    const b = weeklyMuscleBucketForWeek([s], WEEK_2024_01_01);
    expect(b.muscles.quads.sets).toBe(0);
  });

  it("aggregates known map exercise into expected muscles", () => {
    const s = createSession({
      startDate: "2024-01-02T12:00:00.000Z",
      exercises: [
        createExercise({
          name: "Squat",
          sets: [
            createSet({ setNumber: 1, setType: "normal", weight: 100, reps: 5 }),
            createSet({ setNumber: 2, setType: "normal", weight: 100, reps: 5 }),
          ],
        }),
      ],
    });
    const b = weeklyMuscleBucketForWeek([s], WEEK_2024_01_01);
    expect(b.muscles.quads.sets).toBe(2);
    expect(b.muscles.glutes.sets).toBe(2);
    expect(b.muscles.lower_back.sets).toBe(1);
    expect(b.muscles.hamstrings.sets).toBe(1);
    const volSum =
      b.muscles.quads.volume +
      b.muscles.glutes.volume +
      b.muscles.lower_back.volume +
      b.muscles.hamstrings.volume;
    expect(volSum).toBeCloseTo(1000, 5);
  });

  it("credits muscles from user mappings when provided", () => {
    const s = createSession({
      startDate: "2024-01-02T12:00:00.000Z",
      exercises: [
        createExercise({
          name: "Unknown Thing",
          sets: Array.from({ length: 5 }, (_, i) =>
            createSet({ setNumber: i + 1, setType: "normal" }),
          ),
        }),
      ],
    });
    const userMappings: Record<string, MuscleMapEntry> = {
      [normalizeExerciseName("Unknown Thing")]: {
        primary: ["chest"],
        secondary: [],
      },
    };
    const b = weeklyMuscleBucketForWeek([s], WEEK_2024_01_01, userMappings);
    expect(b.muscles.chest.sets).toBe(5);
    expect(b.unmappedExercises).toEqual([]);
  });
});

describe("dailyMuscleSetsForWeek", () => {
  it("places working sets on the session's calendar day", () => {
    const s = createSession({
      startDate: "2024-01-03T15:00:00",
      exercises: [
        createExercise({
          name: "Squat",
          sets: [
            createSet({ setNumber: 1, setType: "normal" }),
            createSet({ setNumber: 2, setType: "normal" }),
          ],
        }),
      ],
    });
    const rows = dailyMuscleSetsForWeek([s], WEEK_2024_01_01);
    const dayKey = s.startDate.slice(0, 10);
    const row = rows.find((r) => r.date === dayKey);
    expect(row).toBeDefined();
    expect(row!.muscles.quads.sets).toBe(2);
    expect(row!.muscles.quads.exercises.some((e) => e.name === "Squat")).toBe(
      true,
    );
  });

  it("returns seven rows Mon–Sun for the week", () => {
    const rows = dailyMuscleSetsForWeek([], WEEK_2024_01_01);
    expect(rows).toHaveLength(7);
    expect(rows[0]!.date).toBe("2024-01-01");
    expect(rows[6]!.date).toBe("2024-01-07");
  });

  it("marks secondary target muscles on daily exercise rows", () => {
    const s = createSession({
      startDate: "2024-01-02T12:00:00",
      exercises: [
        createExercise({
          name: "Squat",
          sets: [
            createSet({ setNumber: 1, setType: "normal" }),
            createSet({ setNumber: 2, setType: "normal" }),
          ],
        }),
      ],
    });
    const rows = dailyMuscleSetsForWeek([s], WEEK_2024_01_01);
    const dayKey = s.startDate.slice(0, 10);
    const day = rows.find((r) => r.date === dayKey);
    expect(day).toBeDefined();
    const squatLower = day!.muscles.lower_back.exercises.find((e) => e.name === "Squat");
    expect(squatLower?.role).toBe("secondary");
    const squatQuads = day!.muscles.quads.exercises.find((e) => e.name === "Squat");
    expect(squatQuads?.role).toBe("primary");
  });
});

describe("weeklyMuscleSetsEndingAt", () => {
  it("places each session in exactly one week bucket", () => {
    const endWeek = "2024-01-08";
    const w0 = createSession({
      startDate: "2024-01-02T12:00:00.000Z",
      exercises: [
        createExercise({
          name: "Squat",
          sets: [createSet({ setNumber: 1, setType: "normal" })],
        }),
      ],
    });
    const w1 = createSession({
      startDate: "2024-01-09T12:00:00.000Z",
      exercises: [
        createExercise({
          name: "Squat",
          sets: [createSet({ setNumber: 1, setType: "normal" })],
        }),
      ],
    });
    const buckets = weeklyMuscleSetsEndingAt([w0, w1], endWeek, 2);
    expect(buckets).toHaveLength(2);
    expect(buckets[0]!.weekStart).toBe("2024-01-01");
    expect(buckets[1]!.weekStart).toBe("2024-01-08");
    expect(buckets[0]!.muscles.quads.sets).toBe(1);
    expect(buckets[1]!.muscles.quads.sets).toBe(1);
  });
});
