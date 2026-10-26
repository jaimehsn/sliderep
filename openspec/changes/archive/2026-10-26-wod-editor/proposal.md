# Proposal

## Why

Workouts now live only in the database (change `workouts-from-db`), and one engine drives both judging and results (`unified-engine`). Even so, the owner can still judge only the four built-ins. The WOD editor plan was to finish the engine primitives (C2) before the editor (D). It has been reordered: the editor comes first, limited to what the engine already runs, and each later primitive (time cap, progressive reps, rest, multi-block) extends the engine and the editor together. That way every change can be tested on a real device as it lands, instead of four engine changes waiting untested for the editor.

## What Changes

- **Create a workout** from the Library (`+ NEW`), as one block in an existing format:
  - **For Time**: a fixed list of exercises with reps per round, plus a "same reps every round" shortcut. A one-round For Time is a Chipper.
  - **AMRAP**: a list of exercises with fixed reps and a duration in whole minutes.
  - **EMOM**: a repeating sequence of minutes, one exercise each, and a total number of minutes.

  Exercises come from the existing catalog. Each line can carry an optional rep description (amount + `m`/`cal`/`s`) and an optional free-text load (e.g. "95/65 lb").
- **Duplicate** any workout, built-in or own. The editor opens prefilled from it, and saving always creates a new, independent workout that remembers its origin. Nothing is ever edited in place, since workouts are immutable.
- **Archive** an own workout from its Library detail, after confirmation. It leaves the Library and workout selection, and saved sessions keep showing it.
- **The Library** lists the built-ins followed by the owner's workouts (marked as own) and stops being read-only. **Workout selection** offers the same workouts, and its disabled "+ NEW WORKOUT" placeholder is removed.
- **A profile is required.** Without one, NEW and DUPLICATE lead to profile creation with an explanation.
- **Deleting the profile** also removes the owner's workouts. A workout still used by a session kept on the phone (one the owner judged for someone else) stays, archived and without an owner, so that session keeps resolving.
- **Load** is shown wherever a workout's exercises are listed: Library detail and the pre-start summary.
- No engine or format change. `engineVersion` stays 1 and no golden changes. There is no schema migration, because workouts' blocks are JSON and the `workouts` table already has `origin`, `ownerId`, `derivedFrom` and `archivedAt`.

## Capabilities

### New Capabilities

- `workout-editor`: creating, duplicating and archiving the owner's workouts — the per-format forms, validation, what a saved workout records, and the profile requirement.

### Modified Capabilities

- `wod-formats`: workouts are no longer exactly the four built-ins. The owner's own workouts are listed after them, and built-ins can be duplicated, but still not edited or archived.
- `library`: lists own workouts, offers NEW, DUPLICATE and ARCHIVE (no longer read-only), and shows each line's rep description and load.
- `session-flow`: workout selection offers built-in and own workouts, and drops the "+ NEW WORKOUT" placeholder.
- `athlete-profile`: deleting the profile also deletes the owner's workouts, except those still referenced by a kept session.
- `judging`: the pre-start summary shows each line's rep description and load.

## Impact

- **Code**:
  - New editor route `app/library/new.tsx`, plus its form components.
  - `app/library/index.tsx` and `app/library/[id].tsx` (actions, own marker, refetch on focus).
  - `app/session/wod.tsx` (own marker, placeholder removed).
  - `db/workouts.ts` (create, archive, and ownership fields on `Workout`; the stored line gains `load`).
  - `db/profile.ts` (`deleteProfile` handles own workouts) and the delete-confirmation copy in `app/profile.tsx`.
  - `constants/wod-engine.ts` (`WodLine.load`, and load/rep description in `summarize()`'s output).
  - `hooks/use-workouts.ts` (a way to refetch).
- **Data**: no schema change. User workouts are written as `origin: 'user'` rows with a real `ownerId`.
- **Docs**: `CLAUDE.md` (routes, `db/workouts.ts`, hooks) and `docs/ROADMAP.md` (the read-only Library assumption, and the plan order D → C2a–d).
