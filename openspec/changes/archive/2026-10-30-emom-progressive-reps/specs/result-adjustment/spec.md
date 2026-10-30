## ADDED Requirements

### Requirement: Adjusting a stopping EMOM
For an EMOM that stops at its first missed interval, the adjusted result SHALL stop at the first interval not completed under the adjusted targets and duration. Valid reps after that interval SHALL NOT count, and the score SHALL keep the "<completed intervals> + <reps in the missed interval>" form. Each interval SHALL keep the target it asked for unless a target change replaces it.

#### Scenario: Raising an earlier target
- **WHEN** a stopping Death by that scored 12 + 9 has minute 5's target raised from 5 to 6, with 5 valid reps recorded in it
- **THEN** the adjusted score reads 4 + 5, and minutes 6–13 are no longer listed

#### Scenario: Lowering the missed interval's target
- **WHEN** a stopping Death by that scored 12 + 9 has minute 13's target lowered to 9
- **THEN** minute 13 is completed, and the adjusted score reads 13 + 0 with minute 14 listed at 0 reps
