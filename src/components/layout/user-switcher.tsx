"use client";

import { ChevronsUpDown } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWorkoutStore } from "@/hooks/use-workouts";
import type { UserFilter } from "@/lib/workout-stats";
import { cn } from "@/lib/utils";

const LABELS: Record<UserFilter, string> = {
  all: "All",
  ilya: "Ilya",
  nastya: "Nastya",
};

export function UserSwitcher() {
  const selectedUser = useWorkoutStore((s) => s.selectedUser);
  const setSelectedUser = useWorkoutStore((s) => s.setSelectedUser);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(buttonVariants({ variant: "outline" }), "gap-2")}
      >
        {LABELS[selectedUser]}
        <ChevronsUpDown className="size-4 opacity-60" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Profile</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(Object.keys(LABELS) as UserFilter[]).map((id) => (
          <DropdownMenuItem
            key={id}
            onClick={() => setSelectedUser(id)}
            data-state={selectedUser === id ? "active" : undefined}
          >
            {LABELS[id]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
