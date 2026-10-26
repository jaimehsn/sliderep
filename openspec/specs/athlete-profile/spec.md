# athlete-profile Specification

## Purpose

Gives the device owner an optional local athlete identity (an alias with a stable id) that lets their sessions be saved and lets other people identify them by scanning a QR code.

## Requirements

### Requirement: At most one local profile
The device SHALL hold zero or one athlete profile, consisting of a stable generated id and an alias. Everything else in the app SHALL work without a profile.

#### Scenario: No profile
- **WHEN** the owner has never created a profile
- **THEN** sessions can still be judged, but own sessions are not saved

### Requirement: Creating a profile
Without a profile, the profile screen SHALL offer CREATE PROFILE with an alias field. CREATE SHALL be disabled while the alias is empty after trimming, and SHALL create the profile with the trimmed alias.

#### Scenario: Create
- **WHEN** the owner enters "  Ana  " and taps CREATE
- **THEN** a profile with alias "Ana" is created and the screen switches to editing it

#### Scenario: Empty alias
- **WHEN** the alias field is empty or only spaces
- **THEN** CREATE is disabled

### Requirement: Editing the alias
With a profile, the profile screen SHALL show the alias for editing. SAVE SHALL be enabled only when the trimmed alias is non-empty and different from the current one. Changing the alias SHALL NOT change the profile id.

#### Scenario: Rename
- **WHEN** the owner changes the alias to "Ana G." and taps SAVE
- **THEN** the alias is "Ana G." and the id is unchanged

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

### Requirement: My QR
With a profile, the owner SHALL be able to show a QR code encoding their athlete id and alias (versioned payload), together with the alias and id in text. The QR screen SHALL be high-contrast dark-on-light regardless of the app theme. Without a profile, opening My QR SHALL redirect to profile creation.

#### Scenario: Show QR
- **WHEN** the owner opens My QR
- **THEN** a black-on-white QR of their id and alias is shown with the alias below it

#### Scenario: My QR without a profile
- **WHEN** My QR is opened and no profile exists
- **THEN** the profile creation screen is shown instead
