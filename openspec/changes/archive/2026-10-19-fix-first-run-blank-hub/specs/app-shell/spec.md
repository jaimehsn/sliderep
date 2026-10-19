# Spec Delta

## MODIFIED Requirements

### Requirement: Adaptive profile shortcut
The hub's profile shortcut SHALL read "MY QR" and open the owner's QR when a profile exists, and read "PROFILE" and open profile creation when none exists. It SHALL reflect the current profile whenever the hub is shown, including right after a profile was created or deleted on another screen.

#### Scenario: With a profile
- **WHEN** a profile exists
- **THEN** the shortcut reads MY QR and opens the QR

#### Scenario: Without a profile
- **WHEN** no profile exists
- **THEN** the shortcut reads PROFILE and opens profile creation

#### Scenario: Profile created from the hub
- **WHEN** the owner taps PROFILE, creates a profile and closes the profile screen
- **THEN** the hub is shown and the shortcut reads MY QR

#### Scenario: Profile deleted elsewhere
- **WHEN** the owner deletes the profile from Settings → PROFILE and returns to the hub
- **THEN** the shortcut reads PROFILE

### Requirement: First-run prompt
On launch, if the first-run prompt has never been answered and no profile exists, the system SHALL show "Welcome to SlideRep" offering CREATE PROFILE or CONTINUE ANONYMOUS. Either answer SHALL be remembered so the prompt is not shown again. If a profile already exists, the prompt SHALL be marked answered without being shown. Leaving the prompt, by either answer or by hardware back, SHALL always lead to the usable hub, never to an empty screen.

#### Scenario: Create profile from the prompt
- **WHEN** the owner taps CREATE PROFILE
- **THEN** profile creation is shown, and closing it returns to the hub

#### Scenario: First launch, profile created
- **WHEN** on the first launch the owner taps CREATE PROFILE, creates a profile and taps ✕
- **THEN** the hub is shown with its shortcut reading MY QR, and the prompt does not appear on later launches

#### Scenario: First launch, profile screen closed without creating
- **WHEN** on the first launch the owner taps CREATE PROFILE and taps ✕ without creating a profile
- **THEN** the hub is shown with its shortcut reading PROFILE, and the prompt does not appear on later launches

#### Scenario: Continue anonymous
- **WHEN** the owner taps CONTINUE ANONYMOUS
- **THEN** the hub is shown and the prompt does not appear on later launches

#### Scenario: Prompt left unanswered
- **WHEN** the owner leaves the prompt with the hardware back button
- **THEN** the hub is shown, the prompt is not shown again during this launch, and it is shown again on the next launch

#### Scenario: Profile already exists
- **WHEN** the app launches with a profile but the prompt never answered
- **THEN** the hub is shown directly and the prompt is marked answered

### Requirement: Settings
Settings SHALL show a PROFILE entry with the current alias (or "no profile yet") that opens the profile screen, and a VERSION entry showing the app version (e.g. "v1.0.0"). The PROFILE entry SHALL reflect the current profile whenever Settings is shown, including right after returning from the profile screen.

#### Scenario: Settings with a profile
- **WHEN** the owner, with alias "Ana", opens Settings
- **THEN** PROFILE shows "· Ana" and VERSION shows the app version

#### Scenario: Alias edited from Settings
- **WHEN** the owner opens PROFILE from Settings, changes the alias from "Ana" to "Ana G", saves and closes the profile screen
- **THEN** Settings' PROFILE shows "· Ana G"
