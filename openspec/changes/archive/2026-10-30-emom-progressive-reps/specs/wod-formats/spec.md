## ADDED Requirements

### Requirement: Progressive EMOM reps
An EMOM line MAY have an increment, a whole number of reps of 0 or more, 0 by default. The line's target SHALL grow by its increment each time its entry of the interval sequence comes round: in the k-th repetition of the sequence (k = 0, 1, 2, …), the target SHALL be the line's reps plus k times its increment.

#### Scenario: Death by
- **WHEN** an EMOM's only interval is BURPEES 1 with increment 1
- **THEN** minute 1 asks for 1 BURPEES, minute 2 for 2, and minute 12 for 12

#### Scenario: Ladder in an alternating sequence
- **WHEN** an EMOM alternates BURPEES 3 with increment 1 and KB SWINGS 10 with increment 2
- **THEN** minutes 1, 3 and 5 ask for 3, 4 and 5 BURPEES, and minutes 2, 4 and 6 ask for 10, 12 and 14 KB SWINGS

### Requirement: EMOM stop at the first missed interval
An EMOM MAY stop at its first missed interval. A missed interval is one that ends with any of its exercises short of its target. A stopping EMOM SHALL be complete at the end of its first missed interval, or after its last interval if none is missed. Its description SHALL end with " · until failure", its workout detail and pre-start summary SHALL show its duration as "<minutes> min max · until failure", and its mode label SHALL be unchanged.

#### Scenario: Stop on a miss
- **WHEN** minute 13 of a stopping Death by of BURPEES (1, +1) ends with 9 valid reps
- **THEN** the workout is complete at 13:00, on minute 13

#### Scenario: No miss
- **WHEN** a stopping EMOM of 10 minutes completes every minute
- **THEN** the workout is complete after minute 10

#### Scenario: Description
- **WHEN** an own stopping EMOM of 30 minutes of BURPEES 1 with increment 1 is listed
- **THEN** its mode reads EMOM · 30 and its description reads "30 min · burpees · until failure"

#### Scenario: Detail and pre-start summary
- **WHEN** the owner opens that workout's detail, or reaches its pre-start summary
- **THEN** the duration reads "30 min max · until failure"
