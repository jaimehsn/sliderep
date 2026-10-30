## MODIFIED Requirements

### Requirement: EMOM content
An EMOM workout SHALL be an ordered sequence of intervals, each with one or more exercises and their reps, repeated in order for a total number of intervals. The total SHALL NOT need to be a multiple of the sequence length. The interval length SHALL be set in whole seconds (EVERY), from 10 to 600 and 60 by default, and the total as a number of intervals (INTERVALS), with the total time shown. DUPLICATE SHALL keep the source's interval length and exercises per interval.

#### Scenario: Alternating EMOM
- **WHEN** the owner creates a 12-minute EMOM of minute 1 BURPEES 10 and minute 2 KB SWINGS 15
- **THEN** minutes 1, 3, … 11 are BURPEES and minutes 2, 4, … 12 are KB SWINGS

#### Scenario: Total not a multiple of the sequence
- **WHEN** an EMOM has a 3-minute sequence and 10 minutes in total
- **THEN** minute 10 uses the sequence's first exercise

#### Scenario: 90-second intervals
- **WHEN** the owner sets EVERY to 90 and INTERVALS to 10
- **THEN** the editor shows a total of 15:00, and the saved workout runs 10 intervals of 90 seconds

#### Scenario: Interval out of range
- **WHEN** the owner sets EVERY to 5 and taps SAVE
- **THEN** nothing is saved and the interval is flagged

#### Scenario: Several exercises in a minute
- **WHEN** the owner adds PUSH-UPS 10 to minute 1 after PULL-UPS 5, and saves
- **THEN** the saved workout's minute 1 is 5 PULL-UPS then 10 PUSH-UPS

#### Scenario: Removing an interval's only exercise
- **WHEN** the owner removes the only exercise of minute 2
- **THEN** minute 2 is removed from the sequence and the later minutes move up
