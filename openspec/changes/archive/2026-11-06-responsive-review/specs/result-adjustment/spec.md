# Spec Delta

## ADDED Requirements

### Requirement: Adjusted target limit
A new target entered on the adjust screen SHALL be at most 999, and its field SHALL NOT accept more than three digits. A saved adjustment with a higher target SHALL keep applying. The duration field SHALL have no such limit.

#### Scenario: Target at the limit
- **WHEN** the owner taps a split and enters 999
- **THEN** a pending target change of 999 is added

#### Scenario: Typing a fourth digit
- **WHEN** the owner types a fourth digit in a target field
- **THEN** the field keeps the first three
