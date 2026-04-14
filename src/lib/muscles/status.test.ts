import { describe, expect, it } from "vitest";

import { statusFromWeeklySets } from "@/lib/muscles";

describe("statusFromWeeklySets", () => {
  it("returns insufficient below minimal zone", () => {
    expect(statusFromWeeklySets(0)).toBe("insufficient");
    expect(statusFromWeeklySets(3)).toBe("insufficient");
    expect(statusFromWeeklySets(5)).toBe("insufficient");
    expect(statusFromWeeklySets(5.9)).toBe("insufficient");
  });

  it("returns minimal from 6 through below solid", () => {
    expect(statusFromWeeklySets(6)).toBe("minimal");
    expect(statusFromWeeklySets(7.5)).toBe("minimal");
    expect(statusFromWeeklySets(9)).toBe("minimal");
    expect(statusFromWeeklySets(9.9)).toBe("minimal");
  });

  it("returns solid from 10 through below high", () => {
    expect(statusFromWeeklySets(10)).toBe("solid");
    expect(statusFromWeeklySets(12)).toBe("solid");
    expect(statusFromWeeklySets(14)).toBe("solid");
    expect(statusFromWeeklySets(14.9)).toBe("solid");
  });

  it("returns high from 15 through 20", () => {
    expect(statusFromWeeklySets(15)).toBe("high");
    expect(statusFromWeeklySets(17)).toBe("high");
    expect(statusFromWeeklySets(20)).toBe("high");
  });

  it("returns very_high above 20", () => {
    expect(statusFromWeeklySets(20.1)).toBe("very_high");
    expect(statusFromWeeklySets(21)).toBe("very_high");
    expect(statusFromWeeklySets(30)).toBe("very_high");
  });
});
