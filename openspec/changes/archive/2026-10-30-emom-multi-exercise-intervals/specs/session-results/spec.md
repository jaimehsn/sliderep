## MODIFIED Requirements

### Requirement: EMOM score
EMOM SHALL be scored as "<completed intervals>/<total intervals> · <total valid reps> reps". An interval SHALL count as completed when the valid reps of every exercise in it reach that exercise's target. The total SHALL include every valid rep, including reps beyond a target.

#### Scenario: EVERY MINUTE score
- **WHEN** 8 of 10 minutes reached their target and 131 valid reps were counted overall
- **THEN** the score reads 8/10 · 131 reps

#### Scenario: Extra reps count in the total
- **WHEN** 12 reps are counted in a BURPEES minute with target 10
- **THEN** that minute is completed, its split shows 10/10, and only 10 reps add to the total

#### Scenario: Interval with an unfinished exercise
- **WHEN** a minute of 5 PULL-UPS + 10 PUSH-UPS ends after 5 PULL-UPS and 7 PUSH-UPS
- **THEN** that minute is not completed, and its 12 reps add to the total

### Requirement: Splits for EMOM
EMOM SHALL list one split per exercise of each interval, in order, with the valid reps counted toward that exercise during the interval and its target, marked completed or not: "Minute N — <exercise>" with 60-second intervals, "Interval N — <exercise>" otherwise. EMOM splits SHALL have no times. A rep SHALL belong to the interval in which it was recorded. The score's completed and total counts SHALL be intervals.

#### Scenario: Missed minute
- **WHEN** only 6 valid KB SWINGS reps are counted in minute 2 (target 15)
- **THEN** "Minute 2 — KB SWINGS" shows 6/15 and is not completed

#### Scenario: 90-second interval splits
- **WHEN** an EMOM of 10 intervals of 90 seconds records 15 valid KB SWINGS at 1:35
- **THEN** they count in "Interval 2 — KB SWINGS", and the score reads "<completed>/10 · <reps> reps"

#### Scenario: Splits of a multi-exercise minute
- **WHEN** minute 1 of 5 PULL-UPS + 10 PUSH-UPS ends after 5 PULL-UPS and 7 PUSH-UPS
- **THEN** "Minute 1 — PULL-UPS" shows 5/5 completed and "Minute 1 — PUSH-UPS" shows 7/10 not completed
