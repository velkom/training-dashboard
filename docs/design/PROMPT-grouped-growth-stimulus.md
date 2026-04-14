# Task: Redesign the Weekly Growth Stimulus card

## Visual reference

Open `docs/design/MOCKUP-muscle-growth-v2.html` in a browser — it is the pixel-accurate target. Every design decision below matches that mockup.

## Summary of changes

The current `WeeklyGrowthSummary` is a flat list of muscles with status pills. The redesigned version adds:

1. **Ring gauge** (Apple Fitness style) — shows % of trained muscles in "growing" state
2. **Summary pills** — replace the separate legend + badge with colored pills that are both legend and stats
3. **Category grouping** — muscles grouped into Push / Pull / Core / Legs sections
4. **Elevated surfaces** — each category's muscle rows live inside a raised container
5. **Status dots** — minimal colored dots replace the verbose status pills on each row
6. **Staggered entrance animation** — categories fade in with 60ms stagger on mount / week change

## Files to modify

| File | Action |
|------|--------|
| `src/components/dashboard/weekly-growth-summary.tsx` | Major rewrite (render structure + ring gauge + grouping logic) |

**Do NOT modify** any other file. All data, types, constants, and helpers already exist.

## Existing data you MUST use

From `src/lib/muscle-groups.ts`:
- `MUSCLE_CATEGORIES` — array of `{ id: MuscleCategoryId, label: string, muscles: MuscleId[] }`:
  - `upper_push` → muscles: chest, front_delts, side_delts, triceps
  - `upper_pull` → muscles: upper_back_lats, upper_back_traps, rear_delts, biceps, forearms
  - `core` → muscles: abs, obliques, lower_back
  - `legs` → muscles: quads, hamstrings, glutes, calves
- `MUSCLE_IDS`, `MUSCLE_LABELS`, `statusFromWeeklySets()`, `SETS_GROWTH_MIN`, `SETS_MAINTENANCE_MIN`

From existing component:
- Props: `bucket: WeeklyMuscleBucket`, `dailyBreakdown: DailyMuscleBreakdown`
- Reuse: `MuscleExerciseDetail`, `GrowthProgressBar` internal components
- Reuse: all helper functions (`statusStyles`, `barFillClass`, `formatSets`, `statusSortKey`)

## Detailed spec

### 1. Ring gauge (SVG)

Position: top-left of the card header, to the left of the title.

```tsx
// Calculate percentage
const ringPct = trainedCount > 0 ? (growingCount / trainedCount) * 100 : 0;
const circumference = 100; // use pathLength="100" on the circle
const offset = circumference - ringPct;
```

Structure:
- Outer container: `w-14 h-14 relative flex-shrink-0`
- SVG `viewBox="0 0 36 36"`, `className="rotate-[-90deg]"` (so 0% starts at top)
- Track circle: `r="15.915"`, stroke = `muted/20`, stroke-width = 5, fill = none
- Fill circle: `r="15.915"`, stroke = `fitness-growing`, stroke-width = 5, stroke-linecap = round, `strokeDasharray="100"`, `strokeDashoffset={offset}`, `pathLength={100}`
- Center label: absolutely positioned, shows `{growingCount}/{trainedCount}`, the denominator in smaller muted text
- Animate offset with inline style: `transition: stroke-dashoffset 0.8s cubic-bezier(0.2, 0, 0, 1)`

### 2. Summary pills

Replace both the badge AND the legend with three pills:

```tsx
const statusCounts = useMemo(() => {
  let growing = 0, maintaining = 0, under = 0;
  for (const id of MUSCLE_IDS) {
    const sets = bucket.muscles[id].sets;
    if (sets <= 0) continue;
    const s = statusFromWeeklySets(sets);
    if (s === "growing") growing++;
    else if (s === "maintaining") maintaining++;
    else under++;
  }
  return { growing, maintaining, under };
}, [bucket]);
```

Render as a flex row of rounded pills, each showing count + label. Use the project's fitness color tokens:
- Growing: `text-fitness-growing bg-fitness-growing/8 border border-fitness-growing/20`
- Maintaining: `text-fitness-maintaining bg-fitness-maintaining/8 border border-fitness-maintaining/20`
- Under: `text-fitness-under bg-fitness-under/8 border border-fitness-under/20`

Only show a pill if its count > 0. Each pill: `inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full tabular-nums`

### 3. Category grouping

```tsx
const groupedMuscles = useMemo(() => {
  const assigned = new Set<MuscleId>();
  const groups: { id: string; label: string; muscles: MuscleId[] }[] = [];

  for (const cat of MUSCLE_CATEGORIES) {
    // Use short labels
    const shortLabel = cat.id === "upper_push" ? "Push"
                     : cat.id === "upper_pull" ? "Pull"
                     : cat.label;
    const trained = cat.muscles.filter(m => trainedMuscleIds.has(m));
    trained.sort((a, b) => {
      const sa = bucket.muscles[a].sets;
      const sb = bucket.muscles[b].sets;
      const ka = statusSortKey(statusFromWeeklySets(sa));
      const kb = statusSortKey(statusFromWeeklySets(sb));
      if (ka !== kb) return ka - kb;
      return sa - sb;
    });
    if (trained.length > 0) {
      groups.push({ id: cat.id, label: shortLabel, muscles: trained });
      trained.forEach(m => assigned.add(m));
    }
  }

  // Safety net for orphans
  const orphans = [...trainedMuscleIds].filter(m => !assigned.has(m));
  if (orphans.length > 0) {
    groups.push({ id: "other", label: "Other", muscles: orphans as MuscleId[] });
  }

  return groups;
}, [bucket, trainedMuscleIds]);
```

### 4. Category header

Each category renders:
- Left: short label in `text-[11px] font-semibold uppercase tracking-wider text-muted-foreground`
- Right: total sets for the category in `text-[10px] text-muted-foreground tabular-nums`

```tsx
const catTotalSets = group.muscles.reduce((sum, m) => sum + bucket.muscles[m].sets, 0);
// Display: "{Math.round(catTotalSets)} total sets"
```

Container: `flex items-center justify-between px-0.5 mb-2`

### 5. Elevated surface container

Wrap muscle rows inside each category in:
```
className="overflow-hidden rounded-xl border border-border/50 bg-card"
```

Use `divide-y divide-border/50` on a wrapper inside to get row separators.

### 6. Status dots (replace pills on each row)

Replace the per-row status pill with a simple dot:
```tsx
<span className={cn(
  "size-2 shrink-0 rounded-full",
  status === "growing" && "bg-fitness-growing shadow-[0_0_6px_var(--color-fitness-growing)]/20",
  status === "maintaining" && "bg-fitness-maintaining shadow-[0_0_6px_var(--color-fitness-maintaining)]/20",
  status === "under" && "bg-fitness-under shadow-[0_0_6px_var(--color-fitness-under)]/20",
)} />
```

### 7. Row layout

Each muscle row:
```
className="grid grid-cols-[1fr_auto_auto] items-center gap-3 px-3.5 py-2.5 transition-colors hover:bg-foreground/[0.03] active:bg-foreground/[0.05]"
```

- Column 1: muscle name + progress bar
- Column 2: `<span className="text-sm font-semibold tabular-nums">{formatSets(sets)}</span> <span className="text-[10px] text-muted-foreground ml-0.5">sets</span>`
- Column 3: status dot

### 8. Staggered entrance animation

Each category group gets a staggered fade-in:
```tsx
<div
  key={group.id}
  style={{
    animation: `fadeSlideIn 350ms cubic-bezier(0.2, 0, 0, 1) ${i * 60}ms both`,
  }}
>
```

Add a `@keyframes fadeSlideIn` block either via a `<style>` tag in the component or by adding it to `globals.css`:
```css
@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
```

**Preferred approach**: add the keyframes to `globals.css` inside `@layer base {}`.

### 9. Expanded detail

Keep existing `MuscleExerciseDetail` component unchanged. When a row is expanded:
- Row gets subtle active background via state: `bg-foreground/[0.03]`
- Detail panel renders below the row, still inside the surface container
- Detail panel base: `border-t border-border/50 bg-background/50 px-3.5 py-3`

### 10. Gap hint improvement

Inside `MuscleExerciseDetail`, upgrade the "Add ~X more sets" text to a styled callout:

```tsx
{status !== "growing" && (
  <div className={cn(
    "mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium",
    status === "under"
      ? "bg-fitness-under/8 text-fitness-under border border-fitness-under/20"
      : "bg-fitness-maintaining/8 text-fitness-maintaining border border-fitness-maintaining/20"
  )}>
    <ArrowUp className="size-3.5 shrink-0 opacity-75" />
    Add ~{gapToGrowth} more set{gapToGrowth === 1 ? "" : "s"} to reach growth range
  </div>
)}
```

Import `ArrowUp` from `lucide-react` (already a project dependency).

## What NOT to do

- Do not change `muscle-groups.ts`, `workout-stats.ts`, or any other file besides `weekly-growth-summary.tsx` (and optionally adding the keyframe to `globals.css`)
- Do not add new npm dependencies
- Do not use framer-motion (not installed)
- Do not remove any existing accessibility attributes
- Do not add collapse/expand to category headers — categories are always open
- Do not use `transition: all` — always specify exact CSS transition properties

## Verification

Run `npm run build` — zero errors, zero type warnings. Open the app and compare against `docs/design/MOCKUP-muscle-growth-v2.html`.
