"use client";

import { MUSCLE_CATEGORIES, MUSCLE_LABELS, type MuscleId } from "@/lib/muscles";
import { cn } from "@/lib/utils";

type MuscleMultiSelectProps = {
  selected: MuscleId[];
  onChange: (selected: MuscleId[]) => void;
  exclude?: MuscleId[];
  label: string;
};

export function MuscleMultiSelect({
  selected,
  onChange,
  exclude = [],
  label,
}: MuscleMultiSelectProps) {
  const excludeSet = new Set(exclude);
  const selectedSet = new Set(selected);

  function toggle(id: MuscleId): void {
    if (excludeSet.has(id)) return;
    const next = new Set(selectedSet);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange([...next]);
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <div className="space-y-2.5">
        {MUSCLE_CATEGORIES.map((cat) => (
          <div key={cat.id}>
            <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {cat.id === "upper_push"
                ? "Push"
                : cat.id === "upper_pull"
                  ? "Pull"
                  : cat.id === "core"
                    ? "Core"
                    : "Legs"}
            </p>
            <div className="flex flex-wrap gap-1">
              {cat.muscles.map((id) => {
                const isExcluded = excludeSet.has(id);
                const isOn = selectedSet.has(id);
                return (
                  <button
                    key={id}
                    type="button"
                    disabled={isExcluded}
                    aria-pressed={isExcluded ? undefined : isOn}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggle(id);
                    }}
                    className={cn(
                      "inline-flex shrink-0 cursor-pointer select-none items-center rounded-full border px-2 py-0.5 text-[11px] font-medium transition-colors",
                      "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none",
                      isExcluded &&
                        "cursor-not-allowed border-border/40 opacity-40",
                      !isExcluded &&
                        !isOn &&
                        "border-border/60 bg-transparent text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground",
                      !isExcluded &&
                        isOn &&
                        "border-primary/40 bg-primary/15 text-primary hover:bg-primary/25",
                    )}
                  >
                    {MUSCLE_LABELS[id]}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
