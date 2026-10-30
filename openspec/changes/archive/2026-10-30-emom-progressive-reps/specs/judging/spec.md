## MODIFIED Requirements

### Requirement: Automatic finish
Judging SHALL finish without any confirmation: For Time and Chipper on the workout's last valid rep, or at their cap when they have one and it comes first, AMRAP when its duration reaches 0, and EMOM when its last minute ends or, when it stops at its first missed interval, when that interval ends. On finish the clock SHALL stop, further gestures SHALL be ignored and the result SHALL be shown.

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
