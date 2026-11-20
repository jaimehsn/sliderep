## MODIFIED Requirements

### Requirement: Score of a block with MAX lines
An EMOM block with MAX lines SHALL be scored with one total per unit: "<N> reps" for MAX lines without a segment, and "<N> <unit>" adding up the segments of each unit, in the order units first appear in the interval sequence, joined by " · ". Reps before a MAX line SHALL NOT count. A stopping EMOM SHALL count only the intervals up to the one where it stopped. On several blocks, the marked block SHALL give the score, and a block with MAX lines SHALL show its own in its group title.

#### Scenario: The box's AMRAP
- **WHEN** an EMOM of every 3:00 × 5 with 2:00 of work, each interval ROW 1 rep (200 m), BURPEES 8 then POWER SNATCHES MAX, ends with 11, 10, 9, 0 and 8 POWER SNATCHES reps
- **THEN** the score reads 38 reps

#### Scenario: Different MAX exercises
- **WHEN** an EMOM alternates POWER SNATCHES MAX and WALL BALL MAX intervals, with 20 valid POWER SNATCHES and 30 valid WALL BALL reps in all
- **THEN** the score reads 50 reps

#### Scenario: Stopping EMOM with a MAX line
- **WHEN** a stopping EMOM with BURPEES 8 then POWER SNATCHES MAX counts 12 and 10 POWER SNATCHES reps in intervals 1 and 2, then misses interval 3's BURPEES
- **THEN** the score reads 22 reps, and the splits end at interval 3

#### Scenario: Block that doesn't score
- **WHEN** a workout of two blocks scores its first block, and its second block has MAX lines with 40 reps
- **THEN** the workout's score is the first block's, and the second block's group title shows 40 reps

#### Scenario: Example 3
- **WHEN** an EMOM of 15 minutes rotates STEP-UPS 16, RUN 1 rep (200 m) and HANDSTAND WALK MAX each rep 5 m, and the five HANDSTAND WALK minutes count 12, 10, 9, 11 and 8 valid reps
- **THEN** the score reads 250 m

#### Scenario: Mixed units
- **WHEN** an EMOM alternates HANDSTAND WALK MAX each rep 5 m and POWER SNATCHES MAX, with 12 valid HANDSTAND WALK reps and 38 valid POWER SNATCHES reps in all
- **THEN** the score reads 60 m · 38 reps

#### Scenario: Different segment sizes of one unit
- **WHEN** one MAX line of a block is HANDSTAND WALK each rep 5 m with 4 valid reps, and another is SLED PUSH each rep 10 m with 3 valid reps
- **THEN** the score reads 50 m

### Requirement: Splits of a MAX line
A MAX line SHALL have one split per interval, like any EMOM exercise, showing its valid reps with no target, or its total in its unit when it has a segment, marked completed when the line was reached. An interval with a MAX line SHALL be completed when its MAX line was reached.

#### Scenario: MAX split
- **WHEN** interval 2 of every 3:00 counts 10 POWER SNATCHES reps after its buy-in
- **THEN** "Interval 2 — POWER SNATCHES" shows 10 reps with no target, completed

#### Scenario: MAX not reached
- **WHEN** interval 4 ends after 6 BURPEES of 8
- **THEN** "Interval 4 — BURPEES" shows 6/8 not completed, and "Interval 4 — POWER SNATCHES" shows 0 reps not completed

#### Scenario: Split in metres
- **WHEN** minute 3 counts 12 valid HANDSTAND WALK reps, each rep 5 m
- **THEN** "Minute 3 — HANDSTAND WALK" shows 60 m
