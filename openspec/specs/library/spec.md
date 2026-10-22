# library Specification

## Purpose

Lets the owner browse the available workouts and exercises outside of a session, purely for reference.

## Requirements

### Requirement: Workouts and exercises list
The Library SHALL show a WORKOUTS section listing the built-in workouts (mode, name, one-line description, same as workout selection) and an EXERCISES section listing every exercise in the catalog once, grouped under GYMNASTICS, WEIGHTLIFTING and MONOSTRUCTURAL headings in that order, alphabetical within each group. Archived exercises SHALL NOT be listed.

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
Tapping a workout SHALL show its mode, name, duration (when it has one) and its exercises with their reps, the same breakdown as the pre-start summary. Opening an unknown workout SHALL return to the Library list.

#### Scenario: CINDY detail
- **WHEN** the owner taps CINDY
- **THEN** the detail shows 12-MIN AMRAP, CINDY, "12 min", and PULL-UPS 5 reps, PUSH-UPS 10 reps, AIR SQUATS 15 reps

### Requirement: Library is read-only
The Library SHALL NOT offer starting a session, editing, duplicating or deleting any workout or exercise.

#### Scenario: No start from the Library
- **WHEN** the owner views a workout's detail
- **THEN** no action to start judging it is offered
