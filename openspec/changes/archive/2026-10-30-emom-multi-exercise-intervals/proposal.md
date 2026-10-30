# Proposal

## Why

Many EMOMs ask for more than one movement per interval, for example "every minute: 5 pull-ups + 10 push-ups". Today each EMOM interval holds exactly one exercise in the engine, results, adjustments and editor, so those workouts can't be written or judged. This is C2b-2, the second of the three changes C2b was split into (`docs/ROADMAP.md`, WOD editor plan): interval length (done), then several exercises per interval, then progressive reps (C2b-3).

## What Changes

- An EMOM interval MAY hold several exercises, each with its own reps. They are done in order within the interval: the live count moves to the next exercise when the current one reaches its target. Only the clock changes the interval.
- Once every exercise of the interval has reached its target, the count stays on the last one. Further valid reps count as extra reps, as they do today.
- Splits are one per exercise of each interval, for example "Interval 1 — PULL-UPS 5/5" and "Interval 1 — PUSH-UPS 10/10". An interval counts as completed only when all its exercises reach their targets. The score stays `<completed>/<total> · <reps> reps`.
- After judging, each exercise's split can have its target adjusted on its own. A target change affects completion only, never which exercise a rep was counted toward.
- The exercise breakdown (Library detail and pre-start summary) shows a multi-exercise interval as one row: "PULL-UPS + PUSH-UPS" with "5 + 10 / min".
- In the editor, each interval of the EMOM sequence holds a list of exercises: "+ EXERCISE" inside an interval, and "+ ADD MINUTE" / "+ ADD INTERVAL" for a new interval.
- No engine version change: an interval with one exercise behaves exactly as today, so every v1 result and golden stays as it is. New goldens pin multi-exercise cases.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `wod-formats`: EMOM intervals may hold several exercises done in order.
- `session-results`: EMOM splits are per exercise of each interval, and an interval is completed when all its exercises are.
- `result-adjustment`: an EMOM target change applies to one exercise of an interval and affects completion only.
- `library`: the exercise breakdown shows a multi-exercise interval as one row.
- `workout-editor`: an EMOM interval takes one or more exercises.

## Impact

- `constants/wod-engine.ts`: the EMOM position uses `exIdx` within the interval, and the engine advances on target inside an interval. `summarize` joins an interval's exercises.
- `components/result/replay.ts` and `components/result/adjust.ts`: splits and completion per exercise.
- `components/editor/draft.ts` and `app/library/new.tsx`: EMOM slots become lists of exercises.
- `app/session/adjust.tsx` and `hooks/use-judge.ts`: no expected change. Split rows already carry `(roundIdx, exIdx)`, and the interval cue already keys on the interval index. The device checks confirm this.
- No storage change. A stored EMOM block's `lines` entry is already a list of lines per interval.
- Tests: `tests/fixtures.ts` gains a synthetic multi-exercise EMOM with golden cases; `tests/engine.test.ts` and `tests/draft.test.ts` gain cases.
