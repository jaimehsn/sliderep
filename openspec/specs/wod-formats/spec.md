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
In an EMOM, each interval SHALL last the workout's interval length, 60 seconds unless set otherwise, and its exercise SHALL cycle through the workout's lines in order (interval 1 → line 1, interval 2 → line 2, interval 3 → line 1, …). The interval SHALL change only when its time elapses, never on reaching the target. The workout SHALL be complete after its last interval. An interval length SHALL be a whole number of seconds from 10 to 600.

#### Scenario: Reaching the target early
- **WHEN** the 10th valid BURPEES rep is counted 30 seconds into minute 1 of EVERY MINUTE
- **THEN** the exercise stays BURPEES until the minute elapses

#### Scenario: Minute change
- **WHEN** minute 1 of EVERY MINUTE elapses
- **THEN** the current interval becomes minute 2 with exercise KB SWINGS (15)

#### Scenario: Live count is capped at the target
- **WHEN** an 11th valid rep is counted during a BURPEES minute with target 10
- **THEN** the live count stays at 10, and the rep is still recorded in the session's events

#### Scenario: 90-second intervals
- **WHEN** an EMOM with 90-second intervals of BURPEES and KB SWINGS has been running for 100 seconds
- **THEN** the current interval is interval 2, with exercise KB SWINGS

### Requirement: Progress indicator per format
The system SHALL show progress as round N of total for For Time, station N of total for Chipper, completed rounds (no total) for AMRAP, and minute N of total for EMOM. An EMOM whose interval is not 60 seconds SHALL show interval N of total.

#### Scenario: For Time progress
- **WHEN** FRAN is in its second round
- **THEN** progress reads round 2 of 3

#### Scenario: EMOM progress
- **WHEN** EVERY MINUTE is in its fourth minute
- **THEN** progress reads minute 4 of 10

#### Scenario: Interval progress
- **WHEN** an EMOM of 10 intervals of 90 seconds is in its third interval
- **THEN** progress reads interval 3 of 10

### Requirement: Format semantics are versioned
Each built-in format SHALL carry a version, and a saved session SHALL record the format version it was judged with, so its result can always be derived with the same rules.

#### Scenario: Saving records the version
- **WHEN** a session is saved
- **THEN** the stored session includes the format version used during judging

### Requirement: Mode label derived from content
A workout's mode label SHALL be derived from its format and content: "FOR TIME" for For Time (including a single-round Chipper), "<rounds> ROUNDS FOR TIME" for a For Time of more than one round where every round has the same reps, "<minutes>-MIN AMRAP" for an AMRAP, and for an EMOM "EMOM · <intervals>" with 60-second intervals, "E<n>MOM · <intervals>" when its interval is a whole number n of minutes, and "EVERY <m:ss> · <intervals>" otherwise.

#### Scenario: Built-in mode labels
- **WHEN** the four built-in workouts are listed
- **THEN** FRAN reads FOR TIME, CINDY reads 12-MIN AMRAP, EVERY MINUTE reads EMOM · 10 and FILTHY FIFTY reads FOR TIME

#### Scenario: Chipper keeps station progress
- **WHEN** FILTHY FIFTY is on its third exercise
- **THEN** its mode still reads FOR TIME and progress reads station 3 of 10

#### Scenario: Same reps every round
- **WHEN** an own For Time has 5 rounds, all of BURPEES 10
- **THEN** its mode reads 5 ROUNDS FOR TIME

#### Scenario: Interval mode labels
- **WHEN** an EMOM has 8 intervals of 120 seconds, and another has 10 intervals of 90 seconds
- **THEN** they read E2MOM · 8 and EVERY 1:30 · 10

### Requirement: Description derived from content
A workout's one-line description SHALL be derived from its content: the rep scheme, round count or duration, then its exercise names in lowercase (joined by " + " for two, by ", " for more), or for a single-round workout its station count and reps per station. The scheme SHALL be "<rounds> rounds" for a For Time whose rounds all have the same reps, and "<intervals> × <m:ss>" for an EMOM whose interval is not 60 seconds. A capped workout's description SHALL end with " · <minutes> min cap".

#### Scenario: Built-in descriptions
- **WHEN** the four built-in workouts are listed
- **THEN** the descriptions read "21-15-9 · thrusters + pull-ups", "12 min · pull-ups, push-ups, air squats", "10 min · burpees + kb swings" and "10 stations · 50 reps each"

#### Scenario: Same reps every round
- **WHEN** an own For Time has 5 rounds of BURPEES 10 and AIR SQUATS 15
- **THEN** its description reads "5 rounds · burpees + air squats"

#### Scenario: Capped description
- **WHEN** an own 21-15-9 For Time of THRUSTERS and PULL-UPS has a 10 min cap
- **THEN** its description reads "21-15-9 · thrusters + pull-ups · 10 min cap"

#### Scenario: Interval description
- **WHEN** an own EMOM has 10 intervals of 90 seconds of BURPEES and KB SWINGS
- **THEN** its description reads "10 × 1:30 · burpees + kb swings"

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

### Requirement: For Time time cap
A For Time or Chipper workout MAY have a time cap, a whole number of minutes of 1 or more. A capped workout SHALL finish either on its last valid rep before the cap or when the session clock reaches the cap, whichever comes first. A rep recorded exactly at the cap or later SHALL NOT count. A workout without a cap SHALL behave as before. The cap SHALL be shown as "<minutes> min cap" wherever the workout's duration is shown.

#### Scenario: Finished before the cap
- **WHEN** a 21-15-9 For Time with a 10 min cap has its last valid rep at 8:12
- **THEN** it finishes at 8:12

#### Scenario: Cap reached
- **WHEN** the same workout's session clock reaches 10:00 with reps still to do
- **THEN** it finishes at 10:00, and no rep recorded at 10:00 or later counts

#### Scenario: Duration line
- **WHEN** the owner views that workout's detail or its pre-start summary
- **THEN** its duration reads "10 min cap"
