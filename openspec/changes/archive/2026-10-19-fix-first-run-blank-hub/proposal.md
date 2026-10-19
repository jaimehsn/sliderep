# Proposal

## Why

On the very first launch, after CREATE PROFILE → creating the profile → ✕, the app lands on an empty screen instead of the hub. The hub loads the profile and the first-run flag only once, on mount, so when the owner comes back it still thinks the prompt is pending and no profile exists, and keeps rendering its blank "awaiting first-run" placeholder. The same happens after CONTINUE ANONYMOUS and after leaving the prompt with the hardware back button. This breaks the existing `app-shell` scenario "closing it returns to the hub" on the one path every new install goes through.

## What Changes

- The hub shows itself normally once the first-run prompt has been opened in this launch, whatever the owner answered (or if they left it with hardware back). It never sits on the blank placeholder after returning.
- The hub reloads the profile every time it comes back into view, so the adaptive shortcut reads MY QR right after a profile is created (from the first-run prompt or from the hub's own PROFILE shortcut), and PROFILE again after one is deleted.
- Settings reloads the profile the same way, so its PROFILE entry shows the current alias after editing, creating or deleting the profile.
- No change to when the prompt is shown or how the answer is remembered: hardware back still leaves it unanswered, so it shows again on the next launch.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `app-shell`: First-run prompt gains an explicit scenario that returning from it always shows the hub; Adaptive profile shortcut and Settings must reflect a profile change made on another screen as soon as the owner returns.

## Impact

- **Code**: `app/index.tsx` (hub) and `app/settings.tsx`. `hooks/use-profile.ts` already exposes `refresh`; no hook changes.
- **No changes** to the database, the first-run flag, `app/first-run.tsx`, `app/profile.tsx` or any dependency.
- **Specs**: a MODIFIED delta for `app-shell`.
