# Spec Delta

## Purpose

Turns a judged session's raw rep and no-rep events into a score and a list of splits, always by replaying the events against the workout's rules, and tells the owner whether and where the session was saved.

## ADDED Requirements

### Requirement: Results are derived, never stored
The score and splits SHALL be computed from the workout definition, its format version and the session's raw events every time they are shown. Neither the score nor the splits SHALL be stored. No-rep events SHALL NOT count toward any score or split.

#### Scenario: Same events, same result
- **WHEN** a saved session's result is shown twice
- **THEN** both show the same score and splits, computed from the stored events

#### Scenario: No-reps are ignored
- **WHEN** a session contains 3 no-rep events between valid reps
- **THEN** the score and splits are the same as for the valid reps alone

### Requirement: For Time and Chipper score
For Time and Chipper SHALL be scored as TIME: the session-clock time of the last valid rep, shown as mm:ss.

#### Scenario: FRAN time
- **WHEN** FRAN's last valid rep happened at 4:32 on the session clock
- **THEN** the score reads TIME 04:32

### Requirement: AMRAP score
AMRAP SHALL be scored as "<completed rounds> + <reps in the unfinished round>".

#### Scenario: CINDY score
- **WHEN** CINDY ends after 14 full rounds and 7 valid reps of the 15th
- **THEN** the score reads 14 + 7

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
The result SHALL show one of: "Saved in your history" when the owner was the judged athlete and the session was saved, "Saved on this phone — will be delivered to <alias> once sync exists" when another registered athlete was judged, or "Not saved" when the judged athlete was anonymous.

#### Scenario: Judging an identified athlete
- **WHEN** the owner judged an athlete identified by QR
- **THEN** the banner reads "Saved on this phone — will be delivered to <their alias> once sync exists"

#### Scenario: Judging anonymously
- **WHEN** the owner judged without identifying the athlete
- **THEN** the banner reads "Not saved"
