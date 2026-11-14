# Tasks

## 1. Presentation snapshot on the current code (no engine edits yet)

- [x] 1.1 Add `tests/presentation.test.ts` (design decision 7). For every built-in and every `SYNTHETIC_WORKOUTS` row, it writes `tests/__presentation__/<id>.json` with `toMatchFileSnapshot`. Each file holds `mode`, `description`, `exercises`, `durationLine`, `timerMode`, `totalSeconds`, `advanceMode`, `engineVersion` and `view(config, initial(config))`, plus the same fields for each part of a sequence. Run `pnpm test` once to record them on the unmodified code. Verify that:
  - every workout wrote a file;
  - FRAN reads `FOR TIME`, CINDY `12-MIN AMRAP`, EVERY MINUTE `EMOM · 10` and FILTHY FIFTY `FOR TIME`;
  - every existing golden is still green.
- [x] 1.2 Add the presentation snapshot rule to `CLAUDE.md`'s Commands paragraph: recorded before `window-model`, never re-recorded with `-u`. Then stop and ask the user to commit `tests/__presentation__/` before any engine edit. Verify that `git status` shows it committed.

## 2. Model, translation and engine

- [x] 2.1 In `constants/wod-engine.ts`:
  - add `ContinuousClock`, `IntervalClock`, `Structure` and `Window`, plus `ENGINE_VERSION = 1`;
  - add `buildWodConfig(name, window)`, which throws on shapes outside the E1 limits;
  - add the private `shapeOf`, exported for `adjust.ts`;
  - move every `format.*` and `block.*` read to the window, with no rule change (design decisions 2–4);
  - delete `Format`, `FORMATS`, the three `*_FORMAT` constants, the `*Kind` types and `WodDefinition`;
  - rewrite the engine-rules comment in terms of shapes.

  Verify with `npx tsc --noEmit` on this file. Errors may remain in consumers until 2.2–2.4.
- [x] 2.2 In `db/workouts.ts`, make `parseWorkoutRow` translate each `StoredBlock` into a window per `formatId` (design decision 5). It throws on an unknown `formatId` and on a block that breaks the invariants listed in design.md Context. `StoredBlock`, `createWorkout` and the queries don't change. Add `tests/engine.test.ts` cases covering:
  - every v2 seed row and every `SYNTHETIC_WORKOUTS` row translating without a throw;
  - a For Time with `rounds !== lines.length`, an AMRAP with two `lines` entries, an EMOM whose `durationSeconds` isn't `rounds × interval`, and an unknown `formatId`, each throwing.

  Verify that the new cases pass.
- [x] 2.3 Move the consumers to the window (design decision 6):
  - `components/result/replay.ts`: `stopOnMiss` from the interval clock;
  - `components/result/adjust.ts`: `shapeOf(config) === 'rounds'`;
  - `components/editor/draft.ts`: `draftFromBlock` → `draftFromWindow(window, name)`, used by `workoutDraftFromConfig`.

  Verify that `grep -rnE "\.format\b|\.format\.|config\.block|FORMATS|draftFromBlock|WodDefinition" app components hooks db constants tests --include='*.ts' --include='*.tsx'` finds nothing. The frozen seed's `V2_FORMATS` in `db/seeds/` and `db/migrations.ts` stay.
- [x] 2.4 Adapt `tests/engine.test.ts` and `tests/draft.test.ts`. They build and patch configs through the window, for example the stopping Tabata and the `draftFromWindow` round-trips, and keep every assertion's expected value. Verify that:
  - `pnpm test` passes;
  - every file in `tests/__goldens__/` and `tests/__presentation__/` is byte-identical (`git status` shows them unmodified);
  - `npx tsc --noEmit` and `pnpm lint` pass.
- [x] 2.5 Update `CLAUDE.md`:
  - WOD System: the window/structure model, its E1 limits, behavior derived from the window, `ENGINE_VERSION`, formats removed, and "window" as the code's name for a block;
  - Storage `workouts.ts`: translate on read, strict invariants;
  - Result Screen `replay.ts`/`adjust.ts`;
  - Workout Editor `draft.ts`: `draftFromWindow`.

  Update `docs/ROADMAP.md`'s "WOD format as data" with the window/structure decision and the E1–E4 plan. Verify that every renamed symbol mentioned in both files exists in the code.

## 3. Device verification

- [x] 3.1 On a phone with existing data, verify that:
  - the Library and workout selection list every workout with the same mode, description and detail as before, including an own For Time with a cap and rest, a 90 s EMOM with work time and an increment, and a multi-block workout;
  - DUPLICATE of each opens the editor with the same content;
  - a saved copy runs.
- [x] 3.2 Judge FRAN, CINDY, EVERY MINUTE and one own multi-block workout, and verify that the timer, KPI, cues, rests and finish behave as before, and that each result matches the last live screen. Open History sessions saved before this change, including one with accepted no-reps, and verify that their scores and splits are unchanged.
- [x] 3.3 Run `openspec validate window-model --strict` and verify that it reports the change as valid.

## Workflow follow-up

- Archive with `/opsx:archive`, syncing the MODIFIED `wod-formats` requirement.
- Next: E2 `shared-clock`. It covers several structures in one continuous window, the stored shape for it and the editor templates. Explore it first: the storage extension and the template list are still open.
