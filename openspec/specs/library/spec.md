# library Specification

## Purpose

Lets the owner browse the available workouts and exercises outside of a session, purely for reference.

## Requirements

### Requirement: Workouts and exercises list
The Library SHALL show a WORKOUTS section listing the built-in workouts followed by the owner's non-archived workouts (mode, name, one-line description, same as workout selection, own ones marked as own) with a NEW action, and an EXERCISES section listing every exercise in the catalog once, grouped under GYMNASTICS, WEIGHTLIFTING and MONOSTRUCTURAL headings in that order, alphabetical within each group. Archived exercises SHALL NOT be listed.

#### Scenario: Deduplicated exercises
- **WHEN** the owner opens the Library
- **THEN** PULL-UPS, BURPEES and KB SWINGS each appear once in EXERCISES, although several workouts use them

#### Scenario: Grouped by category
- **WHEN** the owner opens the Library
- **THEN** EXERCISES shows GYMNASTICS, then WEIGHTLIFTING, then MONOSTRUCTURAL, with PULL-UPS under GYMNASTICS, THRUSTERS under WEIGHTLIFTING and DOUBLE UNDERS under MONOSTRUCTURAL

#### Scenario: Alphabetical within a group
- **WHEN** the owner looks at the MONOSTRUCTURAL group
- **THEN** BIKE comes before ROW, and ROW before RUN

#### Scenario: Full catalog, not only used exercises
- **WHEN** the owner opens the Library
- **THEN** EXERCISES includes ROPE CLIMBS and DEADLIFTS, which no built-in workout uses

#### Scenario: Exercise rows are not interactive
- **WHEN** the owner taps an exercise
- **THEN** nothing happens

### Requirement: Workout detail
Tapping a workout SHALL show its mode, name, duration (when it has one) and its exercises with their reps, rep description and load, the same breakdown as the pre-start summary. It SHALL offer DUPLICATE, and ARCHIVE only for an own workout. Opening an unknown workout SHALL return to the Library list.

#### Scenario: CINDY detail
- **WHEN** the owner taps CINDY
- **THEN** the detail shows 12-MIN AMRAP, CINDY, "12 min", and PULL-UPS 5 reps, PUSH-UPS 10 reps, AIR SQUATS 15 reps, with DUPLICATE and without ARCHIVE

### Requirement: No session start from the Library
The Library SHALL NOT offer starting a session from a workout; judging SHALL start only from workout selection.

#### Scenario: No start from the Library
- **WHEN** the owner views a workout's detail
- **THEN** no action to start judging it is offered

### Requirement: Library list stays current
The Library list SHALL reflect workouts created or archived elsewhere as soon as it is shown again.

#### Scenario: Back from creating a workout
- **WHEN** the owner creates a workout and returns to the Library list
- **THEN** the new workout is listed, marked as own

### Requirement: Summarized reps
The exercise breakdown SHALL show a FOR TIME of more than one round where every round has the same reps as "<N> ROUNDS FOR TIME", with each exercise's reps once. A line of 1 rep with a rep description SHALL show the description in place of the reps.

#### Scenario: Same reps every round
- **WHEN** an own FOR TIME has 5 rounds of BURPEES 10 and AIR SQUATS 15
- **THEN** the detail shows 5 ROUNDS FOR TIME, BURPEES "10 reps" and AIR SQUATS "15 reps"

#### Scenario: Line with load and description
- **WHEN** an own workout has a line ROW 1 rep with description 500 m and a line THRUSTERS 21 with load "95/65 lb"
- **THEN** the detail shows "500 m" in place of the reps on the ROW line, and "95/65 lb" on the THRUSTERS line
