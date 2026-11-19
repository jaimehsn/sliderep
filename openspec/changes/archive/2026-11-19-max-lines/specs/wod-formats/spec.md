## ADDED Requirements

### Requirement: MAX lines in EMOM intervals
An EMOM interval's last exercise MAY be a MAX line, with no reps and no increment; it MAY keep a rep description and a load. It SHALL become current once the exercises before it reach their targets, or at the interval's start when it is the only exercise. Every valid rep recorded while it is current, until the interval's work time ends (the whole interval when it has none), SHALL count toward it, with no limit.

#### Scenario: Buy-in then MAX
- **WHEN** an interval of every 3:00 with 2:00 of work is ROW 1 rep (200 m), BURPEES 8 and POWER SNATCHES MAX, and the judge records 1 ROW rep, 8 BURPEES reps and 11 more valid reps before 2:00
- **THEN** POWER SNATCHES becomes current after the 8th BURPEES rep and counts 11 reps

#### Scenario: Reps after the work time
- **WHEN** a rep is recorded on that POWER SNATCHES line after 2:00 of its interval
- **THEN** it does not count

#### Scenario: Interval of only a MAX line
- **WHEN** an interval's only exercise is WALL BALL MAX
- **THEN** WALL BALL is current from the interval's start and counts every valid rep of its work time

#### Scenario: Next interval
- **WHEN** an interval with a MAX line ends and the next one starts
- **THEN** the next interval starts on its first exercise with the count at 0

### Requirement: Where a MAX line may be
A MAX line SHALL only be the last exercise of an EMOM interval. A FOR TIME or AMRAP block SHALL NOT hold a MAX line, and an interval SHALL NOT hold more than one.

#### Scenario: MAX in a FOR TIME block
- **WHEN** a FOR TIME block would hold a MAX line
- **THEN** it cannot be saved or loaded

### Requirement: Missed interval with a MAX line
An interval with a MAX line SHALL count as missed when its MAX line was never reached, that is, when an exercise before it fell short of its target. Reaching the MAX line SHALL complete the interval, whatever its MAX reps. An interval of only a MAX line SHALL never be missed. A stopping EMOM SHALL stop at its first missed interval as before.

#### Scenario: Buy-in not finished
- **WHEN** a stopping EMOM's interval 3 of ROW 1 rep and BURPEES 8 then POWER SNATCHES MAX ends after 6 BURPEES
- **THEN** interval 3 is missed and the workout is complete at the end of its work time

#### Scenario: MAX reached with no reps
- **WHEN** an interval's buy-in is completed and no POWER SNATCHES rep follows before the work time ends
- **THEN** the interval is not missed

### Requirement: Stored MAX lines
A MAX line SHALL be stored with its exercise and a MAX marker, without reps or increment, and only in the stored layout the editor writes. A stored workout with a MAX line anywhere but last in an EMOM interval, with reps or an increment on a MAX line, or with a MAX line in the legacy layout SHALL fail to load. Stored workouts without MAX lines, and their recorded results, SHALL read as before, under the same engine version.

#### Scenario: A MAX line in a FOR TIME block
- **WHEN** a stored workout has a MAX line in a FOR TIME block
- **THEN** that workout fails to load

#### Scenario: Recorded results unchanged
- **WHEN** a session judged on a built-in workout before this change is opened
- **THEN** its score and splits are the same as before
