# Proposal

## Why

During a session the phone can go to sleep whenever the judge stops touching it, which Android does after its screen timeout (often 30 seconds to 2 minutes). When keep-awake was ruled out, a WOD was a steady stream of swipes that kept the screen on; the workout editor has since added long touch-free stretches: a 1-rep "500 m" line, For Time rests and rests between blocks of up to 600 s. Dev builds never showed the problem, because Expo keeps the screen awake in every non-production build.

## What Changes

- The screen stays on for the whole session run: the pre-start summary, the countdown and judging.
- The screen follows the system timeout again as soon as the run is left: on finishing (the result screen), on aborting, and on ✕ from the pre-start summary.
- The power button still turns the screen off. Nothing is added to recover a session that the system kills; that stays out of scope.
- `docs/ROADMAP.md` no longer lists keep-awake as out of scope, and its "risk to watch" drops the screen timeout.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `judging`: adds a requirement that the screen stays on from the pre-start summary until the run is left.

## Impact

- `app/session/run.tsx`: `RunSession` keeps the screen awake while mounted.
- `package.json` / `pnpm-lock.yaml`: `expo-keep-awake` becomes a direct dependency (it is only a transitive one of `expo` today, so it can't be imported).
- `CLAUDE.md` and `docs/ROADMAP.md`.
- No engine, storage or golden changes. No new Android permission.
