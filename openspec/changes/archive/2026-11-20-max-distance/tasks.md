# Tasks

## 1. Test cases first (recorded before any code edit)

- [x] 1.1 In `tests/fixtures.ts`, add `MAX_DISTANCE_WORKOUTS` (window stored shape), read by `workout()`:
  - `example3`: every 60 s × 15, rotating STEP-UPS 16 with load "2×22.5 kg", RUN 1 rep (200 m), then HANDSTAND WALK MAX each rep 5 m;
  - `mixedUnits`: every 60 s × 4, alternating HANDSTAND WALK MAX each rep 5 m and POWER SNATCHES MAX;
  - `twoSegments`: every 60 s × 2, alternating HANDSTAND WALK MAX each rep 5 m and SLED PUSH MAX each rep 10 m.

  Add `MAX_DISTANCE_CASES`:
  - `example3-metres`: HANDSTAND WALK minutes at 12, 10, 9, 11 and 8, giving 250 m;
  - `mixedunits`: 60 m · 38 reps;
  - `twosegments`: 4 and 3, giving 50 m;
  - `review-example3-segment-no-rep`.

  Add them and the workouts to `tests/goldens.test.ts` and `tests/presentation.test.ts`. Record them as new files only, after task 2.2, because the per-unit score doesn't exist yet. Verify that `pnpm test` passes and that no recorded file changed.

## 2. Engine and results

- [x] 2.1 In `constants/wod-engine.ts`, implement design decisions 1–2:
  - `maxSegment(line)`;
  - `view().segment`, only while the current line is a MAX line with a segment.

  Add `engine.test.ts` cases:
  - on `example3`'s minute 3 after 3 reps, `view` has `done` 3, `max` true and `segment` `{ amount: 5, unit: 'm' }`;
  - on a MAX line without a description, `segment` is absent.

  Verify that `pnpm test` passes with every recorded file unchanged.
- [x] 2.2 In `components/result/replay.ts`, implement design decision 3:
  - `Split.segment`;
  - `splitAmount`;
  - the per-unit MAX score.

  Enable and record the new goldens and presentation snapshots as new files only. Check by hand:
  - `example3-metres` reads `250 m`, and minute 3 shows `60 m`;
  - `mixedunits` reads `60 m · 38 reps`;
  - `twosegments` reads `50 m`;
  - the review case adds 5 m to its split and to the score.

  Verify that the E3 goldens (`boxamrap-*`, `alternatingmax`, `stoppingmax-stops`, `review-boxamrap-*`) are byte-identical.

## 3. Screens and docs

- [x] 3.1 Update the screens:
  - `components/judge/count-readout.tsx` takes the `segment`, showing `done × amount` and the unit in place of "MAX", sized as in design decision 2;
  - `hooks/use-judge.ts` returns `segment`, and `app/session/run.tsx` passes it;
  - `components/result/result-screen.tsx` and `app/session/adjust.tsx` render `splitAmount(split)`.

  Verify that `npx tsc --noEmit`, `pnpm lint` and `pnpm test` pass.
- [x] 3.2 Update `CLAUDE.md` for MAX segments in the engine, results and judging, and mark E4 and the window-model plan done in `docs/ROADMAP.md`. Verify that every symbol named exists in the code.

## 4. Verification

- [x] 4.1 On a 360 × 640 dp screen, create example 3 from EMOM (every 60 s × 15):
  - STEP-UPS 16 with load "2×22.5 kg";
  - RUN 1 rep with EACH REP 200 m;
  - HANDSTAND WALK MAX with EACH REP 5 m.

  Check the Library detail ("MAX" with the note "5 m"). Judge a shortened DUPLICATE and check:
  - the count shows 5, 10, 15 … with "m" beside it;
  - the result reads "<N> m" with HANDSTAND WALK splits in metres;
  - an accepted no-rep on HANDSTAND WALK adds 5 m.

  Judge the earlier box AMRAP and verify that it still reads "<N> reps" with "MAX".
- [x] 4.2 Run `openspec validate max-distance --strict` and verify that it reports the change as valid.

## Workflow follow-up

- Archive with `/opsx:archive`, syncing the requirements of `wod-formats`, `session-results`, `judging` and `result-adjustment`.
- That closes the window-model plan (E1–E4).
