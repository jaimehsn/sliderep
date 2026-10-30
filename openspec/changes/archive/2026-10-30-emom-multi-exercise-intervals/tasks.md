# Tasks

## 1. Fixtures

- [x] 1.1 Add the synthetic 6-minute EMOM (minute 1: 5 PULL-UPS + 10 PUSH-UPS; minute 2: 15 AIR SQUATS) to `SYNTHETIC_WORKOUTS` in `tests/fixtures.ts` (design decision 6). Verify that `pnpm test` stays green.

## 2. Engine

- [x] 2.1 In `constants/wod-engine.ts`:
  - make `lineAt` read `exIdx` within the interval;
  - reset `exIdx` on an interval change in `advanceTo`;
  - advance on target within the interval in `apply`, with the last line taking extra reps;
  - export the shared line-placement helper (design decisions 1 and 3).

  Verify that `pnpm test` stays green with no golden change.
- [x] 2.2 Make `summarize` show a multi-line interval as one row, with names and amounts joined by " + " (design decision 4). Add `tests/engine.test.ts` cases covering:
  - moving to PUSH-UPS on the 5th PULL-UPS;
  - a new minute starting on its first exercise;
  - extra reps staying on the last line, with the live count at its target;
  - the breakdown row "PULL-UPS + PUSH-UPS" / "5 + 10 / min";
  - single-line EMOMs unchanged.

  Verify that `pnpm test` passes.

## 3. Results

- [x] 3.1 In `components/result/replay.ts`, list one split per (interval, line). An interval is completed only when all its lines are (design decision 2).
- [x] 3.2 In `components/result/adjust.ts`, place each bucket's reps on lines by the original targets with the shared helper, and apply target overrides per `(interval, line)` to completion only (design decision 3).
- [x] 3.3 Add the golden cases of design decision 6, recording only these new files. Verify that every pre-existing golden is byte-identical, that the new results match the spec scenarios (5/5 + 7/10 not completed; a raised PULL-UPS target leaves PUSH-UPS at 10/10), and that `pnpm test` passes.

## 4. Editor

- [x] 4.1 In `components/editor/draft.ts`:
  - make `EmomDraft.slots` a `RepsRow[][]`, keeping the flat line index for every helper;
  - add `addLineToSlot`;
  - make `removeLine` drop an empty interval;
  - update `switchFormat`, `validateDraft`, `draftToStoredBlock` and `draftFromBlock` (design decision 5).

  Add `tests/draft.test.ts` cases for:
  - a two-exercise minute saved and run as the spec scenario says;
  - removing an interval's only exercise;
  - DUPLICATE keeping the lines per interval;
  - switching to and from EMOM;
  - the built-ins' round-trip unchanged.

  Verify that `pnpm test` passes.
- [x] 4.2 In `app/library/new.tsx`, group each interval's lines, label the first `MIN n` / `INT n` and the following ones `+`, and add "+ EXERCISE" below each interval. Verify with `npx tsc --noEmit` and `pnpm lint`.

## 5. Docs

- [x] 5.1 Update `CLAUDE.md`:
  - the WOD System entry (EMOM position `(minuteIdx, exIdx)`, onTarget within an interval, the helper, breakdown rows);
  - the `replay.ts` and `adjust.ts` entries;
  - the editor `draft.ts` and `new.tsx` entries.

  Also update `docs/ROADMAP.md` to mark C2b-2 done. Verify that both documents match the code.

## 6. Verification

- [x] 6.1 Run `openspec validate emom-multi-exercise-intervals --strict`, `npx tsc --noEmit`, `pnpm lint` and `pnpm test`. Verify that all pass and no pre-existing golden changed.
- [x] 6.2 On device:
  - create a 6-minute EMOM with minute 1 PULL-UPS 5 + PUSH-UPS 10 and minute 2 AIR SQUATS 15, and check that the Library shows "PULL-UPS + PUSH-UPS" with "5 + 10 / min";
  - judge it, and check the change to PUSH-UPS after 5 reps with no sound, the minute sound with a new minute starting on PULL-UPS, and extra reps staying on PUSH-UPS;
  - check the per-exercise splits and that an interval with an unfinished exercise is not completed;
  - adjust the PUSH-UPS target of a minute and check the score;
  - duplicate it and check minute 1 keeps both exercises;
  - remove an interval's only exercise in the editor;
  - check that EVERY MINUTE is unchanged.
