import type { UserId, WorkoutSession } from "@/types";

import type { ImportParseNotes } from "./import-notes";

export type { ImportParseNotes } from "./import-notes";

export type ConverterConvertResult = {
  sessions: WorkoutSession[];
  parseNotes?: ImportParseNotes;
};

/**
 * Converts vendor export files into normalized {@link WorkoutSession} records.
 */
export type WorkoutConverter = {
  /** Human-readable label shown in the import UI */
  name: string;
  /** Unique key for manual format override */
  id: string;
  /**
   * Returns true when this converter should handle the given files.
   * Implementations should be fast (header sniff / filename only).
   */
  detect: (input: File | File[]) => boolean;
  /**
   * Parses files into normalized sessions. Caller supplies `userId`.
   */
  convert: (
    input: File | File[],
    userId: UserId,
  ) => Promise<ConverterConvertResult>;
};

export type { WorkoutSession as NormalizedWorkout } from "@/types";
