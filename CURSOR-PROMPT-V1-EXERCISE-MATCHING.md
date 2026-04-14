# Cursor Follow-Up Prompt: Fix Exercise Matching Gap

> **Context:** V1 stimulus zones are implemented. The problem: many imported exercises get zero muscle credit because they don't match the curated exercise map. Example: "Conversing Chest Press" (custom exercise in Daily Strength) has `primaryMuscleGroups: ["Chest"]` in the import data, but our system ignores it because the curated map has no entry for that name.

> **Root cause discovered:** The V1 implementation removed the import label fallback entirely (Rule 9). This was correct for unreliable text-only sources (Hevy CSV has no muscle columns). But Daily Strength exports carry **structured primary/secondary muscle group data** per exercise — 98% of its 631-exercise library has `primaryMuscleGroups`. This is reliable structured data from the source app's own exercise database, not user-typed text.

> **This prompt fixes the gap with a 3-layer matching strategy** that stays within the locked V1 rules.

---

## The Problem in Detail

### What the import data actually contains

**Daily Strength JSON** (Ilya's data — `WorkoutSession.json` via `Exercise.json`):
```json
{
  "name": "Conversing chest press",
  "custom": true,
  "primaryMuscleGroups": [{ "name": "Chest" }],
  "secondaryMuscleGroups": []
}
```
```json
{
  "name": "Barbell Bench Press",
  "primaryMuscleGroups": [{ "name": "Chest" }],
  "secondaryMuscleGroups": [{ "name": "Shoulders" }, { "name": "Triceps" }]
}
```

The converter already reads this data (`daily-strength.ts` lines 112-121, `collectMuscleGroups()`) and stores it in `WorkoutExercise.muscleGroups: string[]`. But `collectMuscleGroups()` currently flattens primary and secondary into one undifferentiated list.

**Hevy CSV** (Nastya's data): Has NO muscle columns at all. Headers are: `Title, Date, Duration, Exercise, Superset id, Weight, Reps, Distance, Time, Set Type`. The `muscleGroups` field is always empty after import.

### Current allocation logic after V1 (`allocation.ts` lines 116-131)
```
1. Try curated EXERCISE_MUSCLE_MAP → if match, use primary (1.0) / secondary (0.5)
2. No match → return [] (zero credit)
```

This means: every exercise not in our ~72-entry curated map gets zero credit. For Daily Strength data, we're throwing away reliable structured muscle data that the source app already provides.

### What the user sees

The history page shows "Conversing chest press — Chest" (the tag comes from import data), but the dashboard muscle breakdown completely ignores it. This is confusing and incorrect.

---

## The Fix: 3-Layer Matching Strategy

### Layer 1: Curated exercise map (existing, unchanged)
`EXERCISE_MUSCLE_MAP` lookup via `lookupExerciseMap(name)`. Returns `MuscleMapEntry` with explicit primary/secondary arrays. This is the most precise source and always takes priority.

**No changes needed to this layer.**

### Layer 2: Structured import muscle data (NEW — restore as smart fallback)
When Layer 1 returns no match, AND the exercise has **structured primary/secondary muscle data from import**, use it with the correct 1.0/0.5 contribution values.

**Key distinction:** This is NOT the old "split sets equally" fallback. This layer:
- Uses `primaryMuscleGroups` → contribution 1.0 (same as curated map primary)
- Uses `secondaryMuscleGroups` → contribution 0.5 (same as curated map secondary)
- Only activates when the import data carries **separate** primary and secondary lists
- Respects Rule 3 (only 1.0, 0.5, 0.0 values)
- Respects Rule 2 (same formula: `sets × contribution`)

### Layer 3: Unmapped (no credit)
If neither Layer 1 nor Layer 2 produces allocations, the exercise gets zero credit and is tracked as unmapped for display.

---

## Implementation Tasks

### Task 1: Preserve primary/secondary distinction during import

**File:** `src/types/workout.ts` (or wherever `WorkoutExercise` is defined)

Change the `muscleGroups` field on `WorkoutExercise` to carry the primary/secondary distinction. Two options:

**Option A (minimal change):** Add a new optional field alongside `muscleGroups`:
```typescript
type WorkoutExercise = {
  name: string;
  position: number;
  muscleGroups: string[];                    // keep for backward compat
  importPrimaryMuscles?: string[];           // NEW
  importSecondaryMuscles?: string[];         // NEW
  sets: WorkoutSet[];
};
```

**Option B (cleaner):** Replace `muscleGroups` with structured fields. This requires updating all code that reads `muscleGroups`.

**Recommend Option A** for minimal blast radius. Existing code that reads `muscleGroups` continues to work. The new fields are only used by the allocation fallback.

### Task 2: Update Daily Strength converter to populate new fields

**File:** `src/lib/converters/daily-strength.ts`

In `mapDsExercise()` (line 123-132), populate the new fields:

```typescript
function mapDsExercise(raw: DsSessionExercise, fallbackPos: number): WorkoutExercise {
  const detail = raw.exercise ?? {};
  const sets = (raw.workoutSessionSets ?? []).map((s, i) => mapDsSet(s, i));
  return {
    name: String(detail.name ?? "Exercise"),
    position: typeof raw.position === "number" ? raw.position : fallbackPos,
    muscleGroups: collectMuscleGroups(detail),   // keep existing
    importPrimaryMuscles: (detail.primaryMuscleGroups ?? [])
      .map(g => g.name).filter((n): n is string => !!n),
    importSecondaryMuscles: (detail.secondaryMuscleGroups ?? [])
      .map(g => g.name).filter((n): n is string => !!n),
    sets,
  };
}
```

### Task 3: Hevy converter remains unchanged

**File:** `src/lib/converters/hevy-csv.ts`

Hevy CSV has no muscle columns. `importPrimaryMuscles` and `importSecondaryMuscles` will be `undefined` on Hevy-imported exercises. This is correct — Hevy exercises without a curated map match will get zero credit (Layer 3), which is the right behavior since we have no reliable muscle data for them.

### Task 4: Add structured import fallback to allocation logic

**File:** `src/lib/muscles/allocation.ts`

Add a new function `allocateFromStructuredImportData()` and update `resolveMuscleAllocations()`:

```typescript
/**
 * Allocate from structured import primary/secondary muscle data.
 * Uses the same 1.0/0.5 contribution model as the curated map.
 * Only activates when the exercise carries separate primary and secondary lists.
 */
export function allocateFromStructuredImportData(
  exercise: WorkoutExercise,
  workingSets: number,
): MuscleAllocation[] {
  const primary = exercise.importPrimaryMuscles;
  if (!primary || primary.length === 0) return [];

  const secondary = exercise.importSecondaryMuscles ?? [];

  const resolvedPrimary: MuscleId[] = [];
  for (const label of primary) {
    const m = mapImportMuscleLabel(label);
    if (m) resolvedPrimary.push(m);
  }
  if (resolvedPrimary.length === 0) return [];

  const resolvedSecondary: MuscleId[] = [];
  for (const label of secondary) {
    const m = mapImportMuscleLabel(label);
    if (m && !resolvedPrimary.includes(m)) resolvedSecondary.push(m);
  }

  // Build a MuscleMapEntry and use the same allocation function
  const mapEntry: MuscleMapEntry = {
    primary: [...new Set(resolvedPrimary)],
    secondary: [...new Set(resolvedSecondary)],
  };
  return allocateFromExerciseMapEntry(mapEntry, workingSets);
}
```

Update `resolveMuscleAllocations()`:

```typescript
export function resolveMuscleAllocations(
  exercise: WorkoutExercise,
): MuscleAllocation[] {
  const workingSets = countWorkingSets(exercise);
  if (workingSets === 0) return [];

  // Layer 1: Curated exercise map (highest precision)
  const mapped = lookupExerciseMap(exercise.name);
  if (mapped) {
    const allocs = allocateFromExerciseMapEntry(mapped, workingSets);
    if (allocs.length > 0) return allocs;
  }

  // Layer 2: Structured import data (primary/secondary from source app)
  const fromImport = allocateFromStructuredImportData(exercise, workingSets);
  if (fromImport.length > 0) return fromImport;

  // Layer 3: Unmapped — zero credit
  return [];
}
```

### Task 5: Expand curated map with common missing exercises

**File:** `src/lib/muscles/exercise-map.ts`

Even with the import fallback, the curated map should cover the most common exercises so that Hevy imports (no muscle data) work well too. Add these entries:

**Chest:**
```
"chest press": entry(["chest"], ["front_delts", "triceps"]),
"converging chest press": entry(["chest"], ["front_delts", "triceps"]),
"machine chest press": entry(["chest"], ["front_delts", "triceps"]),
"smith machine bench press": entry(["chest"], ["front_delts", "triceps"]),
"incline chest press": entry(["chest"], ["front_delts", "triceps"]),
"incline machine press": entry(["chest"], ["front_delts", "triceps"]),
"incline fly": entry(["chest"], ["front_delts"]),
"incline dumbbell fly": entry(["chest"], ["front_delts"]),
"machine fly": entry(["chest"], ["front_delts"]),
```

**Shoulders:**
```
"cable lateral raise": entry(["side_delts"], ["front_delts"]),
"cable one arm lateral raise": entry(["side_delts"], []),
"machine lateral raise": entry(["side_delts"], ["front_delts"]),
"machine shoulder press": entry(["front_delts", "side_delts"], ["triceps"]),
"seated overhead press": entry(["front_delts", "side_delts"], ["triceps"]),
"reverse pec deck": entry(["rear_delts"], ["upper_back_traps"]),
"rear delt machine": entry(["rear_delts"], ["upper_back_traps"]),
"cable face pull": entry(["rear_delts", "upper_back_traps"], ["biceps"]),
```

**Arms:**
```
"cable tricep pushdown": entry(["triceps"], ["forearms"]),
"dumbbell tricep extension": entry(["triceps"], ["forearms"]),
"dumbbell standing triceps extension": entry(["triceps"], ["forearms"]),
"seated dumbbell triceps extension": entry(["triceps"], ["forearms"]),
"standing overhead barbell triceps extension": entry(["triceps"], ["forearms"]),
"ez bar curl": entry(["biceps"], ["forearms"]),
"incline dumbbell curl": entry(["biceps"], ["forearms"]),
"dumbbell incline curl": entry(["biceps"], ["forearms"]),
"spider curl": entry(["biceps"], ["forearms"]),
"machine curl": entry(["biceps"], ["forearms"]),
"machine preacher curl": entry(["biceps"], ["forearms"]),
"dumbbell hammer curls": entry(["biceps", "forearms"], []),
"reverse curl": entry(["forearms", "biceps"], []),
"bayesian curl": entry(["biceps"], ["forearms"]),
```

**Back:**
```
"assisted pull up": entry(["upper_back_lats", "biceps"], ["rear_delts"]),
"band assisted chin up": entry(["upper_back_lats", "biceps"], ["rear_delts"]),
"chest supported row": entry(["upper_back_lats", "upper_back_traps"], ["biceps", "rear_delts"]),
"chest supported dumbbell row": entry(["upper_back_lats", "upper_back_traps"], ["biceps", "rear_delts"]),
"machine row": entry(["upper_back_lats", "upper_back_traps"], ["biceps"]),
"wide grip lat pulldown": entry(["upper_back_lats"], ["biceps", "rear_delts"]),
"cable wide grip lat pulldown": entry(["upper_back_lats"], ["biceps", "rear_delts"]),
"close grip lat pulldown": entry(["upper_back_lats"], ["biceps"]),
"straight arm pulldown": entry(["upper_back_lats"], ["rear_delts"]),
"inverted row": entry(["upper_back_lats", "upper_back_traps"], ["biceps", "rear_delts"]),
"trap bar deadlift": entry(["lower_back", "glutes", "hamstrings", "upper_back_traps"], ["quads", "forearms"]),
"stiff leg deadlift": entry(["hamstrings", "glutes"], ["lower_back", "forearms"]),
"farmer walk": entry(["forearms", "upper_back_traps"], ["glutes"]),
"farmers carry": entry(["forearms", "upper_back_traps"], ["glutes"]),
```

**Core:**
```
"decline crunch": entry(["abs"], []),
"bicycle crunch": entry(["abs", "obliques"], []),
"cross body crunch": entry(["obliques"], ["abs"]),
"leg raise": entry(["abs"], []),
"flat bench leg raises": entry(["abs"], []),
"bent knee hip raise": entry(["abs"], []),
"dead bug": entry(["abs"], ["obliques"]),
"side plank": entry(["obliques"], ["abs"]),
"sit up": entry(["abs"], []),
```

**Legs:**
```
"smith machine squat": entry(["quads", "glutes"], ["lower_back", "hamstrings"]),
"machine leg press": entry(["quads", "glutes"], ["hamstrings"]),
"single leg press": entry(["quads", "glutes"], ["hamstrings"]),
"lever seated hip abduction": entry(["glutes"], []),
"adductor machine": entry(["glutes"], []),
"abductor machine": entry(["glutes"], []),
"hip abduction": entry(["glutes"], []),
"hip adduction": entry(["glutes"], []),
"lever seated hip adduction": entry(["glutes"], []),
"nordic curl": entry(["hamstrings"], []),
"reverse lunge": entry(["quads", "glutes"], ["hamstrings"]),
"dumbbell lunge": entry(["quads", "glutes"], ["hamstrings"]),
"barbell hip thrust": entry(["glutes"], ["hamstrings", "quads"]),
"glute ham raise": entry(["hamstrings", "glutes"], ["lower_back"]),
"cable kickback": entry(["glutes"], ["hamstrings"]),
"donkey calf raise": entry(["calves"], []),
"standing calf raise machine": entry(["calves"], []),
"seated calf raise machine": entry(["calves"], []),
"dumbell glute dominant bulgarian split squat": entry(["glutes", "quads"], ["hamstrings"]),
```

### Task 6: Improve token-based matching in lookupExerciseMap

**File:** `src/lib/muscles/exercise-map.ts`

Add a third matching priority after exact match and substring match: token containment. If ALL tokens (words) of a map key appear in the normalized import name, it's a candidate. Pick the candidate with the most tokens (most specific wins). Only apply to map keys with 2+ tokens to avoid false positives from single-word keys like "fly", "squat", "dip".

Replace `lookupExerciseMap()`:

```typescript
export function lookupExerciseMap(name: string): MuscleMapEntry | undefined {
  const key = normalizeExerciseName(name);

  // Priority 1: exact match
  if (EXERCISE_MUSCLE_MAP[key]) return EXERCISE_MUSCLE_MAP[key];

  // Priority 2: substring match
  for (const [k, v] of Object.entries(EXERCISE_MUSCLE_MAP)) {
    if (key.includes(k) || k.includes(key)) return v;
  }

  // Priority 3: token containment (2+ token keys only, most specific wins)
  const importTokens = new Set(key.split(" "));
  let bestMatch: MuscleMapEntry | undefined;
  let bestTokenCount = 1; // minimum 2 tokens to qualify

  for (const [k, v] of Object.entries(EXERCISE_MUSCLE_MAP)) {
    const mapTokens = k.split(" ");
    if (mapTokens.length <= 1) continue;
    if (mapTokens.every(t => importTokens.has(t))) {
      if (mapTokens.length > bestTokenCount) {
        bestTokenCount = mapTokens.length;
        bestMatch = v;
      }
    }
  }

  return bestMatch;
}
```

### Task 7: Surface unmapped exercises in the dashboard

**File:** `src/lib/workout-stats/muscle-week-stats.ts`

Add `unmappedExercises: { name: string; sets: number }[]` to `WeeklyMuscleBucket`.

In `addSessionToWeeklyMuscleBucket()`, when `resolveMuscleAllocations(ex)` returns empty and working sets > 0, push to the unmapped list. Deduplicate by name (sum sets for same exercise name).

**File:** `src/lib/workout-stats/weekly-muscle-stats-view.ts`

Pass `unmappedExercises` through to `WeeklyMuscleStats`.

**File:** `src/components/dashboard/growth/index.tsx`

After the category groups, render a collapsible "Unmapped exercises" section (only when count > 0). Collapsed by default. Each row: exercise name + "N sets not counted". Brief explanation text. Muted styling.

---

## What This Achieves

| Exercise | Source | Layer 1 (curated map) | Layer 2 (structured import) | Result |
|---|---|---|---|---|
| "Barbell Bench Press" | Any | ✓ exact match | — | chest=1.0, front_delts=0.5, triceps=0.5 |
| "Converging chest press" | DS | ✓ new map entry | Would also work via import data | chest=1.0, front_delts=0.5, triceps=0.5 |
| "Converging chest press" | Hevy | ✓ new map entry | No import data available | chest=1.0, front_delts=0.5, triceps=0.5 |
| "Lever Seated Hip Abduction" | DS | ✓ new map entry | Would also work via import data | glutes=1.0 |
| "Some Weird Custom Exercise" | DS | ✗ no match | ✓ has primaryMuscleGroups: ["Chest"] | chest=1.0 |
| "Some Weird Custom Exercise" | Hevy | ✗ no match | ✗ no import data | unmapped, zero credit |
| "Dumbell Glute Dominant Bulgarian Split Squat (female)" | DS | ✓ substring match on new entry | Would also work | glutes=1.0, quads=1.0, hamstrings=0.5 |

---

## Rules Compliance Check

| Rule | Status |
|---|---|
| Rule 2: Formula = sets × contribution | ✓ Layer 2 uses `allocateFromExerciseMapEntry()` with same 1.0/0.5 logic |
| Rule 3: Only 1.0, 0.5, 0.0 | ✓ Import primary → 1.0, import secondary → 0.5 |
| Rule 6: Don't rely on source muscle tags as source of truth | ✓ Layer 1 (curated map) always takes priority. Layer 2 only activates as fallback. |
| Rule 7: Simple deterministic normalization | ✓ No ML, no probabilistic mapping |
| Rule 9: Unknown exercises must not inflate stimulus | ✓ Only exercises with structured primary/secondary data get Layer 2 credit. Hevy exercises with no muscle data get zero. |

The key insight: Rule 6 says "do not rely on source app muscle tags **as the source of truth**." The curated map remains the source of truth (Layer 1). Structured import data is a **fallback**, not the source of truth. This is the same architectural pattern as DNS resolution — authoritative records first, cached records as fallback.

---

## Acceptance Criteria

1. **"Conversing Chest Press" with 4 sets now shows in Chest breakdown** as 4.0 effective sets (primary = chest).

2. **Layer priority is correct.** When both curated map and import data could match, curated map wins. Add a test: exercise named "Barbell Bench Press" with `importPrimaryMuscles: ["Legs"]` should still get chest allocation from curated map, not legs.

3. **Structured import fallback uses 1.0/0.5 values.** Test: exercise with `importPrimaryMuscles: ["Chest"]` and `importSecondaryMuscles: ["Triceps"]` and 4 working sets → chest=4.0, triceps=2.0.

4. **Hevy imports without muscle data still get zero for unknown exercises.** Test: exercise from Hevy with no `importPrimaryMuscles` and no curated map match → empty allocation.

5. **Unmapped exercises are displayed in dashboard** with set counts and explanation text.

6. **Token matching works.** `lookupExerciseMap("Wide Grip Lat Pulldown")` returns lat pulldown entry.

7. **Expanded map compiles.** No duplicate keys, all MuscleId values valid.

8. **No new scoring systems, multipliers, or probabilistic logic added.**

---

## Test Plan

### Allocation tests (`allocation.test.ts`)

```
// Layer 1 priority: curated map wins over import data
exercise("Barbell Bench Press", importPrimary=["Legs"], importSecondary=[])
  → chest=1.0×sets, front_delts=0.5×sets, triceps=0.5×sets (from curated map, NOT legs)

// Layer 2: structured import fallback
exercise("My Custom Press Thing", importPrimary=["Chest"], importSecondary=["Triceps"], sets=4)
  → chest=4.0, triceps=2.0

// Layer 2: primary only, no secondary
exercise("Weird Curl Machine", importPrimary=["Biceps"], importSecondary=[], sets=3)
  → biceps=3.0

// Layer 3: no match, no import data
exercise("Underwater Basket Weaving", importPrimary=undefined, sets=5)
  → [] (empty, zero credit)

// Layer 3: no match, empty import data
exercise("Mystery Exercise", importPrimary=[], importSecondary=[], sets=5)
  → [] (empty, zero credit)
```

### Token matching tests (`exercise-map.test.ts`)

```
lookupExerciseMap("Wide Grip Lat Pulldown") → lat pulldown entry
lookupExerciseMap("Standing Overhead Tricep Extension") → overhead tricep extension entry
lookupExerciseMap("Smith Machine Barbell Back Squat") → barbell back squat entry (most specific)
lookupExerciseMap("Butterfly Machine") → undefined (single-token "fly" skipped)
lookupExerciseMap("Underwater Basket Weaving") → undefined
```

### Import integration tests

```
// Daily Strength exercise with primaryMuscleGroups should populate importPrimaryMuscles
// Hevy exercise should have importPrimaryMuscles = undefined
```

### Weekly stats integration test

```
// Week with 1 session containing:
//   "Barbell Bench Press" (4 sets) — Layer 1 match
//   "My Custom Chest Thingy" (3 sets, importPrimary=["Chest"]) — Layer 2 match
//   "Unknown Thing" (2 sets, no import data) — Layer 3, zero credit
// → Chest should have 4+3=7 effective sets, not 4+3+2=9
// → unmappedExercises should contain "Unknown Thing" with 2 sets
```

---

## Explicit Non-Goals

- No import muscle label used as source of truth (curated map always wins)
- No "equal split" fallback (the old behavior that was correctly removed)
- No user-editable mappings (V2)
- No ML or LLM-based exercise matching
- No changes to zone thresholds or contribution values
- No new scoring systems or multipliers
