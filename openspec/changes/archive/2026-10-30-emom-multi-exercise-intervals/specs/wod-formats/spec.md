## MODIFIED Requirements

### Requirement: EMOM advances on the clock
In an EMOM, each interval SHALL last the workout's interval length, 60 seconds unless set otherwise, and its exercises SHALL cycle through the workout's interval sequence in order (interval 1 → entry 1, interval 2 → entry 2, interval 3 → entry 1, …). The interval SHALL change only when its time elapses, never on reaching a target. The workout SHALL be complete after its last interval. An interval length SHALL be a whole number of seconds from 10 to 600.

#### Scenario: Reaching the target early
- **WHEN** the 10th valid BURPEES rep is counted 30 seconds into minute 1 of EVERY MINUTE
- **THEN** the exercise stays BURPEES until the minute elapses

#### Scenario: Minute change
- **WHEN** minute 1 of EVERY MINUTE elapses
- **THEN** the current interval becomes minute 2 with exercise KB SWINGS (15)

#### Scenario: Live count is capped at the target
- **WHEN** an 11th valid rep is counted during a BURPEES minute with target 10
- **THEN** the live count stays at 10, and the rep is not recorded in the session's events

#### Scenario: 90-second intervals
- **WHEN** an EMOM with 90-second intervals of BURPEES and KB SWINGS has been running for 100 seconds
- **THEN** the current interval is interval 2, with exercise KB SWINGS

## ADDED Requirements

### Requirement: Several exercises per EMOM interval
An EMOM interval MAY hold several exercises, each with its own reps, done in their listed order. Each interval SHALL start on its first exercise. The current exercise SHALL become the next one when it reaches its target. After the last exercise reaches its target, further valid reps SHALL count toward that last exercise, the live count staying at its target. An interval with one exercise SHALL behave as before.

#### Scenario: Next exercise within the interval
- **WHEN** the 5th valid PULL-UPS rep is counted in a minute of 5 PULL-UPS + 10 PUSH-UPS
- **THEN** the exercise becomes PUSH-UPS (10) with the count at 0, and the minute is unchanged

#### Scenario: New interval starts on its first exercise
- **WHEN** a minute of 5 PULL-UPS + 10 PUSH-UPS elapses with PUSH-UPS current, and the next minute is also 5 PULL-UPS + 10 PUSH-UPS
- **THEN** the new minute starts on PULL-UPS with the count at 0

#### Scenario: Reps after the last exercise
- **WHEN** a 12th valid PUSH-UPS rep is counted after 5 PULL-UPS and 10 PUSH-UPS in the same minute
- **THEN** the live count stays at 10 PUSH-UPS, and the 2 extra reps does't count toward PUSH-UPS
