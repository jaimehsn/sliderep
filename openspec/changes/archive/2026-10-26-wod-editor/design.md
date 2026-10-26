# Design

## Context

See proposal.md for why. Today's state:

- **Stored shape.** A workout's `blocks` JSON is `[{ formatId, lines: StoredLine[][], rounds?, durationSeconds? }]`, where `StoredLine = { exerciseId, target, repDescription? }`. `db/workouts.ts`'s strict parser turns a row into a `Workout = { id, config }`, resolving exercise ids to names. `WodLine` keeps only the name, so a loaded workout cannot be written back without a reverse lookup.
- **Per-format layout of `lines`** (from the v2 seed and `Block`'s doc):
  - For Time: one entry per round, same exercise order in each.
  - AMRAP: exactly one entry.
  - EMOM: one entry per distinct minute, one line each, cycled with `minuteIdx % length`. EMOM also stores `rounds` (total minutes) and `durationSeconds` (`rounds × 60`).
- **Ordering.** The `workouts` table already has `origin`, `ownerId`, `derivedFrom`, `archivedAt` and `createdAt`. `listWorkouts` filters out archived rows and orders by `createdAt, rowid`. The built-ins' `createdAt` is the v2 migration time, so anything created later sorts after them.
- **Refresh.** `hooks/use-workouts.ts` loads once on mount, with no refresh.
- **Presentation.** `summarize()` builds `WodExercise = { name, detail }`, the list used by the Library detail and the pre-start overlay. Rep descriptions exist in the model but are shown nowhere.
- **Deleting the profile.** `db/profile.ts`'s `deleteProfile` deletes own sessions and their adjustments, then the profile. `sessions.wodId REFERENCES workouts(id)` with foreign keys ON, so deleting a workout that a session uses would fail.

## Goals / Non-Goals

**Goals:**
- An editor whose state is a plain, testable draft, with pure conversions to and from the stored block.
- Ownership, archiving and profile deletion done in `db/` in one place each, following the existing repository style.

**Non-Goals:**
- Any engine, format or result change. `buildWodConfig` keeps building configs from the same stored shape, now with two extra optional line fields.
- Custom exercises, editing a saved workout, multi-block workouts, and EMOM minutes with several exercises or non-60 s intervals (C2b).
- Starting a session from the Library.

## Decisions

### 1. A pure draft model drives the editor

`components/editor/draft.ts` (pure TS, no React) defines a `Draft` per format, mirroring the agreed forms:

```
ForTimeDraft = { format: 'forTime', name, rounds, sameReps, rows: [{ exerciseId, reps: number[] /* per round */, repDescription?, load? }] }
AmrapDraft   = { format: 'amrap',   name, minutes, rows: [{ exerciseId, reps, repDescription?, load? }] }
EmomDraft    = { format: 'emom',    name, minutes, slots: [{ exerciseId, reps, repDescription?, load? }] }
```

It also exports:
- `emptyDraft(format)`.
- `draftToStoredBlock(draft)`:
  - For Time: one entry per round, a row's description and load copied into every round.
  - AMRAP: one entry, `durationSeconds = minutes × 60`.
  - EMOM: one entry per slot, `rounds = minutes`, `durationSeconds = minutes × 60`, like the seed.
- `draftFromBlock(block)` for DUPLICATE.
- `validateDraft(draft)`, which returns the problems per field.

Switching format in the editor keeps the name and carries the rows' exercises over, with reps reset to the new format's shape.

*Why:* the screen stays thin, and the conversions and validation are covered by vitest in `tests/`. The project's tests are pure TS only, by rule. *Alternative:* form state inside the screen component. It is harder to test, and it would duplicate the stored-shape knowledge that `db/workouts.ts` already has.

### 2. `WodLine` carries `exerciseId` and `load`

The parser already reads each line's `exerciseId`, so `WodLine` gains `exerciseId` and an optional `load` (free text). `StoredLine` gains `load?`. `draftFromBlock` reads ids straight from `config.block`, with no name→id lookup. A prefilled line keeps its exercise even if that exercise has since been archived; the picker just won't offer it for new picks.

*Why:* ids are the stored identity, and names can repeat across categories in a future catalog. Neither field enters any engine calculation, so the goldens are untouched. `pnpm test` confirms it.

### 3. Presentation gains one optional `note` per exercise

`WodExercise` becomes `{ name, detail, note? }`. `note` joins the line's rep description (`"500 m"`, `"15 cal"`, `"60 s"`) and load with `" · "`. It comes from the first round, and every round has the same values by construction. The Library detail and `start-overlay.tsx` render it as a dim second line under the exercise. A line of 1 rep with a rep description shows the description as its `detail` ("500 m", "15 cal / min") and leaves it out of the note. A FOR TIME of more than one round, all with the same reps, shows each exercise once ("10 reps"), with `mode` "<N> ROUNDS FOR TIME" and `description` "<N> rounds · …". Every built-in keeps its summary.

### 4. Repository functions in `db/workouts.ts`

- `Workout` gains `origin: 'builtin' | 'user'` and `ownerId: string | null`. Every select reads them.
- `createWorkout(db, { name, block, ownerId, derivedFrom })`:
  - Inserts one row with `makeId()` (reused from `db/sessions.ts`).
  - Uses `scoringBlock: 0`, `origin: 'user'`, `createdAt: Date.now()`, and the `blocks` JSON with exactly one block.
  - Returns the id.
- `archiveWorkout(db, id, ownerId)`: sets `archivedAt` only where `origin = 'user' AND ownerId = ?`, so a built-in can never be archived, even by a bug in the screen.
- Ownership in screens: `isOwn(workout, profile) = workout.origin === 'user' && workout.ownerId === profile?.id`.

### 5. Deleting the profile, in the same transaction

After own sessions and their adjustments are deleted:

1. `UPDATE workouts SET ownerId = NULL, archivedAt = COALESCE(archivedAt, now) WHERE ownerId = ? AND id IN (SELECT wodId FROM sessions)`
2. `DELETE FROM workouts WHERE ownerId = ?`

Step 1 runs after own sessions are gone, so only kept foreign sessions can still reference a workout. The foreign key would turn a mistake here into an error instead of a dangling session.

*Why:* this is the ROADMAP's decided rule ("kept without an owner until those sessions are purged"). The reference table the ROADMAP mentioned isn't needed, because the only references to a workout today are `sessions.wodId`.

### 6. Routes and navigation

- **One route, `app/library/new.tsx`**, with an optional `from` param.
  - With `from`, it loads that workout (`getWorkout`) and starts from `draftFromBlock`, with name `"<NAME> COPY"` and `derivedFrom = from`.
  - Without it, it starts from `emptyDraft('forTime')`.
  - SAVE calls `createWorkout`, then `router.replace('/library/<newId>')`. Back from the new detail returns to wherever the editor was opened from: the list, or the source's detail.
  - ✕ is `router.back()`, with nothing saved and no confirmation. The draft is cheap, and the flow stays simple.
- **The profile gate** runs in the list and detail action handlers, before navigating: no profile → `Alert.alert('Profile needed', 'Create a profile to create workouts.', [Cancel, Create profile → router.push('/profile')])`. `new.tsx` re-checks on load and redirects to `/profile` if needed, for deep links.
- **ARCHIVE** is shown only when `isOwn`. It asks for confirmation (`Alert.alert`), calls `archiveWorkout`, then `router.dismissTo('/library')`, so archiving a just-saved copy doesn't land on its source.
- **Refetching.** `useWorkouts` gains `refresh`, called in a `useFocusEffect` by `library/index.tsx` and `session/wod.tsx`, the same pattern the hub and History use.
- **Own marker.** Workout cards in both lists show a small "MINE" tag when `isOwn`.
- **Workout selection.** The disabled "+ NEW WORKOUT" placeholder is removed from `session/wod.tsx`.

### 7. Exercise picker

`components/editor/exercise-picker.tsx` is a React Native `Modal` with a search field (case-insensitive substring match on the name) over `useExercises()`. Results are grouped by `EXERCISE_CATEGORIES`, like the Library. Tapping one returns its id and closes the modal.

### 8. Small UI defaults

- **Name.** Typed in caps (`autoCapitalize="characters"`) and stored upper-cased and trimmed, matching the built-ins' whiteboard style.
- **Number fields.** Numeric keyboard, and the integer is parsed on save. Invalid or empty values are what `validateDraft` reports.
- **Rep description unit.** A three-way selector: `m`, `cal`, `s`.
- **"Same reps every round".** On by default for a new For Time. Turning it off splits a row into one field per round, prefilled with the shared value. Turning it on copies the first round's value to every round. A duplicated For Time whose rows differ per round (FRAN) opens with it off.

## Risks / Trade-offs

- [A wide For Time matrix (many rounds, "same reps" off) is cramped on a phone] → Per-round fields scroll horizontally inside their row. The common case keeps "same reps" on, with one field.
- [A stored line that the parser accepts but `draftFromBlock` can't express, e.g. a For Time whose rounds differ in exercises] → It can't exist: the built-ins and everything the editor saves have the same exercise order in every round. `draftFromBlock` throws, like the strict parser, and a test pins the four built-ins round-tripping.
- [An owner-less archived workout stays in the database forever] → Accepted, as decided in the ROADMAP. It is purged together with the foreign sessions once delivery and sync exist.
- [`createdAt` ties: two workouts saved in the same millisecond] → `rowid` already breaks ties in `listWorkouts`.
