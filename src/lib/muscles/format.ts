import type { TrainingStatus } from "./constants";

export type StatusColorClasses = {
  text: string;
  bg: string;
  border: string;
  dot: string;
  barFill: string;
};

/** Tailwind class bundles for muscle training status (cards, bars, dots). */
export function statusColorClasses(status: TrainingStatus): StatusColorClasses {
  switch (status) {
    case "growing":
      return {
        text: "text-fitness-growing border-fitness-growing/40 bg-fitness-growing/10",
        bg: "bg-fitness-growing/10",
        border: "border-fitness-growing/40",
        dot: "size-2 shrink-0 rounded-full bg-fitness-growing shadow-[0_0_6px_var(--color-fitness-growing)]/20",
        barFill: "bg-fitness-growing/80",
      };
    case "maintaining":
      return {
        text: "text-fitness-maintaining border-fitness-maintaining/40 bg-fitness-maintaining/10",
        bg: "bg-fitness-maintaining/10",
        border: "border-fitness-maintaining/40",
        dot: "size-2 shrink-0 rounded-full bg-fitness-maintaining shadow-[0_0_6px_var(--color-fitness-maintaining)]/20",
        barFill: "bg-fitness-maintaining/80",
      };
    case "under":
      return {
        text: "text-fitness-under border-fitness-under/40 bg-fitness-under/10",
        bg: "bg-fitness-under/10",
        border: "border-fitness-under/40",
        dot: "size-2 shrink-0 rounded-full bg-fitness-under shadow-[0_0_6px_var(--color-fitness-under)]/20",
        barFill: "bg-fitness-under/70",
      };
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function statusSortKey(status: TrainingStatus): number {
  switch (status) {
    case "under":
      return 0;
    case "maintaining":
      return 1;
    case "growing":
      return 2;
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function formatSets(sets: number): string {
  return String(Math.round(sets));
}
