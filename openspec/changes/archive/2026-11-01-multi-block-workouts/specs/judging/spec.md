## MODIFIED Requirements

### Requirement: Pre-start summary
Before judging starts, the system SHALL show the workout's mode, name, duration (when it has one), who is being judged or judging, and the list of exercises with their reps, rep description and load. For a workout of several blocks, the list SHALL be grouped by block, each with its mode and duration line, with the rest between blocks. A START action begins the countdown and a ✕ action leaves without judging.

#### Scenario: Summary for FRAN
- **WHEN** the owner reaches the start of a FRAN session
- **THEN** the summary shows THRUSTERS "21 · 15 · 9" and PULL-UPS "21 · 15 · 9" and a START button

#### Scenario: Summary with load
- **WHEN** the owner reaches the start of an own workout whose THRUSTERS line has load "95/65 lb"
- **THEN** the summary shows "95/65 lb" on the THRUSTERS line

#### Scenario: Leaving before starting
- **WHEN** the owner taps ✕ on the pre-start summary
- **THEN** the session is left without anything being recorded

#### Scenario: Summary of several blocks
- **WHEN** the owner reaches the start of a buy-in, 12-min AMRAP and cash-out workout
- **THEN** the summary lists BLOCK 1 FOR TIME, BLOCK 2 12-MIN AMRAP "12 min" and BLOCK 3 FOR TIME, each with its exercises

### Requirement: Automatic finish
Judging SHALL finish without any confirmation when the workout is complete: For Time and Chipper on the last valid rep, or at their cap when it comes first, even during a rest; AMRAP when its duration reaches 0; EMOM when its last interval ends or, when it stops, at its first missed interval's end, or its work's end with a work time. With several blocks, this applies to the last block. On finish the clock SHALL stop, gestures SHALL be ignored and the result SHALL be shown.

#### Scenario: AMRAP time runs out
- **WHEN** CINDY's 12 minutes elapse
- **THEN** an end sound plays, judging finishes keeping the partial round's reps, and the result is shown

#### Scenario: EMOM minute change cue
- **WHEN** an EMOM minute (other than the last) ends
- **THEN** a minute sound plays and the count resets to 0 for the new interval

#### Scenario: Time cap reached
- **WHEN** a capped For Time's session clock reaches its cap with reps still to do
- **THEN** an end sound plays, judging finishes keeping the unfinished position's reps, and the result is shown

#### Scenario: Finished before the cap
- **WHEN** a capped For Time's last valid rep comes before its cap
- **THEN** judging finishes on that rep without an end sound, as an uncapped For Time does

#### Scenario: Missed interval in a stopping EMOM
- **WHEN** a minute of a stopping EMOM ends with its exercise short of its target
- **THEN** an end sound plays instead of the minute sound, judging finishes keeping that minute's reps, and the result is shown

#### Scenario: Cap reached during a rest
- **WHEN** a capped For Time with rest between rounds reaches its cap during a rest
- **THEN** an end sound plays and judging finishes

#### Scenario: A block that isn't the last
- **WHEN** the first of two blocks, a 12-min AMRAP, reaches 0
- **THEN** the minute sound plays instead of the end sound, and judging goes on with the second block

## ADDED Requirements

### Requirement: Judging several blocks
While judging a workout of several blocks, the screen SHALL show "BLOCK n/N" for the current block, and the header, exercise and count SHALL be the current block's. A block change SHALL play the minute sound. A rest after a block SHALL behave like any rest: REST with its time left, gestures ignored and a cue at its start and end.

#### Scenario: Moving to the next block
- **WHEN** the buy-in's last valid rep is counted
- **THEN** the minute sound plays, the screen shows BLOCK 2/3, and the AMRAP's first exercise with its countdown

#### Scenario: Rest after a block
- **WHEN** an 8-min AMRAP with 120 s of rest after it reaches 0, and the clock reaches 8:30
- **THEN** the exercise name reads REST 01:30, and a swipe does nothing
