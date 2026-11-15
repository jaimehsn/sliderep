# Spec Delta

## ADDED Requirements

### Requirement: Several parts under one clock
A For Time or AMRAP block MAY hold several parts in order, timed by one clock started with the block. Each part SHALL be a number of rounds (1 or more), done like a For Time, except that the last part MAY be an AMRAP part, repeated until the block's time ends. The next part SHALL start on the previous part's last valid rep, with no rest between parts. A block's cap or AMRAP duration SHALL count from the block's start. EMOM blocks SHALL hold no parts.

#### Scenario: Buy-in, rounds and cash-out under a cap
- **WHEN** a block capped at 12 minutes holds 15 RING MUSCLE-UPS, then 5 rounds of 1 LEGLESS ROPE CLIMBS and 3 FRONT SQUATS, then 15 RING MUSCLE-UPS, and the 15th ring muscle-up of the first part is counted at 1:40
- **THEN** the first round's LEGLESS ROPE CLIMBS is current from 1:40 and the 12-minute cap still ends the block at 12:00

#### Scenario: AMRAP in the time left
- **WHEN** a 12-minute block holds a 1-round part of 50 ROW, then an AMRAP part of 5 PULL-UPS, 10 PUSH-UPS and 15 AIR SQUATS, and the row's 50th rep is counted at 4:10
- **THEN** the AMRAP part starts at 4:10 and the block ends at 12:00

#### Scenario: An AMRAP part needs a limit and comes last
- **WHEN** a block has an AMRAP part that is not its last part, or a block with an AMRAP part has no time limit
- **THEN** it is not a valid workout and cannot be saved

### Requirement: Completion of a block of several parts
A block whose parts are all rounds SHALL be complete on the last valid rep of its last part, or SHALL finish at its cap when it has one and the cap comes first, with the cap rules of a For Time. A block ending in an AMRAP part SHALL never complete on reps and SHALL finish when its duration elapses, whichever part is in progress.

#### Scenario: Finishing the cash-out
- **WHEN** the last ring muscle-up of the cash-out is counted at 10:52 in a block capped at 12 minutes
- **THEN** the block is complete at 10:52

#### Scenario: The buy-in is not finished
- **WHEN** a 12-minute block of a 50 ROW part then an AMRAP part reaches 12:00 with 38 row reps counted
- **THEN** the block finishes at 12:00 without reaching the AMRAP part

### Requirement: Progress within a part
In a block of several parts, the progress shown SHALL be the current part's: round N of that part's rounds for a part of more than one round, station N of its lines for a 1-round part, and completed rounds of the AMRAP part, counted from the part's start, for an AMRAP part.

#### Scenario: Rounds part after a buy-in
- **WHEN** the buy-in is done and the second of 5 rounds is in progress
- **THEN** progress reads round 2 of 5

#### Scenario: AMRAP rounds count from the part
- **WHEN** an AMRAP part has had 3 rounds completed after its buy-in
- **THEN** progress reads 3 rounds

### Requirement: Mode of a block of several parts
A block of several parts SHALL have the mode "FOR TIME" when all its parts are rounds, and "<minutes>-MIN AMRAP" when it ends in an AMRAP part. A block of a single part SHALL keep the mode, description and breakdown of the matching For Time or AMRAP.

#### Scenario: Modes
- **WHEN** example 1 and a 12-minute block of 50 ROW then an AMRAP part are listed
- **THEN** their modes are "FOR TIME" and "12-MIN AMRAP"

#### Scenario: One part looks as before
- **WHEN** a block holds a single part
- **THEN** its mode, description and breakdown are those of the matching For Time or AMRAP, as before this change

### Requirement: Description of a block of several parts
A block of several parts SHALL be described by its parts joined with " → ", followed by " · <minutes> min cap" for a capped block without an AMRAP part. A 1-round part SHALL read as its lines' amounts and lowercase names joined by ", " ("15 ring muscle-ups", "500 m row"); a part of several rounds as a For Time's scheme and names, plus " · <seconds> s rest" when it rests; an AMRAP part as "amrap · <names>".

#### Scenario: Example 1's description
- **WHEN** the 12-minute capped block of 15 RING MUSCLE-UPS, 5 rounds of 1 LEGLESS ROPE CLIMBS + 3 FRONT SQUATS, and 15 RING MUSCLE-UPS is shown
- **THEN** its description is "15 ring muscle-ups → 5 rounds · legless rope climbs + front squats → 15 ring muscle-ups · 12 min cap"

#### Scenario: Buy-in and AMRAP
- **WHEN** a 12-minute block of 50 ROW then an AMRAP part of PULL-UPS, PUSH-UPS and AIR SQUATS is shown
- **THEN** its description is "50 row → amrap · pull-ups, push-ups, air squats"

### Requirement: Stored workouts keep their reading
Workouts saved in the layout used before blocks could hold several parts, the built-ins included, SHALL still be read and SHALL be judged, scored and shown exactly as before. Workouts created from now on MAY use the new layout, and both layouts SHALL be offered, listed and judged alike.

#### Scenario: A built-in after the change
- **WHEN** FRAN is selected, judged and scored
- **THEN** its mode, description, breakdown, live progress, score and splits are the same as before

#### Scenario: A workout created before the change
- **WHEN** an EMOM created by the owner before this change is opened in the Library
- **THEN** it opens and shows the same as before
