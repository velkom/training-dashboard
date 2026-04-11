"use client";

import { FolderOpen, Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { extractFolderEntries } from "@/lib/extract-files";

type FileDropzoneProps = {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
};

export function FileDropzone({
  onFiles,
  accept = ".csv,.json,.zip,application/json,text/csv,application/zip",
  multiple = true,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const folderRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(
    (list: FileList | null) => {
      if (!list?.length) return;
      onFiles(Array.from(list));
    },
    [onFiles],
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);

      const items = e.dataTransfer.items;
      const hasDirectory = Array.from(items).some(
        (item) => item.webkitGetAsEntry?.()?.isDirectory,
      );

      if (hasDirectory) {
        const files = await extractFolderEntries(items);
        if (files.length > 0) {
          onFiles(files);
          return;
        }
      }

      handleFiles(e.dataTransfer.files);
    },
    [onFiles, handleFiles],
  );

  return (
    <div className="space-y-2">
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => void handleDrop(e)}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 transition-all duration-200 ease-out",
          dragOver
            ? "scale-[1.02] border-primary bg-primary/10 ring-2 ring-primary/25"
            : "border-muted-foreground/25 hover:border-primary/40 hover:bg-muted/20",
        )}
      >
        <Upload
          className={cn(
            "size-10 text-muted-foreground transition-transform duration-200",
            dragOver && "scale-110 text-primary",
          )}
        />
        <div className="text-center text-sm">
          <p className="font-medium">Drop files, a folder, or a ZIP here</p>
          <p className="text-muted-foreground">or click to browse</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFiles(e.target.files)}
        />
        <input
          ref={folderRef}
          type="file"
          className="hidden"
          // @ts-expect-error -- webkitdirectory is not in TS types
          webkitdirectory=""
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      <button
        type="button"
        onClick={() => folderRef.current?.click()}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <FolderOpen className="size-3.5" />
        Or select a folder
      </button>
    </div>
  );
}
