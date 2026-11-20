## MODIFIED Requirements

### Requirement: Judging a MAX line
While a MAX line is current, the judging screen SHALL show its exercise and its count, and "MAX" in place of the reps left and the target. The count SHALL keep growing with each valid rep. On a MAX line with a segment, the count SHALL be its total in its unit, growing by the segment's amount, and the unit SHALL replace "MAX". The other exercises of the interval SHALL be shown as in any EMOM.

#### Scenario: Counting MAX reps
- **WHEN** POWER SNATCHES MAX becomes current and the judge records 3 valid reps
- **THEN** the screen shows POWER SNATCHES, the count 3 and MAX, with no reps left or target

#### Scenario: Buy-in before the MAX line
- **WHEN** BURPEES 8 is current before POWER SNATCHES MAX
- **THEN** the screen shows the reps left and the target 8 as in any EMOM

#### Scenario: Counting metres
- **WHEN** HANDSTAND WALK MAX, each rep 5 m, becomes current and the judge records 3 valid reps
- **THEN** the screen shows HANDSTAND WALK, the count 15 and "m"
