import Papa from "papaparse";

import { assignSessionIds } from "@/lib/dedup";
import type { ImportParseNotes } from "@/lib/converters/import-notes";
import type { UserId, WorkoutExercise, WorkoutSession, WorkoutSetType } from "@/types";

export type HevyRow = Record<string, string | number | undefined>;

export function normKey(
  row: HevyRow,
  ...candidates: string[]
): string | number | undefined {
  const keys = Object.keys(row);
  for (const c of candidates) {
    const hit = keys.find(
      (k) => k.toLowerCase().replace(/\s+/g, "_") === c.toLowerCase(),
    );
    if (hit) return row[hit];
  }
  for (const c of candidates) {
    const hit = keys.find((k) => k.toLowerCase() === c.toLowerCase());
    if (hit) return row[hit];
  }
  return undefined;
}

function cellIsEmpty(v: string | number | undefined | null): boolean {
  if (v == null) return true;
  if (typeof v === "number") return !Number.isFinite(v);
  const s = String(v).trim();
  if (s === "") return true;
  if (s.toLowerCase() === "null") return true;
  return false;
}

/** Row where every column is blank after trim (CSV noise / trailing empty lines). */
export function isBlankCsvRow(row: HevyRow): boolean {
  const keys = Object.keys(row);
  if (keys.length === 0) return true;
  return keys.every((k) => cellIsEmpty(row[k]));
}

function parseNum(v: string | number | undefined): number | undefined {
  if (v === undefined || v === "") return undefined;
  const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

function parseHevySetType(raw: string | number | undefined): WorkoutSetType {
  const s = String(raw ?? "normal").toLowerCase();
  if (s.includes("warm")) return "warmup";
  if (s.includes("drop")) return "dropset";
  if (s === "l" || s.includes("left")) return "left";
  if (s === "r" || s.includes("right")) return "right";
  if (s.includes("fail")) return "failure";
  return "normal";
}

function toIso(dateStr: string | number | undefined): string | null {
  if (dateStr === undefined || dateStr === "") return null;
  const d = new Date(String(dateStr));
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export type ParseHevyCsvResult = {
  sessions: WorkoutSession[];
  parseNotes: ImportParseNotes;
};

/**
 * Hevy CSV export: one row per set, grouped by workout start (`start_time` or `Date`, etc.).
 */
export function parseHevyCsv(text: string, userId: UserId): ParseHevyCsvResult {
  const parsed = Papa.parse<HevyRow>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });
  if (parsed.errors.length) {
    console.warn("Hevy CSV parse warnings", parsed.errors);
  }

  let skippedEmptyRows = 0;
  const rows: HevyRow[] = [];
  for (const r of parsed.data) {
    if (Object.keys(r).length === 0) {
      skippedEmptyRows += 1;
      continue;
    }
    if (isBlankCsvRow(r)) {
      skippedEmptyRows += 1;
      continue;
    }
    rows.push(r);
  }

  let skippedMissingStartTime = 0;
  const byStart = new Map<string, HevyRow[]>();
  for (const row of rows) {
    const startRaw = normKey(row, "start_time", "start time", "date");
    const start = toIso(startRaw);
    if (!start) {
      skippedMissingStartTime += 1;
      continue;
    }
    const list = byStart.get(start) ?? [];
    list.push(row);
    byStart.set(start, list);
  }

  const sessions: Omit<WorkoutSession, "id">[] = [];

  for (const [startIso, group] of byStart) {
    group.sort((a, b) => {
      const exA = Number(normKey(a, "exercise_index", "exercise index") ?? 0);
      const exB = Number(normKey(b, "exercise_index", "exercise index") ?? 0);
      if (exA !== exB) return exA - exB;
      const setA = Number(normKey(a, "set_index", "set index") ?? 0);
      const setB = Number(normKey(b, "set_index", "set index") ?? 0);
      return setA - setB;
    });

    const title = String(normKey(group[0]!, "title") ?? "Workout");
    const endRaw = normKey(group[0]!, "end_time", "end time");
    const endIso = toIso(endRaw) ?? undefined;

    const exerciseMap = new Map<string, HevyRow[]>();
    for (const row of group) {
      const exName = String(
        normKey(row, "exercise_title", "exercise title", "exercise") ?? "Exercise",
      );
      const arr = exerciseMap.get(exName) ?? [];
      arr.push(row);
      exerciseMap.set(exName, arr);
    }

    const exercises: WorkoutExercise[] = [];
    let position = 0;
    for (const [name, exRows] of exerciseMap) {
      const sets = exRows.map((row, idx) => {
        const weight =
          parseNum(normKey(row, "weight_kg", "weight (kg)", "weight")) ??
          parseNum(normKey(row, "weight_lbs", "weight (lbs)"));
        const reps = parseNum(normKey(row, "reps"));
        const distance = parseNum(
          normKey(
            row,
            "distance_km",
            "distance (km)",
            "distance_meters",
            "distance (m)",
            "distance",
          ),
        );
        const time = parseNum(
          normKey(row, "duration_seconds", "duration (seconds)", "time"),
        );
        const setType = parseHevySetType(normKey(row, "set_type", "set type"));
        const oneRepMax = parseNum(normKey(row, "1rm", "one_rep_max"));
        return {
          setNumber: idx + 1,
          weight,
          reps,
          distance,
          time,
          setType,
          oneRepMax,
        };
      });
      const muscleLabels = new Set<string>();
      for (const row of exRows) {
        const raw = normKey(
          row,
          "primary_muscle",
          "primary muscle",
          "muscle",
          "muscles",
          "muscle_groups",
          "muscle groups",
          "muscles_worked",
          "muscles worked",
        );
        if (raw === undefined || raw === "") continue;
        const s = String(raw).trim();
        if (s) muscleLabels.add(s);
      }
      exercises.push({
        name,
        position: position++,
        muscleGroups: [...muscleLabels],
        sets,
      });
    }

    const startDate = new Date(startIso);
    const endDate = endIso ? new Date(endIso) : undefined;
    const durationSeconds = endDate
      ? Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 1000))
      : 0;

    sessions.push({
      userId,
      name: title,
      startDate: startIso,
      endDate: endIso,
      durationSeconds,
      exercises,
    });
  }

  sessions.sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
  );

  return {
    sessions: assignSessionIds(sessions),
    parseNotes: { skippedEmptyRows, skippedMissingStartTime },
  };
}
