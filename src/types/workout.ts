/**
 * Core domain types for normalized workouts across all import sources.
 */

export type UserId = "ilya" | "nastya";

export type WorkoutSetType =
  | "normal"
  | "warmup"
  | "dropset"
  | "left"
  | "right"
  | "failure";

export type WorkoutSet = {
  setNumber: number;
  /** Weight in kilograms */
  weight?: number;
  reps?: number;
  distance?: number;
  /** Duration in seconds */
  time?: number;
  setType: WorkoutSetType;
  oneRepMax?: number;
};

export type WorkoutExercise = {
  name: string;
  position: number;
  muscleGroups: string[];
  sets: WorkoutSet[];
};

export type WorkoutSession = {
  /** Deterministic id used for deduplication */
  id: string;
  userId: UserId;
  name: string;
  startDate: string;
  endDate?: string;
  durationSeconds: number;
  exercises: WorkoutExercise[];
};
