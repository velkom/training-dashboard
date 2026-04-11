import JSZip from "jszip";

/**
 * Extracts File objects from a ZIP archive.
 */
export async function extractZip(zipFile: File): Promise<File[]> {
  const zip = await JSZip.loadAsync(await zipFile.arrayBuffer());
  const files: File[] = [];

  const entries = Object.values(zip.files).filter(
    (e) => !e.dir && !e.name.startsWith("__MACOSX"),
  );

  await Promise.all(
    entries.map(async (entry) => {
      const blob = await entry.async("blob");
      const name = entry.name.split("/").pop() ?? entry.name;
      files.push(new File([blob], name, { lastModified: Date.now() }));
    }),
  );

  return files;
}

/**
 * Recursively collects File objects from a dropped folder via
 * DataTransferItem entries (webkitGetAsEntry).
 */
export async function extractFolderEntries(
  items: DataTransferItemList,
): Promise<File[]> {
  const files: File[] = [];

  async function readEntry(entry: FileSystemEntry): Promise<void> {
    if (entry.isFile) {
      const file = await new Promise<File>((resolve, reject) => {
        (entry as FileSystemFileEntry).file(resolve, reject);
      });
      files.push(file);
    } else if (entry.isDirectory) {
      const reader = (entry as FileSystemDirectoryEntry).createReader();
      const entries = await new Promise<FileSystemEntry[]>((resolve, reject) => {
        reader.readEntries(resolve, reject);
      });
      await Promise.all(entries.map(readEntry));
    }
  }

  const entryPromises: Promise<void>[] = [];
  for (let i = 0; i < items.length; i++) {
    const entry = items[i]?.webkitGetAsEntry?.();
    if (entry) entryPromises.push(readEntry(entry));
  }
  await Promise.all(entryPromises);

  return files;
}

/**
 * Given raw files from the dropzone, expands any .zip archives
 * into their contained files. Non-zip files pass through as-is.
 */
export async function expandFiles(rawFiles: File[]): Promise<File[]> {
  const result: File[] = [];

  for (const file of rawFiles) {
    if (file.name.toLowerCase().endsWith(".zip")) {
      const extracted = await extractZip(file);
      result.push(...extracted);
    } else {
      result.push(file);
    }
  }

  return result;
}
