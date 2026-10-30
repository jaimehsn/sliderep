## ADDED Requirements

### Requirement: Rest fields
A FOR TIME SHALL have an optional REST (SEC) field, the rest between rounds, and an EMOM an optional WORK (SEC) field, the work time per interval. Left empty, there is no rest. When set, REST SHALL be a whole number from 1 to 600 on a FOR TIME of 2 rounds or more, and WORK a whole number from 1 to less than EVERY, for SAVE to be accepted. DUPLICATE SHALL keep both.

#### Scenario: Creating a rested For Time
- **WHEN** the owner creates a 5-round FOR TIME with REST (SEC) 60, and saves
- **THEN** the saved workout rests 60 seconds between rounds

#### Scenario: Creating a Tabata
- **WHEN** the owner creates an EMOM with EVERY 30, WORK (SEC) 20 and INTERVALS 8, and saves
- **THEN** the saved workout has 20 seconds of work and 10 of rest in each interval

#### Scenario: Work not shorter than the interval
- **WHEN** the owner sets WORK (SEC) to 30 with EVERY 30 and taps SAVE
- **THEN** nothing is saved and the work time is flagged

#### Scenario: Rest on one round
- **WHEN** the owner sets REST (SEC) on a 1-round FOR TIME and taps SAVE
- **THEN** nothing is saved and the rest is flagged

#### Scenario: Duplicating keeps the rest
- **WHEN** the owner duplicates a Tabata
- **THEN** the editor opens with WORK (SEC) set to 20
