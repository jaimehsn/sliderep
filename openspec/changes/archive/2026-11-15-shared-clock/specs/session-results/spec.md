# Spec Delta

## ADDED Requirements

### Requirement: Score of a block of several parts
A block of several parts whose parts are all rounds SHALL be scored like a For Time: TIME of its last valid rep when complete, "CAP · <N> reps" when its cap came first, N being every valid rep of every part. A block ending in an AMRAP part SHALL be scored as "<completed AMRAP rounds> + <reps in the unfinished AMRAP round>" when the AMRAP part was reached, and as "CAP · <N> reps" otherwise, N being every valid rep counted.

#### Scenario: Example 1 finished
- **WHEN** example 1's last cash-out rep is counted at 10:52
- **THEN** the score is TIME 10:52

#### Scenario: AMRAP part reached
- **WHEN** a block of 50 ROW then an AMRAP part of 5 PULL-UPS, 10 PUSH-UPS and 15 AIR SQUATS ends after the row, 6 AMRAP rounds and 5 pull-ups and 2 push-ups
- **THEN** the score is "6 + 7"

#### Scenario: AMRAP part not reached
- **WHEN** that block ends with 38 row reps counted
- **THEN** the score is "CAP · 38 reps"

### Requirement: Splits of a block of several parts
A block of several parts SHALL list its splits as a For Time or AMRAP does, with times on the block's clock, each labelled within its part: "Round k" counted from the part's first round for a part of several rounds or an AMRAP part, "Station k" for a 1-round part. The result screen SHALL show each part's splits under a "PART n" subheading. A block of one part SHALL show its splits as before.

#### Scenario: Splits of example 1
- **WHEN** example 1's result is shown
- **THEN** PART 1 lists "Station 1 — RING MUSCLE-UPS", PART 2 lists "Round 1 — LEGLESS ROPE CLIMBS" to "Round 5 — FRONT SQUATS", and PART 3 lists "Station 1 — RING MUSCLE-UPS", with cumulative times running on from part to part

#### Scenario: AMRAP rounds counted from the part
- **WHEN** a block of 50 ROW then an AMRAP part is shown
- **THEN** the first AMRAP split is labelled "Round 1 — PULL-UPS"
