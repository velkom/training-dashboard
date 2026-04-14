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
    case "insufficient":
      return {
        text: "text-fitness-insufficient border-fitness-insufficient/40 bg-fitness-insufficient/10",
        bg: "bg-fitness-insufficient/10",
        border: "border-fitness-insufficient/40",
        dot: "size-2 shrink-0 rounded-full bg-fitness-insufficient shadow-[0_0_6px_var(--color-fitness-insufficient)]/20",
        barFill: "bg-fitness-insufficient/70",
      };
    case "minimal":
      return {
        text: "text-fitness-minimal border-fitness-minimal/40 bg-fitness-minimal/10",
        bg: "bg-fitness-minimal/10",
        border: "border-fitness-minimal/40",
        dot: "size-2 shrink-0 rounded-full bg-fitness-minimal shadow-[0_0_6px_var(--color-fitness-minimal)]/20",
        barFill: "bg-fitness-minimal/80",
      };
    case "solid":
      return {
        text: "text-fitness-solid border-fitness-solid/40 bg-fitness-solid/10",
        bg: "bg-fitness-solid/10",
        border: "border-fitness-solid/40",
        dot: "size-2 shrink-0 rounded-full bg-fitness-solid shadow-[0_0_6px_var(--color-fitness-solid)]/20",
        barFill: "bg-fitness-solid/80",
      };
    case "high":
      return {
        text: "text-fitness-high border-fitness-high/40 bg-fitness-high/10",
        bg: "bg-fitness-high/10",
        border: "border-fitness-high/40",
        dot: "size-2 shrink-0 rounded-full bg-fitness-high shadow-[0_0_6px_var(--color-fitness-high)]/20",
        barFill: "bg-fitness-high/80",
      };
    case "very_high":
      return {
        text: "text-fitness-very-high border-fitness-very-high/40 bg-fitness-very-high/10",
        bg: "bg-fitness-very-high/10",
        border: "border-fitness-very-high/40",
        dot: "size-2 shrink-0 rounded-full bg-fitness-very-high shadow-[0_0_6px_var(--color-fitness-very-high)]/20",
        barFill: "bg-fitness-very-high/80",
      };
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function statusSortKey(status: TrainingStatus): number {
  switch (status) {
    case "insufficient":
      return 0;
    case "minimal":
      return 1;
    case "solid":
      return 2;
    case "high":
      return 3;
    case "very_high":
      return 4;
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function formatSets(sets: number): string {
  return String(Math.round(sets));
}
