# Tasks

## 1. Warning in session setup

- [x] 1.1 In `app/session/setup.tsx`, split the `banner` phase into `skipBanner` and `noProfileBanner` per design.md decision 1 (own subtext, CONTINUE and GO BACK targets), and verify `pnpm lint` and `npx tsc --noEmit` pass
- [x] 1.2 Make "I'll be judged" go to `noProfileBanner` when `profile == null`, and render nothing until `useProfile()`'s `loaded` is true (design.md decision 2); verify `pnpm lint` passes
- [x] 1.3 Verify on device without a profile: "I'll be judged" shows "This session won't be saved" with "You have no profile…", CONTINUE leads to "Who is judging you?", and GO BACK returns to role selection
- [x] 1.4 Verify on device with a profile: "I'll be judged" goes straight to "Who is judging you?", and judge + skip still shows the original warning, whose CONTINUE starts the session and whose GO BACK returns to the scan step
- [x] 1.5 Update `CLAUDE.md`'s `session/setup.tsx` entry to mention the no-profile warning, and verify it no longer says the judge + skip warning is the only one

## 2. Validate

- [x] 2.1 Run `openspec validate judged-without-profile-warning --strict` and verify it reports the change as valid

## Workflow follow-up

- Archive with `/opsx:archive`, syncing the ADDED requirement into `session-flow`.
