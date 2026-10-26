## MODIFIED Requirements

### Requirement: Built-in workouts
The system SHALL provide exactly four built-in workouts: FRAN (For Time, 3 rounds of thrusters + pull-ups at 21-15-9 reps), CINDY (12-minute AMRAP of 5 pull-ups, 10 push-ups, 15 air squats), EVERY MINUTE (10-minute EMOM alternating 10 burpees and 15 KB swings) and FILTHY FIFTY (Chipper of 10 stations at 50 reps each). Every target is expressed in reps. Workouts SHALL be read from the device's stored workouts, not from definitions built into the app code.

#### Scenario: Picking from the built-ins
- **WHEN** the owner, with no workouts of their own, is offered a list of workouts
- **THEN** exactly FRAN, CINDY, EVERY MINUTE and FILTHY FIFTY are listed, in that order, each with its one-line description

#### Scenario: FRAN content
- **WHEN** FRAN is judged
- **THEN** the sequence is THRUSTERS 21, PULL-UPS 21, THRUSTERS 15, PULL-UPS 15, THRUSTERS 9, PULL-UPS 9

### Requirement: Built-in workouts are immutable
Built-in workouts SHALL NOT be editable or archivable by the owner. They MAY be duplicated, which creates a new workout and leaves the built-in unchanged.

#### Scenario: No editing entry point
- **WHEN** the owner views any built-in workout
- **THEN** no action to edit or archive it is offered, and DUPLICATE is offered

### Requirement: Mode label derived from content
A workout's mode label SHALL be derived from its format and content: "FOR TIME" for For Time (including a single-round Chipper), "<rounds> ROUNDS FOR TIME" for a For Time of more than one round where every round has the same reps, "<minutes>-MIN AMRAP" for an AMRAP, and "EMOM · <intervals>" for an EMOM.

#### Scenario: Built-in mode labels
- **WHEN** the four built-in workouts are listed
- **THEN** FRAN reads FOR TIME, CINDY reads 12-MIN AMRAP, EVERY MINUTE reads EMOM · 10 and FILTHY FIFTY reads FOR TIME

#### Scenario: Chipper keeps station progress
- **WHEN** FILTHY FIFTY is on its third exercise
- **THEN** its mode still reads FOR TIME and progress reads station 3 of 10

#### Scenario: Same reps every round
- **WHEN** an own For Time has 5 rounds, all of BURPEES 10
- **THEN** its mode reads 5 ROUNDS FOR TIME

### Requirement: Description derived from content
A workout's one-line description SHALL be derived from its content: the rep scheme, round count or duration, then its exercise names in lowercase (joined by " + " when there are two, by ", " when there are more), or for a single-round workout its station count and reps per station. A For Time whose rounds all have the same reps SHALL use "<rounds> rounds" as its scheme.

#### Scenario: Built-in descriptions
- **WHEN** the four built-in workouts are listed
- **THEN** the descriptions read "21-15-9 · thrusters + pull-ups", "12 min · pull-ups, push-ups, air squats", "10 min · burpees + kb swings" and "10 stations · 50 reps each"

#### Scenario: Same reps every round
- **WHEN** an own For Time has 5 rounds of BURPEES 10 and AIR SQUATS 15
- **THEN** its description reads "5 rounds · burpees + air squats"

## ADDED Requirements

### Requirement: Workout order
Wherever workouts are offered, the built-ins SHALL come first, in their listed order, followed by the owner's non-archived workouts in creation order, each marked as own.

#### Scenario: Own workouts after the built-ins
- **WHEN** the owner has created MY FRAN and then MY CINDY
- **THEN** the list shows the four built-ins, then MY FRAN, then MY CINDY, the last two marked as own
