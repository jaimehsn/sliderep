# Spec Delta

## ADDED Requirements

### Requirement: Warning when judged without a profile
When the owner has no profile and chooses "I'll be judged", the system SHALL warn "This session won't be saved", explaining that there is no profile, before asking who is judging. CONTINUE SHALL go on to identifying the judge, and GO BACK SHALL return to role selection. The warning SHALL NOT be shown when the owner has a profile.

#### Scenario: Judged without a profile
- **WHEN** the owner has no profile and taps "I'll be judged"
- **THEN** "This session won't be saved" is shown with CONTINUE and GO BACK, before "Who is judging you?"

#### Scenario: Continuing past the warning
- **WHEN** the owner taps CONTINUE on that warning
- **THEN** "Who is judging you?" is shown with SCAN QR and SKIP — ANONYMOUS

#### Scenario: Going back from the warning
- **WHEN** the owner taps GO BACK on that warning
- **THEN** role selection is shown

#### Scenario: Judged with a profile
- **WHEN** the owner has a profile and taps "I'll be judged"
- **THEN** "Who is judging you?" is shown directly, with no warning
