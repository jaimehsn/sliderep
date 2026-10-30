## ADDED Requirements

### Requirement: EMOM progression and stop
Each EMOM line SHALL have a `+/ROUND` field for its increment, a whole number of 0 or more, 0 by default. An EMOM SHALL have a "STOP AT FIRST MISSED INTERVAL" option, off by default. DUPLICATE SHALL keep each line's increment and the option.

#### Scenario: Creating a Death by
- **WHEN** the owner creates an EMOM of 30 minutes with BURPEES 1, `+/ROUND` 1 and the stop option on, and saves
- **THEN** the saved workout asks for 1, 2, 3, … BURPEES per minute and stops at its first missed minute

#### Scenario: Invalid increment
- **WHEN** the owner sets a line's `+/ROUND` to a non-number and taps SAVE
- **THEN** nothing is saved and that line is flagged

#### Scenario: Duplicating keeps the progression
- **WHEN** the owner duplicates a stopping EMOM with BURPEES 1 (+1)
- **THEN** the copy opens with `+/ROUND` 1 on BURPEES and the stop option on
