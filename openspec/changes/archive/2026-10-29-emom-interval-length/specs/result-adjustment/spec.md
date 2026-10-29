## MODIFIED Requirements

### Requirement: Editable values
On the adjust screen, the owner SHALL be able to tap any split to set a new positive target for that position, and, for formats with a duration, set a new positive duration (seconds for AMRAP and for a capped For Time or Chipper; for EMOM, whole minutes with 60-second intervals and a number of intervals otherwise). For Time and Chipper without a cap SHALL NOT offer a duration.

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

#### Scenario: Interval EMOM duration
- **WHEN** the owner sets an EMOM of 10 intervals of 90 seconds to 6 intervals
- **THEN** a pending duration change of 540 seconds is added

### Requirement: Duration cutoff
A changed duration SHALL exclude every valid rep recorded after the new duration. For EMOM, the number of intervals scored SHALL become the new duration in intervals.

#### Scenario: Shortened AMRAP
- **WHEN** CINDY's duration is adjusted to 600 seconds
- **THEN** reps recorded after 10:00 no longer count toward rounds or reps

#### Scenario: Shortened EMOM
- **WHEN** EVERY MINUTE's duration is adjusted to 8 minutes
- **THEN** the score is out of 8 minutes and only minutes 1–8 are listed

#### Scenario: Raised duration
- **WHEN** CINDY's duration is adjusted above 720 seconds, or EVERY MINUTE's to 12 minutes
- **THEN** CINDY's score is unchanged, and EVERY MINUTE is scored out of 12 minutes with minutes 11–12 listed at 0 reps, not completed

#### Scenario: Shortened interval EMOM
- **WHEN** an EMOM of 10 intervals of 90 seconds is adjusted to 6 intervals
- **THEN** the score is out of 6 intervals and only intervals 1–6 are listed
