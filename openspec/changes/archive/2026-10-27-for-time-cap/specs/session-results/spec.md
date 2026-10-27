## MODIFIED Requirements

### Requirement: For Time and Chipper score
For Time and Chipper SHALL be scored as TIME: the session-clock time of the last valid rep, shown as mm:ss. A capped workout that was not finished before its cap SHALL be scored as "CAP · <N> reps", N being every valid rep counted before the cap, including the unfinished position's.

#### Scenario: FRAN time
- **WHEN** FRAN's last valid rep happened at 4:32 on the session clock
- **THEN** the score reads TIME 04:32

#### Scenario: Finished under the cap
- **WHEN** a capped For Time is finished at 8:12, before its 10 min cap
- **THEN** the score reads TIME 08:12

#### Scenario: Time capped
- **WHEN** a 21-15-9 For Time with a 10 min cap reaches 10:00 after both round-1 lines (42 reps) and 9 THRUSTERS of round 2
- **THEN** the score reads CAP · 51 reps, and the last split is "Round 2 — THRUSTERS" at 9/15, partial
