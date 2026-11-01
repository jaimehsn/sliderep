# Design

## Context

- A `WodConfig` is one block: `format`, `block`, presentation (`mode`, `description`, `exercises`), `timerMode`, `totalSeconds`, `advanceMode` and `engineVersion`. Every engine function reads it as one block. These are `initial`, `advanceTo`, `apply`, `fold`, `view`, `isResting`, `isComplete` and `durationLine`, and so do `replay.ts` and `adjust.ts`.
- `parseWorkoutRow` throws when a row has more than one block. The `workouts` table already stores `blocks` as a JSON array and has a `scoringBlock` column, which is always 0 today. `createWorkout` writes `[block]` and 0.
- Results are derived from `WOD + log`. The log is `{ t, ok }` on one session clock, and nothing about positions is stored. Adjustments are `{ type: 'target', roundIdx, exIdx, newTarget }` or `{ type: 'duration', newDurationSeconds }`.
- `use-judge.ts`:
  - plays the minute cue when `pos.minuteIdx` grows or the rest state changes;
  - plays the end cue when the workout finishes but isn't `isComplete`;
  - drops gestures while `isResting`.

## Goals / Non-Goals

**Goals:**
- A one-block workout keeps its exact config, state transitions, results and adjustments. Every existing golden and test stays as it is.
- Each block runs on the engine that already exists, untouched. The sequence only routes the clock and the events to the current block.

**Non-Goals:**
- A score spanning blocks, such as total time.
- Editing an earlier block's duration after judging.
- Moving blocks around in the editor. Blocks are added at the end and removed.

## Decisions

### 1. Data: a list of block configs, only when there are several

- **`StoredBlock`:** gains an optional `restAfterSeconds`.
- **`WorkoutRow`:** gains an optional `scoringBlock`, read by the list and get queries.
- **`parseWorkoutRow`:**
  - With one stored block, it builds exactly today's config.
  - With several, it builds one config per block with today's `buildWodConfig`, all sharing the workout's name, and wraps them with `buildSequenceConfig`.

`WodConfig` gains three optional fields, present only on a multi-block config:
- `parts: WodConfig[]`;
- `restAfter: number[]`, in seconds, 0 for none;
- `scoringBlock: number`.

On a multi-block config:
- `format`, `block`, `timerMode`, `advanceMode`, `totalSeconds` and `engineVersion` are copied from the scoring part, so anything that only asks "what kind of score" keeps working;
- `exercises` is the parts' exercises, flattened;
- `isSequence(config)` is the one check.

**Alternative considered:** making every config a sequence of length 1. That touches every reader of `config.format` or `config.block`, and risks the goldens for nothing.

### 2. The sequence engine: the existing engine on a block-local clock

`EngineState` gains an optional `seq`, which is set only for a multi-block config:

```
seq: { idx, start, inner: EngineState, restUntil: number | null, ends: number[] }
```

- `idx` is the current block, and `start` is its start on the session clock.
- `inner` is that block's own engine state, on the local clock `t - start`.
- `restUntil` is the end of the rest after a block.
- `ends` holds each finished block's end time.

The top-level `t`, `finished` and `tagged` stay global. `pos`, `done` and `raw` mirror `inner`. Each `TaggedEvent` gains an optional `block`.

- **`advanceTo`** loops, so one jump can cross several blocks:
  - during a rest after a block, once `t ≥ restUntil`, it starts the next block at `restUntil` with `initial(part)`;
  - otherwise it advances `inner` to `t - start`;
  - when `inner` is finished, the block ended at `start + inner.t`. The last block finishes the workout there. Any other block starts its rest, or starts the next block at once when it has no rest.
- **`apply`** first runs `advanceTo` to the event's `t`. If the workout is finished or between blocks, it tags the event `counted: false`. Otherwise it calls `apply(part, inner, { t - start, ok })`, and tags the event with the inner tag's position, target and `counted`, plus `block`. If `inner` finished on that event (a For Time's last rep), the block ends at that `t`, with the same transition as in `advanceTo`.
- **`fold`** is unchanged: it reduces with `apply`, then calls `advanceTo`.

Every function dispatches on `isSequence` first, so a one-block config never enters this code.

### 3. Block-aware helpers

- **`isResting`** is true between blocks, or when the current part `isResting` on its local state. `restLeftSeconds` follows.
- **`isComplete`** applies only to the last block: it is true once that block is complete, and the workout finished.
- **`view`:**
  - between blocks, `REST mm:ss` with a "rest left" timer, and the next block's first exercise, target and KPI;
  - otherwise, the part's own view on its local state;
  - `blockLabel` is `BLOCK n/N`, or null for one block.
- **`durationLine`** is null on a multi-block config, because each part has its own.
- **`blockIndexOf(state)`** gives `seq.idx`, or 0 for one block. `use-judge` plays the minute cue when it changes. A finish that isn't `isComplete` still plays the end cue, so an AMRAP that ends a workout sounds as today. An AMRAP that ends an earlier block counts as a block change and plays the minute cue.

### 4. Presentation

`buildSequenceConfig`:
- `mode`: the scoring part's mode, then ` · N BLOCKS`;
- `description`: the parts' descriptions joined with ` → `.

The Library detail and the pre-start summary list each part with:
- a `BLOCK n · <mode>` header, with a SCORES tag on the scoring part;
- its `durationLine`;
- its exercises;
- `REST <seconds> s` between parts when `restAfter` is above 0.

A one-block workout renders as today.

### 5. Results: each block's own result, then grouped

For a sequence, `deriveResult`:
1. folds once to get each block's `start` and its tagged events;
2. for each part, builds the local log from the events tagged with that block, shifted by its `start`, and calls `deriveResult(part, localLog)`. Times are therefore block-local;
3. returns:
   - the scoring part's score;
   - `splits`: every part's splits in order, each `Split` carrying `blockIdx`;
   - `groups`: one per block, `{ blockIdx, title: "BLOCK n · <mode> · <score>", splits }`.

`WodResult.groups` is optional: one-block results don't have it. `result-screen.tsx` renders the groups with their headers when they exist.

Every block of a saved session was reached. Judging only finishes when the last block finishes, and an abort saves nothing.

### 6. Adjustments

- A target change gains an optional `blockIdx`. When it is absent, the change is for block 0, so every saved adjustment keeps its meaning.
- For a sequence, `deriveAdjustedResult` splits the changes by block and runs `deriveAdjustedResult(part, localLog, partChanges)` for each part. Duration changes go only to the last part.
- Block boundaries come from the original fold, so a change never moves a block's start or moves a rep between blocks. This is the same no-re-flow rule as within a block.
- The results are combined as in decision 5.
- **`session/adjust.tsx`:**
  - shows the groups' headers;
  - writes `blockIdx` on target changes for a sequence;
  - offers the duration field, as today, for the last part only.

### 7. Storage writes

`createWorkout` takes `blocks: StoredBlock[]` and `scoringBlock`. A one-block draft writes `[block]` with no `restAfterSeconds` and `scoringBlock` 0, exactly as today. No migration is needed.

### 8. Editor

- `WorkoutDraft = { name, scoringBlock, blocks: { draft: Draft; restAfter: string }[] }`.
- Each block's `Draft` is today's type with its own `name` left empty. Every block helper and its tests stay as they are.
- Functions:
  - `validateWorkoutDraft` checks the name once and validates each block, ignoring the block's own name problem. It keys block problems as `block:<index>:<key>`, and `block:<index>:restAfter` for a REST AFTER that isn't 1–600 (`rest` is already a For Time block's key).
  - `workoutToStoredBlocks` and `workoutDraftFromConfig` handle DUPLICATE, both ways.
  - `addBlock` adds a FOR TIME block at the end.
  - `removeBlock` keeps the scoring block where it was, or moves it to block 0 if the scoring block was removed.
- `components/editor/block-editor.tsx` takes today's per-format UI out of `new.tsx`: format, parameters, lines and exercise picker. `new.tsx` renders the name, then one `BlockEditor` per block. With several blocks, each gets a `BLOCK n` header with SCORES and ✕, and every block but the last gets REST AFTER (SEC). "+ BLOCK" goes at the end.

### 9. Goldens and tests

`tests/fixtures.ts` gains three synthetic workouts. `WorkoutRow` gains `scoringBlock` for them.
- **BUY-IN AMRAP:** For Time BURPEES 20 → a scoring 5-min AMRAP of PULL-UPS 5 / AIR SQUATS 15 → For Time BURPEES 20.
- **TWO AMRAPS:** a 4-min AMRAP of BURPEES 10, 60 s of rest, then a scoring 4-min AMRAP of AIR SQUATS 15.
- **AMRAP THEN FOR TIME:** a 3-min AMRAP, then a scoring For Time with a 5 min cap.

The cases are:
- complete runs, with block-local TIMEs;
- a gesture between blocks (not counted);
- a target change in the buy-in (the AMRAP's score is unchanged);
- a legacy change without `blockIdx` (applies to block 1);
- a duration change on the last block.

Engine tests cover:
- the block transitions, including a jump across a block and its rest;
- `isResting` between blocks;
- `blockLabel`;
- the cue-relevant `blockIndexOf`;
- `isComplete` on the last block;
- the live = result check over the new cases;
- one-block configs having no `parts` and no `seq`.

Draft tests cover:
- add and remove of blocks with the scoring marker;
- validation keys;
- one block stored exactly as today;
- DUPLICATE round-trip.

## Risks / Trade-offs

- [The sequence state diverges between live and fold] → Both use the same `apply`/`advanceTo`, and the live = result test runs over the new cases.
- [Code reading `config.format` or `config.block` on a sequence gets the scoring part] → That is intended for score-kind questions. Every engine entry point checks `isSequence` first, and the screens that show content use `parts`.
- [The editor refactor breaks the one-block editor] → `BlockEditor` is today's markup moved unchanged. The device check covers one-block creation and every format again.
- [A long multi-block screen on small phones] → The device check covers the editor and the detail with three blocks and long names, as required by the responsive check.
