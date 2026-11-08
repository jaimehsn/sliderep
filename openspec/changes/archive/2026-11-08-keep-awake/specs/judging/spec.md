# Spec Delta

## ADDED Requirements

### Requirement: Screen stays on during the run
From the moment the pre-start summary appears until the run is left, the system SHALL keep the screen from turning off by the system's screen timeout, with or without touches. Once the run is left, the screen SHALL follow the system timeout again. The user SHALL still be able to turn the screen off with the power button.

#### Scenario: Long stretch without touches while judging
- **WHEN** the judge touches nothing during a 600-second rest, on a phone with a 30-second screen timeout
- **THEN** the screen stays on for the whole rest

#### Scenario: Waiting on the pre-start summary
- **WHEN** the pre-start summary stays open without touches for longer than the screen timeout
- **THEN** the screen stays on

#### Scenario: Result screen after finishing
- **WHEN** judging finishes and the result screen is left open without touches for longer than the screen timeout
- **THEN** the screen turns off by the system timeout

#### Scenario: Leaving before starting
- **WHEN** the owner taps ✕ on the pre-start summary and the next screen is left open without touches for longer than the screen timeout
- **THEN** the screen turns off by the system timeout

#### Scenario: Aborting
- **WHEN** the judge confirms "Abort session?" and the next screen is left open without touches for longer than the screen timeout
- **THEN** the screen turns off by the system timeout
