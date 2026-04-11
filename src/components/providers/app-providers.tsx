"use client";

import { useEffect } from "react";

import { Toaster } from "@/components/ui/sonner";
import { useWorkoutStore } from "@/hooks/use-workouts";

/**
 * Root client providers. Extend with SupabaseSessionProvider / RevenueCat when ready.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  const refresh = useWorkoutStore((s) => s.refresh);

  useEffect(() => {
    useWorkoutStore.persist.rehydrate();
    void refresh();
  }, [refresh]);

  return (
    <>
      {children}
      <Toaster richColors position="top-center" />
    </>
  );
}
