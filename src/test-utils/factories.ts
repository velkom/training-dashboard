import type {
  WorkoutExercise,
  WorkoutSession,
  WorkoutSet,
  WorkoutSetType,
} from "@/types";

let sessionCounter = 0;

export function createSet(overrides: Partial<WorkoutSet> = {}): WorkoutSet {
  return {
    setNumber: 1,
    setType: "normal" as WorkoutSetType,
    ...overrides,
  };
}

export function createExercise(
  overrides: Partial<WorkoutExercise> & Pick<WorkoutExercise, "name">,
): WorkoutExercise {
  return {
    position: 0,
    muscleGroups: [],
    sets: [],
    ...overrides,
  };
}

export function createSession(
  overrides: Partial<WorkoutSession> = {},
): WorkoutSession {
  sessionCounter += 1;
  return {
    id: `test-session-${sessionCounter}`,
    userId: "ilya",
    name: "Test workout",
    startDate: "2024-01-03T10:00:00.000Z",
    durationSeconds: 3600,
    exercises: [],
    ...overrides,
  };
}
