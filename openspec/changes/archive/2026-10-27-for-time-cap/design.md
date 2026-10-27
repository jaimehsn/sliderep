# Design

## Context

- The engine (`constants/wod-engine.ts`) is one fold over `advanceTo`/`apply`. For `repeat: 'rounds'` (For Time, Chipper), `advanceTo` only moves the clock, and the state is `finished` when the last position completes. `cycle` (AMRAP) already finishes in `advanceTo` when `t >= totalSeconds * 1000`.
- A stored block already has an optional `durationSeconds`. `buildWodConfig` copies it into `WodConfig.totalSeconds`, which is 0 for every For Time today.
- `totalSeconds > 0` already drives the duration line (`app/library/[id].tsx`, `components/judge/start-overlay.tsx`) and the adjust screen's duration field (`app/session/adjust.tsx`).
- The adjusted For Time score (`components/result/adjust.ts`) only looks at positions that have reps. That is enough while every judged For Time ran to its last rep, but not once a cap can stop it early. An incomplete adjusted For Time scores the "DNF — …" fallback, which goldens pin.
- `tests/fixtures.ts` builds golden configs only from the v2 built-ins, and none of them has a cap.

## Goals / Non-Goals

**Goals:**
- One rule for "a rep at the cap or later doesn't count", shared by live judging, the result and the adjusted result.
- No change to any existing result: every golden in `tests/__goldens__/` stays byte-identical.

**Non-Goals:**
- Caps on AMRAP or EMOM, which already end on the clock.
- A countdown timer.
- Seconds-level caps in the editor; the adjust screen still takes seconds.

## Decisions

### 1. The cap is the For Time block's `durationSeconds`

A capped For Time stores `durationSeconds = minutes × 60` in its block, the same field AMRAP uses for its duration. As a result, `totalSeconds > 0` on a `rounds` config means "capped".

- **Why:** there is no schema or parser change, and the duration line and adjust field light up on the existing check.
- **Alternative considered:** a separate `capSeconds` field. It names the concept better, but every consumer would read two fields.
- A small exported helper, `capSeconds(config)`, returns the cap for a capped `rounds` config and `null` otherwise. Code that means "cap" calls it instead of testing `totalSeconds` directly.

### 2. The engine finishes a capped `rounds` block at the cap; `engineVersion` stays 1

In `advanceTo`, a `rounds` config with a cap behaves like AMRAP: `t >= cap` finishes the state at `t = cap`. `apply` already ignores events once a `rounds` state is finished, so a rep at the cap or later doesn't count. This holds live too, because `use-judge` drops gestures after a clock-driven finish.

- **Why version 1:** a version is about how a recorded log replays. No log was ever judged against a capped workout, and uncapped workouts take exactly today's path.
- **Alternative considered:** bumping For Time to version 2. That would mean keeping a v1 interpreter around for no log that needs it.

### 3. "Capped" means finished without completing

The result needs to tell a capped finish from a completed one. `EngineState.finished` doesn't, but the final position does. A completed For Time stays on its last position with that position's full count (`apply` doesn't step past it), so `isComplete(config, state)` checks that the state is on the last position and has reached its target.

`deriveOnTarget` (`replay.ts`) scores:
- TIME, as today, when the workout is complete or has no cap;
- otherwise `CAP · <counted reps> reps` under the `SCORE` label.

### 4. The adjusted score checks every position of the block

For a capped workout, `deriveAdjustedOnTarget` uses the latest duration change as the cap, with `e.t < cap`: a rep at the cap doesn't count, matching decision 2. Without a duration change, the original cap applies, which the fold already enforced.

Completeness is checked against all positions of the block (rounds × lines), not only the positions that have reps. A position never reached is incomplete.
- When every position is complete, the score is TIME of the last position's completing rep.
- Otherwise it is `CAP · <sum of kept reps> reps`.

Uncapped For Time keeps today's code path, its `t <= cutoff` filter (unreachable there, since it offers no duration) and its "DNF — …" fallback. That keeps the goldens unchanged.

- **Alternative considered:** changing the AMRAP/EMOM cutoff to `<` as well. It's more uniform, but it would change pinned results.

### 5. Presentation

- **Timer label:** `view` returns `elapsed · cap 12:00` for a capped config. The header renders the label as is.
- **Description:** `describeContent` appends ` · <m> min cap`.
- **Duration line:** the detail and start overlay show `<m> min cap` instead of `<m> min` when `capSeconds(config)` is set.
- **Adjust screen:** the duration field's label says "cap" for a capped workout. It still takes seconds, like AMRAP.
- **End sound:** `use-judge` plays it when a state finishes by the clock, that is, when it is finished and not complete. That covers AMRAP, EMOM and a capped For Time with one condition, instead of the current `repeat !== 'rounds'`.
- `mode` is unchanged.

### 6. Editor

`ForTimeDraft` gains a `cap: string` field: whole minutes, `''` for none.
- `validateDraft` adds a `cap` problem ("Time cap must be 1 or more") when the field is non-empty and not a count.
- `draftToStoredBlock` writes `durationSeconds` only when a cap is set, so existing round-trips are unchanged.
- `draftFromBlock` reads it back.
- `switchFormat` drops the cap when leaving FOR TIME. AMRAP and EMOM keep their own minutes field.

The field goes next to ROUNDS in `app/library/new.tsx`.

### 7. Goldens for capped cases

`tests/fixtures.ts` gains synthetic capped workouts built through `parseWorkoutRow`, and a `GoldenCase` can name one instead of a built-in. The cases are:
- finished under the cap;
- capped mid-position;
- a rep exactly at the cap;
- a shortened cap;
- a raised cap;
- a raised target on a capped workout.

These are recorded once as new golden files. Existing cases aren't touched.

## Risks / Trade-offs

- [`totalSeconds` now has two meanings, duration and cap] → `capSeconds()` names the cap meaning, and screens that branch on it call that helper.
- [The edge rule differs: `<` for the cap, `<=` for the AMRAP/EMOM duration cutoff] → It's documented here and in `CLAUDE.md`, and the "rep at the cap" golden pins the cap side. Aligning AMRAP/EMOM would be a separate change, with its own hand-corrected goldens.
- [A raised cap can't add reps] → That's expected and stated in the spec. Events after the original cap were never recorded.
