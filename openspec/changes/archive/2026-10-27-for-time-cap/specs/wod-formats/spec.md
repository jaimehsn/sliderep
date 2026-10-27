## ADDED Requirements

### Requirement: For Time time cap
A For Time or Chipper workout MAY have a time cap, a whole number of minutes of 1 or more. A capped workout SHALL finish either on its last valid rep before the cap or when the session clock reaches the cap, whichever comes first. A rep recorded exactly at the cap or later SHALL NOT count. A workout without a cap SHALL behave as before. The cap SHALL be shown as "<minutes> min cap" wherever the workout's duration is shown.

#### Scenario: Finished before the cap
- **WHEN** a 21-15-9 For Time with a 10 min cap has its last valid rep at 8:12
- **THEN** it finishes at 8:12

#### Scenario: Cap reached
- **WHEN** the same workout's session clock reaches 10:00 with reps still to do
- **THEN** it finishes at 10:00, and no rep recorded at 10:00 or later counts

#### Scenario: Duration line
- **WHEN** the owner views that workout's detail or its pre-start summary
- **THEN** its duration reads "10 min cap"

## MODIFIED Requirements

### Requirement: Description derived from content
A workout's one-line description SHALL be derived from its content: the rep scheme, round count or duration, then its exercise names in lowercase (joined by " + " when there are two, by ", " when there are more), or for a single-round workout its station count and reps per station. A For Time whose rounds all have the same reps SHALL use "<rounds> rounds" as its scheme. A capped workout's description SHALL end with " · <minutes> min cap".

#### Scenario: Built-in descriptions
- **WHEN** the four built-in workouts are listed
- **THEN** the descriptions read "21-15-9 · thrusters + pull-ups", "12 min · pull-ups, push-ups, air squats", "10 min · burpees + kb swings" and "10 stations · 50 reps each"

#### Scenario: Same reps every round
- **WHEN** an own For Time has 5 rounds of BURPEES 10 and AIR SQUATS 15
- **THEN** its description reads "5 rounds · burpees + air squats"

#### Scenario: Capped description
- **WHEN** an own 21-15-9 For Time of THRUSTERS and PULL-UPS has a 10 min cap
- **THEN** its description reads "21-15-9 · thrusters + pull-ups · 10 min cap"
