import type { UserId, WorkoutSession } from "@/types";

/**
 * Builds a stable fingerprint for deduplication (same logic as session `id`).
 */
export function buildSessionDedupKey(
  userId: UserId,
  startDate: string,
  firstExerciseName: string,
  totalSets: number,
): string {
  return `${userId}|${startDate}|${firstExerciseName}|${totalSets}`;
}

/**
 * Deterministic short hash for browser-safe dedup ids.
 */
export function hashDedupKey(key: string): string {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `w${(h >>> 0).toString(16).padStart(8, "0")}`;
}

export function assignSessionIds(
  sessions: Omit<WorkoutSession, "id">[],
): WorkoutSession[] {
  return sessions.map((s) => {
    const first = s.exercises[0]?.name ?? "";
    const totalSets = s.exercises.reduce(
      (acc, ex) => acc + ex.sets.length,
      0,
    );
    const key = buildSessionDedupKey(
      s.userId,
      s.startDate,
      first,
      totalSets,
    );
    return { ...s, id: hashDedupKey(key) };
  });
}
