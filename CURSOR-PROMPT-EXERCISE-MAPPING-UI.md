# Cursor Prompt: Exercise Mapping Review & Manual Mapping UI During Import

## Goal

Add a new step to the import flow between "Preview" and "Import" where the user can:
1. See all **auto-mapped exercises** — how each was resolved to primary/secondary muscles
2. See all **unmapped exercises** — with usage stats (total sets, number of sessions/days)
3. **Manually map unmapped exercises** by picking primary and secondary muscles from the canonical list
4. Save manual mappings persistently so they apply to future imports and dashboard calculations

---

## Current Import Flow

**File:** `src/app/import/page.tsx`
**Hook:** `src/hooks/use-import.ts`

Current steps: `pick_files` → `preview` → (confirm) → `done`

The preview step (`src/components/import/import-preview.tsx`) shows a session table with name, date, exercise count. It has no exercise-level detail and no muscle mapping visibility.

**After this change, the flow becomes:**

`pick_files` → `preview` → **`review_mappings`** (NEW) → (confirm) → `done`

---

## Part 1: Exercise Mapping Analysis Utility

### New file: `src/lib/muscles/exercise-mapping-analysis.ts`

Create a utility that analyzes a batch of parsed sessions and returns mapping status for every unique exercise.

```typescript
type MappingSource = "curated_map" | "structured_import" | "user_mapping" | "unmapped";

type ExerciseMappingInfo = {
  /** Original exercise name as it appears in import data */
  name: string;
  /** How it was resolved */
  source: MappingSource;
  /** Resolved primary muscles (display names), empty if unmapped */
  primaryMuscles: MuscleId[];
  /** Resolved secondary muscles (display names), empty if unmapped */
  secondaryMuscles: MuscleId[];
  /** Total working sets across all sessions in this import batch */
  totalSets: number;
  /** Number of distinct session dates this exercise appears in */
  sessionCount: number;
};

type MappingAnalysisResult = {
  mapped: ExerciseMappingInfo[];    // sorted by totalSets desc
  unmapped: ExerciseMappingInfo[];  // sorted by totalSets desc
  totalExerciseTypes: number;
  unmappedSetCount: number;         // total working sets lost to unmapped
};
```

**Function:** `analyzeExerciseMappings(sessions: WorkoutSession[], userMappings: Record<string, MuscleMapEntry>): MappingAnalysisResult`

For each unique exercise name across all sessions:
1. Count total working sets (non-warmup) and distinct session dates
2. Try resolving via the 3-layer system (curated map → structured import → unmapped)
3. Also check `userMappings` (new — see Part 3) as a layer between curated map and structured import
4. Classify the source and extract resolved primary/secondary muscles
5. Sort mapped by totalSets desc, unmapped by totalSets desc

---

## Part 2: Mapping Review Step UI

### New file: `src/components/import/mapping-review.tsx`

This is the main new component shown between Preview and Import.

### Layout structure

```
┌─────────────────────────────────────────────────┐
│  Exercise Mapping Review                        │
│  N exercises mapped · M unmapped (X sets lost)  │
├─────────────────────────────────────────────────┤
│                                                 │
│  ⚠ UNMAPPED EXERCISES (only if M > 0)          │
│  These exercises won't count toward any muscle. │
│  Assign muscles below or skip to import as-is.  │
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │ Converging Chest Press                    │  │
│  │ 4 sets · 1 session                       │  │
│  │                                           │  │
│  │ Primary:  [Select muscles ▾]              │  │
│  │ Secondary: [Select muscles ▾]             │  │
│  └───────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────┐  │
│  │ TRX Suspension Row                        │  │
│  │ 12 sets · 3 sessions                     │  │
│  │ Primary:  [Select muscles ▾]              │  │
│  │ Secondary: [Select muscles ▾]             │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  ✓ AUTO-MAPPED EXERCISES (collapsible)          │
│  Click to review how exercises were matched.    │
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │ Barbell Bench Press         12 sets · 3d  │  │
│  │ ● Chest          ○ Front delts · Triceps  │  │
│  │ via: curated map                          │  │
│  ├───────────────────────────────────────────┤  │
│  │ Weird Custom Press          4 sets · 1d   │  │
│  │ ● Chest          ○ Shoulders · Triceps    │  │
│  │ via: import data (Daily Strength)         │  │
│  └───────────────────────────────────────────┘  │
│                                                 │
│  [← Back]                    [Skip] [Import]    │
├─────────────────────────────────────────────────┤
```

### Unmapped exercises section

- Show **only when there are unmapped exercises**
- Sorted by total sets descending (most impactful first)
- Each unmapped exercise card shows:
  - Exercise name (bold)
  - Stats line: `{totalSets} sets · {sessionCount} session(s)` in muted text
  - **Primary muscles selector:** Multi-select from `MUSCLE_IDS` with `MUSCLE_LABELS` display names. The user picks which muscles are primary (1.0 contribution).
  - **Secondary muscles selector:** Same list, but exclude muscles already picked as primary. These get 0.5 contribution.
  - Both selectors should be compact — use a dropdown with checkboxes or a tag-style multi-select. The shadcn `Select` is single-select, so either use a custom multi-select popover or render muscle buttons as toggleable chips/tags.
- Highlight the stats for unmapped exercises with high set counts (e.g. bold or amber accent for exercises with 6+ sets) since those have the most impact on dashboard accuracy.

### Auto-mapped exercises section

- **Collapsed by default** (user can expand to review)
- Each row shows:
  - Exercise name
  - Stats: `{totalSets} sets · {sessionCount}d` (compact)
  - Primary muscles shown with filled dot (●) and muscle name
  - Secondary muscles shown with hollow dot (○) and muscle name
  - Source label in small muted text: `via: curated map` or `via: import data` or `via: user mapping`
- Read-only. The user cannot edit auto-mapped exercises here (they could in V2, but not now).

### Action buttons

- **"Back"** — returns to the preview step
- **"Skip"** — proceeds to import without mapping any unmapped exercises (same as clicking Import without assigning muscles)
- **"Import"** — saves any user-provided manual mappings, then imports all sessions. If there are unmapped exercises the user chose to skip, they import with zero muscle credit as before.

---

## Part 3: User Mapping Persistence

### New store: `src/stores/user-exercise-mappings.ts`

Create a small Zustand store with localStorage persistence for user-defined exercise mappings.

```typescript
type UserExerciseMappingsStore = {
  /**
   * Key: normalized exercise name (via normalizeExerciseName)
   * Value: { primary: MuscleId[], secondary: MuscleId[] }
   */
  mappings: Record<string, MuscleMapEntry>;
  setMapping: (normalizedName: string, entry: MuscleMapEntry) => void;
  removeMapping: (normalizedName: string) => void;
  clearAll: () => void;
};
```

Persist under key `"training-dashboard:user-exercise-mappings"`.

### Integrate user mappings into allocation

**File:** `src/lib/muscles/allocation.ts`

Update `resolveMuscleAllocations()` to add a new layer between curated map and structured import:

```
Layer 1: Curated EXERCISE_MUSCLE_MAP (unchanged, always wins)
Layer 1.5 (NEW): User-defined mappings from userExerciseMappings store
Layer 2: Structured import data (unchanged)
Layer 3: Unmapped — zero credit (unchanged)
```

The user mapping lookup should use `normalizeExerciseName(exercise.name)` as the key, same as the curated map.

**Important:** The `resolveMuscleAllocations` function is a pure utility — it doesn't access React stores directly. To pass user mappings in, either:
- **Option A (recommended):** Add an optional parameter: `resolveMuscleAllocations(exercise, userMappings?: Record<string, MuscleMapEntry>)`
- **Option B:** Create a module-level setter that the store syncs to on mount: `setActiveUserMappings(mappings)`. The allocation function reads from the module variable.

Option A is cleaner and more testable. All callers that need user mappings pass them in. The weekly stats computation in `muscle-week-stats.ts` would need to accept and forward user mappings.

### Integrate user mappings into weekly stats

**File:** `src/lib/workout-stats/muscle-week-stats.ts`

`weeklyMuscleBucketForWeek()` and `addSessionToWeeklyMuscleBucket()` call `resolveMuscleAllocations()`. Update them to accept and pass through `userMappings`.

**File:** `src/hooks/use-weekly-muscle-stats.ts`

Read from the `userExerciseMappingsStore` and pass mappings into the stats computation.

---

## Part 4: Wire Into Import Flow

### Update import flow hook

**File:** `src/hooks/use-import.ts`

Add a new step `"review_mappings"` to `ImportStep`:
```typescript
type ImportStep = "pick_files" | "preview" | "review_mappings" | "done";
```

Add state for pending manual mappings (not yet saved):
```typescript
const [pendingMappings, setPendingMappings] = useState<Record<string, MuscleMapEntry>>({});
```

### Update import page

**File:** `src/app/import/page.tsx`

In the preview step, change the "Import" button to say "Next: Review mappings" and navigate to `review_mappings`.

In the `review_mappings` step, render the `MappingReview` component. Pass:
- `sessions` (parsed sessions)
- `pendingMappings` and `setPendingMappings`
- `onBack` (go back to preview)
- `onConfirm` (save pending mappings to store, then run import)
- `onSkip` (skip mapping, run import directly)

When the user confirms:
1. Save all `pendingMappings` to the `userExerciseMappingsStore` via `setMapping()`
2. Then call `addImported(sessions)` as before
3. The dashboard will now use the saved user mappings for all future calculations

---

## Part 5: Muscle Multi-Select Component

### New file: `src/components/import/muscle-multi-select.tsx`

A compact multi-select component for choosing muscles. Design options:

**Recommended: Toggleable chip/tag buttons**

Render all 16 muscles as small pill buttons in a flex-wrap container. Clicking toggles selection. Selected pills get a colored background, unselected are muted/outlined.

Group them visually by category (Push / Pull / Core / Legs) with tiny category labels above each row, using `MUSCLE_CATEGORIES` from constants.

```
Props:
  selected: MuscleId[]
  onChange: (selected: MuscleId[]) => void
  exclude?: MuscleId[]  // muscles to disable (already picked as primary)
  label: string         // "Primary muscles" or "Secondary muscles"
```

Styling:
- Unselected: `border border-border/60 text-muted-foreground bg-transparent`
- Selected: Use the primary color — `bg-primary/15 border-primary/40 text-primary`
- Disabled/excluded: `opacity-40 pointer-events-none`
- Pill size: small — `text-[11px] px-2 py-0.5 rounded-full`
- Category labels: `text-[10px] uppercase tracking-wider text-muted-foreground`

---

## UI Details

### Summary stats at the top of review step

Show a compact summary bar:
```
✓ 18 exercises mapped · ⚠ 3 unmapped (14 sets not counted)
```

Use green for the mapped count, amber/yellow for the unmapped count. The "sets not counted" number helps the user understand the impact of skipping.

### Unmapped exercise card styling

- Slightly elevated with a subtle left border accent in amber: `border-l-2 border-amber-400`
- Background: `bg-card`
- The stats line ("12 sets · 3 sessions") should be prominent enough that users with high-set unmapped exercises notice them

### Auto-mapped section

- Use a collapsible section (click header to expand/collapse)
- Default: collapsed
- Header: `Auto-mapped exercises (18)` with a chevron icon
- Inside: a compact list, no cards needed — just rows with dividers

### Source labels

- `curated map` — shown in muted text, no special styling
- `import data` — shown in muted text with a small info note on first occurrence: "Muscle data from your fitness app"
- `user mapping` — shown with a small user icon or "manual" label so the user knows they set this one themselves

---

## What NOT to Do

- Do not change the curated `EXERCISE_MUSCLE_MAP` in this task
- Do not change zone thresholds, contribution values (1.0 / 0.5), or the status classification
- Do not add any scoring, confidence, or probabilistic logic
- Do not make the mapping review step mandatory — users can always skip
- Do not allow editing auto-mapped exercises (curated map entries) in this UI — that's V2
- Do not add ML or LLM-based suggestions for unmapped exercises

---

## Acceptance Criteria

1. **Import flow has a new "Review mappings" step** between preview and import confirmation.

2. **All unique exercises from the import batch are listed** — auto-mapped ones in a collapsible section, unmapped ones in a prominent section.

3. **Each auto-mapped exercise shows its resolved primary and secondary muscles and the mapping source** (curated map / import data / user mapping).

4. **Each unmapped exercise shows total working sets and session count** from the import batch.

5. **Users can select primary and secondary muscles for unmapped exercises** using the muscle chip selector. Muscles selected as primary are disabled in the secondary selector.

6. **Manual mappings are persisted** in localStorage under their own key and survive page reloads.

7. **Manual mappings are used by the dashboard** — after mapping "Converging Chest Press" to Chest (primary), the dashboard immediately counts it.

8. **The user can skip mapping** and proceed to import. Unmapped exercises keep zero credit.

9. **Contribution values are correct.** User-mapped primary muscles get 1.0, secondary get 0.5. No other values.

10. **The layer priority is respected.** Curated map > User mappings > Structured import data > Unmapped.

---

## Test Plan

### Unit tests

```
// User mapping resolves correctly
resolveMuscleAllocations(
  exercise("Custom Press", 4 sets),
  userMappings: { "custom press": { primary: ["chest"], secondary: ["triceps"] } }
) → chest=4.0, triceps=2.0

// Curated map still wins over user mapping
resolveMuscleAllocations(
  exercise("Barbell Bench Press", 3 sets),
  userMappings: { "barbell bench press": { primary: ["quads"], secondary: [] } }
) → chest=3.0, front_delts=1.5, triceps=1.5 (from curated map, NOT user mapping)

// User mapping wins over structured import
resolveMuscleAllocations(
  exercise("Custom Thing", importPrimary=["Shoulders"], 3 sets),
  userMappings: { "custom thing": { primary: ["chest"], secondary: [] } }
) → chest=3.0 (from user mapping, NOT import data)
```

### Integration tests

```
// analyzeExerciseMappings returns correct counts
// Sessions with 5 unique exercises, 3 in curated map, 2 unmapped
// → mapped.length === 3, unmapped.length === 2

// totalSets and sessionCount are correct
// "Bench Press" appears in 3 sessions with 4+3+4=11 total working sets
// → mapped entry for "Bench Press" has totalSets=11, sessionCount=3
```

### Manual QA

- Import a Daily Strength ZIP with a custom exercise → appears in unmapped section with correct set count
- Map it to Chest (primary) + Triceps (secondary) → Import → dashboard shows the exercise counting toward Chest and Triceps
- Re-import same file → the exercise now appears in auto-mapped section as "via: user mapping"
- Import a Hevy CSV with an unknown exercise → appears in unmapped section, no import muscle data available
