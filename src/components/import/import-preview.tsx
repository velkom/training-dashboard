"use client";

import { useMemo } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useWorkoutStore } from "@/stores/workout-store";
import type { WorkoutSession } from "@/types";

type ImportPreviewProps = {
  sessions: WorkoutSession[];
  converterName: string;
  onConfirm: () => Promise<void>;
  onBack: () => void;
  isSaving?: boolean;
};

export function ImportPreview({
  sessions,
  converterName,
  onConfirm,
  onBack,
  isSaving,
}: ImportPreviewProps) {
  const existing = useWorkoutStore((s) => s.sessions);

  const { newCount, duplicateCount } = useMemo(() => {
    const ids = new Set(existing.map((s) => s.id));
    let dup = 0;
    for (const s of sessions) {
      if (ids.has(s.id)) dup += 1;
    }
    return {
      newCount: sessions.length - dup,
      duplicateCount: dup,
    };
  }, [existing, sessions]);

  const previewRows = sessions.slice(0, 12);

  return (
    <Card className="border-border/80 bg-card/60 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Preview</CardTitle>
        <CardDescription>
          Source: <span className="font-medium">{converterName}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTitle>Import summary</AlertTitle>
          <AlertDescription className="space-y-1 text-sm">
            <p>Total in file: {sessions.length}</p>
            <p>New: {newCount}</p>
            <p>Already in library (duplicates): {duplicateCount}</p>
          </AlertDescription>
        </Alert>

        <div className="rounded-lg border border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Exercises</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {previewRows.map((s) => (
                <TableRow key={`${s.id}-preview`}>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(s.startDate).toLocaleString("en-US")}
                  </TableCell>
                  <TableCell className="text-right">
                    {s.exercises.length}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {sessions.length > previewRows.length ? (
          <p className="text-xs text-muted-foreground">
            Showing first {previewRows.length} of {sessions.length}.
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={onBack}>
            Back
          </Button>
          <Button type="button" onClick={() => void onConfirm()} disabled={isSaving}>
            {isSaving ? "Saving…" : "Import"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
