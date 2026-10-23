# Design

## Context

- `workouts` (schema v1) has `id, name, blocks, scoringBlock, origin, ownerId, derivedFrom, archivedAt, createdAt`. Schema v2 seeded the four built-ins from the frozen `db/seeds/v2-builtins.ts`. `blocks` is a JSON array of `{ formatId, lines: [[{ exerciseId, target }]], rounds?, durationSeconds? }`, and `scoringBlock` is always `0`. Nothing reads the table: `sessions.wodId` references it only through the foreign key.
- `constants/wods.ts` holds the same four workouts as `WodDefinition`s keyed by a closed `WodId` union, with a hand-written `mode` and `WOD_DESCRIPTIONS`. `getWodConfig(id)` is synchronous and is called from 10 places: the picker, setup, run (through `useJudge`), result, adjust, history list/detail, library list/detail. `app/session/run.tsx:35` passes `setup?.wodId ?? 'fran'` so that `useJudge` can run before its no-setup guard, and `app/session/setup.tsx:24` falls back to `'fran'` for an unknown route param.
- `useJudge` seeds `useReducer(judgeReducer, config, makeInitial)` at mount, so it needs the config synchronously.
- `buildWodConfig` already derives everything except `mode` (copied from the definition). The engine already treats a 1-round `rounds` block as stations (`getKpi`, `summarize`). The built-in `Format` constants live in `constants/wod-engine.ts`. The `formats` table holds a descriptive JSON copy of them.
- `db/exercises.ts`'s `getExercises` filters `archivedAt IS NULL` (correct for the Library catalog).
- The project has no automated tests. Verification is `pnpm lint`, `npx tsc --noEmit` and checks on a device.

## Goals / Non-Goals

**Goals:** the DB is the only source of workouts, and the four built-ins look and behave exactly as before (apart from FILTHY FIFTY's mode label). The live session flow never shows a loading state once a workout is picked. Workout ids become plain strings.

**Non-Goals:** multi-block WODs, rest, caps, replaying older engine versions (change C). Creating, duplicating or archiving workouts (change D). Reading `formats.definition` from the DB. Any schema change.

## Decisions

1. **The chosen workout travels in the session context, written by the picker.** `hooks/use-session.tsx` gains `workout: { id: string; config: WodConfig } | null` plus `setWorkout`. `app/session/wod.tsx` already holds every built config to draw its cards. On tap it calls `setWorkout(w)` and pushes `/session/setup` with no params. `SessionSetup` drops `wodId`: the id travels with the workout, since `WodConfig` has no id field and `saveSession` needs one.
   - Because workouts are immutable (create/duplicate/archive, never edit), holding the built config for the length of a session cannot go stale.
   - Any future entry point (e.g. "start from Library" in D) calls `setWorkout` before pushing.
   - *Alternative: setup loads by a `?wodId=` route param.* Rejected because it adds a loading state and param parsing to setup for a deep-link entry this app doesn't use.
   - *Alternative: a `useWorkout(id)` hook on every flow screen.* Rejected because `run.tsx` would need a loading state in front of the judging screen.

2. **`useJudge(config: WodConfig)` and a guard/inner split in `run.tsx`.** `RunScreen` keeps the context read, fonts and the no-setup redirect. It mounts an inner component only once `workout` and `setup` exist, and that component calls `useJudge(workout.config)`. This removes the `'fran'` fallback without breaking the rules of hooks. `setup.tsx` redirects to `/session/wod` when `workout` is null (same pattern as run/result). `result.tsx` saves `wodId: workout.id`, `engineVersion: workout.config.engineVersion`.

3. **`db/workouts.ts`: `listWorkouts(db)` and `getWorkout(db, id)`, both returning `{ id, config }`.**
   - `listWorkouts`: `WHERE archivedAt IS NULL ORDER BY createdAt, rowid`. The table has an implicit rowid, so the four v2 seed rows (same `createdAt`) keep their insertion order FRAN, CINDY, EVERY MINUTE, FILTHY FIFTY.
   - `getWorkout`: no `archivedAt` filter, and it returns `null` for an unknown id (only possible from a library deep link; `sessions.wodId` is foreign-key-guarded).
   - Both resolve exercise names with one unfiltered `SELECT id, name FROM exercises` (83 rows), never with `getExercises`, so archived exercises still resolve.
   - The parse is strict and throws, with nothing catching it: `blocks.length !== 1`, an unknown `formatId`, or an unknown `exerciseId`. Such rows cannot exist until changes C and D, which widen the parser together with the shape they write.
   - *Alternative: hide or filter unreadable rows.* Rejected because it is code for a state nothing can produce.

4. **Formats resolve to code by id.** `constants/wod-engine.ts` exports `FORMATS: Record<string, Format>` (`forTime`, `amrap`, `emom`) next to the constants it indexes. `formats.definition` is not read. Engine semantics live in code, and pinning by version is change C's job.

5. **Mode and description are derived inside `buildWodConfig`.** `WodDefinition` loses `mode` (now `{ id, name, block }`). `WodConfig` gains `description: string`, and `mode` becomes computed. The rules are driven by `format.repeat`:

   | repeat | mode | description |
   |---|---|---|
   | `rounds`, `rounds > 1` | `FOR TIME` | per-round targets joined by `-` when uniform within each round, else `<rounds> rounds`; then ` · ` + names |
   | `rounds`, `rounds === 1` | `FOR TIME` | `<n> stations · <t> reps each` when all targets are equal, else `<n> stations` |
   | `cycle` | `<min>-MIN AMRAP` | `<min> min · ` + names |
   | `perInterval` | `EMOM · <rounds>` | `<min> min · ` + names |

   "names" are the distinct exercise names in first-seen order, lowercased, joined by ` + ` for two and `, ` for three or more (a single name stands alone). `<min>` = `durationSeconds / 60`. For the four seeds this reproduces today's strings exactly, apart from FILTHY FIFTY → `FOR TIME`.
   - *Alternative: `mode`/`description` columns (v6 migration).* Rejected because D's editor would have to ask for text that the content already implies, and multi-block (C) needs a rule anyway. A free-text `notes` column, if D wants one, is a separate field.
   - *Alternative: a CHIPPER label for 1-round For Time.* Rejected by the user. It contradicts "Chipper = For Time" and would misfire on user WODs.

6. **Screens outside the flow load by id.**
   - `hooks/use-workouts.ts`'s `useWorkouts()` (`{ workouts, loaded }`, mount-only, same shape as `use-exercises.ts`) feeds `session/wod.tsx` and `library/index.tsx`.
   - `library/[id].tsx` calls `getWorkout` in an effect and replaces to `/library` on `null`.
   - `history/[id].tsx` and `session/adjust.tsx` fetch the workout right after the session row, in their existing load.
   - `history/index.tsx` fetches the distinct `wodId`s of the listed sessions in one `Promise.all` and renders from a map.
   - All `as WodId` casts disappear.

7. **`constants/wods.ts` is deleted.** The seven type-only importers (`reducer.ts`, `types.ts`, `judge-header.tsx`, `start-overlay.tsx`, `replay.ts`, `adjust.ts`, `result-screen.tsx`) import from `@/constants/wod-engine`. The v2 seed is the only copy of the four workouts. Keeping the file as reference data would leave a second copy that looks authoritative and drifts.

## Risks / Trade-offs

- [The derived strings differ subtly from today's (case, separator, `kb swings`)] → Before deleting `wods.ts`, compare on the device: picker cards, setup header, start-overlay list, library detail and history row for all four.
- [Picker, library list and library detail now render blank for one frame while the query resolves] → Same pattern as Library's EXERCISES and History today. No spinner.
- [A strict parse throw crashes the screen] → Intended: it can only signal a seed or parser bug. Changes C and D own any new row shapes.
- [The `rowid` tie-break is implicit] → It holds for the v2 seed. D's user workouts get distinct `createdAt` values, so the tie-break never matters for them.

## Migration Plan

No schema or data migration. Schema stays v5. Rollback is reverting the commit; the DB is untouched.
