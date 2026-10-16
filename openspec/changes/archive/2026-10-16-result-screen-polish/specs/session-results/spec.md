# Spec Delta

## MODIFIED Requirements

### Requirement: Saved-state banner
The result SHALL show a banner matching the real save outcome: "Saved in your history" when the owner was the judged athlete and the session was saved, "Saved on this phone — will be delivered to <alias> once sync exists" when another registered athlete was judged and the session was saved, "Saving…" while a save is in progress, "Couldn't save this session" when the save failed, and "Not saved" when the judged athlete was anonymous.

#### Scenario: Judging an identified athlete
- **WHEN** the owner judged an athlete identified by QR
- **THEN** the banner reads "Saved on this phone — will be delivered to <their alias> once sync exists"

#### Scenario: Judging anonymously
- **WHEN** the owner judged without identifying the athlete
- **THEN** the banner reads "Not saved"

#### Scenario: Save in progress
- **WHEN** the result is shown and the session's save has not finished yet
- **THEN** the banner reads "Saving…"

#### Scenario: Save failed
- **WHEN** saving the finished session fails
- **THEN** the banner reads "Couldn't save this session", ADJUST RESULT is not shown, and no retry is offered

#### Scenario: Saved session opened from History
- **WHEN** the owner opens a saved session from History
- **THEN** the banner reads "Saved in your history"
