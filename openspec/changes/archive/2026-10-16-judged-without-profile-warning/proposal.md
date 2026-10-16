# Proposal

## Why

When the owner has no profile and chooses "I'll be judged", the session is never saved (there is no registered judged athlete), but nothing says so until the result shows "Not saved". It is the case where the owner most likely wants the session kept. The only existing "won't be saved" warning covers judge + skip (decision 2.7 in the archived `baseline-specs` proposal).

## What Changes

- When the owner has no profile and taps "I'll be judged", setup shows the same "This session won't be saved" warning before going on, with CONTINUE and GO BACK.
  - CONTINUE goes on to "Who is judging you?" (scan or skip) as today.
  - GO BACK returns to role selection.
- The warning explains why: there is no profile, so nothing is kept. The subtext differs from the judge + skip one, which says the athlete is anonymous.
- No change when the owner has a profile, or when the owner judges. The judge + skip warning stays as is.
- No change to what gets saved. This only warns about the existing rule.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `session-flow`: adds a requirement for the "won't be saved" warning when the owner is judged without a profile. The existing "Anonymous other person" requirement is unchanged: once past this warning, skipping still starts directly.

## Impact

- **Code**: `app/session/setup.tsx` only, which gets a second entry point into its existing `banner` phase.
- **No changes** to the database, saving rules, the result screen or any dependency.
- **Specs**: an ADDED delta for `session-flow`.
