## MODIFIED Requirements

### Requirement: Editable values
On the adjust screen, the owner SHALL be able to tap any split, of any block, to set a new positive target for that position, and, for formats with a duration, set a new positive duration (seconds for AMRAP and for a capped For Time or Chipper; for EMOM, whole minutes with 60-second intervals and a number of intervals otherwise). For Time and Chipper without a cap SHALL NOT offer a duration, and with several blocks only the last block SHALL offer one.

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

#### Scenario: Duration with several blocks
- **WHEN** the owner adjusts a workout whose blocks are a 12-min AMRAP and a For Time with a 5 min cap
- **THEN** only the For Time's cap is offered as a duration

## ADDED Requirements

### Requirement: Adjusting several blocks
A target change SHALL apply to its own block's position only, and SHALL NOT move any block's start or any rep into another block. A saved adjustment without a block SHALL apply to block 1. The adjusted score SHALL be the scoring block's, recomputed with that block's own rules.

#### Scenario: Target in a block that doesn't score
- **WHEN** the owner raises the buy-in's BURPEES target from 20 to 25, with 20 counted
- **THEN** the buy-in's group shows it unfinished, and the scoring AMRAP's score is unchanged
