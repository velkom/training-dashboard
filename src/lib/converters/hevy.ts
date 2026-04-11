import type { UserId } from "@/types";

import { parseHevyCsv } from "./hevy-csv";
import type { WorkoutConverter } from "./types";

export const hevyConverter: WorkoutConverter = {
  id: "hevy",
  name: "Hevy (CSV)",
  detect(input: File | File[]) {
    const files = Array.isArray(input) ? input : [input];
    const hasJson = files.some((f) => f.name.toLowerCase().endsWith(".json"));
    if (hasJson) return false;
    const csvs = files.filter((f) => f.name.toLowerCase().endsWith(".csv"));
    return csvs.length > 0 && files.every((f) => f.name.toLowerCase().endsWith(".csv"));
  },
  async convert(input: File | File[], userId: UserId) {
    const files = Array.isArray(input) ? input : [input];
    const file = files.find((f) => f.name.toLowerCase().endsWith(".csv"));
    if (!file) return { sessions: [] };

    const text = await file.text();
    return parseHevyCsv(text, userId);
  },
};
