# Tasks

## 1. Hub

- [x] 1.1 In `app/index.tsx`, drop the `awaitingFirstRun` blank placeholder and guard `router.push('/first-run')` with a `promptedRef` so it fires at most once per launch (design.md decision 1); verify `pnpm lint` and `npx tsc --noEmit` pass
- [x] 1.2 In `app/index.tsx`, call `useProfile()`'s `refresh` from a `useFocusEffect` (same pattern as `app/history/index.tsx`, design.md decision 2); verify `pnpm lint` passes
- [x] 1.3 Verify on device from a fresh install (clear app data): CREATE PROFILE → create "Ana" → ✕ shows the hub with MY QR; relaunch does not show the prompt
- [x] 1.4 Verify on device from a fresh install each time: CREATE PROFILE → ✕ without creating shows the hub with PROFILE; CONTINUE ANONYMOUS shows the hub; hardware back on the prompt shows the hub, the prompt does not reappear in this launch, and it does reappear after a relaunch
- [x] 1.5 Verify on device with no profile, past first run: hub PROFILE → create → ✕ shows MY QR

## 2. Settings

- [x] 2.1 In `app/settings.tsx`, call `useProfile()`'s `refresh` from a `useFocusEffect`; verify `pnpm lint` and `npx tsc --noEmit` pass
- [x] 2.2 Verify on device: Settings → PROFILE → change the alias → SAVE → ✕ shows the new alias in Settings; delete the profile → ✕ shows "no profile yet", and back on the hub the shortcut reads PROFILE
- [x] 2.3 Update `CLAUDE.md`'s `app/index.tsx` and `app/settings.tsx` entries to mention the focus refresh and the `promptedRef` guard; verify both entries are accurate against the code

## 3. Validate

- [x] 3.1 Run `openspec validate fix-first-run-blank-hub --strict` and verify it reports the change as valid

## Workflow follow-up

- Archive with `/opsx:archive`, syncing the MODIFIED `app-shell` requirements.
