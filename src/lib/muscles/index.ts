export type { MuscleCategoryId, MuscleSetsRecord } from "./constants";
export {
  MUSCLE_CATEGORIES,
  MUSCLE_IDS,
  MUSCLE_LABELS,
  SECONDARY_SET_WEIGHT,
  SETS_HIGH_MAX,
  SETS_INSUFFICIENT_MAX,
  SETS_MINIMAL_MAX,
  SETS_SOLID_MAX,
  type MuscleAllocation,
  type MuscleId,
  type MuscleMapEntry,
  type TrainingStatus,
} from "./constants";
export {
  allocateFromExerciseMapEntry,
  allocateFromImportMuscleLabels,
  allocateFromStructuredImportData,
  countWorkingSets,
  exerciseVolumeKg,
  getStructuredImportMapEntry,
  resolveMuscleAllocations,
} from "./allocation";
export {
  analyzeExerciseMappings,
  type ExerciseMappingInfo,
  type MappingAnalysisResult,
  type MappingSource,
} from "./exercise-mapping-analysis";
export { EXERCISE_MUSCLE_MAP, lookupExerciseMap, normalizeExerciseName } from "./exercise-map";
export { emptyMuscleRecord, STATUS_LABELS, statusFromWeeklySets } from "./status";
export {
  formatSets,
  statusColorClasses,
  statusSortKey,
  type StatusColorClasses,
} from "./format";
