# Spec Delta

## MODIFIED Requirements

### Requirement: Format semantics are versioned
The judging and scoring rules SHALL carry one version for every kind of workout, and a saved session SHALL record the version it was judged with, so its result can always be derived with the same rules. Workouts that exist when the rules are reorganized or extended SHALL keep deriving the same score and splits from the same events.

#### Scenario: Saving records the version
- **WHEN** a session is saved
- **THEN** the stored session includes the rules version used during judging

#### Scenario: Earlier sessions keep their result
- **WHEN** a session saved before the workout model was reorganized is opened in History
- **THEN** it shows the same score and splits as before, including any accepted no-reps

#### Scenario: Earlier workouts look the same
- **WHEN** a workout stored before the workout model was reorganized is listed, opened in the Library or summarized before judging
- **THEN** its mode label, description, exercise rows and duration line are the same as before
