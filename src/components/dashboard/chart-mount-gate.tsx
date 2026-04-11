"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Recharts `ResponsiveContainer` needs non-zero layout; skip render until mounted.
 */
export function ChartMountGate({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) {
    return (
      <div
        className={cn(
          "flex h-full min-h-0 w-full min-w-0 items-center justify-center rounded-lg bg-muted/30 text-xs text-muted-foreground",
          className,
        )}
      >
        Loading chart…
      </div>
    );
  }
  return (
    <div className={cn("h-full min-h-0 w-full min-w-0", className)}>{children}</div>
  );
}
