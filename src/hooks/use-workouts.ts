"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import { getWorkoutRepository } from "@/lib/storage";
import type { UserFilter } from "@/lib/workout-stats";
import type { WorkoutSession } from "@/types";

type WorkoutStore = {
  selectedUser: UserFilter;
  sessions: WorkoutSession[];
  hasLoaded: boolean;
  setSelectedUser: (user: UserFilter) => void;
  refresh: () => Promise<void>;
  addImported: (
    sessions: WorkoutSession[],
  ) => Promise<{ added: number; skipped: number }>;
  updateSession: (session: WorkoutSession) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  clearAllSessions: () => Promise<void>;
};

/**
 * Global workout state + user filter. Sessions live in {@link getWorkoutRepository}.
 */
export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set, get) => ({
      selectedUser: "all",
      sessions: [],
      hasLoaded: false,
      setSelectedUser: (selectedUser) => set({ selectedUser }),
      refresh: async () => {
        const repo = getWorkoutRepository();
        const sessions = await repo.getSessions("all");
        set({ sessions, hasLoaded: true });
      },
      addImported: async (sessions) => {
        const repo = getWorkoutRepository();
        const result = await repo.addSessions(sessions);
        await get().refresh();
        return result;
      },
      updateSession: async (session) => {
        await getWorkoutRepository().updateSession(session);
        await get().refresh();
      },
      deleteSession: async (id) => {
        await getWorkoutRepository().deleteSession(id);
        await get().refresh();
      },
      clearAllSessions: async () => {
        await getWorkoutRepository().clear();
        await get().refresh();
      },
    }),
    {
      name: "training-dashboard:user",
      partialize: (state) => ({ selectedUser: state.selectedUser }),
    },
  ),
);

export function useSelectedUser(): UserFilter {
  return useWorkoutStore((s) => s.selectedUser);
}

export function useWorkoutSessions(): WorkoutSession[] {
  return useWorkoutStore((s) => s.sessions);
}
