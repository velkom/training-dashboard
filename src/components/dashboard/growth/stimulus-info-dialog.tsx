"use client";

import { Info } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { STATUS_LABELS, statusColorClasses, type TrainingStatus } from "@/lib/muscles";

const ZONE_ROWS: {
  sets: string;
  status: TrainingStatus;
  meaning: string;
}[] = [
  { sets: "0–5", status: "insufficient", meaning: "Likely too little volume for growth" },
  { sets: "6–9", status: "minimal", meaning: "Some stimulus, but near the low end" },
  { sets: "10–14", status: "solid", meaning: "Strong range for muscle growth" },
  { sets: "15–20", status: "high", meaning: "High volume — benefits if recovery is good" },
  { sets: "20+", status: "very_high", meaning: "Very high volume — likely doesn't need more" },
];

export function StimulusInfoDialog() {
  return (
    <Dialog>
      <DialogTrigger
        className="inline-flex cursor-pointer items-center text-muted-foreground transition-colors hover:text-foreground"
        aria-label="How weekly growth stimulus works"
      >
        <Info className="size-4" />
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>How this works</DialogTitle>
          <DialogDescription>
            Each exercise you log contributes to weekly effective sets for the
            muscles it trains.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm text-foreground">
          <p>
            Primary muscles get full credit (1 set = 1 effective set). Secondary
            muscles get half credit (1 set = 0.5 effective sets). For example, 3
            sets of bench press gives your chest 3 effective sets and your
            triceps 1.5.
          </p>

          <p className="font-medium">
            Your weekly total per muscle falls into one of five zones:
          </p>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 text-left text-xs text-muted-foreground">
                <th className="pb-2 pr-3 font-medium">Sets/week</th>
                <th className="pb-2 pr-3 font-medium">Zone</th>
                <th className="pb-2 font-medium">What it means</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {ZONE_ROWS.map((row) => {
                const colors = statusColorClasses(row.status);
                return (
                  <tr key={row.status}>
                    <td className="py-1.5 pr-3 tabular-nums">{row.sets}</td>
                    <td className="py-1.5 pr-3">
                      <span className="inline-flex items-center gap-1.5">
                        <span className={colors.dot} />
                        <span className="font-medium">
                          {STATUS_LABELS[row.status]}
                        </span>
                      </span>
                    </td>
                    <td className="py-1.5 text-muted-foreground">
                      {row.meaning}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <p className="text-muted-foreground">
            Exercises that can&apos;t be matched to a known muscle mapping are
            listed as &ldquo;unmapped&rdquo; and don&apos;t count toward any
            muscle.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
