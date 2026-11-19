# Proposal

## Why

The owner's box programs a workout it calls "AMRAP": every 3:00 × 5, with 2:00 of work, do a 200 m run and 8 burpees, then max power snatches until the work time ends, and score the total power snatches. The app can't represent it, because every line needs a target. This change is E3 of the window-model plan in `docs/ROADMAP.md`, after `window-model` (E1) and `shared-clock` (E2).

## What Changes

- An interval's last line MAY be a **MAX line**. It has no target and no increment, but may keep its rep description and load. It counts every valid rep from when it is reached until the interval's work time ends. The lines before it in the interval are a buy-in that must be completed to reach it, and they don't score.
- MAX lines exist only in interval blocks (EMOM). FOR TIME and AMRAP blocks don't take them; a continuous "buy-in, then max" is already a BUY-IN + AMRAP template with one exercise.
- An interval with a MAX line counts as missed when its buy-in wasn't completed, so a stopping EMOM ends there. An interval of only a MAX line is never missed.
- **Score:** a block with MAX lines is scored "<N> reps", the total of valid reps on its MAX lines (all of them, whichever exercise). Splits keep one row per line, and the MAX line shows its reps without a target. On a stopping EMOM, only the intervals up to the one where it stopped count.
- **Several blocks:** the workout still scores by its SCORES block. A block with MAX lines scores its MAX total.
- **Judging:** on a MAX line the count shows "MAX" in place of the reps left and the target.
- **Breakdown and summary:** a MAX line shows "MAX" in place of its reps, e.g. "200 m + 8 + MAX / interval".
- **No-rep review:** accepting a no-rep on a MAX line adds one rep to the MAX total.
- **Editor:**
  - A MAX checkbox on an interval's last line. When on, the REPS and +/ROUND fields hide.
  - Adding an exercise to an interval places it before a MAX line.
  - A new template, EVERY + BUY-IN + MAX: every 180 s, 5 intervals, 120 s of work, one interval of two buy-in lines and a MAX line.
  - DUPLICATE keeps MAX lines.
- **Storage:** a MAX line is stored as `{ exerciseId, max: true }` with no `target`, only in the window-shaped stored block the editor writes. No migration. `engineVersion` stays 1: no stored workout has a MAX line, so no recorded result changes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `wod-formats`: MAX lines in interval blocks: where they may appear, how they count, when their interval is missed, and how they're stored.
- `session-results`: the score and splits of a block with MAX lines, including a stopping one.
- `judging`: the live count on a MAX line.
- `result-adjustment`: accepted no-reps on a MAX line.
- `workout-editor`: the MAX checkbox, line placement, the EVERY + BUY-IN + MAX template, and DUPLICATE.
- `library`: how a MAX line is summarized in the breakdown.

## Impact

- **Engine** (`constants/wod-engine.ts`):
  - `WodLine.max`, checks in `checkWindow`, and a target of 0 for a MAX line.
  - In `apply`, a MAX line counts reps uncapped.
  - `intervalMissed`, `summarize`, and `view` (a `max` flag) handle MAX lines.
  - The description is unchanged.
- **Storage** (`db/workouts.ts`): `StoredLine.max`, parsed strictly in window blocks only.
- **Results:**
  - `components/result/replay.ts`: the MAX score and `Split.max`.
  - `components/result/adjust.ts`: no rule change expected, verified by goldens.
- **Editor:**
  - `components/editor/draft.ts`: `EmomRow.max`, the template, and line placement.
  - `components/editor/block-editor.tsx`: the MAX checkbox.
- **Screens:**
  - `components/judge/count-readout.tsx` and `hooks/use-judge.ts`.
  - The split rows in `components/result/result-screen.tsx` and `app/session/adjust.tsx`.
- **Tests:** new fixtures, goldens and presentation snapshots. No recorded file changes.
- **Docs:** `CLAUDE.md` and `docs/ROADMAP.md`.
