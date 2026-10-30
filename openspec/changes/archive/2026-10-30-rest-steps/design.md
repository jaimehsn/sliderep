# Design

## Context

- A For Time's `apply` moves to the next round as soon as a round's last line reaches its target. `advanceTo` for `rounds` only checks the cap. The clock is the session clock, and the final TIME is the last counted rep's `t`.
- An EMOM's position comes from the clock: `floor(t / intervalMs)`. A stopping EMOM (change `emom-progressive-reps`) finishes at `(m + 1) × intervalMs` when interval `m` is missed, or at `(m + 2) × intervalMs` when interval `m + 1` was skipped with no reps.
- `use-judge.ts`:
  - `record` moves the clock first and drops a gesture once finished, so it is never recorded;
  - `commit` plays the minute cue on an interval change and the end cue on a finish that isn't `isComplete`.
- Results:
  - `deriveOnTarget` and `deriveOnClock` read the fold's counted events;
  - `deriveAdjustedOnTarget` reads them too, through `tagOnTargetPositions`;
  - `deriveAdjustedOnClock` buckets the raw ok log by time.
- Stored blocks are `{ formatId, lines, rounds?, durationSeconds?, intervalSeconds?, stopOnMiss? }`. The parser copies the known fields.

## Goals / Non-Goals

**Goals:**
- A workout without rest produces exactly today's state transitions, results and adjustments. Every existing golden stays byte-identical.
- One definition of "resting", shared by the engine, the live screen and the gesture drop.

**Non-Goals:**
- A rest step as a general `Step` type in the block. Here it is two block parameters; C2d can turn them into steps if blocks need them.
- Showing the next exercise's name during a rest. The count already shows its target.

## Decisions

### 1. Data: two optional block fields

- `Block.restSeconds` is read only for `rounds`: the rest between rounds.
- `Block.workSeconds` is read only for `perInterval`: the work time of each interval.

The stored block and the parser pass both through. The editor writes them only when set. No migration is needed.

**Alternative considered:** reusing `durationSeconds`. It is already the For Time cap and the EMOM total.

### 2. For Time rest: `restUntil` in the engine state

`EngineState` gains `restUntil: number | null`, `null` in `initial`.

- **`apply`:** when a counted rep moves to the next round (not the final one) and the block has `restSeconds`, it sets `restUntil = t + restSeconds × 1000`. After its own `advanceTo`, if `restUntil` is still set, the event is tagged `counted: false`.
- **`advanceTo` for `rounds`:**
  1. The cap is checked first, so a cap reached during a rest finishes the workout.
  2. Then, once `t ≥ restUntil`, `restUntil` goes back to `null`.

The clock is never shifted, so TIME and the cap include the rests and a round's first lap includes the rest before it. A Chipper never changes round, so it never rests.

**Alternative considered:** deriving the rest from the last counted rep's `t`. That needs the round-change instant on every check, and the state already sees it once, in `apply`.

### 3. EMOM work time: a phase of the clock

No state is needed: `t mod intervalMs ≥ workSeconds × 1000` is rest.
- `apply` tags an event in a rest phase `counted: false`.
- For the stop, a missed interval `m` ends at `missEnd(m) = m × intervalMs + (workSeconds ?? intervalSeconds) × 1000`. The existing check becomes "`t ≥ missEnd(m)` and missed, finish there". The skipped interval becomes "`t ≥ missEnd(m + 1)`, finish at `missEnd(m + 1)` on `m + 1`".
- Without a work time, `missEnd(m) = (m + 1) × intervalMs`, which is exactly today's condition and finish time.
- The last interval still ends at `total × intervalMs`, after its rest.

### 4. One resting check, exported

`isResting(config, state)` is true:
- for `rounds`, when `restUntil` is set;
- for `perInterval` with a work time, when `state.t` is in a rest phase.

It is false once finished. `restLeftSeconds(config, state)` gives the countdown. `use-judge`:
- `record` returns false without recording when the clocked state `isResting`, so there are no haptics, as after a finish;
- `commit` plays the minute cue once when `isResting` changes or the interval changes, unless it finished.

### 5. View

- During a rest, `view` returns `exerciseName` `REST mm:ss`.
- For an EMOM with a work time, the timer counts down to the end of the current phase, labelled "work left" or "rest left".
- A For Time's elapsed timer is unchanged.
- `target` and `done` are those of the position, which is already the next round's first line during a For Time rest, at 0.

### 6. Results and adjustments

`deriveOnTarget`, `deriveOnClock` and `deriveAdjustedOnTarget` need no change: reps in a rest are never counted by the fold. `deriveAdjustedOnClock` buckets the raw log, so it also drops ok events in a rest phase. Live never records them, so this only guards crafted or future logs.

### 7. Descriptions

`describeContent` appends, in this order: the scheme and names, " · <seconds> s rest" or " · <seconds> s work", the cap, and " · until failure". Mode labels and the detail duration line are unchanged.

### 8. Editor

- `ForTimeDraft` gains `rest`, and `EmomDraft` gains `work`. Both are strings, `''` for none.
- Validation:
  - `rest` must be 1–600, and only on 2 rounds or more, keyed `rest`;
  - `work` must be from 1 to less than a valid EVERY, keyed `work`.
- `draftToStoredBlock` writes them only when set, and `draftFromBlock` reads them back.
- `new.tsx`: REST (SEC) joins the ROUNDS / TIME CAP row, and WORK (SEC) joins the EVERY / INTERVALS row. Both rows already wrap.

### 9. Goldens

`tests/fixtures.ts` gains three synthetic workouts:
- **RESTED:** 3 rounds of BURPEES 5, with 60 s of rest.
- **RESTED CAPPED:** the same with a 2-minute cap.
- **TABATA:** EVERY 30, WORK 20, 8 intervals of AIR SQUATS 8.

The cases are:
- RESTED:
  - completed (TIME includes both rests);
  - a crafted rep inside a rest (not counted);
  - round 1's target lowered by adjustment (positions not re-flowed).
- RESTED CAPPED: the cap reached during a rest (`CAP · N reps`).
- TABATA:
  - all completed;
  - a crafted rep in a rest phase (not counted, with and without adjustment);
  - a target adjustment.

They're recorded once as new files.

## Risks / Trade-offs

- [The new state field breaks equality-based tests] → `initial` sets it, and every transition spreads the state. Engine tests compare results, not raw states.
- [The live rest and the result disagree] → Both go through the same `apply`/`advanceTo`. The live = result engine test runs over the new workouts.
- [The 250 ms tick shows a rest end up to a tick late] → The tick only updates the screen. A gesture moves the clock to its own `t` first, so it counts the instant the rest ends.
- [The last Tabata interval ends 10 s after its last work] → It matches the usual 4:00 Tabata clock. A stopping EMOM still ends at the work's end.
