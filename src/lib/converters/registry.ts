import type { UserId, WorkoutSession } from "@/types";

import { dailyStrengthConverter } from "./daily-strength";
import { hevyConverter } from "./hevy";
import type { WorkoutConverter } from "./types";

/** Order matters: first confident match wins. */
const converters: WorkoutConverter[] = [
  hevyConverter,
  dailyStrengthConverter,
];

export function listConverters(): WorkoutConverter[] {
  return [...converters];
}

export function getConverterById(id: string): WorkoutConverter | undefined {
  return converters.find((c) => c.id === id);
}

/**
 * Picks the first converter whose `detect` returns true.
 */
export function detectConverter(
  input: File | File[],
): WorkoutConverter | undefined {
  return converters.find((c) => c.detect(input));
}

export async function convertWithDetection(
  input: File | File[],
  userId: UserId,
  converterId?: string,
): Promise<{ converter: WorkoutConverter; sessions: WorkoutSession[] }> {
  const byId = converterId ? getConverterById(converterId) : undefined;
  const converter = byId ?? detectConverter(input);
  if (!converter) {
    throw new Error("Unsupported file format. Try CSV (Hevy) or JSON export.");
  }
  const sessions = await converter.convert(input, userId);
  return { converter, sessions };
}
