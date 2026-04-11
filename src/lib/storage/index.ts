import { createLocalWorkoutRepository } from "./local-repository";
import type { WorkoutRepository } from "./types";

export type { WorkoutRepository } from "./types";

let singleton: WorkoutRepository | null = null;

/**
 * Active persistence implementation. Replace with a Supabase-backed repo later.
 */
export function getWorkoutRepository(): WorkoutRepository {
  if (!singleton) {
    singleton = createLocalWorkoutRepository();
  }
  return singleton;
}
