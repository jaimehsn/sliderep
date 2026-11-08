# Design

## Context

See `proposal.md` for the motivation and `specs/judging/spec.md` for the required behavior.

`app/session/run.tsx` splits into a guard (`RunScreen`) and `RunSession`, which holds both phases, `ready` (pre-start summary and countdown, inside `StartOverlay`) and `judging`. `RunSession` is mounted exactly for the span the spec covers: finishing `router.replace`s to the result screen, and aborting or ✕ goes back.

In non-production builds `expo/src/launch/withDevTools.tsx` wraps the root in `useKeepAwake`, under its own tag. Dev builds therefore keep the screen on everywhere, on every screen.

## Goals / Non-Goals

**Goals:**

- Hold keep-awake for exactly the lifetime of `RunSession`, with nothing to release by hand.

**Non-Goals:**

- Recovering a session the system kills, keeping JS timers running with the screen off, or background audio. A user who presses the power button mid-WOD gets today's behavior.
- A setting to turn this off.

## Decisions

**`useKeepAwake()` in `RunSession`, unconditionally.** The hook activates on mount and deactivates on unmount, so every way out of the run (finish, abort, ✕, hardware back on the summary) releases it with no code per exit. With no tag argument it generates its own, so it doesn't interfere with the dev wrapper's tag.

Alternatives considered:

- *Start at the START tap.* `StartOverlay` owns the countdown state, so the phase would have to move up into `RunSession`, for little benefit: the judge also waits on the summary, and losing the screen there is annoying too.
- *`activateKeepAwakeAsync` / `deactivateKeepAwake` by hand.* One call per exit path, and a missed one leaves the screen on outside the run.
- *In `useJudge`.* It would work, but the hook is about judging state and gestures; the screen's lifetime belongs to the screen.

**`expo-keep-awake` as a direct dependency**, installed with `pnpm exec expo install expo-keep-awake` so the version matches Expo 58 (`~58.0.3`). pnpm's strict `node_modules` doesn't expose it at the top level today, even though `expo` depends on it. It sets Android's `FLAG_KEEP_SCREEN_ON` on the window, so no permission or config plugin is needed.

**Checked on a release APK only.** The dev wrapper hides both the problem and the fix, and the engine tests can't cover a screen (`pnpm test` is pure TS). `pnpm build:apk` produces the build to check.

## Risks / Trade-offs

- [The screen stays on if someone walks away from the pre-start summary] → Accepted when choosing the whole of `RunSession`; it ends as soon as the phone is locked by hand or the run is left.
- [A check run in a dev build passes regardless] → The tasks require a release APK.
- [More battery use during a WOD] → Bounded by the workout's length, and the judge is looking at the screen anyway.
