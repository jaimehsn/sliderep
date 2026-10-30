## ADDED Requirements

### Requirement: Score of a stopping EMOM
An EMOM that stops at its first missed interval SHALL be scored as "<completed intervals> + <valid reps in the missed interval>", with "+ 0" when no interval was missed. Its splits SHALL list the intervals up to and including the missed one, each with the target that interval asked for.

#### Scenario: Death by score
- **WHEN** a stopping Death by of BURPEES (1, +1) completes minutes 1–12 and ends minute 13 with 9 valid reps
- **THEN** the score reads 12 + 9, and the splits run from "Minute 1 — BURPEES" at 1/1 to "Minute 13 — BURPEES" at 9/13

#### Scenario: Stopping EMOM with no miss
- **WHEN** a stopping EMOM of 10 minutes completes every minute
- **THEN** the score reads 10 + 0

#### Scenario: Progressive targets without the stop
- **WHEN** a non-stopping EMOM alternates BURPEES 3 (+1) and KB SWINGS 10 (+2)
- **THEN** its splits show targets 3, 10, 4, 12, … and its score keeps the "<completed>/<total> · <reps> reps" form
