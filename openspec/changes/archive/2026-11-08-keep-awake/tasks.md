# Tasks

## 1. Dependency

- [x] 1.1 Run `pnpm exec expo install expo-keep-awake` and verify `package.json` lists it at `~58.0.3` and `node_modules/expo-keep-awake` exists.

## 2. Keep the screen on

- [x] 2.1 Call `useKeepAwake()` at the top of `RunSession` in `app/session/run.tsx` (not in the `RunScreen` guard), with a short comment saying why it covers both phases. Verify `pnpm lint`, `pnpm exec tsc --noEmit` and `pnpm test` pass, with no change under `tests/__goldens__/`.
- [x] 2.2 Document it: in `CLAUDE.md`, add the keep-awake (and that dev builds always keep the screen on, so only a release build can check it) to the `session/run.tsx` entry. In `docs/ROADMAP.md`, remove keep-awake from *Out of scope for now* and from the *Risk to watch* in *Exercise sessions*, keeping the risk of Android killing the app. Verify by reading the touched lines.

## 3. Device check (owner, release build)

The dev build keeps the screen on everywhere, so this check is only valid on a release APK from `pnpm build:apk`. Set the phone's screen timeout to 30 seconds. No layout changes, so no extreme-content layout pass is needed.

- [x] 3.1 Judging: on a For Time with a rest of at least 60 s, or a 1-rep "500 m" line, touch nothing for over a minute and verify the screen stays on and the timer keeps running.
- [x] 3.2 Pre-start: leave the summary open and untouched for over a minute and verify the screen stays on.
- [x] 3.3 Release: verify the screen turns off by the 30-second timeout on the result screen after finishing, on the hub after confirming "Abort session?" (or wherever the abort lands), and after ✕ on the pre-start summary.
- [x] 3.4 Power button: press it during judging and verify the screen turns off.

## Workflow follow-up

- Archive the change after the device check.
