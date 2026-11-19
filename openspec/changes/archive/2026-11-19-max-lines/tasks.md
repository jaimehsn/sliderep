# Tasks

## 1. Test cases first (recorded before any engine edit)

- [x] 1.1 In `tests/fixtures.ts`, add `MAX_LINE_WORKOUTS`: rows in the window stored shape, with MAX lines written as `{ exerciseId, max: true }`. They stay unread by `workout()` until 2.2.
  - `boxAmrap`: example 2. Every 180 s × 5, 120 s of work, one interval of ROW 1 rep (200 m), BURPEES 8, then POWER SNATCHES MAX with load "60/40 kg".
  - `alternatingMax`: every 60 s × 6, alternating POWER SNATCHES MAX and BURPEES 5 then WALL BALL MAX.
  - `stoppingMax`: every 60 s × 10, stopping, BURPEES 8 then POWER SNATCHES MAX.

  Add `MAX_LINE_CASES`, with logs and a disabled golden list:
  - `boxamrap-all-reached`;
  - `boxamrap-buyin-missed` (one interval short of its BURPEES);
  - `alternatingmax`;
  - `stoppingmax-stops`;
  - `review-boxamrap-max-no-rep`;
  - `review-boxamrap-buyin-no-rep`.

  Verify that `pnpm test` passes and that `git status` shows no recorded file changed.

## 2. Engine and storage

- [x] 2.1 In `constants/wod-engine.ts`, implement design decisions 1–3:
  - `WodLine.max`;
  - `checkWindow` placement rules;
  - `targetAt` returns 0 on a MAX line;
  - `apply` counts a MAX line uncapped (`done = raw`);
  - the stopping skip rule never misses an interval whose first line is MAX;
  - `view().max`.

  Add `engine.test.ts` cases for:
  - a MAX line becoming current after its buy-in;
  - an uncapped count;
  - a rep after the work time not counting;
  - an interval of only a MAX line never missed;
  - a stopping EMOM ending on an unfinished buy-in;
  - `buildWodConfig` throwing for MAX in a continuous window, MAX not last, and MAX with an increment.

  Verify that `pnpm test` passes with every recorded golden and presentation file unchanged.
- [x] 2.2 In `db/workouts.ts`, implement design decision 4: `StoredLine.max`, parsed only in window blocks to `target: 0`. Reject `max` with `target` or `increment`, and `max` in a legacy block. Enable `MAX_LINE_WORKOUTS` in `workout()`. Add parser tests for the three new rows and each rejection. Verify that `pnpm test` passes.
- [x] 2.3 In `summarize`, show a MAX line's amount as "MAX" (design decision 9). Add the new workouts to `tests/presentation.test.ts` and record their snapshots as new files. Check `boxAmrap` against the library scenario by hand: "ROW + BURPEES + POWER SNATCHES", "200 m + 8 + MAX / interval", note "60/40 kg". Verify that only new files appear under `tests/__presentation__/`.
- [x] 2.4 In `components/result/replay.ts`, implement design decision 5: `hasMaxLines`, `Split.max`, a MAX split completed when its line was reached, the "<N> reps" score, and the stopping score over the kept splits. Enable `MAX_LINE_CASES` in `tests/goldens.test.ts` and record them as new files only. Check by hand:
  - `boxamrap-all-reached` scores the sum of its MAX reps;
  - the missed interval shows BURPEES short and POWER SNATCHES 0, not completed;
  - `stoppingmax-stops` ends at the missed interval;
  - the MAX no-rep review adds 1 to the score;
  - the buy-in no-rep review completes the interval with the MAX total unchanged (design decision 6).

  Also check `review.test.ts` on a MAX workout. Verify that `git status` shows only new files under `tests/__goldens__/`.

## 3. Editor

- [x] 3.1 In `components/editor/draft.ts`, implement design decision 8:
  - `EmomRow.max`;
  - `setLineMax`, acting on an interval's last line only;
  - `addLineToSlot` inserting before a MAX line;
  - validation skipping reps and increment on MAX;
  - `draftToStoredBlock` and `draftFromWindow`;
  - the `everyBuyInMax` template in `TEMPLATES`, `emptyDraft`, `applyTemplate` and `templateOf`;
  - other templates clearing `max`.

  Add `tests/draft.test.ts` cases for:
  - the template's contents;
  - switching to it keeping the lines before the MAX line;
  - switching away turning MAX into an ordinary line;
  - inserting before MAX;
  - an interval of only a MAX line saving;
  - `boxAmrap` saved from a draft deep-equal to its fixture row;
  - DUPLICATE of every `MAX_LINE_WORKOUTS` row.

  Verify that `pnpm test` passes.
- [x] 3.2 In `components/editor/block-editor.tsx`, add the EVERY + BUY-IN + MAX template button, and a MAX checkbox on each EMOM interval's last line that hides REPS and +/ROUND when checked. Verify that `npx tsc --noEmit` and `pnpm lint` pass.

## 4. Screens and docs

- [x] 4.1 Update the screens:
  - `components/judge/count-readout.tsx` takes `max`, showing "MAX" in place of the reps left and "of N", sized for 3 digits (design decision 7);
  - `hooks/use-judge.ts` returns `max`, and `app/session/run.tsx` passes it;
  - `components/result/result-screen.tsx` and `app/session/adjust.tsx` show a MAX split's reps with no target.

  Verify that `npx tsc --noEmit`, `pnpm lint` and `pnpm test` pass.
- [x] 4.2 Update `CLAUDE.md` for MAX lines in the engine, storage, results, editor and judging, and mark E3 in `docs/ROADMAP.md`. Verify that every symbol named exists in the code.

## 5. Verification

- [x] 5.1 On a 360 × 640 dp screen, create example 2 from EVERY + BUY-IN + MAX. Check:
  - the editor's MAX checkbox and the hidden fields;
  - an exercise added before the MAX line;
  - the Library detail showing "200 m + 8 + MAX / interval";
  - DUPLICATE.
- [x] 5.2 Judge example 2. Check:
  - the buy-in counting toward its targets;
  - MAX in the count readout with 3-digit counts fitting;
  - reps during the rest dropped;
  - the result's "<N> reps" score and MAX splits with no target.

  Accept a no-rep on the MAX line and check that the score goes up by 1. Judge EVERY MINUTE and FRAN and verify that they look as before.
- [x] 5.3 Run `openspec validate max-lines --strict` and verify that it reports the change as valid.

## Workflow follow-up

- Archive with `/opsx:archive`, syncing the requirements of `wod-formats`, `session-results`, `judging`, `result-adjustment`, `workout-editor` and `library`.
- Next: E4 `max-distance` (MAX by segments; example 3).
