# Spec Delta

## REMOVED Requirements

### Requirement: Failed saves are silent
**Reason**: A failed save is no longer silent. The result's banner now reports it as "Couldn't save this session".
**Migration**: See `session-results` → "Saved-state banner" (scenario "Save failed"). The session is still not stored when the save fails, and the result is still shown.
