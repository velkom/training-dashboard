import type { UserId, WorkoutSession } from "@/types";

/**
 * Persistence abstraction. Swap `LocalWorkoutRepository` for Supabase later.
 */
export type WorkoutRepository = {
  getSessions: (userId?: UserId | "all") => Promise<WorkoutSession[]>;
  addSessions: (
    sessions: WorkoutSession[],
  ) => Promise<{ added: number; skipped: number }>;
  getExerciseNames: (userId?: UserId | "all") => Promise<string[]>;
  updateSession: (session: WorkoutSession) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  clear: () => Promise<void>;
};
