# Tasks

## 1. Data and fixtures

- [x] 1.1 Add the optional `restSeconds` and `workSeconds` to `Block` and `StoredBlock`, passed through by the parser in `db/workouts.ts`. Add the synthetic RESTED, RESTED CAPPED and TABATA workouts to `tests/fixtures.ts` (design decisions 1 and 9). Verify that `pnpm test` stays green with no golden change.

## 2. Engine

- [x] 2.1 In `constants/wod-engine.ts`, add `EngineState.restUntil` and the For Time rest in `apply` and `advanceTo`, with the cap checked first (design decision 2). Verify that `pnpm test` stays green with no golden change.
- [x] 2.2 Add the EMOM work phase: events in a rest phase are not counted, and the stop finishes at `missEnd` (design decision 3). Verify that `pnpm test` stays green with no golden change.
- [x] 2.3 Export `isResting` and `restLeftSeconds`. Add `REST mm:ss` and the work/rest phase timer to `view`, and the " · <seconds> s rest" / " · <seconds> s work" description suffixes (design decisions 4, 5 and 7). Add `tests/engine.test.ts` cases covering:
  - a For Time rest: round 2 starting 60 s after round 1's last rep, a rep inside the rest not counted, and `isResting` / `restLeftSeconds`;
  - the cap reached during a rest;
  - the Tabata phases: counted in work, not counted in rest, and the "work left" / "rest left" timer;
  - a stopping Tabata finishing at the end of the missed interval's work;
  - both descriptions;
  - the live = result check over the new workouts.

  Verify that `pnpm test` passes.

## 3. Live judging

- [x] 3.1 In `hooks/use-judge.ts`, drop gestures while `isResting`: no record and no haptics. Play the minute cue once when the resting state or the interval changes, unless the workout finished (design decision 4). Verify with `npx tsc --noEmit` and `pnpm lint`.

## 4. Results

- [x] 4.1 In `components/result/adjust.ts`, drop rest-phase ok events from the EMOM buckets (design decision 6).
- [x] 4.2 Add the golden cases of design decision 9, recording only these new files. Verify that:
  - every pre-existing golden is byte-identical;
  - RESTED's TIME includes both rests;
  - reps in a rest are not counted;
  - the capped case reads `CAP · N reps`;
  - the Tabata reads `8/8 · 64 reps` when all completed;
  - `pnpm test` passes.

## 5. Editor

- [x] 5.1 In `components/editor/draft.ts`, add the For Time `rest` and the EMOM `work` (design decision 8), covering validation, stored-block conversion both ways and `switchFormat`. Add `tests/draft.test.ts` cases for:
  - a rested For Time and a Tabata saved with their fields;
  - empty fields not written;
  - rest on 1 round, rest out of range, and work not shorter than EVERY, each flagged;
  - DUPLICATE keeping both;
  - the built-ins' round-trip unchanged.

  Verify that `pnpm test` passes.
- [x] 5.2 In `app/library/new.tsx`, add REST (SEC) to the ROUNDS / TIME CAP row and WORK (SEC) to the EVERY / INTERVALS row, with their problems. Verify with `npx tsc --noEmit` and `pnpm lint`.

## 6. Docs

- [x] 6.1 Update `CLAUDE.md`:
  - the WOD System entry (the two fields, `restUntil`, the work phase, `isResting`, the view and descriptions);
  - `use-judge.ts`;
  - `adjust.ts`;
  - the editor `draft.ts` and `new.tsx` entries;
  - the stored block fields in `db/workouts.ts`;
  - the goldens list.

  Also update `docs/ROADMAP.md`: mark C2c done. Verify that both documents match the code.

## 7. Verification

- [x] 7.1 Run `openspec validate rest-steps --strict`, `npx tsc --noEmit`, `pnpm lint` and `pnpm test`. Verify that all pass and no pre-existing golden changed.
- [x] 7.2 On device:
  - create a 3-round FOR TIME of BURPEES 5 with REST (SEC) 30, and check that the Library shows "· 30 s rest";
  - judge it, and check that:
    - a cue plays when the rest starts and when it ends;
    - the screen reads REST with its countdown and the header shows round 2;
    - swipes during the rest do nothing;
    - the TIME includes the rests;
  - create a Tabata (EVERY 30, WORK 20, INTERVALS 8, AIR SQUATS 8), judge it, and check the "work left" / "rest left" timer, REST during the rest, the cues, and swipes ignored in rest;
  - turn the stop on in a copy, miss an interval, and check that judging ends at the end of that work;
  - duplicate both workouts and check that REST / WORK are kept;
  - check that FRAN and EVERY MINUTE are unchanged;
  - layout: the editor's ROUNDS / TIME CAP / REST and EVERY / INTERVALS / WORK rows on a narrow screen, and REST mm:ss on the judging screen, without overflow.
- [x] 7.3 Found in the 7.2 device check: the Library detail and the pre-start summary show only a duration line, never the card description, so a workout's rest wasn't mentioned there. Fix: the two copies of `formatDuration` (`app/library/[id].tsx`, `components/judge/start-overlay.tsx`) become one exported `durationLine(config)` in `constants/wod-engine.ts`, which adds "<seconds> s rest between rounds" (For Time) or "<work> s work / <rest> s rest" (EMOM) after the duration, and is shown even for an uncapped For Time when it has rest. The wod-formats delta gains both as scenarios, and `tests/engine.test.ts` covers the line. Verify with `npx tsc --noEmit`, `pnpm lint`, `pnpm test`, `openspec validate rest-steps --strict`, and on device in 7.2.
