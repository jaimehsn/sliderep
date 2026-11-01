# Tasks

## 1. Data and fixtures

- [x] 1.1 Add the optional `restAfterSeconds` to `StoredBlock` and the optional `scoringBlock` to `WorkoutRow`, selected by `listWorkouts` and `getWorkout`. Give `WodConfig` its optional `parts`, `restAfter` and `scoringBlock`. Add `isSequence` and `buildSequenceConfig` for the mode and description, and make `parseWorkoutRow` build a sequence for several blocks. A single block must still go through `buildWodConfig` exactly as today (design decisions 1 and 4). Add the synthetic BUY-IN AMRAP, TWO AMRAPS and AMRAP THEN FOR TIME workouts to `tests/fixtures.ts`. Verify that `pnpm test` stays green with no golden change.

## 2. Engine

- [x] 2.1 In `constants/wod-engine.ts`, add the optional `EngineState.seq` and `TaggedEvent.block`. Add the sequence `initial`, `advanceTo` and `apply`, dispatched on `isSequence` before any one-block code (design decision 2). Verify that `pnpm test` stays green with no golden change.
- [x] 2.2 Make these block-aware: `isResting`, `restLeftSeconds`, `isComplete`, `view` (with `blockLabel`), `durationLine` and `blockIndexOf` (design decision 3). Add `tests/engine.test.ts` cases covering:
  - transitions at a For Time's last rep, at an AMRAP's end and after a rest;
  - a jump across a block and its rest;
  - a gesture between blocks not counted;
  - `isResting`, `blockLabel` and `blockIndexOf`;
  - `isComplete` only on the last block;
  - the mode and description;
  - one-block configs having no `parts` and no `seq`.

  Verify that `pnpm test` passes.

## 3. Live judging

- [x] 3.1 In `hooks/use-judge.ts`, play the minute cue when `blockIndexOf` changes, and return `blockLabel`. In `app/session/run.tsx`, show `BLOCK n/N` above the exercise name when there is one (design decision 3). Verify with `npx tsc --noEmit` and `pnpm lint`.

## 4. Results and adjustments

- [x] 4.1 In `components/result/replay.ts`, add the per-block `deriveResult` for sequences: local logs, the scoring part's score, `splits` with `blockIdx`, and `groups` (design decision 5).
- [x] 4.2 Add the optional `blockIdx` to target changes in `db/session-adjustments.ts`. In `components/result/adjust.ts`, add the per-block adjusted result, with duration changes going only to the last part (design decision 6).
- [x] 4.3 In `components/result/result-screen.tsx`, render the groups with their headers. In `app/session/adjust.tsx`:
  - show the group headers;
  - write `blockIdx` on target changes for a sequence;
  - offer the duration field for the last part only.

  Verify with `npx tsc --noEmit` and `pnpm lint`.
- [x] 4.4 Add the golden cases of design decision 9, recording only these new files. Verify that:
  - every pre-existing golden is byte-identical;
  - the scores are the scoring blocks', with block-local times;
  - a gesture between blocks is not counted;
  - a buy-in target change leaves the AMRAP score unchanged;
  - a legacy change applies to block 1;
  - `pnpm test` passes.

## 5. Library and pre-start

- [x] 5.1 In `app/library/[id].tsx` and `components/judge/start-overlay.tsx`, list a sequence's blocks:
  - a `BLOCK n · <mode>` header, with SCORES on the scoring block;
  - each block's `durationLine` and exercises;
  - `REST <seconds> s` between blocks.

  One-block workouts must render as today (design decision 4). Verify with `npx tsc --noEmit` and `pnpm lint`.

## 6. Editor

- [x] 6.1 In `components/editor/draft.ts`, add `WorkoutDraft`, `validateWorkoutDraft`, `addBlock`, `removeBlock`, `workoutToStoredBlocks` and `workoutDraftFromConfig` (design decision 8). In `db/workouts.ts`, make `createWorkout` take `blocks` and `scoringBlock` (design decision 7). Add `tests/draft.test.ts` cases for:
  - one block stored exactly as today, including the built-ins' round-trip through the workout draft;
  - three blocks with a rest and the scoring block;
  - removing a block with the scoring marker;
  - the validation keys `block:<index>:…`;
  - DUPLICATE keeping every block.

  Verify that `pnpm test` passes.
- [x] 6.2 Move today's per-block editor UI from `app/library/new.tsx` into `components/editor/block-editor.tsx` unchanged. Then render one `BlockEditor` per block in `new.tsx`, with:
  - the `BLOCK n` header, SCORES and ✕ when there are several;
  - REST AFTER (SEC) on every block but the last;
  - "+ BLOCK" at the end;
  - DUPLICATE loading through `workoutDraftFromConfig`.

  Verify with `npx tsc --noEmit` and `pnpm lint`.

## 7. Docs

- [x] 7.1 Update `CLAUDE.md`:
  - the WOD System entry (sequence configs, the sequence engine, block-aware helpers, presentation);
  - `db/workouts.ts` and `db/session-adjustments.ts`;
  - `replay.ts`, `adjust.ts` and `result-screen.tsx`;
  - `session/adjust.tsx`, `session/run.tsx`, `use-judge.ts` and `start-overlay.tsx`;
  - the Library detail;
  - the editor files (`draft.ts`, `block-editor.tsx` and `new.tsx`);
  - the goldens list.

  Also update `docs/ROADMAP.md`: mark C2d and the WOD editor plan done. Verify that both documents match the code.

## 8. Verification

- [x] 8.1 Run `openspec validate multi-block-workouts --strict`, `npx tsc --noEmit`, `pnpm lint` and `pnpm test`. Verify that all pass and no pre-existing golden changed.
- [x] 8.2 On device:
  - create a workout of a 1-round FOR TIME of BURPEES 10, a scoring 5-minute AMRAP and a 1-round FOR TIME of AIR SQUATS 10, with REST AFTER 30 on block 2. Check the Library card's mode and description, and the detail per block with SCORES and the rest;
  - judge it, and check:
    - BLOCK n/N;
    - the cue at each block change;
    - the AMRAP countdown starting after the buy-in;
    - REST between blocks 2 and 3, with swipes ignored;
    - no end sound when it finishes on the last rep;
  - check the result: the AMRAP's score, and the three groups with block-local times;
  - adjust a buy-in target and the last block (no duration offered for an uncapped For Time), and check that the AMRAP score is unchanged;
  - duplicate it, and check that all blocks, the rest and SCORES are kept;
  - create a one-block workout of each format again, and check that the editor, detail, judging and results are unchanged, along with FRAN, CINDY, EVERY MINUTE and FILTHY FIFTY;
  - layout, on a narrow screen with long names: the editor with three blocks, the detail, the pre-start summary, the judging screen's BLOCK label and the grouped result, all without overflow.
