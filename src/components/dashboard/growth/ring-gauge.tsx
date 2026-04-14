"use client";

export type GrowthRingGaugeProps = {
  solidOrBetterCount: number;
  trainedCount: number;
};

export function GrowthRingGauge({
  solidOrBetterCount,
  trainedCount,
}: GrowthRingGaugeProps) {
  const ringPct =
    trainedCount > 0 ? (solidOrBetterCount / trainedCount) * 100 : 0;
  const circumference = 100;
  const offset = circumference - ringPct;

  return (
    <div
      className="relative flex h-14 w-14 shrink-0 items-center justify-center"
      aria-label={`${solidOrBetterCount} of ${trainedCount} trained muscles in solid growth range or better`}
    >
      <svg
        viewBox="0 0 36 36"
        className="absolute inset-0 size-full rotate-[-90deg]"
        aria-hidden
      >
        <circle
          cx="18"
          cy="18"
          r="15.915"
          fill="none"
          className="stroke-muted/20"
          strokeWidth={5}
        />
        <circle
          cx="18"
          cy="18"
          r="15.915"
          fill="none"
          className="stroke-fitness-solid"
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray="100"
          strokeDashoffset={offset}
          pathLength={100}
          style={{
            transition:
              "stroke-dashoffset 0.8s cubic-bezier(0.2, 0, 0, 1)",
          }}
        />
      </svg>
      <div className="pointer-events-none relative z-10 flex items-baseline justify-center gap-0.5 tabular-nums">
        <span className="text-[13px] font-bold leading-none text-foreground">
          {solidOrBetterCount}
        </span>
        <span className="text-[10px] font-semibold leading-none text-muted-foreground">
          /{trainedCount}
        </span>
      </div>
    </div>
  );
}
