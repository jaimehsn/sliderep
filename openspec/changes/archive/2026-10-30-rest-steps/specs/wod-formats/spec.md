## ADDED Requirements

### Requirement: For Time rest between rounds
A For Time of 2 rounds or more MAY have a rest between rounds, in whole seconds. After a round's last valid rep, the rest SHALL last that long before the next round starts. There SHALL be no rest after the last round. The clock SHALL keep running through every rest. Its description SHALL gain " · <seconds> s rest" after its exercise names, its workout detail and pre-start summary SHALL show "<seconds> s rest between rounds", and its mode label SHALL be unchanged.

#### Scenario: Rest after a round
- **WHEN** round 1 of a 3-round For Time with 60 s of rest ends on a valid rep at 1:10
- **THEN** round 2 starts at 2:10

#### Scenario: No rest after the last round
- **WHEN** the last round's last valid rep is counted
- **THEN** the workout is complete on that rep

#### Scenario: Rested description
- **WHEN** an own For Time of 5 rounds of BURPEES 10 with 60 s of rest is listed
- **THEN** its mode reads 5 ROUNDS FOR TIME and its description reads "5 rounds · burpees · 60 s rest"

#### Scenario: Rest on the detail and pre-start summary
- **WHEN** the owner opens that workout's detail, or reaches its pre-start summary
- **THEN** it reads "60 s rest between rounds", after the cap when it has one

### Requirement: EMOM work and rest
An EMOM MAY have a work time per interval, in whole seconds, shorter than the interval; the rest of each interval SHALL be rest, where reps SHALL NOT count. A stopping EMOM with a work time SHALL be complete at its first missed interval's work end. Its description SHALL gain " · <seconds> s work" after its exercise names, its detail and pre-start summary SHALL show "<work> s work / <rest> s rest" after its duration, and its mode SHALL be unchanged.

#### Scenario: A Tabata
- **WHEN** an own EMOM of 8 intervals of 30 seconds with 20 s of work of AIR SQUATS is listed
- **THEN** its mode reads EVERY 0:30 · 8 and its description reads "8 × 0:30 · air squats · 20 s work"

#### Scenario: Work and rest on the detail and pre-start summary
- **WHEN** the owner opens that Tabata's detail, or reaches its pre-start summary
- **THEN** it reads "4 min · 20 s work / 10 s rest"

#### Scenario: A stopping EMOM with a work time
- **WHEN** interval 3 of a stopping EMOM of 30-second intervals with 20 s of work ends its work short of its target
- **THEN** the workout is complete at 1:20
