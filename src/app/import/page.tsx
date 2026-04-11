"use client";

import { useState } from "react";
import { toast } from "sonner";

import { FileDropzone } from "@/components/import/file-dropzone";
import { FormatSelector } from "@/components/import/format-selector";
import { ImportPreview } from "@/components/import/import-preview";
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
  const [saving, setSaving] = useState(false);

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Import</h1>
        <p className="text-sm text-muted-foreground">
          Drop a ZIP, a folder, or individual files from your fitness app.
          Format is detected automatically and duplicates are skipped.
        </p>
      </div>

      {flow.step !== "preview" ? (
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
      ) : (
        <ImportPreview
          sessions={flow.preview}
          converterName={flow.activeConverter?.name ?? "—"}
          isSaving={saving}
          onBack={() => flow.setStep("pick_files")}
          onConfirm={async () => {
            setSaving(true);
            try {
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
          }}
        />
      )}
    </div>
  );
}
