"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UserId, WorkoutSession } from "@/types";

type EditSessionDialogProps = {
  session: WorkoutSession | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (session: WorkoutSession) => Promise<void>;
};

export function EditSessionDialog({
  session,
  open,
  onOpenChange,
  onSave,
}: EditSessionDialogProps) {
  const [name, setName] = useState("");
  const [userId, setUserId] = useState<UserId>("ilya");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (session) {
      setName(session.name);
      setUserId(session.userId);
    }
  }, [session]);

  async function handleSave() {
    if (!session) return;
    setSaving(true);
    try {
      await onSave({
        ...session,
        name: name.trim() || session.name,
        userId,
      });
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit workout</DialogTitle>
          <DialogDescription>
            Change the display name or profile. Session id stays the same for
            deduplication.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="edit-session-name">Name</Label>
            <Input
              id="edit-session-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="off"
            />
          </div>
          <div className="grid gap-2">
            <Label>Profile</Label>
            <Select
              value={userId}
              onValueChange={(v) => setUserId(v as UserId)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ilya">Ilya</SelectItem>
                <SelectItem value="nastya">Nastya</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter className="border-0 bg-transparent p-0 sm:justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
