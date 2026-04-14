# Task: Show primary vs secondary exercise contribution in muscle detail panel

## Problem

When you expand a muscle row (e.g. Triceps), you see exercises like "Conversing chest press" — a chest exercise. This is confusing because the user thinks "why is a chest exercise under my triceps?" The answer is that chest press contributes secondary sets to triceps (counted at 0.5×), but the UI gives no indication of this. All exercises look the same regardless of whether they're a direct exercise for that muscle or an indirect contributor.

## Solution overview

Thread primary/secondary role information from the allocation layer through the data pipeline to the UI, then visually separate the two groups in the muscle detail panel.

## Visual target

When expanding a muscle (e.g. Triceps at 9 sets):

```
┌─────────────────────────────────────────────────────────┐
│  DIRECT EXERCISES                          6 sets (67%) │
│                                                         │
│  Cable Triceps Pushdown                 33% of week     │
│  Wed · 2 sets                                           │
│  ████████████████░░░░░░░░░░░░░░░░░░░░                   │
│                                                         │
│  Cable Rope Triceps Pushdown            17% of week     │
│  Wed · 1 set                                            │
│  ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░                   │
│                                                         │
│  SECONDARY CONTRIBUTION                    3 sets (33%) │
│  Counted at 50% — these exercises target other muscles  │
│                                                         │
│  Conversing Chest Press                 17% of week     │
│  Mon · 2 sets (4 actual × 0.5)                          │
│  ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░   muted bar      │
│                                                         │
│  Barbell Bench Press                    17% of week     │
│  Fri · 2 sets (4 actual × 0.5)                          │
│  ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░   muted bar      │
│                                                         │
│  Incline Barbell Bench Press            11% of week     │
│  Wed · 1 set (2 actual × 0.5)                           │
│  ██████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░   muted bar      │
│                                                         │
│  ↑ Add ~2 more sets to reach solid growth stimulus      │
└─────────────────────────────────────────────────────────┘
```

## Changes required — data layer

### 1. Add `role` to `DailyMuscleDayExercise`

**File:** `src/lib/workout-stats/muscle-week-stats.ts`

Current type:
```typescript
export type DailyMuscleDayExercise = { name: string; weightedSets: number };
```

Change to:
```typescript
export type DailyMuscleDayExercise = {
  name: string;
  weightedSets: number;
  /** Whether this muscle is a primary or secondary target of the exercise */
  role: "primary" | "secondary";
};
```

### 2. Pass `role` through `addExerciseToMuscleDayCell`

**File:** `src/lib/workout-stats/muscle-week-stats.ts`

Update the function signature:
```typescript
function addExerciseToMuscleDayCell(
  cell: DailyMuscleDayCell,
  exerciseName: string,
  weightedSets: number,
  role: "primary" | "secondary",
): void {
  cell.sets += weightedSets;
  const existing = cell.exercises.find((e) => e.name === exerciseName);
  if (existing) {
    existing.weightedSets += weightedSets;
    // If it appears as both primary and secondary, keep primary (it's the stronger relationship)
    if (role === "primary") existing.role = "primary";
  } else {
    cell.exercises.push({ name: exerciseName, weightedSets, role });
  }
}
```

### 3. Thread role from allocation results in `dailyMuscleSetsForWeek`

**File:** `src/lib/workout-stats/muscle-week-stats.ts`

The function currently calls `resolveMuscleAllocations(ex)` which returns `MuscleAllocation[]` — but `MuscleAllocation` only has `{ muscle, weightedSets }`, not the role.

Option A (simpler — recommended): Look up the exercise map entry to determine role. The allocation already uses `SECONDARY_SET_WEIGHT = 0.5`, so if `weightedSets < workingSets`, it's secondary.

In `dailyMuscleSetsForWeek`, change the inner loop:

```typescript
for (const ex of s.exercises) {
  const allocs = resolveMuscleAllocations(ex, userMappings);
  if (allocs.length === 0) continue;
  const workingSets = countWorkingSets(ex);
  for (const { muscle, weightedSets } of allocs) {
    const cell = row.muscles[muscle];
    if (!cell) continue;
    // If weightedSets < workingSets, this muscle got a reduced share → it's secondary
    const role: "primary" | "secondary" =
      workingSets > 0 && weightedSets < workingSets ? "secondary" : "primary";
    addExerciseToMuscleDayCell(cell, ex.name, weightedSets, role);
  }
}
```

This heuristic works because:
- Primary muscles get `weightedSets = workingSets` (1.0×)
- Secondary muscles get `weightedSets = workingSets × 0.5`
- So `weightedSets < workingSets` reliably identifies secondary contribution

### 4. Add `role` and `actualSets` to `ExerciseWeekRow`

**File:** `src/lib/workout-stats/weekly-muscle-stats-view.ts`

```typescript
export type ExerciseWeekRow = {
  name: string;
  totalSets: number;
  dayEntries: { dayLabel: string; sets: number }[];
  pctOfTotal: number;
  role: "primary" | "secondary";
  /** For secondary exercises: the actual working sets before the 0.5× multiplier */
  actualSets?: number;
};
```

In `buildMuscleExerciseRows`, propagate role from the daily breakdown data:

```typescript
export function buildMuscleExerciseRows(
  muscle: MuscleId,
  dailyBreakdown: DailyMuscleBreakdown,
  muscleWeeklySets: number,
): ExerciseWeekRow[] {
  const byName = new Map<
    string,
    {
      totalSets: number;
      dayEntries: { dayLabel: string; sets: number }[];
      role: "primary" | "secondary";
    }
  >();

  for (const day of dailyBreakdown) {
    const cell = day.muscles[muscle];
    if (cell.sets <= 0) continue;
    for (const ex of cell.exercises) {
      const existing = byName.get(ex.name);
      if (existing) {
        existing.totalSets += ex.weightedSets;
        existing.dayEntries.push({
          dayLabel: day.dayLabel,
          sets: ex.weightedSets,
        });
        // Keep primary if ever seen as primary
        if (ex.role === "primary") existing.role = "primary";
      } else {
        byName.set(ex.name, {
          totalSets: ex.weightedSets,
          dayEntries: [{ dayLabel: day.dayLabel, sets: ex.weightedSets }],
          role: ex.role,
        });
      }
    }
  }

  const total = muscleWeeklySets > 0 ? muscleWeeklySets : 1;
  const rows: ExerciseWeekRow[] = [...byName.entries()].map(([name, data]) => {
    const row: ExerciseWeekRow = {
      name,
      totalSets: data.totalSets,
      dayEntries: data.dayEntries,
      pctOfTotal: (data.totalSets / total) * 100,
      role: data.role,
    };
    // For secondary: compute actual (pre-multiplier) sets
    if (data.role === "secondary") {
      row.actualSets = Math.round(data.totalSets / SECONDARY_SET_WEIGHT);
    }
    return row;
  });

  // Sort: primary first (sorted by sets desc), then secondary (sorted by sets desc)
  rows.sort((a, b) => {
    if (a.role !== b.role) return a.role === "primary" ? -1 : 1;
    return b.totalSets - a.totalSets;
  });
  return rows;
}
```

Import `SECONDARY_SET_WEIGHT` from `@/lib/muscles`.

## Changes required — UI layer

### 5. Update `MuscleExerciseDetail` component

**File:** `src/components/dashboard/growth/muscle-detail.tsx`

Split the exercise list into two groups with section headers:

```tsx
const primaryRows = rows.filter((r) => r.role === "primary");
const secondaryRows = rows.filter((r) => r.role === "secondary");
const primaryTotalSets = primaryRows.reduce((sum, r) => sum + r.totalSets, 0);
const secondaryTotalSets = secondaryRows.reduce((sum, r) => sum + r.totalSets, 0);
```

Render structure:

```tsx
<div className="space-y-3 text-xs">
  {/* ── Primary exercises ── */}
  {primaryRows.length > 0 && (
    <div>
      {secondaryRows.length > 0 && (
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Direct exercises
          </span>
          <span className="text-[10px] tabular-nums text-muted-foreground">
            {formatSets(primaryTotalSets)} sets · {Math.round((primaryTotalSets / muscleWeeklySets) * 100)}%
          </span>
        </div>
      )}
      <ul className="space-y-3">
        {primaryRows.map((row) => (
          <ExerciseRow key={row.name} row={row} />
        ))}
      </ul>
    </div>
  )}

  {/* ── Secondary exercises ── */}
  {secondaryRows.length > 0 && (
    <div className="mt-4 border-t border-border/40 pt-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Secondary contribution
        </span>
        <span className="text-[10px] tabular-nums text-muted-foreground">
          {formatSets(secondaryTotalSets)} sets · {Math.round((secondaryTotalSets / muscleWeeklySets) * 100)}%
        </span>
      </div>
      <p className="mb-3 text-[10px] text-muted-foreground">
        Counted at 50% — these exercises primarily target other muscles
      </p>
      <ul className="space-y-3">
        {secondaryRows.map((row) => (
          <ExerciseRow key={row.name} row={row} isSecondary />
        ))}
      </ul>
    </div>
  )}

  {/* nudge hints stay as-is below */}
</div>
```

### 6. Extract `ExerciseRow` sub-component

Either inline or extract a small helper inside `muscle-detail.tsx`:

```tsx
function ExerciseRow({ row, isSecondary = false }: { row: ExerciseWeekRow; isSecondary?: boolean }) {
  return (
    <li className="space-y-1.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
        <span className={cn(
          "min-w-0 font-semibold",
          isSecondary ? "text-muted-foreground" : "text-foreground"
        )}>
          {row.name}
        </span>
        <span className="shrink-0 tabular-nums text-muted-foreground">
          {Math.round(row.pctOfTotal)}% of week
        </span>
      </div>
      <p className="text-muted-foreground">
        {row.dayEntries
          .map((d) => {
            const setsLabel = `${formatSets(d.sets)} set${Math.round(d.sets) === 1 ? "" : "s"}`;
            if (isSecondary && row.actualSets != null) {
              // Show the actual→effective breakdown for secondary
              const actualPerDay = Math.round(d.sets / SECONDARY_SET_WEIGHT);
              return `${d.dayLabel} · ${setsLabel} (${actualPerDay} actual × 0.5)`;
            }
            return `${d.dayLabel} · ${setsLabel}`;
          })
          .join(", ")}
      </p>
      <div className="h-1 w-full overflow-hidden rounded-full bg-muted/70">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-200 ease-out",
            isSecondary ? "bg-muted-foreground/30" : "bg-primary/75"
          )}
          style={{ width: `${Math.min(100, row.pctOfTotal)}%` }}
        />
      </div>
    </li>
  );
}
```

Key visual differences for secondary exercises:
- Exercise name uses `text-muted-foreground` instead of `text-foreground` (dimmer)
- Day entries show `(4 actual × 0.5)` to explain the math
- Progress bar uses `bg-muted-foreground/30` (gray) instead of `bg-primary/75` (colored) — visually signals "this isn't the main thing"
- The "DIRECT EXERCISES" / "SECONDARY CONTRIBUTION" section headers only appear when BOTH groups exist. If all exercises are primary, no headers needed — keep it clean.

Import `SECONDARY_SET_WEIGHT` from `@/lib/muscles` and `formatSets` from `@/lib/muscles` (already imported).

### 7. Update the progress bar in the muscle row (optional but recommended)

**File:** `src/components/dashboard/growth/progress-bar.tsx`

Consider showing a segmented bar where the primary portion is the main status color and the secondary portion is the same color but dimmer/striped. This gives a quick visual read even before expanding.

This is optional — skip if it adds too much complexity. The expanded detail is the primary improvement.

## Files modified (summary)

| File | Change |
|------|--------|
| `src/lib/workout-stats/muscle-week-stats.ts` | Add `role` to `DailyMuscleDayExercise`, pass through pipeline |
| `src/lib/workout-stats/weekly-muscle-stats-view.ts` | Add `role` + `actualSets` to `ExerciseWeekRow`, sort primary-first |
| `src/components/dashboard/growth/muscle-detail.tsx` | Split exercise list into primary/secondary groups, visual differentiation |

## What NOT to change

- `src/lib/muscles/constants.ts` — no type changes
- `src/lib/muscles/allocation.ts` — allocation logic stays exactly the same
- `src/lib/muscles/exercise-map.ts` — exercise map stays the same
- No new dependencies
- The growth summary ring, status dots, summary pills, category headers — all unchanged
- The overall sets count per muscle stays the same (secondary sets are still counted in the total)

## Tests to add/update

- Update `src/lib/workout-stats/weekly-muscle-stats-view.test.ts` — verify `ExerciseWeekRow` now has correct `role` field
- Add a test in `muscle-week-stats.test.ts` verifying that `DailyMuscleDayExercise` carries `role: "secondary"` for exercises where the muscle is a secondary target
- Test edge case: exercise that appears as both primary and secondary for the same muscle across different days should resolve to `"primary"`

## Verification

1. `npm run build` — zero errors
2. `npm run test` — all pass (update snapshots if any)
3. Expand Triceps → should see "Cable Triceps Pushdown" under Direct, "Conversing Chest Press" under Secondary
4. Expand Glutes → "Hip Thrust" under Direct, "Squat" / "Leg Press" under Secondary (if they contribute secondary glute sets)
5. Expand Chest → all exercises should be Direct (no secondary section shown), no section headers
6. Verify the `(4 actual × 0.5)` math is correct for secondary exercises
