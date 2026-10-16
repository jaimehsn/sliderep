# session-flow Specification

## Purpose

Guides the owner from picking a workout to seeing its result: choosing whether they judge or are judged, identifying the other person by QR or staying anonymous, and handing the outcome of judging to the result.

## Requirements

### Requirement: Workout selection
Starting a new session SHALL show the built-in workouts, each with its mode, name and one-line description. Choosing one SHALL continue to role selection. A ✕ action SHALL return to the hub. A "+ NEW WORKOUT" entry SHALL be shown disabled as "coming soon".

#### Scenario: Picking a workout
- **WHEN** the owner taps CINDY on the workout list
- **THEN** role selection for CINDY is shown

#### Scenario: New workout is unavailable
- **WHEN** the owner taps "+ NEW WORKOUT"
- **THEN** nothing happens

### Requirement: Role selection
For every session, the owner SHALL choose a role: "I'll judge" (the owner judges the other person) or "I'll be judged" (the other person judges the owner). There SHALL be no default role.

#### Scenario: Choosing to judge
- **WHEN** the owner taps "I'll judge"
- **THEN** the screen asks "Who are you judging?" with SCAN QR and SKIP — ANONYMOUS options

#### Scenario: Choosing to be judged
- **WHEN** the owner taps "I'll be judged"
- **THEN** the screen asks "Who is judging you?" with SCAN QR and SKIP — ANONYMOUS options

#### Scenario: Changing the role
- **WHEN** the owner taps "‹ ROLE" after choosing a role
- **THEN** role selection is shown again

### Requirement: Identifying the other person by QR
SCAN QR SHALL ask for camera permission if needed and then scan for a SlideRep athlete QR. A valid QR SHALL identify the other person (id and alias) and start the session. QR codes that are not SlideRep athlete codes SHALL be ignored while scanning continues. CANCEL SHALL stop scanning.

#### Scenario: Valid QR scanned
- **WHEN** the camera reads another athlete's SlideRep QR
- **THEN** that athlete's alias is used for the session and the pre-start summary is shown

#### Scenario: Unrelated QR
- **WHEN** the camera reads a QR that is not a SlideRep athlete code
- **THEN** nothing happens and scanning continues

#### Scenario: Camera permission denied permanently
- **WHEN** camera access has been denied and can no longer be requested
- **THEN** a hint says the session can still continue anonymously

### Requirement: No self-judging
When the owner has a profile, scanning the owner's own QR SHALL be rejected with the message "That's your own QR — scan the other person's instead", and scanning SHALL continue.

#### Scenario: Own QR scanned
- **WHEN** the owner scans the QR shown on their own My QR screen
- **THEN** the rejection message is shown and no session starts

### Requirement: Anonymous other person
SKIP — ANONYMOUS SHALL start the session without identifying the other person. When the owner is the judge and skips, the system SHALL first warn "This session won't be saved" with CONTINUE and GO BACK options.

#### Scenario: Judge skips
- **WHEN** the owner chose "I'll judge" and taps SKIP — ANONYMOUS
- **THEN** the "won't be saved" warning is shown before the session can start

#### Scenario: Judged athlete skips
- **WHEN** the owner chose "I'll be judged" and taps SKIP — ANONYMOUS
- **THEN** the session starts directly with an anonymous judge

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

### Requirement: Who-is-judging label
The pre-start summary and the result SHALL label the session "Judging <alias>" when the owner judges and "Judged by <alias>" when the owner is judged, using "anonymous" when the other person was not identified.

#### Scenario: Anonymous judge label
- **WHEN** the owner is judged by an unidentified person
- **THEN** the label reads "Judged by anonymous"

### Requirement: Session flow navigation
Within the session flow, the OS swipe-back gesture SHALL be disabled. Each step SHALL replace the previous one once passed, so going back from the run or result returns to workout selection. The result shown after judging SHALL offer a ✕ that returns to the hub. Reaching the run or result without a configured session SHALL redirect to workout selection.

#### Scenario: Back from the result
- **WHEN** the owner presses hardware back on the result
- **THEN** workout selection is shown

#### Scenario: Closing the result
- **WHEN** the owner taps ✕ on the result shown after judging
- **THEN** the hub is shown and the session flow is left

#### Scenario: Leaving the flow clears it
- **WHEN** the owner leaves the session flow back to the hub
- **THEN** the role, the other person and the judged events of that session are discarded from memory

### Requirement: Finishing hands off to the result
When judging finishes, the system SHALL show the result for that session's events, role and other person.

#### Scenario: Judging finishes
- **WHEN** the last rep of FRAN is counted
- **THEN** the result screen for that FRAN session is shown
