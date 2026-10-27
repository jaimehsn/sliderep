# session-results Specification

## Purpose

Turns a judged session's raw rep and no-rep events into a score and a list of splits, always by replaying the events against the workout's rules, and tells the owner whether and where the session was saved.

## Requirements

### Requirement: Results are derived, never stored
The score and splits SHALL be computed from the workout definition, its format version and the session's raw events every time they are shown. Neither the score nor the splits SHALL be stored. No-rep events SHALL NOT count toward any score or split.

#### Scenario: Same events, same result
- **WHEN** a saved session's result is shown twice
- **THEN** both show the same score and splits, computed from the stored events

#### Scenario: No-reps are ignored
- **WHEN** a session contains 3 no-rep events between valid reps
- **THEN** the score and splits are the same as for the valid reps alone

### Requirement: For Time and Chipper score
For Time and Chipper SHALL be scored as TIME: the session-clock time of the last valid rep, shown as mm:ss. A capped workout that was not finished before its cap SHALL be scored as "CAP · <N> reps", N being every valid rep counted before the cap, including the unfinished position's.

#### Scenario: FRAN time
- **WHEN** FRAN's last valid rep happened at 4:32 on the session clock
- **THEN** the score reads TIME 04:32

#### Scenario: Finished under the cap
- **WHEN** a capped For Time is finished at 8:12, before its 10 min cap
- **THEN** the score reads TIME 08:12

#### Scenario: Time capped
- **WHEN** a 21-15-9 For Time with a 10 min cap reaches 10:00 after both round-1 lines (42 reps) and 9 THRUSTERS of round 2
- **THEN** the score reads CAP · 51 reps, and the last split is "Round 2 — THRUSTERS" at 9/15, partial

### Requirement: AMRAP score
AMRAP SHALL be scored as "<completed rounds> + <reps in the unfinished round>". The reps in the unfinished round SHALL be the valid reps of every exercise in that round, not only the exercise in progress. In an adjusted result, the unfinished round SHALL be the first round with any position not completed under the adjustment, and its reps SHALL be the reps each of its positions keeps under the adjustment.

#### Scenario: CINDY score
- **WHEN** CINDY ends after 14 full rounds and 7 valid reps of the 15th
- **THEN** the score reads 14 + 7

#### Scenario: Unfinished round past its first exercise
- **WHEN** CINDY ends after 6 full rounds plus 5 PULL-UPS and 10 PUSH-UPS of the 7th, with no AIR SQUATS yet
- **THEN** the score reads 6 + 15

#### Scenario: Round just finished
- **WHEN** CINDY ends right after the last AIR SQUAT of its 6th round
- **THEN** the score reads 6 + 0

#### Scenario: Shortened AMRAP counts the whole unfinished round
- **WHEN** CINDY's duration is adjusted to 600 seconds and, by 10:00, 6 full rounds plus 5 PULL-UPS, 10 PUSH-UPS and 5 AIR SQUATS of the 7th were recorded
- **THEN** the adjusted score reads 6 + 20

#### Scenario: Raised target leaves an earlier round unfinished
- **WHEN** round 3's PULL-UPS, judged at 5/5, are adjusted to a target of 8, and that round's PUSH-UPS (10/10) and AIR SQUATS (15/15) were completed
- **THEN** the adjusted score reads 2 + 30

### Requirement: EMOM score
EMOM SHALL be scored as "<completed minutes>/<total minutes> · <total valid reps> reps". A minute SHALL count as completed when its valid reps reach its target. The total SHALL include every valid rep, including reps beyond a minute's target.

#### Scenario: EVERY MINUTE score
- **WHEN** 8 of 10 minutes reached their target and 131 valid reps were counted overall
- **THEN** the score reads 8/10 · 131 reps

#### Scenario: Extra reps count in the total
- **WHEN** 12 valid reps are counted in a BURPEES minute with target 10
- **THEN** that minute is completed, its split shows 12/10, and all 12 reps add to the total

### Requirement: Splits for rep-driven formats
For For Time, Chipper and AMRAP, the result SHALL list one split per completed exercise position in order, with its label (e.g. "Round 2 — PULL-UPS", "Station 3 — KB SWINGS"), reps/target, cumulative time and lap time since the previous split. An unfinished final position with at least one valid rep SHALL be listed as partial, without times.

#### Scenario: FRAN splits
- **WHEN** FRAN is finished
- **THEN** six splits are listed, from "Round 1 — THRUSTERS" to "Round 3 — PULL-UPS", each with cumulative and lap times

#### Scenario: Partial AMRAP round
- **WHEN** CINDY ends 7 reps into a round's PUSH-UPS
- **THEN** the last split is that round's PUSH-UPS at 7/10, marked partial and without times

### Requirement: Splits for EMOM
EMOM SHALL list one split per minute ("Minute N — <exercise>") with the valid reps counted during that minute and its target, marked completed or not. EMOM splits SHALL have no times. A rep SHALL belong to the minute in which it was recorded.

#### Scenario: Missed minute
- **WHEN** only 6 valid KB SWINGS reps are counted in minute 2 (target 15)
- **THEN** "Minute 2 — KB SWINGS" shows 6/15 and is not completed

### Requirement: Saved-state banner
The result SHALL show a banner matching the real save outcome: "Saved in your history" when the owner was the judged athlete and the session was saved, "Saved on this phone — will be delivered to <alias> once sync exists" when another registered athlete was judged and the session was saved, "Saving…" while a save is in progress, "Couldn't save this session" when the save failed, and "Not saved" when the judged athlete was anonymous.

#### Scenario: Judging an identified athlete
- **WHEN** the owner judged an athlete identified by QR
- **THEN** the banner reads "Saved on this phone — will be delivered to <their alias> once sync exists"

#### Scenario: Judging anonymously
- **WHEN** the owner judged without identifying the athlete
- **THEN** the banner reads "Not saved"

#### Scenario: Save in progress
- **WHEN** the result is shown and the session's save has not finished yet
- **THEN** the banner reads "Saving…"

#### Scenario: Save failed
- **WHEN** saving the finished session fails
- **THEN** the banner reads "Couldn't save this session", ADJUST RESULT is not shown, and no retry is offered

#### Scenario: Saved session opened from History
- **WHEN** the owner opens a saved session from History
- **THEN** the banner reads "Saved in your history"
