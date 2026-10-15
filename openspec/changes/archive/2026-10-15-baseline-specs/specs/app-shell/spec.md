# Spec Delta

## Purpose

Provides the app's home hub and its entry points, the one-time welcome prompt that offers creating a profile, and the Settings screen.

## ADDED Requirements

### Requirement: Hub
The hub SHALL show the app name, a profile shortcut, a NEW SESSION action leading to workout selection, and HISTORY, LIBRARY and SETTINGS entries leading to their screens. Each screen opened directly from the hub SHALL offer a ✕ back to it.

#### Scenario: Start a session
- **WHEN** the owner taps NEW SESSION
- **THEN** workout selection is shown

#### Scenario: Open Library
- **WHEN** the owner taps LIBRARY
- **THEN** the Library is shown

### Requirement: Adaptive profile shortcut
The hub's profile shortcut SHALL read "MY QR" and open the owner's QR when a profile exists, and read "PROFILE" and open profile creation when none exists.

#### Scenario: With a profile
- **WHEN** a profile exists
- **THEN** the shortcut reads MY QR and opens the QR

#### Scenario: Without a profile
- **WHEN** no profile exists
- **THEN** the shortcut reads PROFILE and opens profile creation

### Requirement: First-run prompt
On launch, if the first-run prompt has never been answered and no profile exists, the system SHALL show "Welcome to SlideRep" offering CREATE PROFILE or CONTINUE ANONYMOUS. Either answer SHALL be remembered so the prompt is not shown again. If a profile already exists, the prompt SHALL be marked answered without being shown.

#### Scenario: Create profile from the prompt
- **WHEN** the owner taps CREATE PROFILE
- **THEN** profile creation is shown, and closing it returns to the hub

#### Scenario: Continue anonymous
- **WHEN** the owner taps CONTINUE ANONYMOUS
- **THEN** the hub is shown and the prompt does not appear on later launches

#### Scenario: Prompt left unanswered
- **WHEN** the owner leaves the prompt with the hardware back button
- **THEN** the prompt is shown again on the next launch

#### Scenario: Profile already exists
- **WHEN** the app launches with a profile but the prompt never answered
- **THEN** the hub is shown directly and the prompt is marked answered

### Requirement: Settings
Settings SHALL show a PROFILE entry with the current alias (or "no profile yet") that opens the profile screen, and a VERSION entry showing the app version (e.g. "v1.0.0").

#### Scenario: Settings with a profile
- **WHEN** the owner, with alias "Ana", opens Settings
- **THEN** PROFILE shows "· Ana" and VERSION shows the app version
