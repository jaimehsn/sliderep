# exercise-catalog Specification

## Purpose

TBD - created by archiving change exercise-catalog-from-db. Update Purpose after archive.

## Requirements

### Requirement: Built-in exercise catalog
The app SHALL ship a built-in catalog of exercises, available on every install with or without a profile. Each exercise SHALL have a name in uppercase English, written as it appears on a box whiteboard, and each movement variant SHALL be its own exercise. The catalog SHALL contain only movements countable as reps: isometric holds SHALL NOT be included, and distance or calorie movements SHALL carry no unit in their name.

#### Scenario: Variants are separate exercises
- **WHEN** the owner looks at the catalog
- **THEN** PULL-UPS, STRICT PULL-UPS, JUMPING PULL-UPS and CHEST-TO-BAR PULL-UPS each appear as their own exercise

#### Scenario: No isometric holds
- **WHEN** the owner looks at the catalog
- **THEN** no plank, L-sit or hang hold is listed

#### Scenario: Monostructural names carry no unit
- **WHEN** the owner looks at the catalog
- **THEN** rowing appears as ROW, not as a calorie or meter variant

#### Scenario: Catalog without a profile
- **WHEN** an owner with no profile opens the catalog
- **THEN** the full built-in catalog is available

### Requirement: Exercise categories
Every exercise SHALL belong to exactly one category from the closed list GYMNASTICS, WEIGHTLIFTING, MONOSTRUCTURAL. Kettlebell, dumbbell and other implement movements SHALL be WEIGHTLIFTING; jump rope, running, rowing, cycling, skiing, swimming and sled movements SHALL be MONOSTRUCTURAL.

#### Scenario: Kettlebell movement
- **WHEN** the owner looks up KB SWINGS
- **THEN** it is under WEIGHTLIFTING

#### Scenario: Jump rope movement
- **WHEN** the owner looks up DOUBLE UNDERS
- **THEN** it is under MONOSTRUCTURAL

### Requirement: Built-in exercises are immutable
Built-in exercises SHALL never be renamed, recategorized or removed after they ship. Every exercise the app has already shipped SHALL keep its exact name, including abbreviations such as BACK EXT. Later app versions SHALL only add new built-in exercises.

#### Scenario: Existing exercises survive the catalog update
- **WHEN** a device that already had the app updates to this version
- **THEN** all 14 previously shipped exercises (including BACK EXT.) are still present with the same names, alongside the new ones

#### Scenario: Fresh install matches an updated install
- **WHEN** one device installs this version fresh and another updates to it
- **THEN** both have exactly the same built-in exercises and categories

### Requirement: Exercises are read from storage
The list of exercises the app shows SHALL be read from the device's stored catalog, not derived from the built-in workouts. Archived exercises SHALL NOT be listed.

#### Scenario: Exercise not used by any workout
- **WHEN** the owner browses the exercises
- **THEN** exercises no built-in workout uses, such as ROPE CLIMBS, are listed
