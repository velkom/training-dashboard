"use client";

import { useState } from "react";

import { ChevronDown, ChevronUp } from "lucide-react";

import type { UnmappedExercise } from "@/lib/workout-stats";

export type UnmappedExercisesListProps = {
  exercises: UnmappedExercise[];
};

export function UnmappedExercisesList({
  exercises,
}: UnmappedExercisesListProps) {
  const [open, setOpen] = useState(false);
  const totalSets = exercises.reduce((acc, e) => acc + e.sets, 0);

  return (
    <div className="rounded-xl border border-border/50 bg-card">
      <button
        type="button"
        className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs text-muted-foreground transition-[background-color] duration-150 hover:bg-foreground/[0.03]"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="font-medium">
          {exercises.length} unmapped exercise{exercises.length === 1 ? "" : "s"}{" "}
          <span className="tabular-nums">({totalSets} sets not counted)</span>
        </span>
        {open ? (
          <ChevronUp className="size-4 shrink-0 opacity-60" aria-hidden />
        ) : (
          <ChevronDown className="size-4 shrink-0 opacity-60" aria-hidden />
        )}
      </button>
      {open ? (
        <div className="border-t border-border/50 px-3.5 py-3 text-xs text-muted-foreground">
          <p className="mb-2">
            These exercises are not in the curated muscle map and have no
            structured import data. Their sets do not count toward any muscle.
          </p>
          <ul className="space-y-1">
            {exercises.map((ex) => (
              <li key={ex.name} className="flex items-baseline justify-between gap-2">
                <span className="min-w-0 truncate">{ex.name}</span>
                <span className="shrink-0 tabular-nums">
                  {ex.sets} set{ex.sets === 1 ? "" : "s"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
