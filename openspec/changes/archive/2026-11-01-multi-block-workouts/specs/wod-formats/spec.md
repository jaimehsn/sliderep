## ADDED Requirements

### Requirement: Workouts of several blocks
A workout MAY be a sequence of blocks, each a For Time, AMRAP or EMOM with its own content and options. A block SHALL start when the previous one is complete, after that block's optional rest, and its timer SHALL start then. A block's cap or stop SHALL complete that block only. The workout SHALL be complete when its last block is. Exactly one block SHALL score. A one-block workout SHALL behave as before.

#### Scenario: Buy-in, AMRAP, cash-out
- **WHEN** a workout of a For Time of BURPEES 20, a 12-min AMRAP and a For Time of BURPEES 20 finishes its first BURPEES at 2:10
- **THEN** the AMRAP's countdown starts at 2:10 and ends at 14:10, and the last BURPEES start at 14:10

#### Scenario: Rest between blocks
- **WHEN** an 8-min AMRAP with 120 s of rest after it is followed by another 8-min AMRAP
- **THEN** the second AMRAP starts at 10:00

#### Scenario: Cap ends only its block
- **WHEN** the first block, a For Time with a 5 min cap, reaches its cap unfinished
- **THEN** that block is complete at 5:00 and the next block starts

### Requirement: Mode and description of several blocks
A workout of several blocks SHALL have the scoring block's mode label followed by " · <N> BLOCKS", and a description joining each block's description with " → ".

#### Scenario: Buy-in, AMRAP, cash-out labels
- **WHEN** an own workout of a 1-round For Time of BURPEES 20, a scoring 12-min AMRAP of PULL-UPS 5 and AIR SQUATS 15, and the same BURPEES is listed
- **THEN** its mode reads "12-MIN AMRAP · 3 BLOCKS" and its description reads "1 stations · 20 reps each → 12 min · pull-ups + air squats → 1 stations · 20 reps each"
