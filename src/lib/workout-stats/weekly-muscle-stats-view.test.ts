import { describe, expect, it } from "vitest";

import { createExercise, createSession, createSet } from "@/test-utils/factories";

import { dailyMuscleSetsForWeek } from "./muscle-week-stats";
import {
  buildMuscleExerciseRows,
  computeWeeklyMuscleStats,
} from "./weekly-muscle-stats-view";

const WEEK = "2024-01-01";

describe("computeWeeklyMuscleStats", () => {
  it("marks empty state when no sessions", () => {
    const s = computeWeeklyMuscleStats([], WEEK);
    expect(s.isEmpty).toBe(true);
    expect(s.trainedCount).toBe(0);
    expect(s.groups).toEqual([]);
    expect(s.statusCounts).toEqual({ growing: 0, maintaining: 0, under: 0 });
  });

  it("counts status buckets for trained muscles", () => {
    const sessions = [
      createSession({
        startDate: "2024-01-02T12:00:00",
        exercises: [
          createExercise({
            name: "Squat",
            sets: Array.from({ length: 12 }, (_, i) =>
              createSet({ setNumber: i + 1, setType: "normal" }),
            ),
          }),
          createExercise({
            name: "Leg extension",
            muscleGroups: ["Quads"],
            sets: [
              createSet({ setNumber: 1, setType: "normal" }),
              createSet({ setNumber: 2, setType: "normal" }),
            ],
          }),
        ],
      }),
    ];
    const s = computeWeeklyMuscleStats(sessions, WEEK);
    expect(s.isEmpty).toBe(false);
    expect(s.statusCounts.growing).toBeGreaterThan(0);
    expect(s.groups.some((g) => g.id === "legs")).toBe(true);
    const legs = s.groups.find((g) => g.id === "legs");
    expect(legs?.muscles.length).toBeGreaterThan(0);
    expect(legs?.totalSets).toBeGreaterThan(0);
  });

  it("exposes bucket and breakdown aligned with selected week", () => {
    const sessions = [
      createSession({
        startDate: "2024-01-02T12:00:00",
        exercises: [
          createExercise({
            name: "Squat",
            sets: [createSet({ setNumber: 1, setType: "normal" })],
          }),
        ],
      }),
    ];
    const s = computeWeeklyMuscleStats(sessions, WEEK);
    expect(s.bucket.weekStart).toBe(WEEK);
    expect(s.bucket.muscles.quads.sets).toBe(1);
    expect(s.dailyBreakdown).toHaveLength(7);
  });
});

describe("buildMuscleExerciseRows", () => {
  it("aggregates by exercise name and sorts by total sets", () => {
    const sessions = [
      createSession({
        startDate: "2024-01-02T12:00:00",
        exercises: [
          createExercise({
            name: "Squat",
            sets: [
              createSet({ setNumber: 1, setType: "normal" }),
              createSet({ setNumber: 2, setType: "normal" }),
            ],
          }),
          createExercise({
            name: "Leg Press",
            sets: [createSet({ setNumber: 1, setType: "normal" })],
          }),
        ],
      }),
    ];
    const breakdown = dailyMuscleSetsForWeek(sessions, WEEK);
    const quadsSets = breakdown.reduce((acc, d) => acc + d.muscles.quads.sets, 0);
    const rows = buildMuscleExerciseRows("quads", breakdown, quadsSets);
    expect(rows.length).toBeGreaterThanOrEqual(2);
    expect(rows[0]!.totalSets).toBeGreaterThanOrEqual(rows[1]!.totalSets);
    expect(rows.every((r) => r.pctOfTotal >= 0 && r.pctOfTotal <= 100)).toBe(
      true,
    );
  });
});
