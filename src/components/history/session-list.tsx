"use client";

import { SessionRow } from "@/components/history/session-row";
import type { WorkoutSession } from "@/types";

type SessionListProps = {
  sessions: WorkoutSession[];
  showUserBadge: boolean;
  onEditRequest: (session: WorkoutSession) => void;
  onDeleteRequest: (session: WorkoutSession) => void;
};

export function SessionList({
  sessions,
  showUserBadge,
  onEditRequest,
  onDeleteRequest,
}: SessionListProps) {
  if (sessions.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border/60 bg-muted/10 px-4 py-10 text-center text-sm text-muted-foreground">
        No workouts match your filters. Try clearing the search or switching the
        profile filter in the header.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {sessions.map((s) => (
        <SessionRow
          key={s.id}
          session={s}
          showUserBadge={showUserBadge}
          onEditRequest={onEditRequest}
          onDeleteRequest={onDeleteRequest}
        />
      ))}
    </div>
  );
}
