# Spec Delta

## MODIFIED Requirements

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
