# Design

## Context

`useProfile()` and `useFirstRun()` each hold their own local state, loaded once in a mount `useEffect`. Every screen that calls them gets an independent copy. The hub (`app/index.tsx`) stays mounted under `/first-run`, `/profile` and `/settings`, so when the owner returns its copies are stale:

- `firstRunDone` is still `false`, even though `/first-run` wrote it to the DB through its own `useFirstRun()` instance.
- `profile` is still `null`, even though `/profile` created one.

So `awaitingFirstRun` stays `true` and the hub keeps rendering its blank placeholder. The push effect doesn't fire again either, because none of its deps changed. Settings has the same staleness for its PROFILE sub-line.

`app/history/index.tsx` already uses the established fix for this: `useFocusEffect` to refetch when a screen comes back into view.

## Goals / Non-Goals

**Goals:** the hub is never left blank after the first-run prompt; the hub shortcut and Settings' PROFILE row show the current profile on return.

**Non-Goals:** sharing profile state across screens (a context or store); changing `useProfile`/`useFirstRun`; changing `first-run.tsx`'s navigation.

## Decisions

1. **The hub never blanks itself waiting on first-run, and pushes the prompt at most once per launch.** The `awaitingFirstRun` placeholder is removed: the hub renders as soon as its data has loaded, and the prompt slides in over it. A `promptedRef`, set right before `router.push('/first-run')` and read only inside the effect, stops a second push in the same launch after a hardware back. This covers all three exits (CREATE PROFILE, CONTINUE ANONYMOUS, hardware back) without the hub needing an up-to-date `firstRunDone`. The DB flag still decides the next launch, as today. When the owner comes back with a just-created profile, the effect's existing "profile exists → `markDone()`" branch runs again. That is harmless, since `setFirstRunDone` is an idempotent `INSERT OR REPLACE`.
   - *Alternative: keep the placeholder behind a `prompted` state flag.* This was the first plan. Rejected at implementation because setting that state in the effect trips `react-hooks/set-state-in-effect`, and a ref can't drive a re-render (with no profile, the focus refresh sets the same `null`, so nothing re-renders). Cost: the hub is briefly visible under the prompt's slide-in on first launch instead of a blank background.
   - *Alternative: refetch `firstRunDone` on focus.* Rejected on its own. After hardware back the flag is legitimately still `false` with no profile, so the hub would stay blank, or re-push the prompt in a loop if the effect re-ran.
2. **Hub and Settings call `useProfile()`'s existing `refresh` from `useFocusEffect`.** This is the same pattern as `history/index.tsx`. It is local to the two screens that showed the bug.
   - *Alternative: make `useProfile` refetch on focus itself.* Rejected because it changes behavior for every consumer (`history/index.tsx` already re-runs its own focus effect on `profile` identity changes, `session/setup.tsx`, `my-qr.tsx`, `profile.tsx`) for no current need. Revisit if a third screen hits this.
   - *Alternative: a shared profile context.* Rejected as more machinery than this needs (`use-profile.ts` deliberately has none, per CLAUDE.md).

## Risks / Trade-offs

- [The first focus also triggers `refresh`, so the profile loads twice on mount] → one extra single-row SQLite read; harmless.
- [`prompted` is component state, so a hub remount would reset it] → the hub is the stack root and isn't remounted during a launch; a real relaunch is supposed to re-check the DB flag anyway.
