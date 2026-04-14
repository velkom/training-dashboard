# Cursor Implementation Prompt: V1 Weekly Muscle Stimulus Zones

> **Purpose:** Replace the current 3-status muscle classification system with the locked 5-zone weekly stimulus model. This prompt is implementation-tight. Do not infer product intent. Do not invent extra logic. When in doubt, choose the simpler path.

---

## 1. What Exists Now

The codebase is a Next.js 15 + TypeScript + Zustand training dashboard that imports workout data from external apps (Hevy CSV, Daily Strength JSON), normalizes exercises, and displays weekly muscle group stimulus on a dashboard.

### Current status system (3 statuses)

| File | What it does |
|------|-------------|
| `src/lib/muscles/constants.ts` | Defines `TrainingStatus = "growing" \| "maintaining" \| "under"` and thresholds: `SETS_MAINTENANCE_MIN = 5`, `SETS_GROWTH_MIN = 10`, `SETS_ADVANCED_MIN = 15` |
| `src/lib/muscles/status.ts` | `statusFromWeeklySets()` returns `"growing"` at ≥10, `"maintaining"` at ≥5, `"under"` below 5 |
| `src/lib/muscles/format.ts` | `statusColorClasses()` maps the 3 statuses to Tailwind color bundles using `fitness-growing`, `fitness-maintaining`, `fitness-under` CSS tokens |
| `src/lib/muscles/status.ts` | `STATUS_LABELS` maps: growing→"Growing", maintaining→"Maintaining", under→"Under-trained" |

### Current muscle allocation pipeline

| File | What it does |
|------|-------------|
| `src/lib/muscles/exercise-map.ts` | 100+ curated exercise→muscle mappings. Each entry has `primary: MuscleId[]` and `secondary: MuscleId[]`. `lookupExerciseMap(name)` does normalized exact match then fuzzy substring match. |
| `src/lib/muscles/allocation.ts` | `resolveMuscleAllocations(exercise)` → priority 1: curated map (primary = full working sets, secondary = 0.5× working sets), priority 2: import muscle labels split equally, priority 3: empty array (unmapped). `SECONDARY_SET_WEIGHT = 0.5` in constants.ts. |
| `src/lib/workout-stats/muscle-week-stats.ts` | `weeklyMuscleBucketForWeek()` sums effective sets per muscle for a Monday-aligned week. `addSessionToWeeklyMuscleBucket()` calls `resolveMuscleAllocations()` per exercise and accumulates `weightedSets` into `bucket.muscles[muscle].sets`. |

### Current dashboard UI

| File | What it does |
|------|-------------|
| `src/lib/workout-stats/weekly-muscle-stats-view.ts` | `computeWeeklyMuscleStats()` builds `MuscleGroupSummary[]` with `growingCount`, `maintainingCount`, `underCount` per category. `WeeklyMuscleStats.statusCounts` has same 3 fields. |
| `src/components/dashboard/growth/index.tsx` | `WeeklyGrowthSummary` renders ring gauge, summary pills, and category groups. References `SETS_GROWTH_MIN` in description text. |
| `src/components/dashboard/growth/summary-pills.tsx` | `GrowthSummaryPills` renders 3 colored pills for growing/maintaining/under counts. |
| `src/components/dashboard/growth/category-group.tsx` | `GrowthCategoryGroup` renders rows per muscle with `StatusDot`, `GrowthProgressBar`, sets count, and `STATUS_LABELS[status]` badge. |
| `src/components/dashboard/growth/progress-bar.tsx` | `GrowthProgressBar` scales bar to 150% of `SETS_GROWTH_MIN` (i.e. max = 15 sets). Single tick mark at growth threshold. |
| `src/components/dashboard/growth/ring-gauge.tsx` | `GrowthRingGauge` shows growing/trained ratio as a ring. |
| `src/components/dashboard/growth/muscle-detail.tsx` | `MuscleExerciseDetail` shows exercise breakdown per muscle and a "Add ~N more sets to reach growth range" nudge when status ≠ growing. |
| `src/components/dashboard/muscle-group-cards.tsx` | `MuscleGroupCards` renders per-muscle mini-cards with sparkline, sets count, and `STATUS_LABELS[status]` badge. |

### Current test coverage

| File | Covers |
|------|--------|
| `src/lib/muscles/status.test.ts` | 3 tests for the 3-status boundaries (under/maintaining/growing) |
| `src/lib/muscles/allocation.test.ts` | 6 tests for primary/secondary allocation and import label fallback |
| `src/lib/muscles/exercise-map.test.ts` | 3 tests for normalize + lookup |
| `src/lib/workout-stats/weekly-muscle-stats-view.test.ts` | 4 tests for computed stats and grouping |

### Current fallback for unmapped exercises

In `allocation.ts` line 130, when the curated map has no match, `allocateFromImportMuscleLabels()` splits working sets equally across resolved import muscle labels. If import labels also resolve nothing, the exercise returns an empty allocation array and does not inflate any muscle stimulus. This is partially correct but the equal-split fallback (priority 2) does not use 1.0/0.5 contribution values — it divides sets evenly, which can overcount or undercount.

---

## 2. Problems in the Current Implementation

1. **Only 3 statuses exist.** Product requires exactly 5 zones: Insufficient, Minimal, Solid, High, Very high.

2. **Wrong thresholds.** Current thresholds are 5 and 10. Product requires 5 zone boundaries: 0–5, 6–9, 10–14, 15–20, 20+.

3. **Status names are wrong.** Current names are "Growing", "Maintaining", "Under-trained". Product requires "Insufficient", "Minimal", "Solid", "High", "Very high".

4. **The TrainingStatus type has 3 members.** Must become 5.

5. **Status color classes only cover 3 states.** Must cover 5.

6. **statusSortKey only covers 3 states.** Must cover 5.

7. **WeeklyMuscleStats.statusCounts has 3 fields** (growing, maintaining, under). Must become 5 fields matching the new zone names.

8. **MuscleGroupSummary has 3 count fields** (growingCount, maintainingCount, underCount). Must become 5.

9. **GrowthSummaryPills renders 3 pills.** Must render 5.

10. **GrowthRingGauge shows growing/trained ratio.** Must be updated or replaced to reflect the 5-zone model meaningfully.

11. **GrowthProgressBar hardcodes max scale to SETS_GROWTH_MIN × 1.5 = 15.** Must reflect the new 20+ max zone.

12. **MuscleExerciseDetail shows "Add ~N sets to reach growth range" with a binary growing/not check.** Must use the new zone model and provide zone-appropriate guidance text.

13. **Import muscle label fallback uses equal split** instead of explicit 1.0/0.5 contribution values. This must either be removed or constrained so that unmapped exercises do not silently inflate stimulus.

14. **`SETS_ADVANCED_MIN = 15` is defined but only used implicitly.** Under the new model all 5 boundaries must be explicit constants.

15. **The "dip" entry in exercise-map.ts** maps primary to `["chest", "triceps"]` which gives both muscles 1.0. Per Rule 8, dips should be: triceps = 1.0, chest = 0.5, front_delts = 0.5. This must be corrected.

16. **Fly entries** in the exercise map currently map secondary to `["front_delts"]` with no triceps. This is correct per Rule 8 (triceps = 0.0 for flys). No change needed.

---

## 3. Locked Product Rules

These rules are final. Do not change, reinterpret, rename, merge, or extend them.

### Rule 1: Primary metric
The only primary metric is **weekly effective sets per muscle group**. Do not make session volume the main metric. Do not combine weekly and session data into a single score.

### Rule 2: Formula
```
effective weekly sets for a muscle = sum of all logged sets × exercise-to-muscle contribution
```
No other multiplier is allowed. No RIR, RPE, warmup, effort, intensity, recovery, fatigue, frequency, confidence, or source-specific adjustment.

### Rule 3: Contribution values
Only these are allowed:
- `1.0` = primary muscle
- `0.5` = secondary muscle
- `0.0` = ignore

No 0.25, 0.75, or continuous scoring.

### Rule 4: Weekly stimulus zones

| Effective sets | Zone |
|---|---|
| 0–5 | Insufficient stimulus |
| 6–9 | Minimal growth stimulus |
| 10–14 | Solid growth stimulus |
| 15–20 | High growth stimulus |
| 20+ | Very high stimulus |

### Rule 5: Product meaning

| Zone | Meaning |
|---|---|
| Insufficient | This muscle likely received too little weekly volume for growth. |
| Minimal | This muscle received some weekly stimulus, but likely near the low end for growth. |
| Solid | This muscle is in a strong weekly range for growth. |
| High | This muscle received high weekly volume and may still benefit if recovery is good. |
| Very high | This muscle received very high weekly volume and likely does not need more work. |

### Rule 6: Source data limitations
Do not rely on external muscle tags as source of truth. Do not rely on RIR, RPE, effort, warmup fields, incline angle, or external exercise naming consistency. Use internal normalization and canonical exercise mapping.

### Rule 7: Normalization
Use the existing simple canonical exercise map (`EXERCISE_MUSCLE_MAP` in `exercise-map.ts`). No ML, no probabilistic mapping, no per-app scoring engine.

### Rule 8: Default exercise mappings
These must match the curated map. Fix any deviations:

| Exercise | Chest | Front delts | Triceps |
|---|---|---|---|
| Flat chest press | 1.0 | 0.5 | 0.5 |
| Incline press | 1.0 | 0.5 | 0.5 |
| Dips | 0.5 | 0.5 | 1.0 |
| Fly | 1.0 | 0.5 | 0.0 |

The existing codebase uses exercise names like "barbell bench press", "incline barbell bench press", "dip", "dumbbell fly" etc. Adapt naming only. Do not change meaning.

### Rule 9: Unknown exercises
Unmapped exercises must not inflate weekly muscle stimulus. They must either be excluded from scoring or explicitly marked as unmapped. They must never silently count.

### Rule 10: UI
Dashboard must display the 5 zone-based statuses. Labels must be: Insufficient, Minimal, Solid, High, Very high. Must make it obvious where more training is needed, where stimulus is minimal, where it is sufficient, where it is already high.

---

## 4. Implementation Tasks

### Task 1: Update TrainingStatus type and constants
**File:** `src/lib/muscles/constants.ts`

- Replace `TrainingStatus = "growing" | "maintaining" | "under"` with:
  ```
  "insufficient" | "minimal" | "solid" | "high" | "very_high"
  ```
- Replace the 3 threshold constants with 4 boundary constants:
  ```
  SETS_INSUFFICIENT_MAX = 5
  SETS_MINIMAL_MAX = 9
  SETS_SOLID_MAX = 14
  SETS_HIGH_MAX = 20
  ```
- Remove `SETS_MAINTENANCE_MIN`, `SETS_GROWTH_MIN`, `SETS_ADVANCED_MIN`.
- Keep `SECONDARY_SET_WEIGHT = 0.5` unchanged.

### Task 2: Update status classification function
**File:** `src/lib/muscles/status.ts`

- Replace `statusFromWeeklySets()` to use the 5 zones:
  - `> 20` → `"very_high"`
  - `>= 15 && <= 20` → `"high"`
  - `>= 10 && <= 14` → `"solid"`
  - `>= 6 && <= 9` → `"minimal"`
  - `<= 5` → `"insufficient"`
- Replace `STATUS_LABELS`:
  ```
  insufficient: "Insufficient"
  minimal: "Minimal"
  solid: "Solid"
  high: "High"
  very_high: "Very high"
  ```

### Task 3: Update status color classes
**File:** `src/lib/muscles/format.ts`

- Extend `statusColorClasses()` to handle all 5 statuses.
- Suggested color mapping (use existing CSS token pattern):
  - `insufficient` → red (reuse `fitness-under` token or rename to `fitness-insufficient`)
  - `minimal` → amber/yellow (reuse `fitness-maintaining` token or rename to `fitness-minimal`)
  - `solid` → green (reuse `fitness-growing` token or rename to `fitness-solid`)
  - `high` → blue or brighter green (new token `fitness-high`)
  - `very_high` → purple or deep blue (new token `fitness-very-high`)
- If renaming CSS tokens, update Tailwind config and all usages.
- Update `statusSortKey()` to return 0–4 for the 5 statuses (insufficient=0, minimal=1, solid=2, high=3, very_high=4).

### Task 4: Fix dip exercise mapping
**File:** `src/lib/muscles/exercise-map.ts`

- Change the `dip` and `chest dip` entries from:
  ```
  dip: entry(["chest", "triceps"], ["front_delts"])
  ```
  to:
  ```
  dip: entry(["triceps"], ["chest", "front_delts"])
  chest dip: entry(["triceps"], ["chest", "front_delts"])
  ```
  This makes triceps = 1.0, chest = 0.5, front_delts = 0.5 per Rule 8.

### Task 5: Remove or isolate import muscle label fallback
**File:** `src/lib/muscles/allocation.ts`

- In `resolveMuscleAllocations()`, the priority-2 fallback (`allocateFromImportMuscleLabels`) currently splits sets equally across import labels without using 1.0/0.5 contribution values.
- **Option A (recommended):** Remove the fallback entirely. If the curated map has no match, return an empty array. The exercise is unmapped and does not count toward stimulus.
- **Option B:** Keep the fallback but only as an explicit "unmapped" marker — it must not add to any muscle's effective sets. Log it for UI display as an unmapped exercise.
- Either way: unknown exercises must not inflate weekly muscle stimulus (Rule 9).

### Task 6: Update WeeklyMuscleStats and MuscleGroupSummary types
**File:** `src/lib/workout-stats/weekly-muscle-stats-view.ts`

- Replace `statusCounts: { growing, maintaining, under }` with:
  ```
  statusCounts: { insufficient, minimal, solid, high, very_high }
  ```
- Replace `MuscleGroupSummary` fields `growingCount`, `maintainingCount`, `underCount` with:
  ```
  insufficientCount, minimalCount, solidCount, highCount, veryHighCount
  ```
- Update `computeWeeklyMuscleStats()` to count all 5 statuses.
- Update the `growingCount` field on `WeeklyMuscleStats` (used by ring gauge). Replace with a field that represents the count of muscles in "solid" or better (solid + high + very_high), or remove the ring gauge concept if it no longer maps cleanly to 5 zones.

### Task 7: Update GrowthSummaryPills
**File:** `src/components/dashboard/growth/summary-pills.tsx`

- Render 5 pills instead of 3, using the new status names, labels, and colors.

### Task 8: Update or replace GrowthRingGauge
**File:** `src/components/dashboard/growth/ring-gauge.tsx`

- The ring currently shows growing/trained ratio. With 5 zones, either:
  - Show "solid or better" / trained ratio (solid + high + very_high), or
  - Replace with a different summary visualization that represents 5 zones.
- Update the aria-label text to match the new zone language.

### Task 9: Update GrowthProgressBar
**File:** `src/components/dashboard/growth/progress-bar.tsx`

- Change `BAR_SCALE_MAX_SETS` from `SETS_GROWTH_MIN * 1.5` (15) to a value that represents the full range. Suggested: 25 (slightly above the 20+ threshold so Very high still shows as nearly full).
- Add tick marks or zone indicators at boundaries 6, 10, 15, 20 — or at minimum keep one tick at the "solid" threshold (10).

### Task 10: Update GrowthCategoryGroup
**File:** `src/components/dashboard/growth/category-group.tsx`

- Uses `statusFromWeeklySets()` and `STATUS_LABELS[status]` — these will auto-update once Tasks 2–3 are done.
- Verify the status badge renders correctly for all 5 statuses.

### Task 11: Update MuscleExerciseDetail guidance text
**File:** `src/components/dashboard/growth/muscle-detail.tsx`

- Replace the binary "Add ~N more sets to reach growth range" with zone-appropriate text:
  - **Insufficient:** "Add ~N more sets to reach minimal growth stimulus" (target = 6)
  - **Minimal:** "Add ~N more sets to reach solid growth stimulus" (target = 10)
  - **Solid:** No nudge needed. Optionally: "In solid growth range."
  - **High:** No nudge needed. Optionally: "High weekly volume — ensure recovery is adequate."
  - **Very high:** No nudge needed. Optionally: "Very high volume — likely does not need more work."

### Task 12: Update MuscleGroupCards
**File:** `src/components/dashboard/muscle-group-cards.tsx`

- Uses `statusFromWeeklySets()` and `STATUS_LABELS[status]` — will auto-update.
- Verify badge renders and colors are correct for 5 statuses.

### Task 13: Update WeeklyGrowthSummary header text
**File:** `src/components/dashboard/growth/index.tsx`

- Replace the description referencing `SETS_GROWTH_MIN`:
  ```
  "Effective working sets vs a 10+ sets / week growth target per muscle you trained."
  ```
  With something zone-based:
  ```
  "Weekly effective sets per muscle — classified into stimulus zones."
  ```

### Task 14: Update barrel export
**File:** `src/lib/muscles/index.ts`

- Remove exports of deleted constants (`SETS_MAINTENANCE_MIN`, `SETS_GROWTH_MIN`, `SETS_ADVANCED_MIN`).
- Add exports of new constants (`SETS_INSUFFICIENT_MAX`, `SETS_MINIMAL_MAX`, `SETS_SOLID_MAX`, `SETS_HIGH_MAX`).
- Update all files that import the old constants.

### Task 15: Update tests
**File:** `src/lib/muscles/status.test.ts`

- Replace the 3 existing tests with boundary tests for all 5 zones (see Test Plan section below).

**File:** `src/lib/workout-stats/weekly-muscle-stats-view.test.ts`

- Update the 4 existing tests to use the new 5-status fields in `statusCounts` and `MuscleGroupSummary`.

### Task 16: Add unmapped exercise handling test
**File:** `src/lib/muscles/allocation.test.ts`

- Add a test that verifies an exercise not in the curated map and with no import labels returns an empty allocation.
- Add a test that verifies such an exercise does not inflate any muscle's weekly sets when run through `weeklyMuscleBucketForWeek()`.

---

## 5. Explicit Non-Goals

The following are explicitly forbidden in this implementation. Do not add any of these:

- **No extra scoring systems.** No confidence scores, no quality scores, no readiness scores.
- **No hidden multipliers.** No RIR multiplier, no RPE multiplier, no effort multiplier, no intensity multiplier, no recovery multiplier, no fatigue multiplier, no frequency bonus.
- **No effort logic.** Do not read, parse, or use RIR/RPE fields from imported data.
- **No session-based status logic.** Status is computed from weekly totals only, never per-session.
- **No threshold changes.** The 5 zone boundaries (5, 9, 14, 20) are locked. Do not adjust them.
- **No contribution value changes.** Only 1.0, 0.5, and 0.0 are allowed. No 0.25, 0.75, or any other value.
- **No guessing unknown exercises.** If an exercise is not in the curated map, it must not count toward any muscle stimulus. Do not create heuristic guessing, ML inference, or probabilistic matching beyond the existing `lookupExerciseMap()` logic.
- **No external muscle tags as source of truth.** The curated `EXERCISE_MUSCLE_MAP` is the source of truth. Import labels from external apps are not reliable and must not be used as the primary allocation source.
- **No warmup logic.** Continue to exclude warmup sets (already handled by `countWorkingSets`), but do not add warmup detection, warmup set reclassification, or warmup weight thresholds.
- **No new features.** Do not add muscle group recommendations, periodization suggestions, deload detection, or any feature not described in this document.

---

## 6. Acceptance Criteria

Every item below must be verifiable after implementation.

1. **Weekly status is computed only from weekly effective sets.** No per-session status exists anywhere in the codebase.

2. **Only 1.0, 0.5, and 0.0 contributions are used.** `SECONDARY_SET_WEIGHT` remains `0.5`. Primary muscles receive `workingSets × 1.0`. Secondary muscles receive `workingSets × 0.5`. No other multiplier exists in any code path.

3. **Exactly 5 zones exist.** The `TrainingStatus` type has exactly 5 members: `insufficient`, `minimal`, `solid`, `high`, `very_high`. No other status string exists.

4. **Zone boundaries are correct.** `statusFromWeeklySets(5)` → `insufficient`. `statusFromWeeklySets(6)` → `minimal`. `statusFromWeeklySets(9)` → `minimal`. `statusFromWeeklySets(10)` → `solid`. `statusFromWeeklySets(14)` → `solid`. `statusFromWeeklySets(15)` → `high`. `statusFromWeeklySets(20)` → `high`. `statusFromWeeklySets(21)` → `very_high`.

5. **Unknown exercises do not inflate volume.** An exercise with a name not in `EXERCISE_MUSCLE_MAP` and with no curated map match returns an empty allocation. It adds zero sets to all muscles.

6. **UI labels match product intent.** The dashboard displays exactly these labels: "Insufficient", "Minimal", "Solid", "High", "Very high". No other status text appears.

7. **Dip mapping is corrected.** The `dip` and `chest dip` entries have triceps as primary (1.0) and chest + front_delts as secondary (0.5 each).

8. **No extra hidden logic was added.** Grep the codebase for: `rpe`, `rir`, `effort`, `fatigue`, `recovery`, `readiness`, `confidence`, `intensity`, `frequency.*bonus`, `0.25`, `0.75`. None of these should appear in any calculation code path.

9. **Summary counts use 5 fields.** `statusCounts` has exactly 5 fields. `MuscleGroupSummary` has exactly 5 count fields.

10. **All existing tests pass after being updated.** No test references the old 3-status model.

---

## 7. Test Plan

### 7.1 Zone boundary tests (`status.test.ts`)

```
statusFromWeeklySets(0)    → "insufficient"
statusFromWeeklySets(3)    → "insufficient"
statusFromWeeklySets(5)    → "insufficient"
statusFromWeeklySets(5.9)  → "insufficient"
statusFromWeeklySets(6)    → "minimal"
statusFromWeeklySets(7.5)  → "minimal"
statusFromWeeklySets(9)    → "minimal"
statusFromWeeklySets(9.9)  → "minimal"
statusFromWeeklySets(10)   → "solid"
statusFromWeeklySets(12)   → "solid"
statusFromWeeklySets(14)   → "solid"
statusFromWeeklySets(14.9) → "solid"
statusFromWeeklySets(15)   → "high"
statusFromWeeklySets(17)   → "high"
statusFromWeeklySets(20)   → "high"
statusFromWeeklySets(20.1) → "very_high"
statusFromWeeklySets(21)   → "very_high"
statusFromWeeklySets(30)   → "very_high"
```

### 7.2 Simple direct exercise counting (`allocation.test.ts`)

- 3 sets of barbell bench press → chest gets 3.0 effective sets, front_delts gets 1.5, triceps gets 1.5.

### 7.3 Secondary muscle counting (`allocation.test.ts`)

- 4 sets of lateral raise → side_delts gets 4.0, front_delts gets 2.0.

### 7.4 Mixed weekly workouts (`muscle-week-stats.test.ts` or new test file)

- Week with: 4 sets bench press + 3 sets dumbbell fly + 3 sets lateral raise.
  - Chest: 4×1.0 + 3×1.0 = 7.0 → "minimal"
  - Front delts: 4×0.5 + 3×0.5 + 3×0.5 = 5.0 → "insufficient"
  - Triceps: 4×0.5 = 2.0 → "insufficient"
  - Side delts: 3×1.0 = 3.0 → "insufficient"

### 7.5 Corrected dip mapping (`allocation.test.ts`)

- 4 sets of dips → triceps gets 4.0, chest gets 2.0, front_delts gets 2.0.

### 7.6 Unmapped exercise handling (`allocation.test.ts`)

- Exercise named "underwater basket weaving" with 5 sets and empty muscleGroups → returns empty allocation array.
- Verify it adds zero to all muscles in a weekly bucket.

### 7.7 Regression: import label fallback removed

- Exercise with name not in curated map but with muscleGroups = ["Chest", "Triceps"] → must return empty allocation (not split sets equally).
- This verifies Rule 9 enforcement.

### 7.8 Weekly stats view tests (`weekly-muscle-stats-view.test.ts`)

- Verify `statusCounts` has all 5 fields and they sum to total trained muscles.
- Verify `MuscleGroupSummary` count fields sum correctly per category.

---

## 8. Optional V2 Ideas (NOT included in V1)

These are future possibilities. Do not implement any of them now.

- **User-editable exercise mappings.** Let users override which muscles an exercise targets.
- **Unmapped exercise UI.** Show a list of unmapped exercises so users know what is not being counted.
- **Custom zone thresholds.** Let users adjust the 5 zone boundaries per muscle group.
- **Per-muscle-group frequency display.** Show how many sessions per week hit each muscle.
- **Recovery estimation.** Factor in rest days between sessions for the same muscle.
- **Trend arrows.** Show whether weekly stimulus is trending up or down vs. prior weeks.
- **Import label learning.** Let users confirm or correct import label mappings to improve future imports.
- **Advanced bar visualization.** Show zone bands on the progress bar (colored segments for each zone).
