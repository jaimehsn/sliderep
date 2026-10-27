## MODIFIED Requirements

### Requirement: Editable values
On the adjust screen, the owner SHALL be able to tap any split to set a new positive target for that position, and, for formats with a duration, set a new positive duration (seconds for AMRAP and for a capped For Time or Chipper, whole minutes for EMOM). For Time and Chipper without a cap SHALL NOT offer a duration.

#### Scenario: Editing a split target
- **WHEN** the owner taps "Round 2 — THRUSTERS 15/15" and enters 12
- **THEN** a pending target change of 12 for that position is added

#### Scenario: Invalid or unchanged value
- **WHEN** the owner enters 0, a non-number, or the current value
- **THEN** no change is added

#### Scenario: EMOM duration
- **WHEN** the owner sets EVERY MINUTE's duration to 8
- **THEN** a pending duration change of 8 minutes is added

#### Scenario: Capped For Time duration
- **WHEN** the owner sets a 10 min capped For Time's duration to 480
- **THEN** a pending duration change of 480 seconds is added

## ADDED Requirements

### Requirement: Adjusted time cap
For a capped For Time or Chipper, a changed duration SHALL be the adjusted cap: valid reps recorded at the adjusted cap or later SHALL NOT count. The adjusted score SHALL be TIME of the last position's completing rep when every position of the workout is complete under the adjustment, and "CAP · <N> reps" otherwise, N being every valid rep each position keeps. Raising the cap SHALL NOT add reps, since none were recorded after the original cap.

#### Scenario: Shortened cap
- **WHEN** a For Time finished at 9:30 under a 10 min cap has its duration adjusted to 480 seconds
- **THEN** reps recorded at 8:00 or later no longer count and the score reads "CAP · <reps before 8:00> reps"

#### Scenario: Raised cap
- **WHEN** a For Time that reached its 10 min cap unfinished has its duration adjusted to 900 seconds
- **THEN** the score still reads "CAP · <N> reps" with the same N

#### Scenario: Raised target on a capped workout
- **WHEN** a position of a capped For Time judged at 15/15 is adjusted to a target of 18
- **THEN** that split shows 15/18 not completed, and the score reads "CAP · <N> reps" instead of a time
