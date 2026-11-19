## MODIFIED Requirements

### Requirement: Block templates
A template SHALL only fill a block's time settings and parts: FOR TIME, one rounds part; AMRAP, one AMRAP part; EMOM, an EMOM; FOR TIME + BUY-IN/CASH-OUT, 1-round, rounds and 1-round parts; BUY-IN + AMRAP, a 1-round then an AMRAP part; EVERY + BUY-IN + MAX, every 180 s × 5 with 120 s of work and one interval of two lines and a MAX line. A new block SHALL start as FOR TIME. A picked template SHALL keep the block's lines in its main part, a MAX line becoming ordinary when it has none.

#### Scenario: Buy-in and cash-out template
- **WHEN** the owner picks FOR TIME + BUY-IN/CASH-OUT on an empty block
- **THEN** the block shows three parts: a 1-round part, a rounds part and a 1-round part, each without lines

#### Scenario: Switching template keeps the lines
- **WHEN** a FOR TIME block has THRUSTERS and PULL-UPS and the owner picks BUY-IN + AMRAP
- **THEN** the AMRAP part holds THRUSTERS and PULL-UPS and the 1-round part before it is empty

#### Scenario: EVERY + BUY-IN + MAX template
- **WHEN** the owner picks EVERY + BUY-IN + MAX on an empty block
- **THEN** the block shows EVERY 180, INTERVALS 5 and WORK 120, and one interval of two empty lines followed by an empty MAX line

#### Scenario: Leaving a MAX template
- **WHEN** a block of ROW, BURPEES and POWER SNATCHES MAX is switched to FOR TIME
- **THEN** its rounds part holds ROW, BURPEES and POWER SNATCHES as ordinary lines with empty reps

## ADDED Requirements

### Requirement: MAX lines in the editor
The last line of each EMOM interval SHALL have a MAX checkbox, off by default. A MAX line SHALL hide its reps and `+/ROUND` fields and keep its exercise, rep description and load. Adding an exercise to an interval that ends in a MAX line SHALL place it before the MAX line. Removing an interval's other lines SHALL leave its MAX line as its only exercise. Saving SHALL accept an interval of only a MAX line. DUPLICATE SHALL keep every MAX line.

#### Scenario: Marking MAX
- **WHEN** the owner checks MAX on POWER SNATCHES, last in minute 1 after BURPEES 8, and saves
- **THEN** the saved workout's minute 1 is BURPEES 8 then POWER SNATCHES MAX

#### Scenario: Adding before the MAX line
- **WHEN** an interval is BURPEES 8 then POWER SNATCHES MAX and the owner adds an exercise to it
- **THEN** the new line sits between BURPEES and POWER SNATCHES

#### Scenario: Duplicating keeps MAX
- **WHEN** the owner duplicates a workout with a POWER SNATCHES MAX line
- **THEN** the copy opens with POWER SNATCHES marked MAX and no reps
