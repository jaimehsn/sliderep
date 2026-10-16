# session-storage Specification

## Purpose

Decides which judged sessions are kept on the device, what a saved session contains, how own and foreign sessions differ, and guarantees that nothing leaves the phone.

## Requirements

### Requirement: Save only when the judged athlete is registered
A finished session SHALL be saved automatically, exactly once, when the result is shown, if and only if the judged athlete is identified: the scanned athlete when the owner judges, or the owner's profile when the owner is judged. Otherwise nothing SHALL be saved. Aborted sessions SHALL never be saved.

#### Scenario: Owner judges a scanned athlete
- **WHEN** the owner judges an athlete identified by QR, with or without a profile of their own
- **THEN** the session is saved

#### Scenario: Owner judges anonymously
- **WHEN** the owner judges after SKIP — ANONYMOUS
- **THEN** the session is not saved

#### Scenario: Owner is judged with a profile
- **WHEN** the owner has a profile and is judged, by a scanned or an anonymous judge
- **THEN** the session is saved

#### Scenario: Owner is judged without a profile
- **WHEN** the owner has no profile and is judged
- **THEN** the session is not saved

### Requirement: Saved session contents
A saved session SHALL contain the workout, its format version, the judged athlete's id and alias, the judge's id and alias (or none for an anonymous judge), the start time, and the raw events (time and rep/no-rep). It SHALL be marked unverified. Derived results SHALL NOT be stored.

#### Scenario: Anonymous judge
- **WHEN** the owner is judged by an anonymous judge and the session is saved
- **THEN** the stored judge id and alias are empty

### Requirement: Own and foreign sessions
A saved session SHALL be "own" when the judged athlete is the owner's profile, and "foreign" when it is another athlete (the owner judged them). Foreign sessions SHALL be kept on the device for future delivery and SHALL NOT be listed or deletable individually.

#### Scenario: Foreign session is kept
- **WHEN** the owner judged another registered athlete
- **THEN** the session is stored on this phone and does not appear in the owner's History

### Requirement: Deleting own sessions
The owner SHALL be able to delete their own sessions. Deleting a session SHALL also delete all of its adjustment packages, in one step.

#### Scenario: Delete with adjustments
- **WHEN** an own session with 2 adjustment packages is deleted
- **THEN** neither the session nor its packages remain

### Requirement: Data stays on the device
All data SHALL be stored only on the device. The app SHALL opt out of OS backup, and SHALL NOT send any data to a server or other device.

#### Scenario: Changing phones
- **WHEN** the owner moves to a new phone
- **THEN** none of the sessions, adjustments or profile are carried over
