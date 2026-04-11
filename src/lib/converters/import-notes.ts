/** Optional metadata from a converter parse (e.g. CSV row cleanup). */
export type ImportParseNotes = {
  skippedEmptyRows: number;
  skippedMissingStartTime: number;
};
