## MODIFIED Requirements

### Requirement: For Time content
A FOR TIME workout SHALL be a number of rounds (1 or more) and an ordered list of exercises shared by every round, with reps set per exercise and per round. A "same reps every round" option SHALL keep each exercise's reps equal across rounds. A one-round FOR TIME SHALL be a Chipper. A FOR TIME MAY have a time cap in whole minutes; left empty, it has none, and when set it SHALL be 1 or more for SAVE to be accepted. DUPLICATE SHALL keep the source's cap.

#### Scenario: A 21-15-9 For Time
- **WHEN** the owner creates a 3-round FOR TIME of THRUSTERS and PULL-UPS at 21, 15 and 9 reps per round
- **THEN** judging it runs THRUSTERS 21, PULL-UPS 21, THRUSTERS 15, PULL-UPS 15, THRUSTERS 9, PULL-UPS 9

#### Scenario: Same reps every round
- **WHEN** "same reps every round" is on, there are 5 rounds and BURPEES is set to 10
- **THEN** BURPEES has 10 reps in each of the 5 rounds

#### Scenario: One round is a Chipper
- **WHEN** the owner creates a 1-round FOR TIME of 4 exercises
- **THEN** it is judged station by station, like FILTHY FIFTY

#### Scenario: Setting a time cap
- **WHEN** the owner sets TIME CAP (MIN) to 10 and saves
- **THEN** the workout is saved with a 10 min cap

#### Scenario: Invalid time cap
- **WHEN** the owner enters 0 in TIME CAP (MIN) and taps SAVE
- **THEN** nothing is saved and the cap is flagged

#### Scenario: Duplicating keeps the cap
- **WHEN** the owner duplicates a workout with a 10 min cap
- **THEN** the editor opens with TIME CAP (MIN) set to 10
