import { describe, expect, it } from "vitest";

import {
  SETS_GROWTH_MIN,
  SETS_MAINTENANCE_MIN,
  statusFromWeeklySets,
} from "@/lib/muscles";

describe("statusFromWeeklySets", () => {
  it("returns under below maintenance threshold", () => {
    expect(statusFromWeeklySets(0)).toBe("under");
    expect(statusFromWeeklySets(SETS_MAINTENANCE_MIN - 0.1)).toBe("under");
    expect(statusFromWeeklySets(4.9)).toBe("under");
  });

  it("returns maintaining at maintenance boundary through below growth", () => {
    expect(statusFromWeeklySets(SETS_MAINTENANCE_MIN)).toBe("maintaining");
    expect(statusFromWeeklySets(7)).toBe("maintaining");
    expect(statusFromWeeklySets(SETS_GROWTH_MIN - 0.1)).toBe("maintaining");
    expect(statusFromWeeklySets(9.9)).toBe("maintaining");
  });

  it("returns growing at growth threshold and above", () => {
    expect(statusFromWeeklySets(SETS_GROWTH_MIN)).toBe("growing");
    expect(statusFromWeeklySets(15)).toBe("growing");
    expect(statusFromWeeklySets(20)).toBe("growing");
  });
});
