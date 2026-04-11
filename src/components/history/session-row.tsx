"use client";

import { ChevronDown, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { UserId, WorkoutSession, WorkoutSetType } from "@/types";

const USER_LABEL: Record<UserId, string> = {
  ilya: "Ilya",
  nastya: "Nastya",
};

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function setTypeLabel(t: WorkoutSetType): string {
  switch (t) {
    case "normal":
      return "Normal";
    case "warmup":
      return "Warm-up";
    case "dropset":
      return "Drop";
    case "left":
      return "L";
    case "right":
      return "R";
    case "failure":
      return "Failure";
    default: {
      const _exhaustive: never = t;
      return _exhaustive;
    }
  }
}

type SessionRowProps = {
  session: WorkoutSession;
  showUserBadge: boolean;
  onEditRequest: (session: WorkoutSession) => void;
  onDeleteRequest: (session: WorkoutSession) => void;
};

export function SessionRow({
  session,
  showUserBadge,
  onEditRequest,
  onDeleteRequest,
}: SessionRowProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-border/60 bg-card/40">
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setExpanded((v) => !v);
            }
          }}
          onClick={() => setExpanded((v) => !v)}
          className="flex cursor-pointer flex-wrap items-center gap-3 p-4 text-left transition-colors hover:bg-muted/20"
        >
          <span className="text-muted-foreground">
            {expanded ? (
              <ChevronDown className="size-4" />
            ) : (
              <ChevronRight className="size-4" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-2">
              <p className="font-medium leading-tight">{session.name}</p>
              {showUserBadge ? (
                <Badge variant="secondary" className="text-[10px]">
                  {USER_LABEL[session.userId]}
                </Badge>
              ) : null}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {new Date(session.startDate).toLocaleString("en-US")} ·{" "}
              {formatDuration(session.durationSeconds)} ·{" "}
              {session.exercises.length} exercise
              {session.exercises.length === 1 ? "" : "s"}
            </p>
          </div>
          <div
            className="flex shrink-0 gap-1"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Edit workout"
              onClick={() => onEditRequest(session)}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="text-destructive hover:text-destructive"
              aria-label="Delete workout"
              onClick={() => onDeleteRequest(session)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        </div>

        {expanded ? (
          <div className="space-y-4 border-t border-border/50 px-4 pb-4 pt-3">
            {session.exercises
              .slice()
              .sort((a, b) => a.position - b.position)
              .map((ex) => (
                <div key={`${session.id}-${ex.position}-${ex.name}`} className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{ex.name}</p>
                    {ex.muscleGroups.map((m) => (
                      <Badge key={m} variant="outline" className="text-[10px] font-normal">
                        {m}
                      </Badge>
                    ))}
                  </div>
                  <div className="overflow-x-auto rounded-lg border border-border/50">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-12">Set</TableHead>
                          <TableHead className="text-right">kg</TableHead>
                          <TableHead className="text-right">Reps</TableHead>
                          <TableHead>Type</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ex.sets.map((st) => (
                          <TableRow key={`${ex.name}-${st.setNumber}`}>
                            <TableCell className="tabular-nums">{st.setNumber}</TableCell>
                            <TableCell className="text-right tabular-nums">
                              {st.weight != null ? st.weight : "—"}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {st.reps != null ? st.reps : "—"}
                            </TableCell>
                            <TableCell
                              className={cn(
                                st.setType !== "normal" && "text-primary",
                              )}
                            >
                              {setTypeLabel(st.setType)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
          </div>
        ) : null}
    </div>
  );
}
