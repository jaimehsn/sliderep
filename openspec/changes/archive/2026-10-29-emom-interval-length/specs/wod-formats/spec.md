## MODIFIED Requirements

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
