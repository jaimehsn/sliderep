# result-adjustment Specification

## Purpose

Lets a registered judge correct a just-finished session's result (a split's target or the workout's duration) through a small number of append-only adjustment packages, without ever altering the recorded events.

## Requirements

### Requirement: Who can adjust and when
The ADJUST RESULT action SHALL be offered only on the result shown right after judging, only when the owner was the judge, has a profile and the session was saved, and only while the session has fewer than 3 adjustment packages. It SHALL NOT be offered from History or to the judged athlete.

#### Scenario: Registered owner judged an identified athlete
- **WHEN** the owner, with a profile, finishes judging an athlete identified by QR
- **THEN** the result shows ADJUST RESULT

#### Scenario: Owner was judged
- **WHEN** the owner finishes a session in which they were judged
- **THEN** ADJUST RESULT is not shown

#### Scenario: Viewing from History
- **WHEN** the owner opens a saved session from History
- **THEN** ADJUST RESULT is not shown

### Requirement: Adjustment packages are capped and append-only
A session SHALL accept at most 3 adjustment packages. Each saved package SHALL record its changes, who approved it (the owner's id) and when. Saved packages SHALL NOT be edited or removed, and the recorded events SHALL never change.

#### Scenario: Third package saved
- **WHEN** the third package is saved for a session
- **THEN** the adjust screen reads "3 of 3 packages used", SAVE PACKAGE is disabled, and ADJUST RESULT disappears from the result

### Requirement: Editable values
On the adjust screen, the owner SHALL be able to tap any split to set a new positive target for that position, and, for formats with a duration, set a new positive duration (seconds for AMRAP and for a capped For Time or Chipper; for EMOM, whole minutes with 60-second intervals and a number of intervals otherwise). For Time and Chipper without a cap SHALL NOT offer a duration.

#### Scenario: Editing a split target
- **WHEN** the owner taps "Round 2 — THRUSTERS 15/15" and enters 12
- **THEN** a pending target change of 12 for that position is added

#### Scenario: Invalid or unchanged value
- **WHEN** the owner enters 0, a non-number, or the current value
- **THEN** no change is added

#### Scenario: EMOM duration
- **WHEN** the owner sets EVERY MINUTE's duration to 8
- **THEN** a pending duration change of 8 minutes is added

#### Scenario: Capped For Time duration
- **WHEN** the owner sets a 10 min capped For Time's duration to 480
- **THEN** a pending duration change of 480 seconds is added

#### Scenario: Interval EMOM duration
- **WHEN** the owner sets an EMOM of 10 intervals of 90 seconds to 6 intervals
- **THEN** a pending duration change of 540 seconds is added

### Requirement: Live preview and saving
The adjust screen SHALL show the score and splits with the saved packages plus the pending changes applied. SAVE PACKAGE SHALL store the pending changes as one package and SHALL be disabled when there is nothing pending. Leaving with ✕ SHALL discard pending changes.

#### Scenario: Returning to the result
- **WHEN** the owner saves a package and returns to the result
- **THEN** the result shows the adjusted score and splits

#### Scenario: Leaving without saving
- **WHEN** the owner makes changes and taps ✕ without saving
- **THEN** no package is stored and the result is unchanged

### Requirement: Later changes override earlier ones
When several saved packages change the same position's target, or the duration, the most recent change SHALL apply.

#### Scenario: Target changed twice
- **WHEN** package 1 sets a position's target to 12 and package 2 sets it to 14
- **THEN** the adjusted result uses 14 for that position

### Requirement: Reps are not re-flowed between positions
For For Time, Chipper and AMRAP, each valid rep SHALL stay in the position it was counted in during judging. A changed target SHALL only change how many of that position's own reps count and whether it is complete; reps SHALL NOT move to the next or previous position.

#### Scenario: Lowered target
- **WHEN** a position judged at 15/15 is adjusted to a target of 12
- **THEN** that split shows 12/12 completed, its time is the 12th rep's time, and the following splits keep their own reps

#### Scenario: Raised target
- **WHEN** a For Time position judged at 15/15 is adjusted to a target of 18
- **THEN** that split shows 15/18 not completed, and the score shows "DNF — <completed positions>/<total positions> + 15" instead of a time

### Requirement: Duration cutoff
A changed duration SHALL exclude every valid rep recorded after the new duration. For EMOM, the number of intervals scored SHALL become the new duration in intervals.

#### Scenario: Shortened AMRAP
- **WHEN** CINDY's duration is adjusted to 600 seconds
- **THEN** reps recorded after 10:00 no longer count toward rounds or reps

#### Scenario: Shortened EMOM
- **WHEN** EVERY MINUTE's duration is adjusted to 8 minutes
- **THEN** the score is out of 8 minutes and only minutes 1–8 are listed

#### Scenario: Raised duration
- **WHEN** CINDY's duration is adjusted above 720 seconds, or EVERY MINUTE's to 12 minutes
- **THEN** CINDY's score is unchanged, and EVERY MINUTE is scored out of 12 minutes with minutes 11–12 listed at 0 reps, not completed

#### Scenario: Shortened interval EMOM
- **WHEN** an EMOM of 10 intervals of 90 seconds is adjusted to 6 intervals
- **THEN** the score is out of 6 intervals and only intervals 1–6 are listed

### Requirement: EMOM target change affects completion only
For EMOM, changing the target of an exercise in an interval SHALL only change whether that exercise, and so its interval, counts as completed. It SHALL NOT move any rep to another exercise. The total of valid reps SHALL NOT change with target changes.

#### Scenario: Raising an EMOM target
- **WHEN** a BURPEES minute with 11 valid reps has its target raised from 10 to 12
- **THEN** that minute is no longer completed and the total valid reps is unchanged

#### Scenario: Raising the first exercise's target
- **WHEN** a minute of 5 PULL-UPS + 10 PUSH-UPS was judged as 5 PULL-UPS and 10 PUSH-UPS, and PULL-UPS' target is raised to 7
- **THEN** "Minute 1 — PULL-UPS" shows 5/7 not completed, PUSH-UPS still shows 10/10, and the minute is not completed

### Requirement: Adjusted time cap
For a capped For Time or Chipper, a changed duration SHALL be the adjusted cap: valid reps recorded at the adjusted cap or later SHALL NOT count. The adjusted score SHALL be TIME of the last position's completing rep when every position of the workout is complete under the adjustment, and "CAP · <N> reps" otherwise, N being every valid rep each position keeps. Raising the cap SHALL NOT add reps, since none were recorded after the original cap.

#### Scenario: Shortened cap
- **WHEN** a For Time finished at 9:30 under a 10 min cap has its duration adjusted to 480 seconds
- **THEN** reps recorded at 8:00 or later no longer count and the score reads "CAP · <reps before 8:00> reps"

#### Scenario: Raised cap
- **WHEN** a For Time that reached its 10 min cap unfinished has its duration adjusted to 900 seconds
- **THEN** the score still reads "CAP · <N> reps" with the same N

#### Scenario: Raised target on a capped workout
- **WHEN** a position of a capped For Time judged at 15/15 is adjusted to a target of 18
- **THEN** that split shows 15/18 not completed, and the score reads "CAP · <N> reps" instead of a time
