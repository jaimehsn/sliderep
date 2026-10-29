# workout-editor Specification

## Purpose

Lets the owner create their own workouts, starting empty or from a copy of an existing one, in the formats the engine runs, and archive the ones they no longer want, without ever editing a saved workout.

## Requirements

### Requirement: Creating a workout needs a profile
Creating or duplicating a workout SHALL require a local profile. Without one, the NEW and DUPLICATE actions SHALL lead to profile creation with a message explaining that workouts need a profile, and no editor SHALL open.

#### Scenario: NEW without a profile
- **WHEN** the owner, with no profile, taps NEW in the Library
- **THEN** profile creation is shown with an explanation, and no workout editor opens

### Requirement: Workout editor
The editor SHALL let the owner set a name and choose one format: FOR TIME, AMRAP or EMOM. Each line SHALL pick an exercise from the catalog (searchable and grouped by category, archived exercises excluded) and MAY carry a rep description (a positive amount in m, cal or s) and a free-text load. Adding a rep description SHALL set the line's empty reps to 1. The workout SHALL be a single block.

#### Scenario: Picking an exercise
- **WHEN** the owner adds a line and searches "pull"
- **THEN** catalog exercises containing "PULL" are offered, grouped by category

#### Scenario: A rep description defaults the reps to 1
- **WHEN** the owner adds a ROW line with no reps and gives it a rep description of 500 m
- **THEN** its reps are set to 1

#### Scenario: Line with description and load
- **WHEN** a line is set to ROW, 1 rep, description 500 m
- **THEN** the line is saved with that description and no load

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

### Requirement: AMRAP content
An AMRAP workout SHALL be an ordered list of exercises with fixed reps, repeated until its duration, which SHALL be a whole number of minutes.

#### Scenario: A CINDY-like AMRAP
- **WHEN** the owner creates a 20-minute AMRAP of 5 PULL-UPS, 10 PUSH-UPS and 15 AIR SQUATS
- **THEN** it is listed as 20-MIN AMRAP and judged like CINDY for 20 minutes

### Requirement: EMOM content
An EMOM workout SHALL be an ordered sequence of intervals, each with one exercise and its reps, repeated in order for a total number of intervals. The total SHALL NOT need to be a multiple of the sequence length. The interval length SHALL be set in whole seconds (EVERY), from 10 to 600 and 60 by default, and the total as a number of intervals (INTERVALS), with the total time shown. DUPLICATE SHALL keep the source's interval length.

#### Scenario: Alternating EMOM
- **WHEN** the owner creates a 12-minute EMOM of minute 1 BURPEES 10 and minute 2 KB SWINGS 15
- **THEN** minutes 1, 3, … 11 are BURPEES and minutes 2, 4, … 12 are KB SWINGS

#### Scenario: Total not a multiple of the sequence
- **WHEN** an EMOM has a 3-minute sequence and 10 minutes in total
- **THEN** minute 10 uses the sequence's first exercise

#### Scenario: 90-second intervals
- **WHEN** the owner sets EVERY to 90 and INTERVALS to 10
- **THEN** the editor shows a total of 15:00, and the saved workout runs 10 intervals of 90 seconds

#### Scenario: Interval out of range
- **WHEN** the owner sets EVERY to 5 and taps SAVE
- **THEN** nothing is saved and the interval is flagged

### Requirement: Saving validates the workout
SAVE SHALL be refused, with the problem shown, unless the workout has a non-empty name, at least one line, an exercise on every line, and every reps, rounds, minutes and rep-description amount at 1 or more. Names SHALL NOT need to be unique.

#### Scenario: Missing name
- **WHEN** the owner taps SAVE with an empty name
- **THEN** nothing is saved and the name is flagged as required

#### Scenario: Repeated name
- **WHEN** the owner saves a workout named FRAN
- **THEN** it is saved, and both FRAN workouts are listed

### Requirement: A saved workout is new and immutable
SAVE SHALL always create a new workout owned by the current profile and SHALL NOT change any existing workout. After saving, the new workout's Library detail SHALL be shown. A saved workout SHALL NOT be editable.

#### Scenario: Saving opens its detail
- **WHEN** the owner saves a new workout
- **THEN** its Library detail is shown, and it appears in the Library and in workout selection

#### Scenario: No editing
- **WHEN** the owner views an own workout's detail
- **THEN** no action to edit it is offered

### Requirement: Duplicating a workout
DUPLICATE SHALL open the editor prefilled with the source workout's format and content and its name followed by " COPY". Saving SHALL create a new workout that records the source as its origin and SHALL leave the source unchanged. Leaving the editor without saving SHALL create nothing.

#### Scenario: Duplicating FRAN
- **WHEN** the owner duplicates FRAN, changes its reps to 15-12-9 and saves
- **THEN** a new workout "FRAN COPY" with 15-12-9 exists, and FRAN is unchanged

#### Scenario: Leaving without saving
- **WHEN** the owner duplicates CINDY and closes the editor with ✕
- **THEN** no workout is created

### Requirement: Archiving an own workout
An own workout's detail SHALL offer ARCHIVE, which SHALL ask for confirmation and then archive it. Built-in workouts SHALL NOT offer ARCHIVE. After archiving, the Library list SHALL be shown.

#### Scenario: Archiving
- **WHEN** the owner archives an own workout and confirms
- **THEN** it no longer appears in the Library or in workout selection, and sessions saved with it still show it in History

#### Scenario: Archive cancelled
- **WHEN** the owner cancels the confirmation
- **THEN** the workout stays listed
