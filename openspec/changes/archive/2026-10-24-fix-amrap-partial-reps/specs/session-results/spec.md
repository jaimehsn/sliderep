## MODIFIED Requirements

### Requirement: AMRAP score
AMRAP SHALL be scored as "<completed rounds> + <reps in the unfinished round>". The reps in the unfinished round SHALL be the valid reps of every exercise in that round, not only the exercise in progress. In an adjusted result, the unfinished round SHALL be the first round with any position not completed under the adjustment, and its reps SHALL be the reps each of its positions keeps under the adjustment.

#### Scenario: CINDY score
- **WHEN** CINDY ends after 14 full rounds and 7 valid reps of the 15th
- **THEN** the score reads 14 + 7

#### Scenario: Unfinished round past its first exercise
- **WHEN** CINDY ends after 6 full rounds plus 5 PULL-UPS and 10 PUSH-UPS of the 7th, with no AIR SQUATS yet
- **THEN** the score reads 6 + 15

#### Scenario: Round just finished
- **WHEN** CINDY ends right after the last AIR SQUAT of its 6th round
- **THEN** the score reads 6 + 0

#### Scenario: Shortened AMRAP counts the whole unfinished round
- **WHEN** CINDY's duration is adjusted to 600 seconds and, by 10:00, 6 full rounds plus 5 PULL-UPS, 10 PUSH-UPS and 5 AIR SQUATS of the 7th were recorded
- **THEN** the adjusted score reads 6 + 20

#### Scenario: Raised target leaves an earlier round unfinished
- **WHEN** round 3's PULL-UPS, judged at 5/5, are adjusted to a target of 8, and that round's PUSH-UPS (10/10) and AIR SQUATS (15/15) were completed
- **THEN** the adjusted score reads 2 + 30
