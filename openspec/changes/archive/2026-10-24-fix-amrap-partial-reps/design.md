# Design

## Context

See proposal.md for why. Two places compute the AMRAP "+ N":

- `components/result/replay.ts` (unadjusted) returns `${state.pos.completedRounds} + ${state.done}` from the final fold state. `done` is the count on the current line only.
- `components/result/adjust.ts` (adjusted) walks the resolved positions round by round, stops at the first round with an incomplete position, and takes `kept.length` of that round's **first incomplete** position only.

Both already have what the fix needs. The fold tags every counted event with its position (`TaggedEvent.pos`), and the adjusted path has each position's `kept` reps.

The C1 goldens (`tests/__goldens__/`) pin the wrong values. `CLAUDE.md` and the header of `tests/goldens.test.ts` say they are never re-recorded.

## Goals / Non-Goals

**Goals:**
- "+ N" counts every valid rep of the unfinished round, in both paths, as the `session-results` spec says.
- The only golden diffs are the score lines that were wrong, and they are reviewable by eye.

**Non-Goals:**
- Which round counts as unfinished in an adjusted result. That is still the first round with any incomplete position, and later rounds' reps are still dropped. The spec now states this rule; it does not change.
- The v1 quirk that an unadjusted AMRAP result still counts reps recorded after its duration (old logs only). This change leaves it alone.
- Live judging, splits, and the For Time/Chipper/EMOM scores.

## Decisions

### 1. Unadjusted: count the round's tagged events, not targets

"+ N" becomes the number of counted tagged events whose `pos.roundIdx` equals the final state's `pos.roundIdx`. Right after a round ends, the state moves to the next round with no events yet, so a just-finished round yields `+ 0` with no special case.

*Alternative:* the sum of the earlier lines' targets plus `done`. It gives the same number today, but it rebuilds from targets what the tagged events already say directly. Counting events also matches how the splits are built.

### 2. Adjusted: sum `kept` across the unfinished round

In the round walk, "+ N" becomes the sum of `kept.length` over every resolved position of the first round that isn't complete, instead of the first incomplete position's `kept.length`. A position after an incomplete one in that round still counts its kept reps. That is what "reps in the unfinished round" means, and it is what the raised-target scenario pins (`2 + 30`).

### 3. Engine version stays 1

The spec has always defined v1's AMRAP score this way, and only the code deviated from it. A version bump would mean keeping the wrong derivation alive for v1 sessions, which is option B, rejected. Saved events are unchanged. Old CINDY sessions simply derive the correct score from now on.

### 4. Goldens: correct by hand, add cases, document the exception

- The wrong score lines in the existing CINDY goldens are edited by hand, never with `vitest -u`. Re-recording would rewrite every file the test touches, and a hand edit keeps the diff to exactly the lines this change claims are wrong. Expected corrections, from the fixtures' logs (CINDY rounds are 30 reps):

  | Golden | Field | Before | After |
  |---|---|---|---|
  | `cindy-partial-round` | result | 7 + 14 | 7 + 29 |
  | `cindy-no-reps` | result | 6 + 5 | 6 + 20 |
  | `cindy-adjusted-target` | result, adjusted | 7 + 14 | 7 + 29 |
  | `cindy-adjusted-duration` | result | 7 + 14 | 7 + 29 |
  | `cindy-adjusted-duration` | adjusted | 6 + 5 | 6 + 20 |

  `cindy-empty` (`0 + 0`) and `cindy-reps-after-12min` (`8 + 3`, partial within the first line) stay as they are.
- New fixture cases pin the scenarios. Their goldens are recorded fresh, after the fix:
  - `cindy-two-lines-into-round`: 195 reps, giving `6 + 15` (the device report).
  - `cindy-round-just-finished`: 180 reps, giving `6 + 0`.
  - `cindy-adjusted-target-up`: round 3's pull-ups raised to 8, giving `2 + 30` adjusted.
- The golden rule in `CLAUDE.md` and in the test header gains its one exception: a golden may be corrected by hand only to fix a deviation from the spec, in a change of its own that lists each corrected line. Any other different result is still a new engine version.

## Risks / Trade-offs

- [A user notices an old CINDY score changed] → Intended. It now matches the spec and the splits it was already showing, and the proposal records it.
- [A hand edit hides an unintended change elsewhere in a golden] → Before committing, check that `git diff tests/__goldens__` touches only `scoreValue` lines in exactly the five rows above, and that the rest of the suite stays green.
- [The adjusted raised-target score (`2 + 30`) reads oddly] → It follows the existing rule for which round is unfinished. Whether later rounds should count belongs to a future adjustment change, not this fix.
