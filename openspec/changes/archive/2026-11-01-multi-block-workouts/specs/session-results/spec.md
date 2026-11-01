## ADDED Requirements

### Requirement: Results of several blocks
A workout of several blocks SHALL be scored by its scoring block alone, with that block's own rules and its block-local times. The splits SHALL be grouped by block in order, each group headed by "BLOCK <n> · <mode> · <its result>", with that block's times counted from its own start.

#### Scenario: Scoring AMRAP between two blocks of BURPEES
- **WHEN** the buy-in ends at 2:10, the scoring 12-min AMRAP ends with 7 rounds and 12 reps, and the cash-out takes 1:50
- **THEN** the score reads 7 + 12, and the groups are headed "BLOCK 1 · FOR TIME · 02:10", "BLOCK 2 · 12-MIN AMRAP · 7 + 12" and "BLOCK 3 · FOR TIME · 01:50"

#### Scenario: Scoring For Time is timed from its own start
- **WHEN** a 12-min AMRAP is followed by a scoring For Time that finishes 4:05 after its start
- **THEN** the score reads TIME 04:05
