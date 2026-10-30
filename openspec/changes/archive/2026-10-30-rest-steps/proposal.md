# Proposal

## Why

Two common shapes can't be written yet:
- **For Time with rest between rounds**: "5 rounds for time, rest 1:00 between rounds".
- **Work/rest intervals**: a Tabata is 8 intervals of 20 seconds of work and 10 seconds of rest.

Today every second of a workout is work: a For Time moves straight to its next round, and an EMOM counts reps until its interval ends. This is C2c, the change after C2b in the WOD editor plan (`docs/ROADMAP.md`). Rest between blocks waits for C2d (multi-block).

## What Changes

- A For Time MAY have a **rest between rounds**, in seconds. After a round's last valid rep, the rest starts; the next round starts when it ends. There is no rest after the last round, so the workout still finishes on its last rep.
- The clock never stops. A rested For Time's time includes its rests, and its cap counts them. A cap reached during a rest finishes the workout as `CAP · N reps`.
- An EMOM MAY have a **work time** per interval, shorter than the interval. The rest of each interval is rest. A Tabata is EVERY 30 s, WORK 20 s, 8 intervals. It is scored like any EMOM: `<completed>/<total> · <reps> reps`.
- A stopping EMOM with a work time stops at the end of the missed interval's work, not at the end of its interval.
- During a rest:
  - the swipe band ignores gestures, which are not recorded;
  - the screen shows REST and the rest's countdown;
  - a cue plays when a rest starts and when work resumes.
- Descriptions:
  - a rested For Time's description gains " · <seconds> s rest";
  - an EMOM with a work time gains " · <seconds> s work";
  - mode labels are unchanged.
- Adjustments are unchanged: rest is not adjustable, and a rep in a rest never counts.
- In the editor:
  - For Time gets an optional REST (SEC) field, for 2 rounds or more;
  - EMOM gets an optional WORK (SEC) field, shorter than EVERY;
  - DUPLICATE keeps both.
- No engine version change. A workout without rest behaves exactly as today, so every v1 result and golden stays as it is. New goldens pin rested For Time and Tabata cases.
- Out of scope:
  - rest in AMRAP;
  - rest between blocks (C2d);
  - a lowest-interval Tabata score.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `wod-formats`: For Time rest between rounds, EMOM work time, and their descriptions.
- `judging`: gestures ignored during a rest, the REST display and cues, the rest-aware timer and the stopping EMOM's finish at the end of work.
- `session-results`: a rested For Time's time includes its rests, and a rep in a rest never counts.
- `workout-editor`: the REST (SEC) and WORK (SEC) fields.

## Impact

- `constants/wod-engine.ts`:
  - `Block.restSeconds` (For Time) and `Block.workSeconds` (EMOM);
  - `EngineState.restUntil`;
  - the rest in `apply` and `advanceTo`;
  - an exported rest check;
  - the view's REST display and phase timer;
  - the description text.
- `db/workouts.ts`: the stored block's optional `restSeconds` and `workSeconds` are passed through. Both are written only when set, so there is no migration.
- `hooks/use-judge.ts`: drops gestures during a rest, and plays the cue on a rest change.
- `components/result/adjust.ts`: the EMOM bucket skips rest-phase reps, for safety.
- `components/editor/draft.ts` and `app/library/new.tsx`: the two fields.
- Tests: `tests/fixtures.ts` gains a rested For Time and a Tabata with golden cases; `tests/engine.test.ts` and `tests/draft.test.ts` gain cases.
