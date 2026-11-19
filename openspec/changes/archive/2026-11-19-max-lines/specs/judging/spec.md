## ADDED Requirements

### Requirement: Judging a MAX line
While a MAX line is current, the judging screen SHALL show its exercise and its rep count, and "MAX" in place of the reps left and the target. The count SHALL keep growing with each valid rep. The other exercises of the interval SHALL be shown as in any EMOM.

#### Scenario: Counting MAX reps
- **WHEN** POWER SNATCHES MAX becomes current and the judge records 3 valid reps
- **THEN** the screen shows POWER SNATCHES, the count 3 and MAX, with no reps left or target

#### Scenario: Buy-in before the MAX line
- **WHEN** BURPEES 8 is current before POWER SNATCHES MAX
- **THEN** the screen shows the reps left and the target 8 as in any EMOM
