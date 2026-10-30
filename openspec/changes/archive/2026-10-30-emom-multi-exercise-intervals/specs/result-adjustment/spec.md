## MODIFIED Requirements

### Requirement: EMOM target change affects completion only
For EMOM, changing the target of an exercise in an interval SHALL only change whether that exercise, and so its interval, counts as completed. It SHALL NOT move any rep to another exercise. The total of valid reps SHALL NOT change with target changes.

#### Scenario: Raising an EMOM target
- **WHEN** a BURPEES minute with 11 valid reps has its target raised from 10 to 12
- **THEN** that minute is no longer completed and the total valid reps is unchanged

#### Scenario: Raising the first exercise's target
- **WHEN** a minute of 5 PULL-UPS + 10 PUSH-UPS was judged as 5 PULL-UPS and 10 PUSH-UPS, and PULL-UPS' target is raised to 7
- **THEN** "Minute 1 — PULL-UPS" shows 5/7 not completed, PUSH-UPS still shows 10/10, and the minute is not completed
