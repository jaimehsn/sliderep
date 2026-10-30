## MODIFIED Requirements

### Requirement: Every input is recorded as a timestamped event
Each valid rep and each no-rep SHALL be recorded as an event with its time in milliseconds since judging started. Events SHALL be recorded even when they do not change the live count. Gestures during a rest SHALL NOT be recorded.

#### Scenario: No-rep is recorded
- **WHEN** the judge swipes left 75 seconds into the session
- **THEN** a no-rep event with time ≈ 75000 ms is added to the session's events

#### Scenario: Gesture during a rest
- **WHEN** the judge swipes right during a rest
- **THEN** no event is recorded, the count is unchanged and there is no haptic feedback

### Requirement: Timer per format
The header SHALL show elapsed time for For Time and Chipper, time remaining for AMRAP, and time left in the current interval for EMOM, labelled "min left" with 60-second intervals and "interval left" otherwise. A capped For Time or Chipper SHALL keep showing elapsed time, labelled with its cap. An EMOM with a work time SHALL show the time left in the current work, labelled "work left", or in the current rest, labelled "rest left".

#### Scenario: AMRAP countdown
- **WHEN** CINDY has been running for 2 minutes
- **THEN** the timer shows 10:00 labelled "remaining"

#### Scenario: EMOM minute timer
- **WHEN** EVERY MINUTE has been running for 75 seconds
- **THEN** the timer shows 00:45 labelled "min left"

#### Scenario: Capped For Time timer
- **WHEN** a For Time with a 12 min cap has been running for 7:42
- **THEN** the timer shows 07:42 labelled "elapsed · cap 12:00"

#### Scenario: Interval timer
- **WHEN** an EMOM with 90-second intervals has been running for 100 seconds
- **THEN** the timer shows 01:20 labelled "interval left"

#### Scenario: Tabata timer
- **WHEN** a Tabata of 30-second intervals with 20 s of work has been running for 52 seconds
- **THEN** the timer shows 00:08 labelled "rest left"

### Requirement: Automatic finish
Judging SHALL finish without any confirmation: For Time and Chipper on the workout's last valid rep, or at their cap when they have one and it comes first, even during a rest; AMRAP when its duration reaches 0; and EMOM when its last interval ends or, when it stops at its first missed interval, when that interval ends, or its work ends if it has a work time. On finish the clock SHALL stop, further gestures SHALL be ignored and the result SHALL be shown.

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

## ADDED Requirements

### Requirement: Rest during judging
During a rest, the exercise name SHALL read REST with the rest's time left, and the count SHALL show the next exercise's 0 and target. A cue SHALL play when a rest starts and when work resumes, using the interval sound, and only once when both happen together. For a For Time, the progress indicator SHALL already show the next round during its rest.

#### Scenario: For Time rest
- **WHEN** round 1 of a For Time with 60 s of rest ends at 1:10, and the clock reaches 1:30
- **THEN** a cue played at 1:10, the exercise name reads REST 00:40, and the header shows round 2

#### Scenario: Work resumes
- **WHEN** that rest ends at 2:10
- **THEN** a cue plays and round 2's first exercise is shown with a count of 0
