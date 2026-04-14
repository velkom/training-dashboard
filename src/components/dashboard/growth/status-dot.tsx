"use client";

import { STATUS_LABELS, statusColorClasses, type TrainingStatus } from "@/lib/muscles";

export type StatusDotProps = {
  status: TrainingStatus;
};

export function StatusDot({ status }: StatusDotProps) {
  return (
    <span
      className={statusColorClasses(status).dot}
      title={STATUS_LABELS[status]}
      aria-hidden
    />
  );
}
