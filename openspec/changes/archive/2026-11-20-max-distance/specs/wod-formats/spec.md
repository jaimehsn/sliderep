## ADDED Requirements

### Requirement: Segments of a MAX line
A MAX line's rep description SHALL be its segment: each valid rep counted on it SHALL stand for one segment completed, worth the description's amount in its unit (m, cal or s). A MAX line without a rep description SHALL count reps. Counting SHALL be unchanged: one valid rep per segment, an unfinished segment never recorded.

#### Scenario: Handstand walk in 5 m segments
- **WHEN** a minute's HANDSTAND WALK MAX line, each rep 5 m, counts 12 valid reps
- **THEN** that minute's HANDSTAND WALK is 60 m

#### Scenario: MAX line without a segment
- **WHEN** a POWER SNATCHES MAX line with no rep description counts 12 valid reps
- **THEN** its total is 12 reps
