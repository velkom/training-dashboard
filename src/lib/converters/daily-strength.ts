import { assignSessionIds } from "@/lib/dedup";
import type {
  UserId,
  WorkoutExercise,
  WorkoutSession,
  WorkoutSet,
  WorkoutSetType,
} from "@/types";

import type { WorkoutConverter } from "./types";

// ---------- Real Daily Strength export types ----------

type DsMuscleGroup = { id?: string; name?: string };

type DsExerciseDetail = {
  name?: string;
  primaryMuscleGroups?: DsMuscleGroup[];
  secondaryMuscleGroups?: DsMuscleGroup[];
  category?: string;
};

type DsSet = {
  reps?: number;
  weight?: number;
  warmUp?: boolean;
  dropSet?: boolean;
  untilFailure?: boolean;
  set?: number;
  oneRepMax?: number;
  distance?: number;
  time?: number;
  measurementUnit?: string;
};

type DsSessionExercise = {
  exercise?: DsExerciseDetail;
  position?: number;
  workoutSessionSets?: DsSet[];
};

type DsSession = {
  id?: string;
  name?: string;
  startDate?: number | string;
  endDate?: number | string;
  isComplete?: boolean;
  workoutSessionExercises?: DsSessionExercise[];
};

// ---------- Legacy / generic JSON types ----------

type LegacySet = Record<string, unknown>;
type LegacyExercise = {
  name?: string;
  position?: number;
  muscleGroups?: string[];
  sets?: LegacySet[];
};
type LegacySession = {
  id?: string;
  name?: string;
  title?: string;
  startDate?: string;
  start_time?: string;
  startedAt?: string;
  endDate?: string;
  end_time?: string;
  endedAt?: string;
  durationSeconds?: number;
  duration_seconds?: number;
  exercises?: LegacyExercise[];
};

// ---------- Helpers ----------

function msToIso(v: number | string | undefined): string | undefined {
  if (v === undefined || v === "") return undefined;
  const n = typeof v === "number" ? v : Number(v);
  if (Number.isFinite(n) && n > 1_000_000_000_000) {
    return new Date(n).toISOString();
  }
  if (Number.isFinite(n) && n > 1_000_000_000) {
    return new Date(n * 1000).toISOString();
  }
  if (typeof v === "string") {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return undefined;
}

function dsSetType(s: DsSet): WorkoutSetType {
  if (s.warmUp) return "warmup";
  if (s.dropSet) return "dropset";
  if (s.untilFailure) return "failure";
  return "normal";
}

function mapDsSet(raw: DsSet, index: number): WorkoutSet {
  return {
    setNumber: typeof raw.set === "number" ? raw.set : index + 1,
    weight: typeof raw.weight === "number" ? raw.weight : undefined,
    reps: typeof raw.reps === "number" ? raw.reps : undefined,
    distance: typeof raw.distance === "number" ? raw.distance : undefined,
    time: typeof raw.time === "number" ? raw.time : undefined,
    setType: dsSetType(raw),
    oneRepMax: typeof raw.oneRepMax === "number" ? raw.oneRepMax : undefined,
  };
}

function collectMuscleGroups(ex: DsExerciseDetail): string[] {
  const names = new Set<string>();
  for (const g of ex.primaryMuscleGroups ?? []) {
    if (g.name) names.add(g.name);
  }
  for (const g of ex.secondaryMuscleGroups ?? []) {
    if (g.name) names.add(g.name);
  }
  return [...names];
}

function mapDsExercise(raw: DsSessionExercise, fallbackPos: number): WorkoutExercise {
  const detail = raw.exercise ?? {};
  const sets = (raw.workoutSessionSets ?? []).map((s, i) => mapDsSet(s, i));
  return {
    name: String(detail.name ?? "Exercise"),
    position: typeof raw.position === "number" ? raw.position : fallbackPos,
    muscleGroups: collectMuscleGroups(detail),
    sets,
  };
}

function mapDsSession(raw: DsSession, userId: UserId): Omit<WorkoutSession, "id"> {
  const startIso = msToIso(raw.startDate) ?? new Date().toISOString();
  const endIso = msToIso(raw.endDate);
  const startDate = new Date(startIso);
  const endDate = endIso ? new Date(endIso) : undefined;
  const durationSeconds = endDate
    ? Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 1000))
    : 0;

  const exercises = (raw.workoutSessionExercises ?? [])
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    .map((ex, i) => mapDsExercise(ex, i));

  return {
    userId,
    name: String(raw.name ?? "Workout"),
    startDate: startIso,
    endDate: endIso,
    durationSeconds,
    exercises,
  };
}

// ---------- Legacy fallback ----------

function parseLegacySetType(raw: unknown): WorkoutSetType {
  const s = String(raw ?? "normal").toLowerCase();
  if (s.includes("warm")) return "warmup";
  if (s.includes("drop")) return "dropset";
  if (s.includes("left")) return "left";
  if (s.includes("right")) return "right";
  if (s.includes("fail")) return "failure";
  return "normal";
}

function mapLegacySet(raw: Record<string, unknown>, index: number): WorkoutSet {
  const weight =
    typeof raw.weight === "number"
      ? raw.weight
      : typeof raw.weightKg === "number"
        ? raw.weightKg
        : typeof raw.weight_kg === "number"
          ? raw.weight_kg
          : undefined;
  const reps =
    typeof raw.reps === "number"
      ? raw.reps
      : typeof raw.repetitions === "number"
        ? raw.repetitions
        : undefined;
  return {
    setNumber: typeof raw.setNumber === "number" ? raw.setNumber : index + 1,
    weight,
    reps,
    distance: typeof raw.distance === "number" ? raw.distance : undefined,
    time: typeof raw.time === "number" ? raw.time : undefined,
    setType: parseLegacySetType(raw.setType ?? raw.set_type),
    oneRepMax:
      typeof raw.oneRepMax === "number"
        ? raw.oneRepMax
        : typeof raw.one_rep_max === "number"
          ? raw.one_rep_max
          : undefined,
  };
}

function mapLegacyExercise(raw: LegacyExercise, position: number): WorkoutExercise {
  const sets = (raw.sets ?? []).map((s, i) => mapLegacySet(s, i));
  return {
    name: String(raw.name ?? "Exercise"),
    position: typeof raw.position === "number" ? raw.position : position,
    muscleGroups: Array.isArray(raw.muscleGroups)
      ? raw.muscleGroups.filter((m): m is string => typeof m === "string")
      : [],
    sets,
  };
}

function asString(v: unknown): string | undefined {
  if (typeof v === "string") return v;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return undefined;
}

function mapLegacySession(raw: LegacySession, userId: UserId): Omit<WorkoutSession, "id"> {
  const start =
    asString(raw.startDate) ??
    asString(raw.start_time) ??
    asString(raw.startedAt) ??
    new Date().toISOString();
  const end = asString(raw.endDate) ?? asString(raw.end_time) ?? asString(raw.endedAt);
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : undefined;
  const durationSeconds =
    typeof raw.durationSeconds === "number"
      ? raw.durationSeconds
      : typeof raw.duration_seconds === "number"
        ? raw.duration_seconds
        : endDate
          ? Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 1000))
          : 0;

  const exercises = (raw.exercises ?? []).map((ex, i) => mapLegacyExercise(ex, i));

  return {
    userId,
    name: String(raw.name ?? raw.title ?? "Workout"),
    startDate: startDate.toISOString(),
    endDate: endDate?.toISOString(),
    durationSeconds,
    exercises,
  };
}

// ---------- Detection ----------

function isDsFormat(data: unknown): data is DsSession[] {
  return (
    Array.isArray(data) &&
    data.length > 0 &&
    typeof data[0] === "object" &&
    data[0] !== null &&
    "workoutSessionExercises" in (data[0] as object)
  );
}

function isLegacyFormat(data: unknown): data is LegacySession[] {
  return (
    Array.isArray(data) &&
    data.length > 0 &&
    typeof data[0] === "object" &&
    data[0] !== null &&
    "exercises" in (data[0] as object)
  );
}

async function readJsonFile(file: File): Promise<unknown> {
  const text = await file.text();
  return JSON.parse(text) as unknown;
}

function extractSessions(data: unknown): unknown[] | null {
  if (isDsFormat(data)) return data;
  if (isLegacyFormat(data)) return data;
  if (
    data &&
    typeof data === "object" &&
    "sessions" in data &&
    Array.isArray((data as { sessions: unknown }).sessions)
  ) {
    return (data as { sessions: unknown[] }).sessions;
  }
  if (
    data &&
    typeof data === "object" &&
    "workouts" in data &&
    Array.isArray((data as { workouts: unknown }).workouts)
  ) {
    return (data as { workouts: unknown[] }).workouts;
  }
  return null;
}

export const dailyStrengthConverter: WorkoutConverter = {
  id: "daily-strength",
  name: "Daily Strength (JSON)",
  detect(input: File | File[]) {
    const files = Array.isArray(input) ? input : [input];
    const hasCsv = files.some((f) => f.name.toLowerCase().endsWith(".csv"));
    if (hasCsv) return false;
    const jsonFiles = files.filter((f) => f.name.toLowerCase().endsWith(".json"));
    if (jsonFiles.length === 0) return false;
    const named = jsonFiles.find(
      (f) => f.name.toLowerCase() === "workoutsession.json",
    );
    if (named) return true;
    const named2 = jsonFiles.find((f) =>
      f.name.toLowerCase().includes("workoutsession"),
    );
    if (named2) return true;
    return jsonFiles.length === 1;
  },
  async convert(input: File | File[], userId: UserId) {
    const files = Array.isArray(input) ? input : [input];
    const jsonFiles = files.filter((f) => f.name.toLowerCase().endsWith(".json"));
    const preferred =
      jsonFiles.find((f) => f.name.toLowerCase() === "workoutsession.json") ??
      jsonFiles.find((f) => f.name.toLowerCase().includes("workoutsession")) ??
      jsonFiles[0];
    if (!preferred) return { sessions: [] };

    const data = await readJsonFile(preferred);
    const raw = extractSessions(data);
    if (!raw || raw.length === 0) return { sessions: [] };

    const sessions: Omit<WorkoutSession, "id">[] = raw.map((item) => {
      if (
        typeof item === "object" &&
        item !== null &&
        "workoutSessionExercises" in item
      ) {
        return mapDsSession(item as DsSession, userId);
      }
      return mapLegacySession(item as LegacySession, userId);
    });

    sessions.sort(
      (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
    );

    return { sessions: assignSessionIds(sessions) };
  },
};
