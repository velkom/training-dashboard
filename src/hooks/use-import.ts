"use client";

import { useCallback, useMemo, useState } from "react";

import { convertWithDetection, detectConverter, listConverters } from "@/lib/converters";
import type { ImportParseNotes, WorkoutConverter } from "@/lib/converters/types";
import { expandFiles } from "@/lib/extract-files";
import type { MuscleMapEntry } from "@/lib/muscles";
import type { UserId, WorkoutSession } from "@/types";

export type ImportStep = "pick_files" | "preview" | "review_mappings";

export function useImportFlow(defaultUser: UserId = "nastya") {
  const [step, setStep] = useState<ImportStep>("pick_files");
  const [files, setFilesRaw] = useState<File[]>([]);
  const [expandedFiles, setExpandedFiles] = useState<File[]>([]);
  const [userId, setUserId] = useState<UserId>(defaultUser);
  const [converterOverride, setConverterOverride] = useState<string | undefined>();
  const [preview, setPreview] = useState<WorkoutSession[]>([]);
  const [activeConverter, setActiveConverter] = useState<WorkoutConverter | null>(
    null,
  );
  const [parseNotes, setParseNotes] = useState<ImportParseNotes | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expanding, setExpanding] = useState(false);
  const [pendingMappings, setPendingMappings] = useState<
    Record<string, MuscleMapEntry>
  >({});

  const setFiles = useCallback(async (raw: File[]) => {
    setFilesRaw(raw);
    setError(null);

    const hasZip = raw.some((f) => f.name.toLowerCase().endsWith(".zip"));
    const hasMany = raw.length > 5;

    if (hasZip || hasMany) {
      setExpanding(true);
      try {
        const expanded = await expandFiles(raw);
        setExpandedFiles(expanded);
      } catch {
        setError("Failed to extract archive.");
        setExpandedFiles(raw);
      } finally {
        setExpanding(false);
      }
    } else {
      setExpandedFiles(raw);
    }
  }, []);

  const effectiveFiles = expandedFiles;

  const detected = useMemo(() => {
    if (effectiveFiles.length === 0) return undefined;
    return detectConverter(effectiveFiles);
  }, [effectiveFiles]);

  const reset = useCallback(() => {
    setStep("pick_files");
    setFilesRaw([]);
    setExpandedFiles([]);
    setPreview([]);
    setActiveConverter(null);
    setParseNotes(null);
    setError(null);
    setConverterOverride(undefined);
    setPendingMappings({});
  }, []);

  const runParse = useCallback(async () => {
    setError(null);
    if (effectiveFiles.length === 0) {
      setError("Add at least one file.");
      return;
    }
    if (!converterOverride && !detectConverter(effectiveFiles)) {
      setError("Could not detect format. Pick a source manually.");
      return;
    }
    try {
      const { converter, sessions, parseNotes: notes } = await convertWithDetection(
        effectiveFiles,
        userId,
        converterOverride,
      );
      setActiveConverter(converter);
      setPreview(sessions);
      setParseNotes(notes ?? null);
      setStep("preview");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed");
    }
  }, [effectiveFiles, userId, converterOverride]);

  const converters = useMemo(() => listConverters(), []);

  return {
    step,
    setStep,
    files: files,
    setFiles,
    userId,
    setUserId,
    converterOverride,
    setConverterOverride,
    preview,
    activeConverter,
    parseNotes,
    error,
    setError,
    detected,
    converters,
    reset,
    runParse,
    expanding,
    pendingMappings,
    setPendingMappings,
  };
}
