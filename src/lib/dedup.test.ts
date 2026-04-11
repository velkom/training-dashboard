import { describe, expect, it } from "vitest";

import {
  assignSessionIds,
  buildSessionDedupKey,
  hashDedupKey,
} from "@/lib/dedup";

describe("buildSessionDedupKey", () => {
  it("joins fields with pipe separators", () => {
    expect(
      buildSessionDedupKey("ilya", "2024-01-01T10:00:00.000Z", "Squat", 12),
    ).toBe("ilya|2024-01-01T10:00:00.000Z|Squat|12");
  });
});

describe("hashDedupKey", () => {
  it("returns deterministic w-prefixed hex for the same key", () => {
    const key = "nastya|2023-06-15T12:00:00.000Z|Bench|8";
    expect(hashDedupKey(key)).toBe(hashDedupKey(key));
    expect(hashDedupKey(key)).toMatch(/^w[0-9a-f]{8}$/);
  });
});

describe("assignSessionIds", () => {
  it("assigns stable ids from session fingerprint", () => {
    const sessions = assignSessionIds([
      {
        userId: "ilya",
        name: "Leg day",
        startDate: "2024-01-01T10:00:00.000Z",
        durationSeconds: 3600,
        exercises: [
          {
            name: "Squat",
            position: 0,
            muscleGroups: ["quads"],
            sets: [
              {
                setNumber: 1,
                weight: 100,
                reps: 5,
                setType: "normal",
              },
            ],
          },
        ],
      },
    ]);
    expect(sessions).toHaveLength(1);
    expect(sessions[0]!.id).toMatch(/^w[0-9a-f]{8}$/);
    const again = assignSessionIds([
      {
        userId: "ilya",
        name: "Other name",
        startDate: "2024-01-01T10:00:00.000Z",
        durationSeconds: 1,
        exercises: [
          {
            name: "Squat",
            position: 0,
            muscleGroups: [],
            sets: [{ setNumber: 1, setType: "normal" }],
          },
        ],
      },
    ]);
    expect(again[0]!.id).toBe(sessions[0]!.id);
  });
});
