## MODIFIED Requirements

### Requirement: Pre-start summary
Before judging starts, the system SHALL show the workout's mode, name, duration (when it has one), who is being judged or judging, and the list of exercises with their reps, rep description and load. A START action begins the countdown and a ✕ action leaves without judging.

#### Scenario: Summary for FRAN
- **WHEN** the owner reaches the start of a FRAN session
- **THEN** the summary shows THRUSTERS "21 · 15 · 9" and PULL-UPS "21 · 15 · 9" and a START button

#### Scenario: Summary with load
- **WHEN** the owner reaches the start of an own workout whose THRUSTERS line has load "95/65 lb"
- **THEN** the summary shows "95/65 lb" on the THRUSTERS line

#### Scenario: Leaving before starting
- **WHEN** the owner taps ✕ on the pre-start summary
- **THEN** the session is left without anything being recorded
