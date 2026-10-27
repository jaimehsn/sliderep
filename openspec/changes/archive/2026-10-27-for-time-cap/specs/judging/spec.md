## MODIFIED Requirements

### Requirement: Timer per format
The header SHALL show elapsed time for For Time and Chipper, time remaining for AMRAP, and time left in the current minute for EMOM. A capped For Time or Chipper SHALL keep showing elapsed time, labelled with its cap.

#### Scenario: AMRAP countdown
- **WHEN** CINDY has been running for 2 minutes
- **THEN** the timer shows 10:00 labelled "remaining"

#### Scenario: EMOM minute timer
- **WHEN** EVERY MINUTE has been running for 75 seconds
- **THEN** the timer shows 00:45 labelled "min left"

#### Scenario: Capped For Time timer
- **WHEN** a For Time with a 12 min cap has been running for 7:42
- **THEN** the timer shows 07:42 labelled "elapsed · cap 12:00"

### Requirement: Automatic finish
Judging SHALL finish without any confirmation: For Time and Chipper on the workout's last valid rep, or at their cap when they have one and it comes first, AMRAP when its duration reaches 0, and EMOM when its last minute ends. On finish the clock SHALL stop, further gestures SHALL be ignored and the result SHALL be shown.

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
