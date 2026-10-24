# Spec Delta

## ADDED Requirements

### Requirement: Live progress follows the session clock
While judging, the current interval, the automatic finish, the timer and the live count SHALL be derived from the same session clock that stamps each recorded event, so that the live screen and the result always place an event in the same interval.

#### Scenario: Rep just after an EMOM minute boundary
- **WHEN** a valid rep is recorded 60.2 seconds into EVERY MINUTE
- **THEN** it is counted live in minute 2, and the result also counts it in minute 2

#### Scenario: AMRAP ends exactly at its duration
- **WHEN** CINDY's session clock reaches 12:00
- **THEN** judging finishes at that moment, and no gesture after it is recorded

#### Scenario: Live state matches the result
- **WHEN** a session finishes
- **THEN** the interval, round and count shown on its last live screen are the ones its result derives from the recorded events
