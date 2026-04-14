"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { MuscleMapEntry } from "@/lib/muscles";

export type UserExerciseMappingsStore = {
  /**
   * Key: normalized exercise name (via `normalizeExerciseName`)
   * Value: primary / secondary muscle ids
   */
  mappings: Record<string, MuscleMapEntry>;
  setMapping: (normalizedName: string, entry: MuscleMapEntry) => void;
  removeMapping: (normalizedName: string) => void;
  clearAll: () => void;
};

export const useUserExerciseMappingsStore = create<UserExerciseMappingsStore>()(
  persist(
    (set) => ({
      mappings: {},
      setMapping: (normalizedName, entry) =>
        set((state) => ({
          mappings: { ...state.mappings, [normalizedName]: entry },
        })),
      removeMapping: (normalizedName) =>
        set((state) => {
          const next = { ...state.mappings };
          delete next[normalizedName];
          return { mappings: next };
        }),
      clearAll: () => set({ mappings: {} }),
    }),
    {
      name: "training-dashboard:user-exercise-mappings",
      partialize: (state) => ({ mappings: state.mappings }),
      skipHydration: true,
    },
  ),
);
