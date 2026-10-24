# Design

## Context

- **Where format rules are interpreted today** (see proposal.md - Why):
  - `constants/wod-engine.ts`'s `buildWodConfig` returns closures: `getTarget`, `getExerciseName`, `getKpi`, `advance`, `isComplete`, `initialSession`, plus `advanceMode`.
  - `components/judge/reducer.ts` applies `REP`/`NO_REP` and advances on target.
  - `hooks/use-judge.ts` counts seconds with `setInterval`, changes the EMOM minute through a `RESET` action, and finishes an AMRAP when `elapsed === totalSeconds`.
  - `components/result/replay.ts` (`deriveOnTarget`, `deriveOnClock`) and `components/result/adjust.ts` (`tagOnTargetPositions`, `deriveAdjustedOnClock`) each re-walk the log.
- Events are `{ t, ok }` (`LogEntry`, plus a UI-only `id`), stamped with `Date.now() - sessionStart`. The live interval comes from the `setInterval` count instead, so the two clocks drift apart.
- **v1 result semantics the goldens must pin.** The baseline specs describe these, and `engineVersion` 1 means them:
  - For Time and Chipper stop at the last rep. TIME is the last counted rep's `t`.
  - The unadjusted AMRAP counts every valid rep in the log, even after its duration.
  - EMOM buckets reps by `floor(t / 60000)`, counts reps beyond each minute's target, and ignores reps at or after its last minute.
  - With one or more adjustment changes, `deriveAdjustedResult` uses its own position-fixed algorithm: AMRAP round counting, For Time `DNF —` fallback, EMOM per-minute overrides.
- **Consumers of `WodConfig`:**
  - Presentation only: picker, setup, library, history, start overlay, result screen (`mode`, `name`, `description`, `exercises`, `totalSeconds`, `engineVersion`).
  - `session/adjust.tsx` also reads `advanceMode` (`isEmom`).
- `formatTime` lives in `reducer.ts` and is imported by `replay.ts`, `adjust.ts` and `use-judge.ts`.
- Engine-side files are pure TS. The only Expo import in their graph is a type (`SQLiteDatabase`, through `db/session-adjustments.ts` and `db/workouts.ts`). The tsconfig doesn't set `verbatimModuleSyntax`, so esbuild (vitest) drops those imports.

## Goals / Non-Goals

**Goals:** a single incremental engine used by live judging and by results. Byte-identical score and splits for every v1 log, with or without adjustments, proven by goldens recorded before the refactor. Live judging on the session clock.

**Non-Goals:** blocks, rest, caps, progressive reps (C2). Changing any v1 quirk. Component or screen tests. Bumping `engineVersion`. Persisting anything new.

## Decisions

1. **Incremental fold, and the result is the same fold.** In `constants/wod-engine.ts`:
   - `initial(config): EngineState`
   - `advanceTo(config, state, t): EngineState` applies clock transitions up to `t`.
   - `apply(config, state, event): EngineState` calls `advanceTo(event.t)`, then counts the event.
   - `view(config, state)` returns `{ exerciseName, target, kpi, timer }` for the header, exercise name and count.
   - `fold(config, events, endT)` is `events` sorted by `t`, reduced with `apply` from `initial`, then `advanceTo(endT)`.

   Live judging calls `apply` on each gesture and `advanceTo` on each tick. Results call `fold`. There is no second walk of the log anywhere.
   - *Alternative: a pure `interpret(config, events, t)` recomputed every tick.* Rejected by the user for efficiency. The divergence risk it removes is covered by decision 7's property test instead.

2. **`EngineState` holds the position, the counts and every event tagged with its position.** It is `{ pos: WodSession, done, raw, finished, t, tagged: { t, ok, pos, counted }[] }`.
   - `done` is the live count (capped at the target for onClock).
   - `raw` is the uncapped count in the current EMOM interval.
   - `tagged` is what `adjust.ts` used to rebuild in `tagOnTargetPositions`.
   - The no-rep accent stays UI state in the hook (`lastKind`), as today.

3. **v1 rules per `format.repeat`:**

   | repeat | `advanceTo(t)` | `apply(event)` |
   |---|---|---|
   | `rounds` | no clock transitions | ignored once `finished`. Count; on reaching the target advance; if the next position is complete, `finished` (stay on the final position, keep `done`) |
   | `cycle` | `t >= durationSeconds*1000` marks `finished` | **still counts after `finished`** (v1 quirk; live never sends such events, because the hook ignores gestures once finished) |
   | `perInterval` | `minuteIdx = min(floor(t/60000), totalMinutes)`; a change resets `done`/`raw`; reaching `totalMinutes` marks `finished` | ignored at or after `totalMinutes`. Counts `raw += 1`, `done = min(raw, target)`; never advances on target |

   No-rep events are tagged (`counted: false`) and never change counts. These are the rules `engineVersion` 1 pins. C2's new formats get their own rows and versions.

4. **`WodConfig` keeps structure and presentation only:** `mode`, `name`, `description`, `exercises`, `timerMode`, `totalSeconds`, `advanceMode`, `engineVersion`, plus the data the engine reads (`format`, `block`).
   - The closures (`getTarget`, `getExerciseName`, `getKpi`, `advance`, `isComplete`, `initialSession`) become private helpers of the engine.
   - `advanceMode` stays because `session/adjust.tsx` reads it as plain data.
   - `formatTime` moves from `reducer.ts` into `wod-engine.ts`.

5. **`use-judge.ts` runs on the session clock.**
   - The hook holds `EngineState` in state, replacing `useReducer`/`judgeReducer`. A `setInterval` of ~250 ms calls `advanceTo(Date.now() - sessionStart)`.
   - Timer text uses `elapsed = floor(t / 1000)` with today's formulas, so the `judging` timer scenarios still hold.
   - Sounds fire on transitions found by comparing the previous and next state: the minute cue on a `minuteIdx` increase while not finished, and the end cue on a clock-driven `finished`.
   - The clock freezes at the finishing `t` (last rep for For Time, `durationSeconds*1000` for AMRAP, `totalMinutes*60000` for EMOM).
   - The hook's return shape (`timerStr`, `timerLabel`, `done`, `target`, `exerciseName`, `kpi`, `finished`, `log`, gesture/animated styles, `startTimer`) is unchanged, so `session/run.tsx` needs no change.

6. **`replay.ts` and `adjust.ts` keep their signatures and output.**
   - `deriveResult(config, log)` folds with `endT = ∞` (results never cut; each v1 rule decides what counts) and builds splits and the score from `tagged` + final state.
   - `deriveAdjustedResult(config, log, changes)` takes positions from the same fold's `tagged` instead of `tagOnTargetPositions`. Everything after that (per-position overrides, cutoffs, AMRAP rounds, `DNF —`, EMOM buckets) stays as it is.
   - Keeping the signatures is what lets the golden tests run unchanged before and after.
   - `components/judge/reducer.ts` is deleted, and `components/judge/types.ts` keeps only `LogEntry`.

7. **Tests: vitest, engine-only, snapshot goldens.**
   - `vitest` is a dev dependency, with a `"test": "vitest run"` script and a `vitest.config.ts` that maps `@/` to the root. Test files live in `tests/`.
   - Configs are built from the frozen `db/seeds/v2-builtins.ts` rows through `db/workouts.ts`'s parser, exported as `parseWorkoutRow(row, exerciseNames)`. The tests run the real built-ins without SQLite.
   - `tests/goldens.test.ts` runs `deriveResult` and `deriveAdjustedResult` over synthetic logs and asserts with `toMatchFileSnapshot` (`tests/__goldens__/<case>.json`).
     - The snapshots are recorded on the current code **before** any engine edit.
     - During C1 `vitest` is never run with `-u`.
   - Cases per workout:
     - **FRAN**: complete; stopped mid-round; no-reps interleaved; reps after the last rep; adjusted target down; adjusted target up (`DNF —`).
     - **FILTHY FIFTY**: complete; mid-station.
     - **CINDY**: partial round; reps after 12:00; adjusted target; adjusted duration shorter.
     - **EVERY MINUTE**: all minutes completed; missed minutes; extra reps beyond the target; reps at or after 10:00; adjusted target; adjusted duration.
     - **Edge cases**: empty log; unsorted log.
   - `tests/engine.test.ts`, the property test: for each case, interleave `advanceTo` ticks every 250 ms with `apply` at each event, then compare the final state to `fold(config, events, endT)`. This pins "live = result" without testing the hook.

## Risks / Trade-offs

- [The fold and the hook drift if someone adds logic only in the hook] → The hook only calls `apply`/`advanceTo`/`view`, and decision 7's property test fails if the fold and the stepwise path disagree.
- [A golden is recorded with a bug] → Intended: goldens pin v1 *as shipped*, quirks included. Fixing anything is a new engine version in C2, never a silent re-record.
- [Someone runs `vitest -u` mid-refactor and overwrites a golden] → The snapshots are committed before the refactor starts (task group 1 ends with a commit point), so a diff shows up in git.
- [250 ms tick: a minute change or AMRAP end shows up to 250 ms late on screen] → The *state* is still correct, because every gesture is applied at its own `t` through `advanceTo` first. Only the display waits for the next tick.
- [An Expo/RN import reaches the test graph as a value] → Use `import type` for the engine-side imports touched in this change. A failing `vitest run` would show it immediately.

## Migration Plan

No data migration. Schema stays v5 and `engineVersion` stays 1. Rollback is reverting the commit, since saved sessions are untouched and the goldens prove results unchanged.
