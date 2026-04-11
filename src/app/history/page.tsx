"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DeleteConfirmDialog } from "@/components/history/delete-confirm-dialog";
import { EditSessionDialog } from "@/components/history/edit-session-dialog";
import { SessionList } from "@/components/history/session-list";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSelectedUser, useWorkoutStore } from "@/stores/workout-store";
import { filterSessions } from "@/lib/workout-stats";
import type { WorkoutSession } from "@/types";

export default function HistoryPage() {
  const sessions = useWorkoutStore((s) => s.sessions);
  const selectedUser = useSelectedUser();
  const updateSession = useWorkoutStore((s) => s.updateSession);
  const deleteSession = useWorkoutStore((s) => s.deleteSession);
  const clearAllSessions = useWorkoutStore((s) => s.clearAllSessions);

  const [query, setQuery] = useState("");
  const [clearOpen, setClearOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [editTarget, setEditTarget] = useState<WorkoutSession | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<WorkoutSession | null>(null);

  const scoped = useMemo(
    () => filterSessions(sessions, selectedUser),
    [sessions, selectedUser],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return scoped;
    return scoped.filter((s) => s.name.toLowerCase().includes(q));
  }, [scoped, query]);

  const sorted = useMemo(
    () =>
      [...filtered].sort(
        (a, b) =>
          new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
      ),
    [filtered],
  );

  async function handleUpdate(s: WorkoutSession) {
    try {
      await updateSession(s);
      toast.success("Workout updated.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update");
      throw e;
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteSession(id);
      toast.success("Workout removed.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete");
      throw e;
    }
  }

  async function handleClearAll() {
    setClearing(true);
    try {
      await clearAllSessions();
      toast.success("All workouts cleared.");
      setClearOpen(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not clear");
    } finally {
      setClearing(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">History</h1>
        <p className="text-sm text-muted-foreground">
          Review every imported workout, expand for sets, edit metadata, or
          delete mistakes. Uses the profile filter in the header.
        </p>
      </div>

      <Card className="border-border/80 bg-card/60 backdrop-blur-sm">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Workouts</CardTitle>
              <CardDescription>
                Showing {sorted.length} of {scoped.length} in view
                {selectedUser !== "all" ? ` (${selectedUser})` : ""}.
              </CardDescription>
            </div>
            <Badge variant="secondary" className="shrink-0">
              {sorted.length} shown
            </Badge>
          </div>
          <div className="relative max-w-md">
            <Label htmlFor="history-search" className="sr-only">
              Search by name
            </Label>
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="history-search"
              placeholder="Search by workout name…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {sessions.length === 0 ? (
            <Alert>
              <AlertTitle>No data yet</AlertTitle>
              <AlertDescription>
                Import workouts from the Import page to build your history.
              </AlertDescription>
            </Alert>
          ) : (
            <ScrollArea className="max-h-[min(70vh,720px)] pr-3">
              <SessionList
                sessions={sorted}
                showUserBadge={selectedUser === "all"}
                onEditRequest={setEditTarget}
                onDeleteRequest={setDeleteTarget}
              />
            </ScrollArea>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-4">
            <p className="text-xs text-muted-foreground">
              Clear all removes every session for every profile from this
              browser.
            </p>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={sessions.length === 0}
              onClick={() => setClearOpen(true)}
            >
              Clear all workouts
            </Button>
          </div>
        </CardContent>
      </Card>

      <EditSessionDialog
        session={editTarget}
        open={editTarget !== null}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
        onSave={handleUpdate}
      />
      <DeleteConfirmDialog
        session={deleteTarget}
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={handleDelete}
      />

      <Dialog open={clearOpen} onOpenChange={setClearOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Clear all workouts?</DialogTitle>
            <DialogDescription>
              This permanently removes {sessions.length} session
              {sessions.length === 1 ? "" : "s"} from local storage. This cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setClearOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => void handleClearAll()}
              disabled={clearing || sessions.length === 0}
            >
              {clearing ? "Clearing…" : "Clear everything"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
