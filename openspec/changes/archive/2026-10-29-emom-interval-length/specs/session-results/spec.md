## MODIFIED Requirements

### Requirement: Splits for EMOM
EMOM SHALL list one split per interval with the valid reps counted during that interval and its target, marked completed or not: "Minute N — <exercise>" with 60-second intervals, "Interval N — <exercise>" otherwise. EMOM splits SHALL have no times. A rep SHALL belong to the interval in which it was recorded. The score's completed and total counts SHALL be intervals.

#### Scenario: Missed minute
- **WHEN** only 6 valid KB SWINGS reps are counted in minute 2 (target 15)
- **THEN** "Minute 2 — KB SWINGS" shows 6/15 and is not completed

#### Scenario: 90-second interval splits
- **WHEN** an EMOM of 10 intervals of 90 seconds records 15 valid KB SWINGS at 1:35
- **THEN** they count in "Interval 2 — KB SWINGS", and the score reads "<completed>/10 · <reps> reps"
