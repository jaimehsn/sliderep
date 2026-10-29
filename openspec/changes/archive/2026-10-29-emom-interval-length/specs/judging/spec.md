## MODIFIED Requirements

### Requirement: Timer per format
The header SHALL show elapsed time for For Time and Chipper, time remaining for AMRAP, and time left in the current interval for EMOM, labelled "min left" with 60-second intervals and "interval left" otherwise. A capped For Time or Chipper SHALL keep showing elapsed time, labelled with its cap.

#### Scenario: AMRAP countdown
- **WHEN** CINDY has been running for 2 minutes
- **THEN** the timer shows 10:00 labelled "remaining"

#### Scenario: EMOM minute timer
- **WHEN** EVERY MINUTE has been running for 75 seconds
- **THEN** the timer shows 00:45 labelled "min left"

#### Scenario: Capped For Time timer
- **WHEN** a For Time with a 12 min cap has been running for 7:42
- **THEN** the timer shows 07:42 labelled "elapsed · cap 12:00"

#### Scenario: Interval timer
- **WHEN** an EMOM with 90-second intervals has been running for 100 seconds
- **THEN** the timer shows 01:20 labelled "interval left"
