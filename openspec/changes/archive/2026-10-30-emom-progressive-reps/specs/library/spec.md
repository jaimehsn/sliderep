## MODIFIED Requirements

### Requirement: Summarized reps
The exercise breakdown SHALL show a FOR TIME of more than one round where every round has the same reps as "<N> ROUNDS FOR TIME", with each exercise's reps once. A line of 1 rep with a rep description SHALL show the description in place of the reps. An EMOM interval of several exercises SHALL be shown as one row, its exercise names and its reps each joined by " + ". An EMOM line with an increment SHALL show it after its reps as "(+<increment>)".

#### Scenario: Same reps every round
- **WHEN** an own FOR TIME has 5 rounds of BURPEES 10 and AIR SQUATS 15
- **THEN** the detail shows 5 ROUNDS FOR TIME, BURPEES "10 reps" and AIR SQUATS "15 reps"

#### Scenario: Line with load and description
- **WHEN** an own workout has a line ROW 1 rep with description 500 m and a line THRUSTERS 21 with load "95/65 lb"
- **THEN** the detail shows "500 m" in place of the reps on the ROW line, and "95/65 lb" on the THRUSTERS line

#### Scenario: Multi-exercise EMOM interval
- **WHEN** an own EMOM has minute 1 of 5 PULL-UPS + 10 PUSH-UPS and minute 2 of 15 AIR SQUATS
- **THEN** the detail shows "PULL-UPS + PUSH-UPS" with "5 + 10 / min" and "AIR SQUATS" with "15 / min"

#### Scenario: Progressive EMOM line
- **WHEN** an own EMOM's only interval is BURPEES 1 with increment 1
- **THEN** the detail shows BURPEES with "1 (+1) / min"
