## MODIFIED Requirements

### Requirement: Accepted no-reps on a MAX line
An accepted no-rep recorded on a MAX line SHALL count as a valid rep of that line, adding 1 to the block's MAX total, or one segment's amount to its unit's total when the line has a segment, with no time given back. An accepted no-rep on an exercise before a MAX line SHALL count toward that exercise as in any EMOM. It SHALL NOT move any rep onto the MAX line, and SHALL NOT change the MAX total.

#### Scenario: No-rep on the MAX line
- **WHEN** a POWER SNATCHES MAX interval was judged at 10 valid reps and 1 no-rep, and that no-rep is accepted
- **THEN** that split shows 11 reps and the score goes up by 1

#### Scenario: No-rep on the buy-in
- **WHEN** an interval's BURPEES 8 was judged at 7 valid reps and 1 no-rep, with no POWER SNATCHES rep after them, and that no-rep is accepted
- **THEN** the interval is completed and the MAX total is unchanged

#### Scenario: One more segment
- **WHEN** a HANDSTAND WALK MAX minute, each rep 5 m, was judged at 12 valid reps and 1 no-rep, and that no-rep is accepted
- **THEN** that split shows 65 m and the metres in the score go up by 5
