# Design

## Context

- An EMOM's targets come from `targetAt(config, pos)`, which reads the line's fixed `target`. `intervalLineAt(config, m, k)` (change `emom-multi-exercise-intervals`) places a rep on a line by summing the interval's line targets. `replay.ts` and `adjust.ts` read their split targets from `targetAt`, and adjustments place reps with `intervalLineAt`.
- `advanceTo` for `perInterval`:
  - it moves to the interval the clock falls in, resetting `exIdx`, `done` and `raw`;
  - it finishes only after the last interval.
- `use-judge.ts`:
  - plays the end sound on any finish that isn't `isComplete`, which is always the case for an EMOM;
  - plays the interval cue only on an interval change that isn't a finish.
- `deriveOnClock` and `deriveAdjustedOnClock` build the same list of per-line splits and the `<completed>/<total> · <reps> reps` score. Adjustments bucket ok reps by time, up to the possibly overridden duration.
- Stored lines are `{ exerciseId, target, repDescription?, load? }`, and stored blocks are `{ formatId, lines, rounds?, durationSeconds?, intervalSeconds? }`. The parser copies the known fields.
- `EmomDraft` is `{ every, intervals, slots: RepsRow[][] }`. The For Time "SAME REPS EVERY ROUND" checkbox (`styles.checkRow`) is the existing toggle pattern.

## Goals / Non-Goals

**Goals:**
- An EMOM without an increment or the stop produces exactly today's state, results and adjustments. Every existing golden stays byte-identical.
- One definition of a progressive target, and one of a missed interval, shared by live judging, results and adjustments.

**Non-Goals:**
- Ladders on AMRAP or For Time.
- A "DEATH BY" mode label.
- Increments that shrink. Increments are 0 or more.

## Decisions

### 1. Data: `increment` on the line, `stopOnMiss` on the block

`WodLine` and the stored line gain an optional `increment`. `Block` and `StoredBlock` gain an optional `stopOnMiss`. The parser passes both through. The editor writes `increment` only when it is greater than 0 and `stopOnMiss` only when it is true, so existing rows and 60-second plain EMOMs are stored exactly as before.

**Alternative considered:** a new `Format` (a "Death by" format). The stop and the ladder are content the owner writes, and they combine freely with interval length and several exercises. As format variants they would multiply.

### 2. Progressive target in `targetAt`

For `perInterval`, `targetAt` returns `line.target + (line.increment ?? 0) × floor(minuteIdx / sequenceLength)`. That is the k-th repetition of the sequence. Change `intervalLineAt` to sum `targetAt` for each line of the interval, instead of the raw `target`.

Everything that already reads `targetAt` follows automatically:
- `apply`'s on-target move and the live capped count;
- the view;
- the split targets;
- adjustment placement.

### 3. The stop in `advanceTo`

A small helper decides whether the state's current interval is missed: its current line isn't the interval's last, or `raw < targetAt`. This works because earlier lines of an interval were left only on reaching their target.

When `stopOnMiss` is set and the clock leaves interval `m`:
- If interval `m` is missed, finish at `(m + 1) × intervalMs`, keeping its position and counts.
- If interval `m` is completed but the clock jumped past interval `m + 1`, that interval had no reps and is missed (every target is at least 1). Finish at `(m + 2) × intervalMs`, on `m + 1` with zero counts.
- Otherwise, move on as today.

The end of the last interval finishes as today. Since `finished` is set, `apply` ignores later events and `use-judge` plays the end sound, with no interval cue.

### 4. Results: the same split list, cut at the first missed interval

`deriveOnClock` and `deriveAdjustedOnClock` build their split lists as now. For a stopping EMOM, one shared helper in `replay.ts` then does the following:
1. It finds the first interval with any split not completed.
2. It drops the splits of later intervals.
3. It scores `<intervals before it> + <its reps>`, or `<total> + 0` when none is missed.

This matches the fold's stop: a fold finishing at a miss counts no event after it, so the first incomplete interval of the fold's counted reps is exactly where it stopped.

For adjustments, cutting at the first interval not completed under the adjusted targets is exactly the spec's recomputation:
- reps after the cut drop out of the score;
- a lowered target that completes the missed interval moves the stop to the next interval, which has 0 reps.

**Alternative considered:** a second fold over adjusted targets. The per-line splits already hold everything the cut needs, and the adjusted path doesn't fold for EMOM today.

### 5. Breakdown and description

- In `summarize`, a line's amount gets ` (+n)` when its increment is greater than 0, giving "1 (+1) / min" and "5 (+1) + 10 / min".
- In `describeContent`, a stopping EMOM's description ends with " · until failure". This is never combined with the For Time cap suffix.
- The mode label is unchanged.

### 6. Editor

- EMOM rows become `RepsRow & { increment: string }`. An empty string means 0, and the input shows a "0" placeholder.
- `EmomDraft` gains `stopOnMiss: boolean`, default false.
- `validateDraft` flags a non-empty increment that isn't a whole number of 0 or more on `line:<i>`, as "Increment must be 0 or more".
- Draft conversion:
  - `draftToStoredBlock` and `draftFromBlock` write and read both fields;
  - `switchFormat` to EMOM starts increments empty;
  - `addLine` and `addLineToSlot` create empty ones.
- `new.tsx`:
  - each EMOM line's REPS row gets a `+/ROUND` input;
  - a "STOP AT FIRST MISSED INTERVAL" checkbox, in the same style as "SAME REPS EVERY ROUND", sits under EVERY / INTERVALS.

### 7. Goldens

`tests/fixtures.ts` gains two synthetic workouts:
- **LADDER:** 6 minutes alternating BURPEES 3 (+1) and KB SWINGS 10 (+2), no stop.
- **DEATH BY:** 20 minutes of BURPEES 1 (+1), stopping.

The cases are:
- LADDER: all completed, and one minute missed (no stop, so it runs on).
- DEATH BY:
  - stopped at minute 13 with 9 reps;
  - all 20 completed (`20 + 0`);
  - an empty log (`0 + 0`, minute 1 listed at 0/1);
  - a rep logged after the stop (ignored);
  - minute 5's target raised to 6 (`4 + 5`);
  - minute 13's target lowered to 9 (`13 + 0`).

They're recorded once as new files, and every existing golden stays byte-identical.

## Risks / Trade-offs

- [The live stop and the result cut disagree] → Both rest on the same per-line completion. The live = result engine test runs over the new cases, and the goldens pin the cut.
- [A raised duration on a stopping EMOM] → The cut happens after the duration override, and the stop still applies. Reps after the original stop don't exist live.
- [Progressive targets make long ladders' later splits unreachable] → That's the athlete's workout. INTERVALS remains the owner's maximum.
