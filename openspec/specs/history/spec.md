# history Specification

## Purpose

Lets the owner look back at the sessions in which they were the judged athlete, see each one's result, and delete the ones they no longer want.

## Requirements

### Requirement: History lists own sessions only
History SHALL list the owner's own sessions (where the owner's profile was the judged athlete), newest first. Sessions in which the owner was the judge SHALL NOT appear. Without a profile or without own sessions, History SHALL show "No sessions yet".

#### Scenario: Mixed sessions
- **WHEN** the device holds 2 own sessions and 3 sessions the owner judged for others
- **THEN** History lists only the 2 own sessions, newest first

#### Scenario: No profile
- **WHEN** the owner has no profile
- **THEN** History shows "No sessions yet"

### Requirement: History row content
Each History row SHALL show the workout's mode and name, the session's local date and time (e.g. "Oct 15, 2026 · 09:41") and its score computed from the stored events without adjustments.

#### Scenario: FRAN row
- **WHEN** an own FRAN session finished with a time of 04:32 is listed
- **THEN** its row shows FOR TIME, FRAN, its date and time, and 04:32

### Requirement: Session detail
Opening a row SHALL show the same result view as after judging (score, splits, "Judged by <judge alias or anonymous>", "Saved in your history"), with any saved adjustment packages applied, and SHALL NOT offer ADJUST RESULT. If the session no longer exists, History SHALL be shown instead.

#### Scenario: Open a session
- **WHEN** the owner taps a FRAN row judged by "Leo"
- **THEN** the detail shows FRAN's score and splits and "Judged by Leo", with no ADJUST RESULT

#### Scenario: Missing session
- **WHEN** a session detail is opened for a session that was deleted
- **THEN** the History list is shown

### Requirement: Deleting from History
The detail SHALL offer DELETE SESSION, asking "Delete session?" — "This cannot be undone." Confirming SHALL delete the session with its adjustment packages and return to the list, which SHALL no longer include it.

#### Scenario: Delete confirmed
- **WHEN** the owner confirms deleting a session
- **THEN** the list is shown without that session

#### Scenario: Delete cancelled
- **WHEN** the owner cancels the confirmation
- **THEN** the session remains
