# Proposal

## Why

The owner's box programs MAX by distance, such as example 3: a 15-minute rotating EMOM whose third minute is max handstand walk. The judge counts it in segments of 5 m, one swipe per segment completed. Since `max-lines` (E3), a MAX line can carry an EACH REP rep description (5 m), but the app only shows it as a note: the score and the judging count say "12 reps", not "60 m". This change is E4, the last step of the window-model plan in `docs/ROADMAP.md`.

## What Changes

- **Segments:** a MAX line's EACH REP (amount and unit: m, cal or s) is its segment. Each valid rep on it is one segment completed, worth that amount in that unit. A MAX line without EACH REP still counts reps, as in E3. A segment not completed doesn't count, because the judge swipes only on a completed one.
- **Judging:** on a MAX line with a segment, the large count shows the total in its unit (5, 10, 15 …), with the unit beside it in place of "MAX".
- **Score:** a block with MAX lines is scored as one total per unit, in the order the units first appear in the interval sequence, joined by " · ". Examples: "60 m", or "60 m · 38 reps" when it mixes units. Lines of the same unit add up, whatever their segment size.
- **Splits:** a MAX line with a segment shows its total in its unit, e.g. "Minute 3 — HANDSTAND WALK 60 m".
- **No-rep review:** an accepted no-rep on a MAX line with a segment adds one segment.
- **Unchanged:**
  - storage, the editor and the breakdown ("MAX", with the note "5 m");
  - the exercise catalog: example 3 uses STEP-UPS or DB BOX STEP-OVERS, with the load in LOAD;
  - `engineVersion` stays 1, since only the presentation of a MAX line's count changes, not what counts.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `wod-formats`: a MAX line's rep description is its segment size.
- `session-results`: per-unit MAX score and splits in their unit.
- `judging`: the live count of a MAX line with a segment, in its unit.
- `result-adjustment`: an accepted no-rep on a MAX line with a segment adds one segment.

## Impact

- **Engine:** `constants/wod-engine.ts`, where `view` gains the current MAX line's segment.
- **Results:**
  - `components/result/replay.ts`: a split's segment, and the per-unit score.
  - `components/result/adjust.ts`: no rule change expected, verified by goldens.
- **Screens:** `components/judge/count-readout.tsx`, `hooks/use-judge.ts`, `app/session/run.tsx`, and the split rows of `components/result/result-screen.tsx` and `app/session/adjust.tsx`.
- **Tests:** new fixtures, goldens and presentation snapshots. No recorded file changes.
- **Docs:** `CLAUDE.md` and `docs/ROADMAP.md`.
- **Saved workouts:** an own workout saved since E3 with EACH REP on a MAX line would show its existing results in that unit, from "12 reps" to "60 m". The reps counted are the same.
