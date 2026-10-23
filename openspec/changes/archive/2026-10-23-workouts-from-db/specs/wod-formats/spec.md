# Spec Delta

## MODIFIED Requirements

### Requirement: Built-in workouts
The system SHALL provide exactly four built-in workouts: FRAN (For Time, 3 rounds of thrusters + pull-ups at 21-15-9 reps), CINDY (12-minute AMRAP of 5 pull-ups, 10 push-ups, 15 air squats), EVERY MINUTE (10-minute EMOM alternating 10 burpees and 15 KB swings) and FILTHY FIFTY (Chipper of 10 stations at 50 reps each). Every target is expressed in reps. Workouts SHALL be read from the device's stored workouts, not from definitions built into the app code.

#### Scenario: Picking from the built-ins
- **WHEN** the owner is offered a list of workouts
- **THEN** exactly FRAN, CINDY, EVERY MINUTE and FILTHY FIFTY are listed, in that order, each with its one-line description

#### Scenario: FRAN content
- **WHEN** FRAN is judged
- **THEN** the sequence is THRUSTERS 21, PULL-UPS 21, THRUSTERS 15, PULL-UPS 15, THRUSTERS 9, PULL-UPS 9

## ADDED Requirements

### Requirement: Mode label derived from content
A workout's mode label SHALL be derived from its format and content: "FOR TIME" for For Time (including a single-round Chipper), "<minutes>-MIN AMRAP" for an AMRAP, and "EMOM · <intervals>" for an EMOM.

#### Scenario: Built-in mode labels
- **WHEN** the four built-in workouts are listed
- **THEN** FRAN reads FOR TIME, CINDY reads 12-MIN AMRAP, EVERY MINUTE reads EMOM · 10 and FILTHY FIFTY reads FOR TIME

#### Scenario: Chipper keeps station progress
- **WHEN** FILTHY FIFTY is on its third exercise
- **THEN** its mode still reads FOR TIME and progress reads station 3 of 10

### Requirement: Description derived from content
A workout's one-line description SHALL be derived from its content: the rep scheme or duration, then its exercise names in lowercase (joined by " + " when there are two, by ", " when there are more), or for a single-round workout its station count and reps per station.

#### Scenario: Built-in descriptions
- **WHEN** the four built-in workouts are listed
- **THEN** the descriptions read "21-15-9 · thrusters + pull-ups", "12 min · pull-ups, push-ups, air squats", "10 min · burpees + kb swings" and "10 stations · 50 reps each"

### Requirement: Archived workouts
An archived workout SHALL NOT be offered in workout selection or listed in the Library, but SHALL still be shown, with its exercise names, for any saved session that references it. An exercise's archived state SHALL NOT affect how existing workouts show it.

#### Scenario: Archived workout is not offered
- **WHEN** a workout has been archived
- **THEN** it does not appear in workout selection or in the Library

#### Scenario: Saved session of an archived workout
- **WHEN** the owner opens a History session whose workout has since been archived
- **THEN** the session shows that workout's mode, name, result and splits as before

#### Scenario: Archived exercise in a workout
- **WHEN** an exercise used by a workout has been archived
- **THEN** that workout still shows the exercise's name wherever it shows its exercises
