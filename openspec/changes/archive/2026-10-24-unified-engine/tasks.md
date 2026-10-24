# Tasks

## 1. Test runner and goldens on the current code (no engine edits yet)

- [x] 1.1 Add `vitest` as a dev dependency (`pnpm add -D vitest`), a `"test": "vitest run"` script and a `vitest.config.ts` mapping `@/` to the project root, with tests under `tests/` (design.md decision 7); verify `pnpm test` runs, reporting no test files instead of a config error
- [x] 1.2 Export `db/workouts.ts`'s row parser as `parseWorkoutRow(row, exerciseNames)` with no behavior change (`listWorkouts`/`getWorkout` call it), and add `tests/fixtures.ts`, which builds the four built-in configs from `db/seeds/v2-builtins.ts` and holds the synthetic logs and adjustment packages listed in design.md decision 7; verify `pnpm lint` and `npx tsc --noEmit` pass
- [x] 1.3 Add `tests/goldens.test.ts`, which runs `deriveResult` and `deriveAdjustedResult` over every fixture case with `toMatchFileSnapshot('__goldens__/<case>.json')`, and run `pnpm test` once to record them on the unmodified engine; verify every case wrote a golden, then spot-check by hand that FRAN complete, CINDY "reps after 12:00", EVERY MINUTE "extra reps" and FRAN "adjusted target up" (`DNF —`) show the v1 quirks described in design.md Context
- [x] 1.4 Add `pnpm test` to `CLAUDE.md`'s Commands block (engine-only scope, goldens never re-recorded with `-u` without a new engine version) and update `docs/ROADMAP.md`'s "golden logs are advisable once tests are introduced" line to point at `tests/`; then stop and ask the user to commit the goldens before any engine edit (design.md Risks); verify `git status` shows `tests/__goldens__/` committed

## 2. Engine core

- [x] 2.1 In `constants/wod-engine.ts`, add `EngineState`, `initial`, `advanceTo`, `apply`, `view` and `fold` with the per-`repeat` v1 rules of design.md decisions 2–3, built on the existing private behavior helpers, and move `formatTime` there (re-exported from `reducer.ts` for now); verify lint/tsc pass
- [x] 2.2 Add `tests/engine.test.ts`: for every fixture case, the stepwise path (250 ms `advanceTo` ticks interleaved with `apply`) ends in the same state as `fold(config, events, endT)`, plus focused cases for the three v1 rules (For Time ignores events after the last rep, AMRAP counts after its duration, EMOM ignores reps at or after its last minute and caps `done` but not `raw`); verify `pnpm test` passes with the goldens still green

## 3. Results on the fold

- [x] 3.1 Rewrite `components/result/replay.ts`'s `deriveResult` to build splits and the score from `fold(config, log, Infinity)` (design.md decision 6), keeping its signature and `Split`/`WodResult` types; verify `pnpm test` passes with every golden unchanged
- [x] 3.2 Replace `components/result/adjust.ts`'s `tagOnTargetPositions` with the fold's `tagged` positions, leaving the override layer as is; verify `pnpm test` passes with every golden unchanged
- [x] 3.3 Update `CLAUDE.md`'s Result Screen entries (`replay.ts` and `adjust.ts` fold with the engine, no own log walk); verify the entries match the code

## 4. Live judging on the session clock

- [x] 4.1 Rewrite `hooks/use-judge.ts` to hold `EngineState` instead of `useReducer`, with a ~250 ms tick calling `advanceTo(Date.now() - sessionStart)`, timer text from `floor(t / 1000)`, minute and end sounds on state transitions, the clock frozen at the finishing `t`, and gestures ignored once `finished` — keeping its return shape (design.md decision 5); verify lint/tsc pass and `session/run.tsx` needs no change
- [x] 4.2 Update `CLAUDE.md`'s `hooks/use-judge.ts` and judge component entries (engine state on the session clock, no reducer); verify the entries match the code

## 5. Remove the old code paths

- [x] 5.1 Delete `components/judge/reducer.ts`, reduce `components/judge/types.ts` to `LogEntry`, drop the behavior closures from `WodConfig` (keeping `advanceMode` and adding `format`/`block` as data, design.md decision 4), and point every `formatTime` import at `wod-engine.ts`; verify `grep -rn "judgeReducer\|getTarget\|isComplete\|initialSession" app components hooks` finds only engine-internal uses, and that lint, tsc and `pnpm test` pass with goldens unchanged
- [x] 5.2 Rewrite `CLAUDE.md`'s WOD System entry for `constants/wod-engine.ts` (the fold API, the v1 rules per `repeat`, `WodConfig` as structure and presentation); verify the entries match the code

## 6. Device verification

- [x] 6.1 Judge each of the four workouts once: FRAN finishes on its last rep with the clock frozen there, CINDY ends exactly at 00:00 with the end sound, EVERY MINUTE plays the minute cue and resets the count each minute and ends after minute 10, and FILTHY FIFTY shows station progress; verify each result matches the last live screen (round/minute and count)
- [x] 6.2 Open saved sessions from before this change in History (including one with adjustments) and verify their scores and splits are unchanged; open ADJUST RESULT on a new session and verify an adjustment still saves and updates the score
- [x] 6.3 Run `openspec validate unified-engine --strict` and verify it reports the change as valid

## Workflow follow-up

- Archive with `/opsx:archive`, syncing the ADDED `judging` requirement.
- Next: change C2 (engine v2 primitives: blocks, rest, cap, progressive reps) on top of this engine.
