"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { WorkoutConverter } from "@/lib/converters/types";

type FormatSelectorProps = {
  converters: WorkoutConverter[];
  /** `undefined` means auto-detect */
  converterOverride: string | undefined;
  onOverrideChange: (id: string | undefined) => void;
};

export function FormatSelector({
  converters,
  converterOverride,
  onOverrideChange,
}: FormatSelectorProps) {
  const value = converterOverride ?? "auto";

  return (
    <div className="grid gap-2">
      <Label htmlFor="format">File format</Label>
      <Select
        value={value}
        onValueChange={(next) =>
          onOverrideChange(!next || next === "auto" ? undefined : next)
        }
      >
        <SelectTrigger id="format" className="w-full max-w-md">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="auto">Auto-detect</SelectItem>
          {converters.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        If you upload both CSV and JSON, choose the format manually.
      </p>
    </div>
  );
}
