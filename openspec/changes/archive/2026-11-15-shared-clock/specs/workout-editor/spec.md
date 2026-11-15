# Spec Delta

## MODIFIED Requirements

### Requirement: Workout editor
The editor SHALL let the owner set a name and start each block from one of the templates (see Block templates). Each line SHALL pick an exercise from the catalog (searchable and grouped by category, archived exercises excluded) and MAY carry a rep description (a positive amount in m, cal or s) and a free-text load. Adding a rep description SHALL set the line's empty reps to 1. The workout SHALL have one block or more (see Several blocks).

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

### Requirement: Block templates
A template SHALL only fill a block's time settings and parts: FOR TIME is one rounds part; AMRAP one AMRAP part; EMOM an EMOM as before; FOR TIME + BUY-IN/CASH-OUT a 1-round part, a rounds part and a 1-round part; BUY-IN + AMRAP a 1-round part and an AMRAP part. A new block SHALL start as FOR TIME. Picking a template SHALL replace the block's settings and parts and keep its exercise lines in the template's main part (the rounds part, the AMRAP part, or one EMOM interval each).

#### Scenario: Buy-in and cash-out template
- **WHEN** the owner picks FOR TIME + BUY-IN/CASH-OUT on an empty block
- **THEN** the block shows three parts: a 1-round part, a rounds part and a 1-round part, each without lines

#### Scenario: Switching template keeps the lines
- **WHEN** a FOR TIME block has THRUSTERS and PULL-UPS and the owner picks BUY-IN + AMRAP
- **THEN** the AMRAP part holds THRUSTERS and PULL-UPS and the 1-round part before it is empty

### Requirement: Parts of a FOR TIME or AMRAP block
A FOR TIME or AMRAP block SHALL be a time setting plus an ordered list of parts. Each part SHALL be ROUNDS, edited like a For Time's content (rounds, same reps every round, REST (SEC) between its rounds, lines with reps per round), or AMRAP, an ordered list of lines with fixed reps. "+ PART" SHALL add a 1-round part at the end, before the AMRAP part when there is one. Each part but the only one SHALL have a remove action. With one part, the block SHALL look as before.

#### Scenario: Adding a cash-out before the AMRAP
- **WHEN** a block has a 1-round part and an AMRAP part and the owner taps "+ PART"
- **THEN** the new 1-round part is placed between them

#### Scenario: Removing a part
- **WHEN** the owner removes the second of three parts
- **THEN** the block keeps the first and third parts, in that order

#### Scenario: One part looks as before
- **WHEN** a block holds a single ROUNDS part
- **THEN** the editor shows it like the FOR TIME editor shown before this change, with no part header

### Requirement: Time setting of a block of parts
A block whose parts are all ROUNDS SHALL have an optional TIME CAP (MIN), as a FOR TIME does. A block whose last part is AMRAP SHALL have a required duration in whole minutes of 1 or more. SAVE SHALL be refused, with the problem shown, when an AMRAP part is not the block's last part, when a block ending in AMRAP has no valid duration, or when a part has no line.

#### Scenario: Buy-in and AMRAP without minutes
- **WHEN** a block of a 1-round part and an AMRAP part has no minutes and the owner taps SAVE
- **THEN** nothing is saved and the minutes are flagged

#### Scenario: AMRAP part not last
- **WHEN** the owner turns the first of two parts into AMRAP and taps SAVE
- **THEN** nothing is saved and that part is flagged

#### Scenario: Saving example 1
- **WHEN** the owner sets a 12-minute cap and parts 15 RING MUSCLE-UPS, 5 rounds of 1 LEGLESS ROPE CLIMBS + 3 FRONT SQUATS, and 15 RING MUSCLE-UPS, and taps SAVE
- **THEN** the workout is saved and judged as one block of three parts under a 12-minute cap

### Requirement: Duplicating keeps the parts
DUPLICATE SHALL open the editor with every block's time setting and parts as in the source, each part with its rounds, reps, rest and lines, for workouts saved before and after this change.

#### Scenario: Duplicating a block of parts
- **WHEN** the owner duplicates a workout whose block is 50 ROW then a 12-minute AMRAP part
- **THEN** the editor opens with a 12-minute block of those two parts

#### Scenario: Duplicating an older workout
- **WHEN** the owner duplicates FRAN
- **THEN** the editor opens with one ROUNDS part of 3 rounds at 21, 15 and 9 reps, as before
