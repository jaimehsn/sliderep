# Proposal

## Why

Many workouts are more than one piece. Two examples:
- "Run 400 m, then a 12-minute AMRAP, then run 400 m" has a buy-in and a cash-out.
- "An 8-minute AMRAP, rest 2 minutes, another 8-minute AMRAP" has two parts and a rest between them.

Today a workout is exactly one block, and the parser rejects anything else. This is C2d, the last change of the WOD editor plan (`docs/ROADMAP.md`). The ROADMAP already decided that a workout is a sequence of blocks, each with its own format and timer, and that one designated block scores.

## What Changes

- A workout MAY have **several blocks**, in any order. Each block is a FOR TIME, AMRAP or EMOM with every option it has today: cap, rest between rounds, interval length, work time, progression and the stop.
- **Block sequence:**
  - Each block but the last MAY have a **rest after** it, in seconds.
  - A block starts when the previous one finishes, after that rest. Its own timer starts at that moment.
  - The session clock never stops.
  - A block's cap, or its stop at the first missed interval, finishes that block only, and the workout goes on.
- **Judging:**
  - The screen shows "BLOCK n/N".
  - A block change plays the interval cue.
  - The rest between blocks works like the rests of change `rest-steps`: REST with its countdown, gestures ignored.
  - The end sound plays only when the whole workout finishes by the clock.
- **Results:**
  - The score is the **scoring block's**.
  - Below it, the splits are grouped by block, each group headed by that block's own result, for example "BLOCK 1 · FOR TIME · 02:10".
  - Every block of a finished session was reached, since judging only finishes when the last block does and an abort saves nothing.
- **Adjustments:**
  - Targets MAY be changed in any block.
  - The duration only in the **last** block, because moving an earlier block's end would move every later block.
  - Existing adjustments, which carry no block, apply to block 1.
- **Presentation:**
  - The mode is the scoring block's mode followed by " · <N> BLOCKS".
  - The description joins each block's description with " → ".
  - The Library detail and the pre-start summary list each block with its mode, duration line and exercises, plus the rest between blocks.
- **Editor:**
  - Blocks are stacked on one screen, with "+ BLOCK" and a remove action on each block.
  - Each block has its own format and parameters, a REST AFTER (SEC), and a SCORES marker, which defaults to the first block.
  - With one block, the editor looks as it does today.
  - DUPLICATE keeps every block.
- **No engine version change and no migration:**
  - A one-block workout is stored, judged, scored and adjusted exactly as today, so every v1 result and golden stays as it is.
  - The `blocks` column is already an array, and the `scoringBlock` column already exists.
  - New goldens pin multi-block cases.
- **Out of scope:** a score over the whole workout, such as total time across blocks.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `wod-formats`: workouts made of several blocks, the block sequence and the rest between blocks, and the mode and description of a multi-block workout.
- `judging`: the block indicator, block changes, the rest between blocks, the end of the workout, and the pre-start summary per block.
- `session-results`: the scoring block's score and the splits grouped per block.
- `result-adjustment`: targets in any block, and duration only in the last block.
- `library`: the workout detail per block.
- `workout-editor`: several blocks, REST AFTER and SCORES; the editor is no longer limited to one block.

## Impact

- `constants/wod-engine.ts`:
  - a multi-block config made of one config per block, plus the rests after each block and the scoring index;
  - a sequence engine that runs each block's existing engine on a block-local clock;
  - block-aware `isResting`, `isComplete` and `view`;
  - the combined mode and description.
- `db/workouts.ts`:
  - parses several stored blocks, each with an optional `restAfterSeconds`, and reads `scoringBlock`;
  - `createWorkout` saves a list of blocks.
- `db/session-adjustments.ts`: an optional `blockIdx` on target changes.
- `components/result/replay.ts`, `adjust.ts` and `result-screen.tsx`: per-block results, grouped splits, and the block-aware adjusted result.
- `app/session/adjust.tsx`: split rows grouped by block, and the duration field only for the last block.
- `app/session/run.tsx` and `hooks/use-judge.ts`: the block indicator, and cues at block changes.
- `app/library/[id].tsx` and `components/judge/start-overlay.tsx`: the breakdown per block.
- `components/editor/draft.ts`, `app/library/new.tsx` and a new `components/editor/block-editor.tsx`: the workout draft made of block drafts, and the block sections.
- Tests: synthetic multi-block workouts with golden cases, plus engine and draft tests.
