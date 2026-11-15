# Spec Delta

## ADDED Requirements

### Requirement: Judging a block of several parts
While a block of several parts is judged, the screen SHALL show "PART n/N" for the current part above the exercise name, joined to the block label as "BLOCK n/N · PART n/N" on a workout of several blocks. The header's progress SHALL be the current part's. Moving to the next part SHALL play no cue, like a new round.

#### Scenario: Moving from the buy-in to the rounds
- **WHEN** the 15th ring muscle-up of example 1's buy-in is counted
- **THEN** the screen shows PART 2/3, LEGLESS ROPE CLIMBS, and the header reads round 1 of 5, with no sound

#### Scenario: One part shows no part label
- **WHEN** a block of a single part is judged
- **THEN** no part label is shown and the screen is as before

### Requirement: Timer of a block of several parts
A block of several parts whose parts are all rounds SHALL show elapsed time, labelled with its cap when it has one. A block ending in an AMRAP part SHALL show the time remaining of the whole block, from its start and in every part.

#### Scenario: Remaining time during a buy-in
- **WHEN** a 12-minute block of 50 ROW then an AMRAP part is judged and the clock reads 3:00 during the row
- **THEN** the timer shows 09:00 remaining and the screen shows PART 1/2

#### Scenario: Elapsed time with a cap
- **WHEN** example 1 is judged
- **THEN** the timer shows elapsed time labelled with its 12:00 cap

### Requirement: Pre-start summary of a block of several parts
The pre-start summary SHALL list a block of several parts grouped by part, each under "PART n" followed by its kind: the round count for a part of several rounds ("5 ROUNDS", with " · <seconds> s REST" when it rests), "AMRAP" for an AMRAP part, nothing more for a 1-round part.

#### Scenario: Summary of example 1
- **WHEN** example 1 is about to be judged
- **THEN** the summary lists PART 1 with RING MUSCLE-UPS 15, PART 2 · 5 ROUNDS with LEGLESS ROPE CLIMBS 1 and FRONT SQUATS 3, and PART 3 with RING MUSCLE-UPS 15
