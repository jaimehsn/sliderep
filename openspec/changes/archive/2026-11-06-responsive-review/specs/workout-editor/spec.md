# Spec Delta

## ADDED Requirements

### Requirement: Workout name limit
A workout's name SHALL have at most 40 characters: the field SHALL NOT accept more, and SAVE SHALL be refused, with the problem shown, for a longer name after trimming. A saved workout whose name is already longer SHALL keep it.

#### Scenario: Typing past the limit
- **WHEN** the owner types a 41st character in the name field
- **THEN** the field keeps the first 40

### Requirement: Duplicate name fits the limit
DUPLICATE SHALL prefill the name as the source's name followed by " COPY", shortening the source's part only as much as needed for the whole name to fit in 40 characters.

#### Scenario: Short name
- **WHEN** the owner duplicates FRAN
- **THEN** the name field shows "FRAN COPY"

#### Scenario: Name at the limit
- **WHEN** the owner duplicates a workout with a 40-character name
- **THEN** the name field shows the name's first 35 characters, without trailing spaces, followed by " COPY"

### Requirement: Reps limit
Reps on a line SHALL be at most 999: the field SHALL NOT accept more than three digits, and SAVE SHALL be refused, with the problem shown, for a higher value. The limit SHALL apply to the line's written reps, not to the reps an EMOM increment reaches over time.

#### Scenario: Duplicating reps over the limit
- **WHEN** a duplicated line has 1000 reps and the owner taps SAVE
- **THEN** nothing is saved and that line is flagged

#### Scenario: Reps at the limit
- **WHEN** a line has 999 reps and the rest of the workout is valid
- **THEN** SAVE creates the workout

#### Scenario: Increment past the limit
- **WHEN** an EMOM line has 900 reps and a +/ROUND of 200
- **THEN** SAVE creates the workout
