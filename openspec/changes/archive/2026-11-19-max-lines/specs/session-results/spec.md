## ADDED Requirements

### Requirement: Score of a block with MAX lines
An EMOM block with at least one MAX line SHALL be scored as "<N> reps", N being the valid reps counted on all its MAX lines, whichever their exercise. Reps on the exercises before a MAX line SHALL NOT add to N. On a stopping EMOM, N SHALL count only the intervals up to and including the one where it stopped. On a workout of several blocks, the block marked to score SHALL give the workout's score as before, and a block with MAX lines SHALL show its "<N> reps" in its group title.

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

### Requirement: Splits of a MAX line
A MAX line SHALL have one split per interval, like any EMOM exercise, showing its valid reps with no target, marked completed when the line was reached. An interval with a MAX line SHALL be completed when its MAX line was reached.

#### Scenario: MAX split
- **WHEN** interval 2 of every 3:00 counts 10 POWER SNATCHES reps after its buy-in
- **THEN** "Interval 2 — POWER SNATCHES" shows 10 reps with no target, completed

#### Scenario: MAX not reached
- **WHEN** interval 4 ends after 6 BURPEES of 8
- **THEN** "Interval 4 — BURPEES" shows 6/8 not completed, and "Interval 4 — POWER SNATCHES" shows 0 reps not completed
