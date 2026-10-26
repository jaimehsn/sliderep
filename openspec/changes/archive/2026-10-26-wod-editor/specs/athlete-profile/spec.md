## MODIFIED Requirements

### Requirement: Deleting the profile
DELETE PROFILE SHALL ask for confirmation ("Delete profile?" — "Your own sessions and workouts will be deleted. Sessions you judged for others stay on this phone."). Confirming SHALL delete the profile, all own sessions and their adjustment packages, and the owner's workouts, and SHALL keep foreign sessions. An own workout still referenced by a kept foreign session SHALL NOT be deleted: it SHALL be kept archived and without an owner, so that session still shows it.

#### Scenario: Delete confirmed
- **WHEN** the owner confirms deleting a profile that has 3 own and 2 foreign sessions
- **THEN** the profile and the 3 own sessions with their packages are deleted, and the 2 foreign sessions remain

#### Scenario: Own workouts deleted
- **WHEN** the owner confirms deleting a profile that has 2 own workouts used by no kept session
- **THEN** both workouts are deleted and appear nowhere

#### Scenario: Own workout used by a foreign session
- **WHEN** the owner judged someone else on an own workout and then confirms deleting the profile
- **THEN** that foreign session remains and still shows the workout, which no longer appears in the Library or workout selection and has no owner

#### Scenario: Delete cancelled
- **WHEN** the owner cancels the confirmation
- **THEN** nothing is deleted
