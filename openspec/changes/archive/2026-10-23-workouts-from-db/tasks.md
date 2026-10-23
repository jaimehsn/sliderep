# Tasks

## 1. Engine: formats by id, derived mode and description

- [x] 1.1 In `constants/wod-engine.ts`, export `FORMATS: Record<string, Format>` (`forTime`, `amrap`, `emom`), add `description: string` to `WodConfig`, and compute `mode`/`description` in `buildWodConfig` from the rules table (design.md decision 5), still keeping `WodDefinition.mode` for now; verify `pnpm lint` and `npx tsc --noEmit` pass
- [x] 1.2 With a throwaway script in the scratchpad (as in change A), build all four configs and compare the derived `mode`/`description` against `constants/wods.ts`'s hand-written `mode` and `WOD_DESCRIPTIONS`; verify the only difference is FILTHY FIFTY's mode (`CHIPPER` → `FOR TIME`)
- [x] 1.3 Drop `mode` from `WodDefinition` and from the four definitions in `constants/wods.ts`, and switch `session/wod.tsx` and `library/index.tsx` cards from `WOD_DESCRIPTIONS[id]` to `config.description`, then delete `WOD_DESCRIPTIONS`; verify lint/tsc pass

## 2. Workouts repository

- [x] 2.1 Add `db/workouts.ts` with `Workout = { id: string; config: WodConfig }`, `listWorkouts(db)` (`archivedAt IS NULL`, `ORDER BY createdAt, rowid`) and `getWorkout(db, id)` (no archive filter, `null` when missing). Both resolve exercise names through one unfiltered `SELECT id, name FROM exercises` and parse `blocks` strictly, throwing on more than one block, an unknown `formatId` or an unknown `exerciseId` (design.md decisions 3–4); verify lint/tsc pass
- [x] 2.2 Add `hooks/use-workouts.ts` (`{ workouts, loaded }`, mount-only, same shape as `use-exercises.ts`) and add `db/workouts.ts` and `use-workouts.ts` to `CLAUDE.md`'s Storage and Hooks sections; verify lint/tsc pass and that the entries match the code

## 3. Session flow carries the workout

- [x] 3.1 In `hooks/use-session.tsx`, add `workout: Workout | null` + `setWorkout` and remove `wodId` from `SessionSetup`. Change `useJudge` to take a `WodConfig` (design.md decisions 1–2); verify the remaining tsc errors are only at the flow call sites fixed in 3.2–3.4
- [x] 3.2 `session/wod.tsx`: list from `useWorkouts()`, and on tap call `setWorkout(w)` and push `/session/setup` with no params. `session/setup.tsx`: read `workout` from context, redirect to `/session/wod` when it's null, and drop the route param and `'fran'` fallback; verify lint/tsc pass for both files
- [x] 3.3 `session/run.tsx`: split into a guard (context, fonts, redirect) and an inner component that calls `useJudge(workout.config)`, removing the `'fran'` fallback. `session/result.tsx`: save `wodId: workout.id` and `engineVersion: workout.config.engineVersion`, render with `workout.config`, and add `workout` to the redirect guard; verify lint/tsc pass
- [x] 3.4 Update `CLAUDE.md`'s session flow entries (`wod.tsx` writes the workout, `setup.tsx` no longer takes a param and redirects, `run.tsx` split) and its `use-session.tsx`/`use-judge.ts` entries; verify the entries match the code

## 4. Screens outside the flow load by id

- [x] 4.1 `library/index.tsx`: WORKOUTS from `useWorkouts()`. `library/[id].tsx`: `getWorkout` in an effect, replacing to `/library` on `null` (design.md decision 6); verify lint/tsc pass
- [x] 4.2 `history/[id].tsx` and `session/adjust.tsx`: fetch the workout with `getWorkout(db, session.wodId)` in their existing load, and drop the `as WodId` casts; verify lint/tsc pass
- [x] 4.3 `history/index.tsx`: fetch the listed sessions' distinct `wodId`s in one `Promise.all` and render rows from the resulting map; verify lint/tsc pass
- [x] 4.4 Update `CLAUDE.md`'s Library and History route entries (WORKOUTS read from the DB, the detail screens load by id); verify the entries match the code

## 5. Remove `constants/wods.ts`

- [x] 5.1 Repoint the seven type-only imports (`reducer.ts`, `types.ts`, `judge-header.tsx`, `start-overlay.tsx`, `replay.ts`, `adjust.ts`, `result-screen.tsx`) to `@/constants/wod-engine`, then delete `constants/wods.ts` (design.md decision 7); verify that `grep -rn "constants/wods\|WodId\|getWodConfig\|WOD_IDS" app components hooks db constants` finds nothing and that lint/tsc pass
- [x] 5.2 Rewrite `CLAUDE.md`'s WOD System section (no `wods.ts`; `FORMATS`, derived `mode`/`description`; the v2 seed is the only copy of the four built-ins); verify there are no remaining mentions of `constants/wods.ts` except as history

## 6. Device verification

- [x] 6.1 Upgrade path (an existing install with saved sessions): verify that the picker and the Library list FRAN, CINDY, EVERY MINUTE, FILTHY FIFTY in that order with the spec's mode labels and descriptions (FILTHY FIFTY reads FOR TIME, progress still "station N of 10"), that History rows and details of old sessions still render, and that ADJUST RESULT still opens and saves
- [x] 6.2 Judge and save each of the four workouts once (one in each role), and verify each appears in History with the right result
- [x] 6.3 Fresh install (clear app data): verify the picker and Library match 6.1 and that a FRAN session starts and saves
- [x] 6.4 Run `openspec validate workouts-from-db --strict` and verify it reports the change as valid

## Workflow follow-up

- Archive with `/opsx:archive`, syncing the MODIFIED `wod-formats` and `session-flow` requirements and the three ADDED `wod-formats` requirements.
- Next in sequence: change C (engine v2: blocks, rest, cap, progressive reps, identical replay of engineVersion 1 logs).
