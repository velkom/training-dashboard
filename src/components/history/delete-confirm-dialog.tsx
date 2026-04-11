"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { WorkoutSession } from "@/types";

type DeleteConfirmDialogProps = {
  session: WorkoutSession | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (id: string) => Promise<void>;
};

export function DeleteConfirmDialog({
  session,
  open,
  onOpenChange,
  onConfirm,
}: DeleteConfirmDialogProps) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!session) return;
    setDeleting(true);
    try {
      await onConfirm(session.id);
      onOpenChange(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete workout?</DialogTitle>
          <DialogDescription>
            This removes the session from your library. You can import it again
            later if needed.
          </DialogDescription>
        </DialogHeader>
        {session ? (
          <p className="rounded-md border border-border/60 bg-muted/30 px-3 py-2 text-sm">
            <span className="font-medium">{session.name}</span>
            <br />
            <span className="text-muted-foreground">
              {new Date(session.startDate).toLocaleString("en-US")}
            </span>
          </p>
        ) : null}
        <DialogFooter className="border-0 bg-transparent p-0 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => void handleDelete()}
            disabled={deleting}
          >
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
