## MODIFIED Requirements

### Requirement: Workout detail
Tapping a workout SHALL show its mode, name, duration (when it has one) and its exercises with their reps, rep description and load, the same breakdown as the pre-start summary, grouped by block for a workout of several blocks. It SHALL offer DUPLICATE, and ARCHIVE only for an own workout. Opening an unknown workout SHALL return to the Library list.

#### Scenario: CINDY detail
- **WHEN** the owner taps CINDY
- **THEN** the detail shows 12-MIN AMRAP, CINDY, "12 min", and PULL-UPS 5 reps, PUSH-UPS 10 reps, AIR SQUATS 15 reps, with DUPLICATE and without ARCHIVE

#### Scenario: Detail of several blocks
- **WHEN** the owner taps an own workout of two 8-min AMRAPs with 120 s of rest between them
- **THEN** the detail lists BLOCK 1 and BLOCK 2, each "8-MIN AMRAP" and "8 min" with its exercises, with "REST 120 s" between them, and marks the scoring block
