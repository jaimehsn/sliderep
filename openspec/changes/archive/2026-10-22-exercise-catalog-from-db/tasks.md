# Tasks

## 1. Freeze the v2 seed

- [x] 1.1 Generate `db/seeds/v2-builtins.ts` as a literal snapshot of `buildBuiltinSeed`'s current output (3 formats, 14 exercises, 4 workouts, JSON columns verbatim, `createdAt` left to the caller), using a throwaway script in the scratchpad, and add the "migration snapshot, never edit" header (design.md decision 2); verify with the same script that the snapshot deep-equals `buildBuiltinSeed(0)` once `createdAt` is ignored
- [x] 1.2 Switch the v2 block in `db/migrations.ts` to read the snapshot, then delete `db/seed-builtins.ts` (`getWodDefinition` stays until task 3.2, the Library still uses it); verify `pnpm lint` and `npx tsc --noEmit` pass

## 2. Schema v5 and repository

- [x] 2.1 Create `db/seeds/v5-exercises.ts` with the categories for the 14 existing ids and the 69 new `{ id, name, category }` rows from design.md's Catalog list, ids written out with the existing slugify rule (design.md decision 3), with the same never-edit header; verify with a throwaway script that there are 83 distinct ids and names (38/35/10 per category) and that every id equals `slugify(name)`
- [x] 2.2 Add the v5 block to `db/migrations.ts` (`DATABASE_VERSION = 5`, `ADD COLUMN category TEXT`, 14 `UPDATE`s plus 69 `INSERT`s in one transaction, `user_version = 5`) and extend the file's header comment (design.md decision 1 and Migration Plan); verify `pnpm lint` and `npx tsc --noEmit` pass
- [x] 2.3 Add `db/exercises.ts` (`ExerciseCategory`, `EXERCISE_CATEGORIES`, `getExercises(db)` filtering `archivedAt IS NULL`, ordered by name) and `hooks/use-exercises.ts` (`{ exercises, loaded }`, same shape as `use-first-run.ts`) (design.md decisions 4–5); verify `pnpm lint` and `npx tsc --noEmit` pass
- [x] 2.4 Update `CLAUDE.md`'s Storage section (schema v5, `db/seeds/`, `db/exercises.ts`, removal of `seed-builtins.ts`) and Hooks section (`use-exercises.ts`); verify the entries match the code

## 3. Library

- [x] 3.1 In `app/library/index.tsx`, replace `EXERCISE_NAMES` with `useExercises()`, render EXERCISES only once loaded, grouped under GYMNASTICS / WEIGHTLIFTING / MONOSTRUCTURAL subheadings, rows still non-interactive (design.md decision 5); verify `pnpm lint` and `npx tsc --noEmit` pass
- [x] 3.2 Remove `constants/wods.ts`'s `getWodDefinition`, which has no consumers left, and update `CLAUDE.md`'s `app/library/index.tsx` and WOD System (`constants/wods.ts`) entries; verify `grep -rn getWodDefinition app components constants db hooks` finds nothing and lint/tsc pass

## 4. Device verification

- [x] 4.1 Upgrade path: on a device with the current release (schema v4) and at least one saved session, install this build and verify that the Library shows the three groups with 83 exercises (BACK EXT. present, DOUBLE UNDERS under MONOSTRUCTURAL, ROPE CLIMBS present), that History still lists the old session, and that judging FRAN still works and saves
- [x] 4.2 Fresh install (clear app data): verify that the Library shows the same 83 exercises in the same groups, and that all four example WODs still start and save a session (exercises the frozen v2 seed and the `sessions.wodId` FK)
- [x] 4.3 Run `openspec validate exercise-catalog-from-db --strict` and verify it reports the change as valid

## Workflow follow-up

- Archive with `/opsx:archive`, syncing the new `exercise-catalog` spec and the MODIFIED `library` requirement.
- Next in sequence: change B (workouts loaded from the DB).
