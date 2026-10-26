## MODIFIED Requirements

### Requirement: Workout selection
Starting a new session SHALL show the built-in workouts followed by the owner's non-archived workouts, each with its mode, name and one-line description, own ones marked as own. Choosing one SHALL continue to role selection. A ✕ action SHALL return to the hub. Workout selection SHALL NOT offer creating a workout; workouts are created from the Library.

#### Scenario: Picking a workout
- **WHEN** the owner taps CINDY on the workout list
- **THEN** role selection for CINDY is shown

#### Scenario: Picking an own workout
- **WHEN** the owner taps an own workout on the workout list
- **THEN** role selection for that workout is shown, and judging runs its content

#### Scenario: New workout is unavailable
- **WHEN** the owner views workout selection
- **THEN** no "+ NEW WORKOUT" entry is shown
