# Spec Delta

## ADDED Requirements

### Requirement: AMRAP rounds and reps
AMRAP SHALL be scored as "<completed rounds> + <reps in the unfinished round>". The reps in the unfinished round SHALL be the valid reps of every exercise in that round, not only the exercise in progress. An adjusted result SHALL be scored the same way, with the accepted no-reps counted and surplus events left out.

#### Scenario: CINDY score
- **WHEN** CINDY ends after 14 full rounds and 7 valid reps of the 15th
- **THEN** the score reads 14 + 7

#### Scenario: Unfinished round past its first exercise
- **WHEN** CINDY ends after 6 full rounds plus 5 PULL-UPS and 10 PUSH-UPS of the 7th, with no AIR SQUATS yet
- **THEN** the score reads 6 + 15

#### Scenario: Round just finished
- **WHEN** CINDY ends right after the last AIR SQUAT of its 6th round
- **THEN** the score reads 6 + 0

#### Scenario: Accepted no-rep in the unfinished round
- **WHEN** CINDY ends after 6 full rounds plus 5 PULL-UPS and 4 valid PUSH-UPS of the 7th with 1 no-rep among the PUSH-UPS, and that no-rep is accepted
- **THEN** the adjusted score reads 6 + 10

## REMOVED Requirements

### Requirement: AMRAP score
**Reason**: Its adjusted-result wording and scenarios were about duration and target changes, which no longer exist.
**Migration**: Replaced by "AMRAP rounds and reps", with the same unadjusted rule and scenarios.
