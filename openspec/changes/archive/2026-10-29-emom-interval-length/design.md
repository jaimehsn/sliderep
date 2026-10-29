# Design

## Context

- An EMOM's interval is 60 seconds by assumption. The engine's `advanceTo` uses `Math.floor(t / 60000)` and `t: total * 60000`, and `totalIntervals` is `ceil(totalSeconds / 60)`. `kpiAt` labels it `'minute'` and `view` labels the timer `'min left'`.
- `replay.ts` (`deriveOnClock`) and `adjust.ts` (`deriveAdjustedOnClock`) bucket reps by `floor(t / 60000)`, label splits "Minute N", and derive the count from `totalSeconds / 60` (or the duration override / 60).
- `app/session/adjust.tsx` shows and converts an EMOM's duration in whole minutes.
- A stored EMOM block is `{ formatId: 'emom', lines: [[line], …], rounds: <intervals>, durationSeconds: <intervals × 60> }`. The parser (`db/workouts.ts`) copies `rounds` and `durationSeconds` into `Block`.
- `EmomDraft` has a `minutes` field that is both the interval count and the minutes.
- The position type `WodSession` names the interval index `minuteIdx`.

## Goals / Non-Goals

**Goals:**
- One place that knows an EMOM's interval length. Every use of 60 000 ms derives from it instead.
- No change to any existing result. At 60 s, every label and every golden stays as it is.

**Non-Goals:**
- Several exercises per interval (C2b-2), progressive reps (C2b-3) and rest intervals (C2c).
- Interval lengths on AMRAP or For Time.

## Decisions

### 1. `intervalSeconds` on the block, omitted at 60

`Block` and `StoredBlock` gain an optional `intervalSeconds`, and the parser passes it through. A new exported helper, `intervalSeconds(config)`, returns `config.block.intervalSeconds ?? 60`. Every engine and result use of 60 000 ms reads that helper instead.

- `totalIntervals` becomes `ceil(totalSeconds / interval)`.
- `durationSeconds` stays `rounds × interval`, so `totalSeconds` keeps meaning the whole workout's duration. The AMRAP-style remaining-time code and the adjust duration field keep working.

**Alternative considered:** an interval on `Format`, as the ROADMAP's draft `onClock(seconds)` suggests. Formats are built-in and versioned, so every interval length would need its own format, or a format parameter. The interval is content the owner writes, so it belongs in the block.

### 2. `minuteIdx` keeps its name

`WodSession.minuteIdx` stays as is and is documented as the interval index. It's read by the adjustments' `roundIdx` mapping and in many tests. A rename would be churn with no behavior change, and C2b-2 will touch positions anyway.

### 3. Labels: "minute" at 60 s, "interval" otherwise

A small helper decides once per config whether the workout counts in minutes:
- KPI label: `'minute'` or `'interval'`.
- Timer label: `'min left'` or `'interval left'`.
- Split label: `Minute N` or `Interval N`.

**Mode** (`describeMode`):
- at 60 s, `EMOM · n`;
- when the interval is a multiple of 60, `E<k>MOM · n`;
- otherwise `EVERY m:ss · n`.

**Description** (`describeContent`):
- at 60 s, unchanged;
- otherwise `n × m:ss · <names>`.

`m:ss` comes from a short formatter of its own. `formatTime`'s zero-padded `01:30` reads like a clock, not a length.

### 4. Adjusting an EMOM in intervals

The adjustment is still stored as `{ type: 'duration', newDurationSeconds }`, so the stored change shape doesn't change. `adjust.tsx` shows and reads it:
- in minutes at 60 s, as today;
- otherwise in intervals, converting `n × interval` both ways.

`deriveAdjustedOnClock` buckets reps by `floor(t / intervalMs)` and counts `ceil(cutoff / interval)` intervals. At 60 s that is exactly today's arithmetic.

### 5. Editor: `every` and `intervals`

`EmomDraft` becomes `{ every: string, intervals: string, slots }`. `minutes` is renamed `intervals`, since that is what it always counted. `every` starts at `'60'`.

`validateDraft` reports:
- `every`, "Interval must be 10 to 600 seconds";
- `intervals`, "Intervals must be 1 or more".

`draftToStoredBlock` writes `rounds = intervals` and `durationSeconds = intervals × every`, and writes `intervalSeconds` only when `every ≠ 60`, so built-ins round-trip byte-identically. `draftFromBlock` reads `every` from `intervalSeconds ?? 60`.

The screen shows EVERY (SEC) and INTERVALS on one row, with `= m:ss` total beside them once both are valid.

### 6. Goldens

`tests/fixtures.ts` gains two synthetic workouts:
- a 10 × 90 s EMOM alternating BURPEES 10 and KB SWINGS 15;
- an 8 × 120 s EMOM.

The cases are:
- all intervals completed;
- missed intervals, including a rep just after the 90 s boundary;
- reps at or after the end;
- a shortened duration (6 intervals);
- a raised target.

They're recorded once as new files, and existing goldens stay byte-identical.

## Risks / Trade-offs

- [Some 60 s assumption is missed, so a non-60 EMOM is half-converted] → `grep` for `60000` and `/ 60` in the engine and results during implementation. The live = result engine test runs on the new synthetic cases too.
- [The `minuteIdx` name now misleads] → Documented in the type and in `CLAUDE.md`. It can be renamed when C2b-2 reshapes positions.
- [Old app versions can't read `intervalSeconds`] → Irrelevant: single device, no sync. The field is optional, and absent on every pre-existing row.
