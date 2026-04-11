# Training Dashboard

Web dashboard for workout history (CSV/JSON exports from mobile apps).

## Getting started

```bash
npm install
npm run dev
```

Use `npm install` on its own line (do not append `# …` on the same line—npm may treat `#` as a package name and error).

If the dev server shows strange `ENOENT` errors under `.next/`, stop it, run `rm -rf .next`, then `npm run dev` again.

Open [http://localhost:3000](http://localhost:3000).

## Import

- **Hevy** — CSV export (one row per set). Muscle columns are read when present.
- **Daily Strength / JSON** — array of sessions or `{ sessions }` / `{ workouts }`; with multiple files, `WorkoutSession.json` is preferred when present.

Re-importing the full history does not create duplicates: sessions match by stable `id`.

## Stack

Next.js 15, TypeScript, Tailwind v4, shadcn/ui, Zustand, Recharts, PapaParse. Data is stored in `localStorage` via `WorkoutRepository`.

## Scripts

| Command           | Description        |
| ----------------- | ------------------ |
| `npm run dev`     | Development server |
| `npm run build`   | Production build   |
| `npm run lint`    | ESLint             |

## Publish to GitHub

Workout data stays in your browser (`localStorage`); only application code goes to the repo.

**Option A — GitHub CLI** (install with `brew install gh`, then `gh auth login`):

```bash
gh repo create training-dashboard --public --source=. --remote=origin --push
```

**Option B — GitHub website**: create a new empty public repository named `training-dashboard`, then:

```bash
git remote add origin https://github.com/<your-username>/training-dashboard.git
git push -u origin main
```

If `origin` already exists, use `git remote set-url origin <url>` instead of `add`.
