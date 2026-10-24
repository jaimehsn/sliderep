# Proposal

## Why

The `session-results` spec scores an AMRAP as "<completed rounds> + <reps in the unfinished round>". The code instead adds only the reps of the unfinished round's **current exercise**. A CINDY session that ended after 6 rounds plus 5 pull-ups and 10 push-ups of the 7th shows `6 + 0` instead of `6 + 15`. The spec's only scenario (7 reps into the first exercise) can't tell the two apart, which is how this survived.

The bug predates the engine refactor. Change `unified-engine` (C1) kept it on purpose, because C1 promised that no saved result would change, and its goldens pin the wrong value. It was found on device while testing C1. Fixing it in a change of its own keeps that promise intact and makes this the only reviewable place where saved results change.

## What Changes

- The AMRAP score's "+ N" becomes the total valid reps across every exercise of the unfinished round. This applies to the plain result and to the adjusted result.
- In an adjusted result, the unfinished round is the first round with any incomplete position (unchanged), and "+ N" counts the reps kept in every position of that round.
- Saved CINDY sessions that ended mid-round, after the first exercise, show the corrected score when reopened. Their stored events don't change. Only the derivation from them does. `engineVersion` stays 1, because the spec always defined v1 this way and it was the code that deviated.
- Splits, the For Time/Chipper/EMOM scores and live judging are unchanged.
- The affected CINDY goldens are corrected by hand, only on their score line, as a documented fix against the spec. New golden cases pin the scenario the bug escaped through.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `session-results`: the AMRAP score requirement gains scenarios that pin "+ N" as the whole unfinished round, including in an adjusted result.

## Impact

- **Code**: `components/result/replay.ts` (unadjusted AMRAP score) and `components/result/adjust.ts` (adjusted AMRAP score).
- **Tests**: score lines of the affected `tests/__goldens__/cindy-*.json` files, plus new cases in `tests/fixtures.ts`.
- **Docs**: `CLAUDE.md`'s golden rule and the header of `tests/goldens.test.ts` state when a golden may be corrected (a deviation from the spec, in its own change) instead of only "never".
- **Data**: no schema or stored-data change. The scores shown for some old CINDY sessions change.
