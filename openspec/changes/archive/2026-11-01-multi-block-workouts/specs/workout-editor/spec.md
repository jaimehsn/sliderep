## MODIFIED Requirements

### Requirement: Workout editor
The editor SHALL let the owner set a name and choose one format: FOR TIME, AMRAP or EMOM. Each line SHALL pick an exercise from the catalog (searchable and grouped by category, archived exercises excluded) and MAY carry a rep description (a positive amount in m, cal or s) and a free-text load. Adding a rep description SHALL set the line's empty reps to 1. The workout SHALL have one block or more (see Several blocks).

#### Scenario: Picking an exercise
- **WHEN** the owner adds a line and searches "pull"
- **THEN** catalog exercises containing "PULL" are offered, grouped by category

#### Scenario: A rep description defaults the reps to 1
- **WHEN** the owner adds a ROW line with no reps and gives it a rep description of 500 m
- **THEN** its reps are set to 1

#### Scenario: Line with description and load
- **WHEN** a line is set to ROW, 1 rep, description 500 m
- **THEN** the line is saved with that description and no load

## ADDED Requirements

### Requirement: Several blocks
"+ BLOCK" SHALL add a new block after the last, and each block but the only one SHALL have a remove action. Each block SHALL have its own format and parameters. Each block but the last SHALL have an optional REST AFTER (SEC), a whole number from 1 to 600. With several blocks, a SCORES marker SHALL choose the scoring block, the first by default. With one block, the editor SHALL look as before. DUPLICATE SHALL keep every block.

#### Scenario: Buy-in and AMRAP
- **WHEN** the owner sets block 1 to a 1-round FOR TIME of BURPEES 20, adds a block, sets it to a 12-minute AMRAP, marks it SCORES and saves
- **THEN** the saved workout has the two blocks and block 2 scores

#### Scenario: Removing a block
- **WHEN** the owner removes block 2 of three
- **THEN** block 3 becomes block 2, and the SCORES marker stays on the block it was on, or moves to block 1 if it was on the removed one

#### Scenario: Invalid block
- **WHEN** block 2 has no exercise and the owner taps SAVE
- **THEN** nothing is saved and block 2 is flagged

#### Scenario: Duplicating keeps the blocks
- **WHEN** the owner duplicates a workout of three blocks with a rest after block 1
- **THEN** the editor opens with the three blocks, the rest and the same scoring block
