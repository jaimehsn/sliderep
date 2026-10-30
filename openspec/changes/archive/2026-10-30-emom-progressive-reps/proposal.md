# Proposal

## Why

Two common EMOM styles can't be written yet:
- **Ladders**, where reps grow every time an exercise comes round: "burpees +1 each minute".
- **"Death by"**, where reps grow every minute until the athlete can't finish one, and the score is how far they got.

Today an EMOM's targets are fixed and the workout always runs every interval. This is C2b-3, the last of the three changes C2b was split into (`docs/ROADMAP.md`, WOD editor plan).

## What Changes

- An EMOM line MAY have an **increment**: reps added each time its entry of the interval sequence comes round. A line of 3 reps with +1, in a sequence of two entries, asks for 3, 4, 5, … in intervals 1, 3, 5, …. A one-entry sequence of BURPEES 1 with +1 is a Death by: 1, 2, 3, … per minute.
- An EMOM MAY **stop at the first missed interval**. When an interval ends with any of its exercises short of its target, judging finishes there, with the end sound. INTERVALS becomes the maximum.
- With the stop, the score is `<completed intervals> + <reps in the missed interval>`, for example `12 + 9`. The splits list the intervals up to the missed one. Without the stop, the score keeps today's `<completed>/<total> · <reps> reps`.
- After judging, a target change on an EMOM with the stop recomputes where it stopped: the first interval not completed under the adjusted targets. Reps after it no longer count.
- Breakdown and description:
  - a line with an increment shows it in the breakdown, as in "1 (+1) / min";
  - a stopping EMOM's description ends with " · until failure";
  - the mode label is unchanged.
- In the editor:
  - each EMOM line gets a `+/ROUND` field, 0 by default;
  - the EMOM gets a "STOP AT FIRST MISSED INTERVAL" option;
  - DUPLICATE keeps both.
- No engine version change. An EMOM without an increment or the stop behaves exactly as today, so every v1 result and golden stays as it is. New goldens pin ladder and Death by cases.
- Out of scope: ladders on AMRAP or For Time.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `wod-formats`: EMOM lines may have an increment, and an EMOM may stop at its first missed interval.
- `judging`: judging also finishes when a stopping EMOM misses an interval.
- `session-results`: the score and splits of a stopping EMOM.
- `result-adjustment`: adjusting a stopping EMOM recomputes the stop.
- `library`: the breakdown shows a line's increment.
- `workout-editor`: the `+/ROUND` field and the stop option.

## Impact

- `constants/wod-engine.ts`:
  - `WodLine.increment` and `Block.stopOnMiss`;
  - the per-interval target grows by cycle, through `targetAt` and the shared line-placement helper;
  - `advanceTo` finishes at a missed interval when stopping;
  - the breakdown and description text.
- `db/workouts.ts`: the stored line's optional `increment` and the stored block's optional `stopOnMiss` are passed through. Both are written only when set, so there is no migration.
- `components/result/replay.ts` and `components/result/adjust.ts`: the stop's splits, score and adjusted recomputation.
- `components/editor/draft.ts` and `app/library/new.tsx`: the EMOM `+/ROUND` field and the stop toggle.
- Tests: `tests/fixtures.ts` gains a synthetic ladder EMOM and a Death by with golden cases; `tests/engine.test.ts` and `tests/draft.test.ts` gain cases.
