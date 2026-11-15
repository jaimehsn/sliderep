# Spec Delta

## ADDED Requirements

### Requirement: Breakdown of a block of several parts
The workout detail SHALL show a block of several parts grouped by part, as the pre-start summary does: each part under "PART n" with its kind, its exercises summarized like a For Time's or an AMRAP's, and the block's duration line once.

#### Scenario: Detail of a buy-in and AMRAP
- **WHEN** the owner opens a 12-minute block of 50 ROW then an AMRAP part of PULL-UPS, PUSH-UPS and AIR SQUATS
- **THEN** the detail shows 12-MIN AMRAP, "12 min", PART 1 with ROW 50, and PART 2 · AMRAP with the three exercises and their reps
