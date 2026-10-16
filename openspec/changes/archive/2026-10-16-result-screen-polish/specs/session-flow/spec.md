# Spec Delta

## MODIFIED Requirements

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
