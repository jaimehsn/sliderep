# Proposal

## Why

Many interval workouts don't run on one-minute intervals: "every 2 minutes for 16 minutes" (E2MOM), "every 90 seconds × 10", "every 30 seconds". Today an EMOM's interval is fixed at 60 seconds in the engine, results, adjustments and editor, so those workouts can't be written or judged. This is C2b-1, the first of the three changes C2b was split into (`docs/ROADMAP.md`, WOD editor plan): interval length first, then several exercises per interval (C2b-2), then progressive reps (C2b-3).

## What Changes

- An EMOM MAY set its interval length: whole seconds from 10 to 600, 60 by default. An EMOM without one runs on 60-second intervals, exactly as today.
- The editor's EMOM gets EVERY (SEC), defaulting to 60, and INTERVALS (the total count), and shows the total time derived from them. INTERVALS replaces TOTAL MINUTES, which it equals at 60 s.
- Mode label: "EMOM · 10" at 60 s; "E2MOM · 8" for a whole number of minutes; otherwise "EVERY 1:30 · 10". Description: "10 min · …" at 60 s, otherwise "10 × 1:30 · …".
- With an interval other than 60 s, judging, progress, splits and the adjust screen speak of intervals: timer "interval left", progress "interval N of total", splits "Interval N — <exercise>", and the adjusted duration in intervals. At 60 s everything still reads "minute".
- No engine version change: no recorded log was judged against a non-60-second interval, so every v1 result and golden stays as it is. New goldens pin 90-second and 2-minute cases.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `wod-formats`: EMOM intervals have a length, and the mode label, description and progress follow it.
- `judging`: the EMOM timer counts down the current interval.
- `session-results`: EMOM splits are per interval.
- `result-adjustment`: an EMOM's duration is adjusted in intervals.
- `workout-editor`: EMOM content takes EVERY (SEC) and INTERVALS.

## Impact

- `constants/wod-engine.ts`: an `intervalSeconds` on `Block`; the interval index, total intervals, timer, KPI label, mode label and description stop assuming 60 s.
- `components/result/replay.ts`, `components/result/adjust.ts`: interval buckets and labels.
- `app/session/adjust.tsx`: the EMOM duration field in intervals.
- `components/editor/draft.ts`, `app/library/new.tsx`: the EVERY and INTERVALS fields.
- `db/workouts.ts`: the stored block passes `intervalSeconds` through. This is optional and only written when it isn't 60, so there is no migration.
- Tests: `tests/fixtures.ts` gains synthetic 90-second and 2-minute EMOMs with golden cases; `tests/engine.test.ts` and `tests/draft.test.ts` gain interval cases.
