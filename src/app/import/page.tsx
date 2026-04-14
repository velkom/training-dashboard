"use client";

import { useState } from "react";
import { toast } from "sonner";

import { FileDropzone } from "@/components/import/file-dropzone";
import { FormatSelector } from "@/components/import/format-selector";
import { ImportPreview } from "@/components/import/import-preview";
import { MappingReview } from "@/components/import/mapping-review";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useImportFlow } from "@/hooks/use-import";
import { useUserExerciseMappingsStore } from "@/stores/user-exercise-mappings";
import { useSelectedUser, useWorkoutStore } from "@/stores/workout-store";
import type { UserId } from "@/types";

export default function ImportPage() {
  const selectedUser = useSelectedUser();
  const defaultUser: UserId =
    selectedUser === "ilya" || selectedUser === "nastya"
      ? selectedUser
      : "nastya";
  const flow = useImportFlow(defaultUser);
  const addImported = useWorkoutStore((s) => s.addImported);
  const setUserMapping = useUserExerciseMappingsStore((s) => s.setMapping);
  const removeUserMapping = useUserExerciseMappingsStore((s) => s.removeMapping);
  const [saving, setSaving] = useState(false);

  async function runImport(savePendingMappings: boolean): Promise<void> {
    setSaving(true);
    try {
      if (savePendingMappings) {
        for (const [normalizedName, entry] of Object.entries(
          flow.pendingMappings,
        )) {
          if (entry.primary.length > 0) {
            setUserMapping(normalizedName, entry);
          } else {
            removeUserMapping(normalizedName);
          }
        }
      }
      const res = await addImported(flow.preview);
      toast.success(
        `Import complete: added ${res.added}, skipped ${res.skipped}.`,
      );
      flow.reset();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Could not save import",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Import</h1>
        <p className="text-sm text-muted-foreground">
          Drop a ZIP, a folder, or individual files from your fitness app.
          Format is detected automatically and duplicates are skipped.
        </p>
      </div>

      {flow.step === "pick_files" ? (
        <Card className="border-border/80 bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Files</CardTitle>
            <CardDescription>
              CSV (Hevy), JSON files, folder, or ZIP (Daily Strength and
              similar exports).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-2">
              <Label>Assign import to</Label>
              <Select
                value={flow.userId}
                onValueChange={(v) => flow.setUserId(v as UserId)}
              >
                <SelectTrigger className="max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ilya">Ilya</SelectItem>
                  <SelectItem value="nastya">Nastya</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <FormatSelector
              converters={flow.converters}
              converterOverride={flow.converterOverride}
              onOverrideChange={flow.setConverterOverride}
            />

            <FileDropzone
              onFiles={(f) => {
                flow.setFiles(f);
              }}
            />

            {flow.expanding ? (
              <p className="text-xs text-muted-foreground animate-pulse">
                Extracting files…
              </p>
            ) : flow.files.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-muted-foreground">Selected:</span>
                {flow.files.length <= 6
                  ? flow.files.map((f) => (
                      <Badge key={f.name + f.size} variant="secondary">
                        {f.name}
                      </Badge>
                    ))
                  : (
                      <Badge variant="secondary">
                        {flow.files.length} files
                      </Badge>
                    )}
              </div>
            ) : null}

            {flow.detected ? (
              <p className="text-xs text-muted-foreground">
                Detected format:{" "}
                <span className="font-medium">{flow.detected.name}</span>
              </p>
            ) : flow.files.length > 0 && !flow.expanding ? (
              <p className="text-xs text-amber-500 dark:text-amber-400">
                Auto-detect did not match — pick the format manually.
              </p>
            ) : null}

            {flow.error ? (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{flow.error}</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex gap-2">
              <Button
                type="button"
                onClick={() => void flow.runParse()}
                disabled={flow.files.length === 0 || flow.expanding}
              >
                Parse
              </Button>
              <Button type="button" variant="outline" onClick={flow.reset}>
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {flow.step === "preview" ? (
        <ImportPreview
          sessions={flow.preview}
          converterName={flow.activeConverter?.name ?? "—"}
          parseNotes={flow.parseNotes}
          onBack={() => flow.setStep("pick_files")}
          onContinueToReview={() => flow.setStep("review_mappings")}
        />
      ) : null}

      {flow.step === "review_mappings" ? (
        <MappingReview
          sessions={flow.preview}
          pendingMappings={flow.pendingMappings}
          setPendingMappings={flow.setPendingMappings}
          onBack={() => flow.setStep("preview")}
          isSaving={saving}
          onSkip={() => runImport(false)}
          onConfirm={() => runImport(true)}
        />
      ) : null}
    </div>
  );
}
