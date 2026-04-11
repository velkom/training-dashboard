import { describe, expect, it } from "vitest";

import { filterSessions } from "@/lib/workout-stats";
import type { WorkoutSession } from "@/types";

const baseSession = (overrides: Partial<WorkoutSession>): WorkoutSession => ({
  id: "w00000001",
  userId: "ilya",
  name: "Test",
  startDate: "2024-01-01T10:00:00.000Z",
  durationSeconds: 0,
  exercises: [],
  ...overrides,
});

describe("filterSessions", () => {
  const sessions: WorkoutSession[] = [
    baseSession({ id: "a", userId: "ilya" }),
    baseSession({ id: "b", userId: "nastya" }),
  ];

  it('returns all sessions when user is "all"', () => {
    expect(filterSessions(sessions, "all")).toEqual(sessions);
  });

  it("filters by userId", () => {
    expect(filterSessions(sessions, "nastya")).toEqual([sessions[1]]);
  });
});
