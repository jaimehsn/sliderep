# Design

## Context

- `app/session/setup.tsx` runs a local `phase: 'role' | 'scan' | 'banner'` state machine. Today `banner` is only reached from `handleScanDone` (judge + skip), and its CONTINUE calls `navigateToRun(null)` while GO BACK returns to `scan`.
- It reads `useProfile()` but only uses `profile`, ignoring `loaded`. Until the profile query resolves, `profile` is `null` even when a profile exists.

## Goals / Non-Goals

**Goals:**
- Warn at role choice when the owner is judged without a profile, reusing the existing banner UI.

**Non-Goals:**
- Offering profile creation from the warning (option C in decision 2.7, not chosen).
- Changing what is saved, or the judge + skip warning.

## Decisions

**1. Two banner variants instead of one `banner` phase.**
Split the phase into `'skipBanner'` (today's judge + skip) and `'noProfileBanner'` (new). Each variant has its own:
- subtext: today's "Judging anonymously — nothing is kept after you finish." vs "You have no profile — nothing is kept after you finish.";
- CONTINUE target: `navigateToRun(null)` vs `setPhase('scan')`;
- GO BACK target: `scan` vs `role`.

The title "THIS SESSION WON'T BE SAVED" and the buttons stay shared.

*Alternative:* a separate `pendingContinue` callback held in state. That is rejected because explicit phases are easier to read in this file's existing style.

**2. The "I'll be judged" tap decides by `profile == null`, gated on `loaded`.**
The role buttons are rendered only once `loaded` is true, the same pattern `session/result.tsx` and `history/index.tsx` use when they wait on `profileLoaded`. This prevents a fast tap from showing the warning to an owner who does have a profile. The wait is a few milliseconds of local SQLite, and the screen already shows a blank view while fonts load.

## Risks / Trade-offs

- [Renaming the `banner` phase touches the judge + skip path] → Re-check that path on device as part of the tasks.
