# Proposal

## Why

Engine v2 (change C of the WOD editor plan) adds blocks, rest steps, time caps and progressive reps. Today a format's rules are interpreted in four places: `wod-engine.ts`'s `WodConfig` functions, the live `reducer.ts`, the live clock in `use-judge.ts` (EMOM minute change and AMRAP end driven by a `setInterval` second counter), and the result walks in `replay.ts`/`adjust.ts`. Every new primitive would have to be written three times, and saved results must keep matching the live session. The `setInterval` counter already drifts from the `Date.now()` stamps on each rep, so the judge can see a rep in one EMOM minute while the result counts it in the next. C is therefore split in two. This change, **C1**, unifies the engine with no change to any saved result. **C2** adds the new primitives on top of it.

## What Changes

- One incremental engine (`initial` / `advanceTo(t)` / `apply(event)` / `view`) drives both live judging and results. The result is the same fold over the stored events, not a separate walk. `reducer.ts` is removed and `WodConfig` loses its behavior functions.
- Live judging follows the session clock: the EMOM minute change, the AMRAP end and the visible timer are computed from the same `t` that stamps each event (a ~250 ms tick), no longer from a drifting second counter.
- `replay.ts` and `adjust.ts` keep their signatures and output, but take event positions from the engine fold instead of re-walking the log. The "no re-flow" adjustment layer is unchanged.
- Every saved result stays identical, including today's v1 quirks: the unadjusted AMRAP replay doesn't cut at its duration, EMOM results count reps beyond a minute's target, and adjusted results use their own position-fixed algorithm. `engineVersion` stays 1.
- The project gets its first test runner (vitest, engine code only). Synthetic golden logs are recorded against the current code **before** the refactor and must still match after it.
- No schema, data or UI change.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `judging`: a new requirement that live progress (EMOM interval, AMRAP end, the count) follows the same session clock as the recorded events, so what the judge sees matches the result.

## Impact

- **Code**: `constants/wod-engine.ts` (engine functions; `WodConfig` reduced to structure and presentation); `hooks/use-judge.ts` (engine state and a session-clock tick in place of `useReducer`/`setInterval`); `components/result/replay.ts` and `components/result/adjust.ts` (fold-based positions); `components/judge/reducer.ts` and the `JudgeState`/`JudgeAction` types removed; `db/workouts.ts` exports its row parser so tests can build configs from the frozen v2 seed.
- **Tooling**: `vitest` dev dependency, a `test` script, a vitest config mapping `@/`, test files and snapshot goldens next to the engine code.
- **Database**: none. Schema stays v5, and no stored row changes meaning.
- **Docs**: `CLAUDE.md` (Commands, WOD System, judge components, result screen, hooks); `docs/ROADMAP.md`'s note that golden logs wait for tests.
- **Dependencies**: `vitest` (dev only).
