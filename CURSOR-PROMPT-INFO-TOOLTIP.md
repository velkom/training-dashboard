# Cursor Prompt: Add Info Tooltip to Weekly Growth Stimulus

## What to do

Add a small info icon (ⓘ) next to the "Weekly growth stimulus" title in the dashboard card. Clicking or hovering it opens a popover/dialog that explains how the system works and what the five stimulus zones mean.

## Where to add it

**File:** `src/components/dashboard/growth/index.tsx`

The title is on line 48:
```tsx
<CardTitle>Weekly growth stimulus</CardTitle>
```

Place a small `Info` icon (from `lucide-react`) right after the title text, inline. On click, open a popover or a small dialog with the explanation content.

## UI component to use

There is no Popover component in `src/components/ui/` yet. Two options:

**Option A (recommended):** Use the existing `Dialog` component (`src/components/ui/dialog.tsx`). Render a small button with the Info icon. On click, open a Dialog with the explanation. This works well on mobile.

**Option B:** Install shadcn Popover (`npx shadcn@latest add popover`) and use it for a lighter hover/click popover. Better for desktop but may need mobile handling.

Pick whichever is simpler. Dialog already exists and works.

## Info icon styling

- Use `lucide-react` `Info` icon
- Size: `size-4` (16px)
- Color: `text-muted-foreground`
- Hover: `hover:text-foreground`
- Cursor: `cursor-pointer`
- Vertically aligned with the title text
- Add `aria-label="How weekly growth stimulus works"`

## Explanation content

Use this exact content inside the popover/dialog. Keep it concise and scannable.

**Title:** How this works

**Body:**

Each exercise you log contributes to weekly effective sets for the muscles it trains.

Primary muscles get full credit (1 set = 1 effective set). Secondary muscles get half credit (1 set = 0.5 effective sets). For example, 3 sets of bench press gives your chest 3 effective sets and your triceps 1.5.

Your weekly total per muscle falls into one of five zones:

| Sets/week | Zone | What it means |
|---|---|---|
| 0–5 | Insufficient | Likely too little volume for growth |
| 6–9 | Minimal | Some stimulus, but near the low end |
| 10–14 | Solid | Strong range for muscle growth |
| 15–20 | High | High volume — benefits if recovery is good |
| 20+ | Very high | Very high volume — likely doesn't need more |

Exercises that can't be matched to a known muscle mapping are listed as "unmapped" and don't count toward any muscle.

**End of content.**

## Styling the explanation

- Use the same card/muted styling as the rest of the dashboard
- The table should use the existing `Table` component from `src/components/ui/table.tsx`, or simple styled HTML table with `text-sm` and muted borders
- Color-code each zone row's label with its status color (use `statusColorClasses()` from `src/lib/muscles/format.ts` for the dot or text color)
- Keep total height reasonable — content should not require excessive scrolling

## What NOT to do

- Do not add a tooltip that only shows on hover (not accessible, doesn't work on mobile)
- Do not add a separate page or route
- Do not change any calculation logic
- Do not change zone names, thresholds, or wording beyond what is specified above
