import type { WorkoutSession } from "@/types";

import type { WorkoutRepository } from "./types";

const STORAGE_KEY = "training-dashboard:sessions:v1";

function readAll(): WorkoutSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as WorkoutSession[];
  } catch {
    return [];
  }
}

function writeAll(sessions: WorkoutSession[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function createLocalWorkoutRepository(): WorkoutRepository {
  return {
    async getSessions(userId) {
      const all = readAll();
      if (!userId || userId === "all") return all;
      return all.filter((s) => s.userId === userId);
    },

    async addSessions(sessions) {
      const existing = readAll();
      const existingIds = new Set(existing.map((s) => s.id));
      let added = 0;
      let skipped = 0;
      const merged = [...existing];
      for (const s of sessions) {
        if (existingIds.has(s.id)) {
          skipped += 1;
          continue;
        }
        existingIds.add(s.id);
        merged.push(s);
        added += 1;
      }
      merged.sort(
        (a, b) =>
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
      );
      writeAll(merged);
      return { added, skipped };
    },

    async getExerciseNames(userId) {
      const sessions = await this.getSessions(userId);
      const names = new Set<string>();
      for (const s of sessions) {
        for (const ex of s.exercises) {
          names.add(ex.name);
        }
      }
      return [...names].sort((a, b) => a.localeCompare(b));
    },

    async updateSession(session) {
      const all = readAll();
      const idx = all.findIndex((s) => s.id === session.id);
      if (idx === -1) return;
      const next = [...all];
      next[idx] = session;
      next.sort(
        (a, b) =>
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
      );
      writeAll(next);
    },

    async deleteSession(id) {
      writeAll(readAll().filter((s) => s.id !== id));
    },

    async clear() {
      writeAll([]);
    },
  };
}
