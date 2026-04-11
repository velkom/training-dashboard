import { describe, expect, it } from "vitest";

import { sessionVolumeKg, totalVolumeKg } from "@/lib/workout-stats";
import type { WorkoutSession } from "@/types";

const sessionWithSets = (
  sets: { weight?: number; reps?: number }[],
): WorkoutSession => ({
  id: "w1",
  userId: "ilya",
  name: "Push",
  startDate: "2024-01-02T12:00:00.000Z",
  durationSeconds: 1800,
  exercises: [
    {
      name: "Press",
      position: 0,
      muscleGroups: [],
      sets: sets.map((st, i) => ({
        setNumber: i + 1,
        weight: st.weight,
        reps: st.reps,
        setType: "normal" as const,
      })),
    },
  ],
});

describe("sessionVolumeKg", () => {
  it("sums weight times reps for working sets", () => {
    const s = sessionWithSets([
      { weight: 50, reps: 10 },
      { weight: 60, reps: 5 },
    ]);
    expect(sessionVolumeKg(s)).toBe(50 * 10 + 60 * 5);
  });

  it("ignores sets missing weight or reps", () => {
    const s = sessionWithSets([
      { weight: 40, reps: 8 },
      { weight: undefined, reps: 10 },
      { weight: 20, reps: undefined },
    ]);
    expect(sessionVolumeKg(s)).toBe(40 * 8);
  });
});

describe("totalVolumeKg", () => {
  it("sums volume across sessions", () => {
    const a = sessionWithSets([{ weight: 10, reps: 2 }]);
    const b = sessionWithSets([{ weight: 5, reps: 4 }]);
    expect(totalVolumeKg([a, b])).toBe(20 + 20);
  });
});
