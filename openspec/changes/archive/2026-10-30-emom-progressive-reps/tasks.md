# Tasks

## 1. Data and fixtures

- [x] 1.1 Add the optional `increment` to `WodLine` and the stored line, and the optional `stopOnMiss` to `Block` and `StoredBlock`, passed through by `parseWorkoutRow`. Add the synthetic LADDER and DEATH BY workouts to `tests/fixtures.ts` (design decisions 1 and 7). Verify that `pnpm test` stays green with no golden change.

## 2. Engine

- [x] 2.1 In `constants/wod-engine.ts`, make `targetAt` grow by the increment per sequence repetition and `intervalLineAt` sum `targetAt`. Then add the missed-interval helper and the stop in `advanceTo` (design decisions 2 and 3). Verify that `pnpm test` stays green with no golden change.
- [x] 2.2 Add ` (+n)` to the breakdown and " · until failure" to a stopping EMOM's description (design decision 5). Add `tests/engine.test.ts` cases covering:
  - Death by targets 1, 2 and 12;
  - the ladder targets 3/10/4/12/5/14;
  - a stop at a missed minute (t = 13:00, on minute 13, end with no cue transition);
  - a stop after a skipped empty minute;
  - no stop when every minute is completed;
  - the breakdown "1 (+1) / min" and the description "… · until failure";
  - plain EMOMs unchanged.

  Verify that `pnpm test` passes.

## 3. Results

- [x] 3.1 In `components/result/replay.ts`, add the shared cut-at-first-miss helper and use it in `deriveOnClock` for stopping EMOMs (design decision 4).
- [x] 3.2 In `components/result/adjust.ts`, apply the same helper after the adjusted split list.
- [x] 3.3 Add the golden cases of design decision 7, recording only these new files. Verify that:
  - every pre-existing golden is byte-identical;
  - the new results match the spec scenarios (`12 + 9`, `20 + 0`, `4 + 5`, `13 + 0` with minute 14 at 0, and the ladder's targets);
  - `pnpm test` passes.

## 4. Editor

- [x] 4.1 In `components/editor/draft.ts`, add the EMOM rows' `increment` and the draft's `stopOnMiss` (design decision 6), covering validation, stored-block conversion both ways, `switchFormat`, `addLine` and `addLineToSlot`. Add `tests/draft.test.ts` cases for:
  - a Death by saved with `increment: 1` and `stopOnMiss: true`;
  - 0 and empty increments not written;
  - an invalid increment flagged on its line;
  - DUPLICATE keeping both;
  - the built-ins' round-trip unchanged.

  Verify that `pnpm test` passes.
- [x] 4.2 In `app/library/new.tsx`, add the `+/ROUND` input to each EMOM line and the "STOP AT FIRST MISSED INTERVAL" checkbox. Verify with `npx tsc --noEmit` and `pnpm lint`.

## 5. Docs

- [x] 5.1 Update `CLAUDE.md`:
  - the WOD System entry (increment, progressive `targetAt`, the stop, breakdown and description);
  - the `replay.ts` and `adjust.ts` entries;
  - the editor `draft.ts` and `new.tsx` entries.

  Also update `docs/ROADMAP.md`: mark C2b-3 and C2b done. Verify that both documents match the code.

## 6. Verification

- [x] 6.1 Run `openspec validate emom-progressive-reps --strict`, `npx tsc --noEmit`, `pnpm lint` and `pnpm test`. Verify that all pass and no pre-existing golden changed.
- [x] 6.2 On device:
  - create a Death by: EMOM, 30 intervals, BURPEES 1 with `+/ROUND` 1, stop on. Check that the Library shows "1 (+1) / min" and "… · until failure";
  - judge it, and check that the targets grow 1, 2, 3 … each minute, and that missing a minute ends judging with the end sound and a score of `<completed> + <reps>`;
  - adjust an earlier minute's target upward and check that the score and splits are cut there;
  - create a ladder without the stop (BURPEES 3 +1 / KB SWINGS 10 +2) and check the growing targets and the normal score;
  - duplicate the Death by and check that `+/ROUND` and the stop are kept;
  - check that EVERY MINUTE is unchanged.
- [x] 6.3 Found in the 6.2 device check (a 30-minute Death by): `RoundPips` drew one square per round/interval with no limit, so past ~12 the row overflowed the header and pushed the "N/total" readout off screen. Pre-existing, first visible with this change's long EMOMs. Fix: `judge-header.tsx` shows the pips only up to `MAX_PIPS` (12) and keeps "N/total" alone beyond that; its right column can no longer grow past the space beside the timer. Verify with `npx tsc --noEmit` and `pnpm lint`, and on device in 6.2 (the 30-minute Death by's header reads "minute N/30", without pips).
- [x] 6.4 Found in the 6.2 device check: the Library detail and the pre-start summary don't show the card description, only a duration line ("30 min"), so a stopping EMOM never said "until failure" there. Fix: both `formatDuration`s (`app/library/[id].tsx`, `components/judge/start-overlay.tsx`) read "<m> min max · until failure" for a stopping EMOM; the wod-formats delta's stop requirement gains that as a scenario. Verify with `npx tsc --noEmit`, `pnpm lint`, `openspec validate emom-progressive-reps --strict`, and on device in 6.2.
- [x] 6.5 Found in the 6.2 device check: the editor's EMOM `= m:ss` total sat on the EVERY / INTERVALS row and ran off the right edge. Fix: `app/library/new.tsx` shows it as a `TOTAL m:ss` line below the row, and `paramRow` wraps (`flexWrap`, `rowGap`) so no parameter row can run off screen. The responsive review of every view is logged in `docs/ROADMAP.md` (Known issues) for later. Verify with `npx tsc --noEmit` and `pnpm lint`, and on device in 6.2 (EVERY 90, INTERVALS 10 shows TOTAL 15:00 below the row).
