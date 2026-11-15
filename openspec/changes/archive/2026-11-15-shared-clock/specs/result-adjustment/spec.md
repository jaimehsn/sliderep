# Spec Delta

## ADDED Requirements

### Requirement: Accepted no-reps on a block of several parts
On a block of several parts whose parts are all rounds, an accepted no-rep SHALL give back time as on a For Time, to every later event of the block, across parts. On a block ending in an AMRAP part, an accepted no-rep SHALL give back no time in any part, as on an AMRAP, and its end SHALL NOT move. The adjust screen SHALL list each part's no-reps under its "PART n" subheading.

#### Scenario: A buy-in no-rep on example 1
- **WHEN** a no-rep in example 1's buy-in is accepted and makes the buy-in complete 4 seconds earlier
- **THEN** every later split and the TIME move 4 seconds earlier

#### Scenario: A buy-in no-rep before an AMRAP part
- **WHEN** a no-rep in the row of a block of 50 ROW then an AMRAP part is accepted
- **THEN** the row's position gains a valid rep, no later time moves, and the block still ends at its duration
