# Design

## Context

- **Today's model** (`constants/wod-engine.ts`):
  - `buildWodConfig(definition, format)` turns a `WodDefinition` (`{ id, name, block }`) plus one of three built-in `Format`s into a `WodConfig`.
  - That config carries `format` (`repeat: rounds | cycle | perInterval`, `advance`, `timer`, `stop`, `score`, `version`) and `block`. `block` holds `lines: WodLine[][]` plus `rounds`, `durationSeconds`, `intervalSeconds`, `stopOnMiss`, `restSeconds` and `workSeconds`. What each field means depends on `repeat`.
  - Several stored blocks become a `SequenceConfig` (`parts`, `restAfter`, `scoringBlock`) whose parts are ordinary configs.
- **Where `format` / `block` are read:**
  - Inside the engine: positions, targets, KPI, `advanceTo`, `apply`, `view`, `durationLine`, `isComplete`, mode/description/exercises.
  - `components/result/replay.ts`: `config.block.stopOnMiss`.
  - `components/result/adjust.ts`: `config.format.repeat !== 'rounds'`.
  - `components/editor/draft.ts`: `workoutDraftFromConfig` → `draftFromBlock(config.format.id, config.block)`.
  - `tests/engine.test.ts`, `tests/draft.test.ts`.
  - Screens and hooks (`use-judge.ts`, `session/run.tsx`, `workout-breakdown.tsx`, `session/adjust.tsx`) only use the engine API and the presentation fields, plus `isSequence`/`parts`.
- **Storage**: `workouts.blocks` is JSON `StoredBlock[]` (`formatId` + the block fields above). `db/workouts.ts`'s `parseWorkoutRow` resolves `formatId` through `FORMATS`. The `formats` table is seeded and never read. `sessions.engineVersion` stores `format.version`, which is 1 for all three formats.
- **Invariants every stored block satisfies today:** the editor's `draftToStoredBlock` and the frozen v2 seed are the only writers.
  - For Time: `rounds === lines.length` (Chipper: 1). A `durationSeconds` is the cap.
  - AMRAP: exactly one `lines` entry and `durationSeconds > 0`.
  - EMOM: `lines` is the interval sequence, `rounds` is the interval count, and `durationSeconds === rounds × (intervalSeconds ?? 60)`.
- **The safety net:** `tests/__goldens__/` pins every v1 result. Nothing pins the presentation strings except some `engine.test.ts` assertions and the specs.

## Goals / Non-Goals

**Goals:**
- Every reader of the workout's structure reads windows and structures. `Format` and `Block` are gone.
- Results, live judging and presentation are identical, proven by the untouched goldens and by a new presentation snapshot recorded before the refactor.
- The model's shape is the one E2–E4 extend, so they add cases and don't rewrite.

**Non-Goals:**
- Several structures in a continuous window (E2).
- MAX lines and the global score (E3, E4).
- Changing the stored format.
- A new storage shape for E2's content (decided in E2).
- Unifying the one-block and several-block configs into one path.
- Renaming `WodSession`'s fields or the UI's "BLOCK".

## Decisions

1. **Translate on read, no migration.** `parseWorkoutRow` maps each `StoredBlock` to a window. `StoredBlock`, the seeds, the migrations and the editor's `draftToStoredBlock` don't change.
   - *Alternative: a v7 migration rewriting `workouts.blocks` as windows.* Rejected. It rewrites user data and the frozen seed's meaning for no behavioral gain, and E2 still has to extend the stored shape. Storage changes are better made once, together with the first content that needs them.
   - *Alternative: write both shapes.* Rejected as needless duplication.

2. **The model.** It lives in `constants/wod-engine.ts`, next to `WodLine`, which is unchanged:

   ```ts
   type ContinuousClock = { kind: 'continuous'; limitSeconds?: number };   // For Time cap, AMRAP duration
   type IntervalClock = {
     kind: 'intervals'; everySeconds: number; count: number;               // count = number of intervals
     workSeconds?: number; stopOnMiss?: boolean;
   };
   type Structure =
     | { kind: 'rounds'; rounds: WodLine[][]; restSeconds?: number }        // one entry per round; Chipper = 1
     | { kind: 'cycle'; lines: WodLine[] }                                 // AMRAP
     | { kind: 'once'; lines: WodLine[] };                                 // done in order; the last takes extra reps
   type Window =
     | { clock: ContinuousClock; structures: Structure[] }
     | { clock: IntervalClock; intervals: Structure[][] };                 // rotating sequence, one entry per interval
   ```

   - **E1 limits.** A continuous window holds exactly one structure, either `rounds` or `cycle` (`cycle` only with a limit). Each interval entry holds exactly one `once`. `buildWodConfig` throws on anything else: those shapes are E2's and E3's to allow.
   - **Field moves.** The fields keep their names where they move, so the engine diff stays mechanical:
     - `restSeconds` goes with `rounds`.
     - `workSeconds`/`stopOnMiss` go with the interval clock.
     - `increment` stays on the line.
   - **Why `once` exists already:** an EMOM interval's lines are a "once" (done in order, never repeated). Naming that now is what lets E3 put `[once, MAX]` in an interval and E2 put a buy-in `once` in a continuous window, without reshaping intervals.
   - *Alternative: keep `Block` and add a `clock` field.* Rejected. It keeps fields whose meaning depends on the format, which is exactly what made shared clocks unrepresentable.

3. **Behavior is derived from the window, and the rules are not changed.** A private `shapeOf(config)` returns `'rounds' | 'cycle' | 'perInterval'`:
   - intervals → `perInterval`
   - continuous → the kind of its only structure

   Every `config.format.repeat` read becomes `shapeOf(config)`. Every `config.block.*` read becomes the matching window read: `lines[r]` → the `rounds` entry, `lines[0]` → the `cycle` lines, `lines[m % n]` → the `once` lines of interval entry `m % n`, `durationSeconds` → `limitSeconds` or `count × everySeconds`. `timerMode`, `advanceMode` and `totalSeconds` are computed from the same shape, with the values `Format` gave them.
   - Where a read is exported, it stays exported (`intervalSeconds`, `intervalLines`, `capSeconds`, `durationLine`, `isComplete`…). `shapeOf` is exported only for `adjust.ts` (decision 6).
   - *Alternative: rewrite the continuous engine now to step through a list of structures.* Rejected for E1. It is E2's real work, and doing it here mixes a behavior-preserving move with new semantics, which defeats the point of the goldens.

4. **`WodConfig` and the version.**
   - `WodConfig` drops `format` and `block` and gains `window`. The presentation fields and `parts`/`restAfter`/`scoringBlock` are unchanged.
   - `buildWodConfig(name, window)` replaces `buildWodConfig(definition, format)`. `buildSequenceConfig` is unchanged.
   - `Format`, `FORMATS`, `FOR_TIME_FORMAT`/`AMRAP_FORMAT`/`EMOM_FORMAT`, `RepeatKind`/`AdvanceKind`/`TimerKind`/`StopKind`/`ScoreKind` and `WodDefinition` are deleted.
   - `engineVersion` is the exported constant `ENGINE_VERSION = 1` on every config, which is the same value each `Format` carried.
   - The comment block above the engine rules is rewritten in terms of shapes, with the same rules.

5. **Strict translation.** `parseWorkoutRow` builds the window per `formatId`:
   - `forTime` → continuous `{ limitSeconds: durationSeconds }` + `rounds`
   - `amrap` → continuous `{ limitSeconds: durationSeconds }` + `cycle`
   - `emom` → intervals `{ everySeconds: intervalSeconds ?? 60, count: rounds, workSeconds, stopOnMiss }` + one `once` per `lines` entry

   An unknown `formatId` throws, as it does today. A block that breaks the Context invariants also throws, in keeping with the parser's "a throw is a bug" policy. The model then carries no redundant field to disagree with: the interval count and total are no longer two stored numbers.
   - *Alternative: copy every stored number into the model as is.* Rejected. It would keep `rounds` and `durationSeconds` side by side forever, for rows that cannot exist.

6. **Consumers.**
   - `replay.ts` reads `stopOnMiss` from the interval clock.
   - `adjust.ts` asks `shapeOf(config) === 'rounds'`.
   - `draft.ts`'s `draftFromBlock(formatId, block, name)` becomes `draftFromWindow(window, name)`. It is the same mapping, keyed on the window's shape, and still throws for a For Time whose rounds don't share their exercises.
   - `tests/fixtures.ts` keeps building configs through `parseWorkoutRow`, so the goldens exercise the translation.
   - The tests that patch `config.block` (`engine.test.ts`'s stopping Tabata) patch the window instead.

7. **Presentation snapshot, recorded first.** `tests/presentation.test.ts` writes one file per workout under `tests/__presentation__/` (`toMatchFileSnapshot`). It covers every built-in and every `SYNTHETIC_WORKOUTS` row and records:
   - `mode`, `description`, `exercises`, `durationLine`, `timerMode`, `totalSeconds`, `advanceMode`, `engineVersion`
   - `view(config, initial(config))`
   - the same for each part of a sequence

   It is recorded on the unmodified code and committed before any engine edit. Like the goldens, it is never re-recorded with `-u`.

8. **Names.** "Window" is the code's name for what the UI and the multi-block code call a block. `blockIndexOf`, `TaggedEvent.block`, `blockLogs`, `restAfter`, `BLOCK n/N` and `SequenceConfig` keep their names, because renaming them would touch the goldens' `blockIdx` keys and the screens for nothing.

## Risks / Trade-offs

- **The refactor silently changes a result or a string** → The goldens and the presentation snapshot are both recorded before any engine edit and must stay green after every task. Neither is ever re-recorded. The stepwise-vs-fold engine test keeps running.
- **A real stored row breaks an invariant and now throws, which blanks the Library or History** → Only the editor and the seed have ever written rows, and both satisfy the invariants. A task checks every seed and fixture row against the translation. The device check opens the Library, a duplicated workout of each format and History sessions on a phone with real data.
- **E1 adds nothing the user can see** → Accepted, as with `unified-engine`. It keeps E2–E4 from each reworking the engine and the parser.
- **`shapeOf` is a per-shape dispatch inside an engine that is meant to be compositional** → Accepted as transitional. E2 replaces the continuous branches with structure stepping, and its tests decide where `shapeOf` stays.

## Migration Plan

No data migration. The schema stays v6. Rollback is reverting the change's commits: stored data never changed shape, so older code reads it as before.
