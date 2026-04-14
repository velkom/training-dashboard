"use client";

import { useEffect } from "react";

import { Toaster } from "@/components/ui/sonner";
import { useUserExerciseMappingsStore } from "@/stores/user-exercise-mappings";
import { useWorkoutStore } from "@/stores/workout-store";

/**
 * Root client providers. Extend with SupabaseSessionProvider / RevenueCat when ready.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  const refresh = useWorkoutStore((s) => s.refresh);

  useEffect(() => {
    useWorkoutStore.persist.rehydrate();
    useUserExerciseMappingsStore.persist.rehydrate();
    void refresh();
  }, [refresh]);

  return (
    <>
      {children}
      <Toaster richColors position="top-center" />
    </>
  );
}
