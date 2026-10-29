# Tasks

## 1. Data and fixtures

- [x] 1.1 Add optional `intervalSeconds` to `Block` (`constants/wod-engine.ts`) and `StoredBlock` (`db/workouts.ts`), passed through by `parseWorkoutRow`. Add the 10 × 90 s and 8 × 120 s synthetic EMOMs to `tests/fixtures.ts` (design decisions 1 and 6). Verify that `pnpm test` stays green and no file under `tests/__goldens__/` changes.

## 2. Engine

- [x] 2.1 Add `intervalSeconds(config)` and use it in `advanceTo` and `totalIntervals` instead of 60 000 ms. Make `kpiAt`'s and `view`'s labels follow it, and document `minuteIdx` as the interval index (design decisions 1–3). Verify that `pnpm test` stays green with no golden change.
- [x] 2.2 Make `describeMode` and `describeContent` follow the interval (`E2MOM · 8`, `EVERY 1:30 · 10`, `10 × 1:30 · …`). Add `tests/engine.test.ts` cases covering:
  - interval 2 at 100 s;
  - the timer reading `01:20` and "interval left";
  - progress "interval";
  - finishing after the last interval;
  - both mode labels and the description;
  - EVERY MINUTE unchanged.

  Verify that `pnpm test` passes.

## 3. Results

- [x] 3.1 In `components/result/replay.ts`, bucket and count EMOM splits per interval and label them "Interval N" when the interval isn't 60 s.
- [x] 3.2 In `components/result/adjust.ts`, bucket by interval and count `ceil(cutoff / interval)` intervals (design decision 4).
- [x] 3.3 Add golden cases for the synthetic EMOMs:
  - all completed;
  - missed intervals with a rep just after the 90 s boundary;
  - reps at or after the end;
  - shortened to 6 intervals;
  - a raised target.

  Record only these new files. Verify that every pre-existing golden is byte-identical and that `pnpm test` passes.

## 4. Adjust screen

- [x] 4.1 In `app/session/adjust.tsx`, show and read an EMOM's duration in intervals when its interval isn't 60 s (label `INTERVALS`), converting to `newDurationSeconds`. Verify with `npx tsc --noEmit` and `pnpm lint`.

## 5. Editor

- [x] 5.1 In `components/editor/draft.ts`, rename `EmomDraft.minutes` to `intervals` and add `every`, with validation, `draftToStoredBlock` (`intervalSeconds` only when ≠ 60), `draftFromBlock` and `switchFormat` (design decision 5). Add `tests/draft.test.ts` cases for:
  - 90 s saving with `intervalSeconds`;
  - 60 s saving without it;
  - DUPLICATE keeping it;
  - 5 and 601 being flagged;
  - the built-ins' round-trip unchanged.

  Verify that `pnpm test` passes.
- [x] 5.2 In `app/library/new.tsx`, replace TOTAL MINUTES with EVERY (SEC) and INTERVALS on one row, with the `= m:ss` total and their problem messages. Verify with `npx tsc --noEmit` and `pnpm lint`.

## 6. Docs

- [x] 6.1 Update `CLAUDE.md`:
  - the WOD System entry (`intervalSeconds`, the helper, labels, `minuteIdx` meaning);
  - the result `replay.ts`/`adjust.ts` entries;
  - `session/adjust.tsx`;
  - the editor `draft.ts` and `new.tsx` entries.

  Also update `docs/ROADMAP.md`: mark C2b-1 done and list C2b-2 and C2b-3 in the WOD editor plan. Verify that both documents match the code.

## 7. Verification

- [x] 7.1 Run `openspec validate emom-interval-length --strict`, `npx tsc --noEmit`, `pnpm lint` and `pnpm test`. Verify that all pass and that no pre-existing golden changed.
- [x] 7.2 On device:
  - create an EMOM EVERY 90 × 6 intervals of BURPEES 10 / KB SWINGS 15, and check that the editor shows "= 9:00" and the Library shows EVERY 1:30 · 6 and "6 × 1:30 · …";
  - judge it, and check "interval left" counting down from 01:30, progress "interval N of 6", the sound at each change and the "Interval N" splits;
  - adjust it to 4 intervals and check the score;
  - duplicate it and check that EVERY is 90;
  - check that EVERY MINUTE is unchanged.
