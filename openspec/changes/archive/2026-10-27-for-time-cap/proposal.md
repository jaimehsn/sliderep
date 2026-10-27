# Proposal

## Why

Most real For Time workouts are written with a time cap ("21-15-9, 10 min cap"), and an athlete who doesn't finish in time is scored by the reps they completed. Today a For Time only ends on its last rep, so a capped workout can't be written or judged. This is C2a, the first of the engine primitives planned after the editor (`docs/ROADMAP.md`, WOD editor plan), and it extends the engine and the editor together so it can be tested on a device.

## What Changes

- A For Time (and Chipper) workout MAY have a time cap in whole minutes. Without one it behaves exactly as today.
- While judging a capped workout, the clock still counts up, its label shows the cap ("ELAPSED · CAP 12:00"), and judging finishes at the cap with the end sound if the workout isn't done.
- Score: TIME mm:ss when the workout is finished before the cap; "CAP · N reps" otherwise, N being every valid rep before the cap. A rep exactly at the cap or later doesn't count.
- The cap shows as "12 min cap" where a workout's duration is shown (Library detail, pre-start summary) and at the end of its one-line description.
- The editor gets an optional TIME CAP (MIN) field for FOR TIME; DUPLICATE copies it.
- The adjust screen offers the cap, in seconds like an AMRAP's duration, for a capped workout. The adjusted score is TIME or "CAP · N reps" under the adjusted cap and targets. Uncapped For Time keeps no duration field and its existing "DNF" fallback.
- No engine version change: no recorded log was judged against a capped workout, so every v1 result and golden stays as it is. New goldens pin the capped cases.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `wod-formats`: a new "For Time time cap" requirement; the one-line description gains the cap.
- `session-results`: the For Time and Chipper score covers the cap.
- `judging`: the timer label shows the cap, and judging finishes at the cap.
- `result-adjustment`: a capped workout offers its cap as a duration, with its own cutoff and score rules.
- `workout-editor`: For Time content gains the optional cap, validated as 1 or more.

## Impact

- `constants/wod-engine.ts`: `advanceTo` ends a capped `rounds` block at its cap; `view` timer label; `describeContent`; a helper telling a capped workout and its completion apart.
- `components/result/replay.ts` and `components/result/adjust.ts`: the capped score; the adjusted path checks every position of the block, not only those with reps.
- `hooks/use-judge.ts`: the end sound also plays when a For Time ends at its cap.
- `app/library/[id].tsx`, `components/judge/start-overlay.tsx`: the "min cap" duration line.
- `components/editor/draft.ts`, `app/library/new.tsx`: the cap field.
- `app/session/adjust.tsx`: the duration field label for a cap.
- Tests: `tests/fixtures.ts` gains capped synthetic workouts and golden cases; `tests/draft.test.ts` gains cap cases. Stored data: a capped For Time block stores `durationSeconds`, already in the stored block shape, so there is no migration.
