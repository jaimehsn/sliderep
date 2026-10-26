# wod-formats Specification

## Purpose

Defines the built-in WOD formats (For Time, AMRAP, EMOM, Chipper) as rules for how a workout advances, when it is complete and how progress is shown, together with the four built-in workouts that run on them.

## Requirements

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

### Requirement: For Time advances on target
In a For Time workout, the system SHALL move to the next exercise as soon as the current exercise's target is reached, and to the next round after the round's last exercise. The workout SHALL be complete when the last round's last exercise reaches its target.

#### Scenario: Reaching an exercise target
- **WHEN** the 21st valid rep of THRUSTERS is counted in FRAN's first round
- **THEN** the current exercise becomes PULL-UPS (21) with its count reset to 0

#### Scenario: Last rep of the workout
- **WHEN** the 9th valid PULL-UPS rep of FRAN's third round is counted
- **THEN** the workout is complete and stays on the final exercise with its final count

### Requirement: Chipper is a single-round For Time
A Chipper SHALL behave as a For Time workout with exactly one round, where each line is a station. Progress SHALL be shown as stations instead of rounds.

#### Scenario: Chipper progress label
- **WHEN** FILTHY FIFTY is on its third exercise
- **THEN** progress reads station 3 of 10

### Requirement: AMRAP cycles until time runs out
In an AMRAP, the system SHALL advance on target like For Time, but after the last exercise it SHALL start the same round again and add one to the completed-rounds tally. The workout SHALL never complete on reps; it ends only when its duration elapses.

#### Scenario: Completing a CINDY round
- **WHEN** the 15th valid AIR SQUATS rep is counted
- **THEN** the current exercise becomes PULL-UPS (5) and the completed-rounds tally increases by 1

#### Scenario: AMRAP progress has no total
- **WHEN** an AMRAP is in progress
- **THEN** progress shows the number of completed rounds with no total

### Requirement: EMOM advances on the clock
In an EMOM, each minute SHALL be one interval whose exercise cycles through the workout's lines in order (minute 1 → line 1, minute 2 → line 2, minute 3 → line 1, …). The interval SHALL change only when the minute elapses, never on reaching the target. The workout SHALL be complete after its last interval.

#### Scenario: Reaching the target early
- **WHEN** the 10th valid BURPEES rep is counted 30 seconds into minute 1 of EVERY MINUTE
- **THEN** the exercise stays BURPEES until the minute elapses

#### Scenario: Minute change
- **WHEN** minute 1 of EVERY MINUTE elapses
- **THEN** the current interval becomes minute 2 with exercise KB SWINGS (15)

#### Scenario: Live count is capped at the target
- **WHEN** an 11th valid rep is counted during a BURPEES minute with target 10
- **THEN** the live count stays at 10, and the rep is still recorded in the session's events

### Requirement: Progress indicator per format
The system SHALL show progress as round N of total for For Time, station N of total for Chipper, completed rounds (no total) for AMRAP, and minute N of total for EMOM.

#### Scenario: For Time progress
- **WHEN** FRAN is in its second round
- **THEN** progress reads round 2 of 3

#### Scenario: EMOM progress
- **WHEN** EVERY MINUTE is in its fourth minute
- **THEN** progress reads minute 4 of 10

### Requirement: Format semantics are versioned
Each built-in format SHALL carry a version, and a saved session SHALL record the format version it was judged with, so its result can always be derived with the same rules.

#### Scenario: Saving records the version
- **WHEN** a session is saved
- **THEN** the stored session includes the format version used during judging

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

### Requirement: Workout order
Wherever workouts are offered, the built-ins SHALL come first, in their listed order, followed by the owner's non-archived workouts in creation order, each marked as own.

#### Scenario: Own workouts after the built-ins
- **WHEN** the owner has created MY FRAN and then MY CINDY
- **THEN** the list shows the four built-ins, then MY FRAN, then MY CINDY, the last two marked as own
