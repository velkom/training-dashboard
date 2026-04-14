import { describe, expect, it } from "vitest";

import { normalizeExerciseName } from "@/lib/muscles";
import { createExercise, createSession, createSet } from "@/test-utils/factories";

import { analyzeExerciseMappings } from "./exercise-mapping-analysis";

describe("analyzeExerciseMappings", () => {
  it("splits mapped vs unmapped by curated map and counts sets/sessions", () => {
    const sessions = [
      createSession({
        startDate: "2024-01-01T10:00:00.000Z",
        exercises: [
          createExercise({
            name: "Barbell Bench Press",
            sets: [
              createSet({ setNumber: 1, setType: "normal" }),
              createSet({ setNumber: 2, setType: "normal" }),
            ],
          }),
          createExercise({
            name: "Mystery Move",
            sets: [
              createSet({ setNumber: 1, setType: "normal" }),
              createSet({ setNumber: 2, setType: "normal" }),
              createSet({ setNumber: 3, setType: "normal" }),
            ],
          }),
        ],
      }),
      createSession({
        startDate: "2024-01-03T10:00:00.000Z",
        exercises: [
          createExercise({
            name: "Barbell Bench Press",
            sets: [
              createSet({ setNumber: 1, setType: "normal" }),
              createSet({ setNumber: 2, setType: "normal" }),
            ],
          }),
        ],
      }),
    ];

    const r = analyzeExerciseMappings(sessions, {});
    expect(r.mapped.length).toBe(1);
    expect(r.unmapped.length).toBe(1);
    expect(r.totalExerciseTypes).toBe(2);
    expect(r.unmappedSetCount).toBe(3);

    const bench = r.mapped.find((x) => x.name === "Barbell Bench Press");
    expect(bench?.source).toBe("curated_map");
    expect(bench?.totalSets).toBe(4);
    expect(bench?.sessionCount).toBe(2);

    const mystery = r.unmapped[0];
    expect(mystery?.name).toBe("Mystery Move");
    expect(mystery?.totalSets).toBe(3);
    expect(mystery?.sessionCount).toBe(1);
  });

  it("aggregates bench across three sessions for totalSets and sessionCount", () => {
    const mkBench = () =>
      createExercise({
        name: "Barbell Bench Press",
        sets: Array.from({ length: 4 }, (_, i) =>
          createSet({ setNumber: i + 1, setType: "normal" }),
        ),
      });
    const sessions = [
      createSession({ startDate: "2024-01-01T10:00:00.000Z", exercises: [mkBench()] }),
      createSession({ startDate: "2024-01-02T10:00:00.000Z", exercises: [mkBench()] }),
      createSession({ startDate: "2024-01-03T10:00:00.000Z", exercises: [mkBench()] }),
    ];
    const r = analyzeExerciseMappings(sessions, {});
    const bench = r.mapped.find((x) => x.name === "Barbell Bench Press");
    expect(bench?.totalSets).toBe(12);
    expect(bench?.sessionCount).toBe(3);
  });

  it("treats exercise as user-mapped when userMappings entry applies", () => {
    const sessions = [
      createSession({
        startDate: "2024-01-01T10:00:00.000Z",
        exercises: [
          createExercise({
            name: "Totally Unknown Lift",
            sets: [createSet({ setNumber: 1, setType: "normal" })],
          }),
        ],
      }),
    ];
    const key = normalizeExerciseName("Totally Unknown Lift");
    const r = analyzeExerciseMappings(sessions, {
      [key]: { primary: ["chest"], secondary: [] },
    });
    expect(r.unmapped).toHaveLength(0);
    expect(r.mapped).toHaveLength(1);
    expect(r.mapped[0]?.source).toBe("user_mapping");
    expect(r.mapped[0]?.primaryMuscles).toEqual(["chest"]);
  });
});
