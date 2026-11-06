# Spec Delta

## ADDED Requirements

### Requirement: Alias limit
An alias entered on the profile screen SHALL have at most 24 characters: the field SHALL NOT accept more, and CREATE and SAVE SHALL be disabled for a longer one after trimming. An existing longer alias, and any alias read from another person's QR, SHALL be kept and shown as it is.

#### Scenario: Typing past the limit
- **WHEN** the owner types a 25th character in the alias field
- **THEN** the field keeps the first 24

#### Scenario: Existing longer alias
- **WHEN** the owner's alias already has 30 characters and they open the profile screen without changing it
- **THEN** the stored alias stays unchanged, and it still shows in full on the QR screen

#### Scenario: Scanned longer alias
- **WHEN** a scanned QR holds a 30-character alias
- **THEN** the session uses that alias unchanged
