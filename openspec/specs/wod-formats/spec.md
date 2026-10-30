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
In an EMOM, each interval SHALL last the workout's interval length, 60 seconds unless set otherwise, and its exercises SHALL cycle through the workout's interval sequence in order (interval 1 → entry 1, interval 2 → entry 2, interval 3 → entry 1, …). The interval SHALL change only when its time elapses, never on reaching a target. The workout SHALL be complete after its last interval. An interval length SHALL be a whole number of seconds from 10 to 600.

#### Scenario: Reaching the target early
- **WHEN** the 10th valid BURPEES rep is counted 30 seconds into minute 1 of EVERY MINUTE
- **THEN** the exercise stays BURPEES until the minute elapses

#### Scenario: Minute change
- **WHEN** minute 1 of EVERY MINUTE elapses
- **THEN** the current interval becomes minute 2 with exercise KB SWINGS (15)

#### Scenario: Live count is capped at the target
- **WHEN** an 11th valid rep is counted during a BURPEES minute with target 10
- **THEN** the live count stays at 10, and the rep is not recorded in the session's events

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

### Requirement: Several exercises per EMOM interval
An EMOM interval MAY hold several exercises, each with its own reps, done in their listed order. Each interval SHALL start on its first exercise. The current exercise SHALL become the next one when it reaches its target. After the last exercise reaches its target, further valid reps SHALL count toward that last exercise, the live count staying at its target. An interval with one exercise SHALL behave as before.

#### Scenario: Next exercise within the interval
- **WHEN** the 5th valid PULL-UPS rep is counted in a minute of 5 PULL-UPS + 10 PUSH-UPS
- **THEN** the exercise becomes PUSH-UPS (10) with the count at 0, and the minute is unchanged

#### Scenario: New interval starts on its first exercise
- **WHEN** a minute of 5 PULL-UPS + 10 PUSH-UPS elapses with PUSH-UPS current, and the next minute is also 5 PULL-UPS + 10 PUSH-UPS
- **THEN** the new minute starts on PULL-UPS with the count at 0

#### Scenario: Reps after the last exercise
- **WHEN** a 12th valid PUSH-UPS rep is counted after 5 PULL-UPS and 10 PUSH-UPS in the same minute
- **THEN** the live count stays at 10 PUSH-UPS, and the 2 extra reps does't count toward PUSH-UPS

### Requirement: Progressive EMOM reps
An EMOM line MAY have an increment, a whole number of reps of 0 or more, 0 by default. The line's target SHALL grow by its increment each time its entry of the interval sequence comes round: in the k-th repetition of the sequence (k = 0, 1, 2, …), the target SHALL be the line's reps plus k times its increment.

#### Scenario: Death by
- **WHEN** an EMOM's only interval is BURPEES 1 with increment 1
- **THEN** minute 1 asks for 1 BURPEES, minute 2 for 2, and minute 12 for 12

#### Scenario: Ladder in an alternating sequence
- **WHEN** an EMOM alternates BURPEES 3 with increment 1 and KB SWINGS 10 with increment 2
- **THEN** minutes 1, 3 and 5 ask for 3, 4 and 5 BURPEES, and minutes 2, 4 and 6 ask for 10, 12 and 14 KB SWINGS

### Requirement: EMOM stop at the first missed interval
An EMOM MAY stop at its first missed interval. A missed interval is one that ends with any of its exercises short of its target. A stopping EMOM SHALL be complete at the end of its first missed interval, or after its last interval if none is missed. Its description SHALL end with " · until failure", its workout detail and pre-start summary SHALL show its duration as "<minutes> min max · until failure", and its mode label SHALL be unchanged.

#### Scenario: Stop on a miss
- **WHEN** minute 13 of a stopping Death by of BURPEES (1, +1) ends with 9 valid reps
- **THEN** the workout is complete at 13:00, on minute 13

#### Scenario: No miss
- **WHEN** a stopping EMOM of 10 minutes completes every minute
- **THEN** the workout is complete after minute 10

#### Scenario: Description
- **WHEN** an own stopping EMOM of 30 minutes of BURPEES 1 with increment 1 is listed
- **THEN** its mode reads EMOM · 30 and its description reads "30 min · burpees · until failure"

#### Scenario: Detail and pre-start summary
- **WHEN** the owner opens that workout's detail, or reaches its pre-start summary
- **THEN** the duration reads "30 min max · until failure"

### Requirement: For Time rest between rounds
A For Time of 2 rounds or more MAY have a rest between rounds, in whole seconds. After a round's last valid rep, the rest SHALL last that long before the next round starts. There SHALL be no rest after the last round. The clock SHALL keep running through every rest. Its description SHALL gain " · <seconds> s rest" after its exercise names, its workout detail and pre-start summary SHALL show "<seconds> s rest between rounds", and its mode label SHALL be unchanged.

#### Scenario: Rest after a round
- **WHEN** round 1 of a 3-round For Time with 60 s of rest ends on a valid rep at 1:10
- **THEN** round 2 starts at 2:10

#### Scenario: No rest after the last round
- **WHEN** the last round's last valid rep is counted
- **THEN** the workout is complete on that rep

#### Scenario: Rested description
- **WHEN** an own For Time of 5 rounds of BURPEES 10 with 60 s of rest is listed
- **THEN** its mode reads 5 ROUNDS FOR TIME and its description reads "5 rounds · burpees · 60 s rest"

#### Scenario: Rest on the detail and pre-start summary
- **WHEN** the owner opens that workout's detail, or reaches its pre-start summary
- **THEN** it reads "60 s rest between rounds", after the cap when it has one

### Requirement: EMOM work and rest
An EMOM MAY have a work time per interval, in whole seconds, shorter than the interval; the rest of each interval SHALL be rest, where reps SHALL NOT count. A stopping EMOM with a work time SHALL be complete at its first missed interval's work end. Its description SHALL gain " · <seconds> s work" after its exercise names, its detail and pre-start summary SHALL show "<work> s work / <rest> s rest" after its duration, and its mode SHALL be unchanged.

#### Scenario: A Tabata
- **WHEN** an own EMOM of 8 intervals of 30 seconds with 20 s of work of AIR SQUATS is listed
- **THEN** its mode reads EVERY 0:30 · 8 and its description reads "8 × 0:30 · air squats · 20 s work"

#### Scenario: Work and rest on the detail and pre-start summary
- **WHEN** the owner opens that Tabata's detail, or reaches its pre-start summary
- **THEN** it reads "4 min · 20 s work / 10 s rest"

#### Scenario: A stopping EMOM with a work time
- **WHEN** interval 3 of a stopping EMOM of 30-second intervals with 20 s of work ends its work short of its target
- **THEN** the workout is complete at 1:20
