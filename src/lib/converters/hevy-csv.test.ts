import { describe, expect, it } from "vitest";

import { isBlankCsvRow, parseHevyCsv } from "./hevy-csv";

describe("isBlankCsvRow", () => {
  it("treats all-blank cells as empty", () => {
    expect(
      isBlankCsvRow({
        Title: "",
        Date: "  ",
        Exercise: "null",
      }),
    ).toBe(true);
  });

  it("is false when any cell has content", () => {
    expect(
      isBlankCsvRow({
        Title: "x",
        Date: "",
      }),
    ).toBe(false);
  });
});

describe("parseHevyCsv", () => {
  it("groups by Date column and exercise name Exercise", () => {
    const csv = [
      "Title,Date,Duration,Exercise,Weight,Reps,Set Type",
      'W,"2026-04-10 09:00:00",00:30:00,Squat,100,5,NORMAL_SET',
    ].join("\n");
    const { sessions, parseNotes } = parseHevyCsv(csv, "ilya");
    expect(parseNotes.skippedEmptyRows).toBe(0);
    expect(parseNotes.skippedMissingStartTime).toBe(0);
    expect(sessions).toHaveLength(1);
    expect(sessions[0]!.name).toBe("W");
    expect(sessions[0]!.exercises[0]!.name).toBe("Squat");
    expect(sessions[0]!.exercises[0]!.sets[0]!.weight).toBe(100);
    expect(sessions[0]!.exercises[0]!.sets[0]!.reps).toBe(5);
  });

  it("counts blank rows and rows with invalid dates", () => {
    const csv = [
      "Title,Date,Duration,Exercise,Weight,Reps,Set Type",
      'Ok,"2026-04-10 09:00:00",00:30:00,Press,10,5,NORMAL_SET',
      ",,,,,,",
      'BadDate,"not-a-real-date",00:30:00,Curl,5,5,NORMAL_SET',
    ].join("\n");
    const { sessions, parseNotes } = parseHevyCsv(csv, "nastya");
    expect(parseNotes.skippedEmptyRows).toBe(1);
    expect(parseNotes.skippedMissingStartTime).toBe(1);
    expect(sessions).toHaveLength(1);
    expect(sessions[0]!.exercises[0]!.name).toBe("Press");
  });

  it("uses start_time when present", () => {
    const csv = [
      "title,start_time,exercise_title,weight_kg,reps,set_type",
      'Gym,"2020-06-01T12:00:00.000Z",Deadlift,80,3,NORMAL_SET',
    ].join("\n");
    const { sessions, parseNotes } = parseHevyCsv(csv, "ilya");
    expect(parseNotes.skippedEmptyRows).toBe(0);
    expect(parseNotes.skippedMissingStartTime).toBe(0);
    expect(sessions).toHaveLength(1);
    expect(sessions[0]!.exercises[0]!.name).toBe("Deadlift");
  });
});
