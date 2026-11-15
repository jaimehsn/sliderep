# Proposal

## Why

The owner's box programs workouts where several pieces share one clock, and today's blocks can't express them: each block has its own clock, so a buy-in, 5 rounds and a cash-out inside a 12-minute cap, or "50 cal row, then AMRAP in the time left", can only be approximated with separate blocks that each restart the clock. Change `window-model` (E1, archived 2026-11-14) rebuilt the engine on windows that hold structures, but still limited a continuous window to a single structure. This change is **E2** of that plan (`docs/ROADMAP.md` → WOD format as data). It lifts that limit and gives the editor templates so these workouts can be written in a few taps. The scope and rules were agreed in the explore session of 2026-11-15.

## What Changes

- **Several parts under one clock.** A block with a continuous clock (a For Time, a capped For Time, or an AMRAP) MAY hold several **parts** in order, all timed by the block's one clock.
  - Each part is **rounds**: N rounds, where 1 round is a buy-in, cash-out or chipper-like station list.
  - The last part MAY instead be an **AMRAP**, repeated until the block's time runs out. An AMRAP part needs a time limit and can only be the last part.
  - The time limit counts from the block's start, not from the part's.
  - EMOM blocks are unchanged.
- **Behavior follows the content:**
  - A block without an AMRAP part behaves like a For Time. It finishes on the last rep of its last part or at its cap, and it scores TIME or `CAP · N reps`.
  - A block ending in an AMRAP part behaves like an AMRAP. It ends when its time runs out. It scores `<rounds> + <reps>` of the AMRAP part, or `CAP · N reps` when the AMRAP part was never reached.
- **Judging.** The header's progress shows the current part's own progress: round x/5, station x/n, or the AMRAP's rounds. A block of several parts shows `PART n/N` above the exercise name, in the same place as `BLOCK n/N`; both together read `BLOCK n/N · PART n/N`.
- **Results.**
  - Splits keep their labels, counted within their part.
  - On a block of several parts, each part's splits sit under a `PART n` subheading on the result and adjust screens.
  - Accepting a no-rep moves later times earlier only in a block without an AMRAP part, the same rule For Time and AMRAP follow today.
- **Presentation.**
  - A block of several parts keeps the mode of its behavior ("FOR TIME", "12-MIN AMRAP").
  - Its description joins its parts with " → ".
  - Its exercise breakdown is grouped per part.
- **Editor.**
  - A block is created from a **template**: FOR TIME, AMRAP, EMOM, FOR TIME + BUY-IN/CASH-OUT, or BUY-IN + AMRAP. This replaces the FORMAT choice.
  - The template only fills the block's clock and parts. A FOR TIME or AMRAP block's parts can then be added, removed and edited freely.
  - DUPLICATE opens any workout, including one of several parts.
- **Storage.**
  - New workouts are saved in a new stored block shape: the clock plus its parts, or the clock plus its interval sequence. This includes EMOMs and one-part blocks.
  - Workouts already stored in the old layout, the built-ins among them, are still read as they are. Nothing is migrated.
- **No result changes.** Every existing workout keeps its score, splits, mode, description and breakdown. The result goldens and presentation snapshots are not re-recorded; new cases are added. `engineVersion` stays 1.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `wod-formats`: a For Time or AMRAP block may hold several parts under one clock, with the behavior, mode and description derived from them.
- `workout-editor`: templates replace the format choice, and a FOR TIME or AMRAP block becomes a time setting plus a list of parts.
- `judging`: the progress shown is the current part's, plus a `PART n/N` label on blocks of several parts.
- `session-results`: scoring of a block ending in an AMRAP part, and splits shown under a `PART n` subheading.
- `result-adjustment`: the no-rep review shows the part subheadings, and the time-shift rule is stated per block content (no AMRAP part vs ending in one).
- `library`: the breakdown of a block of several parts is grouped by part.

## Impact

- **Code**:
  - `constants/wod-engine.ts`:
    - The window check allows several `rounds` parts plus a final `cycle`.
    - Positions run across a window's parts.
    - New helpers for the part a position is in and the KPI within that part.
    - `view` gains a part label.
    - Mode, description and breakdown cover several parts.
  - `db/workouts.ts`: a second stored block shape and its strict parser, alongside the old one.
  - `components/editor/draft.ts` and `block-editor.tsx`: the block draft becomes a clock plus parts, with templates.
  - `components/result/replay.ts`: labels within a part, the score of a block ending in an AMRAP part, and each split's part index.
  - `components/result/result-screen.tsx` and `app/session/adjust.tsx`: the part subheadings.
  - `components/workout-breakdown.tsx`: part groups.
  - `app/session/run.tsx` and `hooks/use-judge.ts`: the part label.
- **Tests**:
  - New golden and presentation cases for the user's example 1 and a buy-in + AMRAP.
  - Draft tests for templates, parts and the new stored shape.
  - Engine tests for parsing the new shape.
  - Existing recorded files are untouched.
- **Database**: none. The schema stays v6. The new shape lives in the existing `workouts.blocks` JSON column.
- **Docs**: `CLAUDE.md` (WOD System, Storage, Workout Editor, Result Screen, Judge) and `docs/ROADMAP.md` (E2 done).
- **Dependencies**: none.
