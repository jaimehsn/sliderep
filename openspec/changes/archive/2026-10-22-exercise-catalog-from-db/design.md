# Design

## Context

- `exercises` (schema v1) has `id, name, origin, ownerId, derivedFrom, archivedAt, createdAt`, and no category. Schema v2 seeded 14 rows through `db/seed-builtins.ts`'s `buildBuiltinSeed`, which nothing reads back. Ids are `slugify(name)` (e.g. `back-ext`, `kb-swings`).
- `buildBuiltinSeed` runs **inside** the v2 migration and derives its rows from `constants/wods.ts` at runtime (`db/migrations.ts:93`). A fresh install therefore seeds whatever the constants say *today*, which is only correct as long as the constants never change. Change B will change them.
- `workouts.blocks` JSON references exercises by id, with no SQL foreign key. `sessions` references workouts, not exercises.
- `app/library/index.tsx` builds `EXERCISE_NAMES` at module load from `getWodDefinition` (its only consumer besides the seed) and renders synchronously, with no DB access.
- The project has no automated tests. Verification is `pnpm lint`, `npx tsc --noEmit` and checks on a device.

## Goals / Non-Goals

**Goals:** v5 adds categories and the full catalog. A fresh install and an upgraded install end up with identical built-in rows. The Library reads exercises only from the DB.

**Non-Goals:** exercise search, filtering or detail screens (the editor in change D needs these). User-created exercises. Archiving UI. Any change to how workouts are loaded (change B).

## Decisions

1. **`ALTER TABLE exercises ADD COLUMN category TEXT`; "required" is enforced in app code.** Same approach as v4's `judgeAlias`. The v5 migration fills the column for the 14 existing rows and inserts the new ones in one transaction, so no row is ever left without a category once v5 completes. The repository type declares `category: ExerciseCategory` (non-null).
   - *Alternative: rebuild `exercises` with `category TEXT NOT NULL CHECK (category IN (...))`.* A rebuild is safe, since no SQL FK points at `exercises`. It would also make the DB itself reject a bad category from the future editor. Rejected for now as more migration than a three-value list needs. If change D wants DB-level enforcement, it can add the rebuild then.

2. **Seed data is frozen literal files under `db/seeds/`, never derived from constants.**
   - `db/seeds/v2-builtins.ts`: a literal snapshot of exactly the rows `buildBuiltinSeed` produces today (3 `formats`, 14 `exercises`, 4 `workouts`, with `blocks`/`definition` JSON strings verbatim). `createdAt` is still supplied at migration time. The v2 block imports this snapshot instead of calling `buildBuiltinSeed`. On already-migrated devices v2 never runs again, so behavior there is unchanged. On a fresh install it produces the same rows as before. `db/seed-builtins.ts` is then deleted, and `constants/wods.ts`'s `getWodDefinition` with it (no consumers left once the Library stops using it).
   - `db/seeds/v5-exercises.ts`: the categories for the 14 existing ids, plus the 69 new `{ id, name, category }` rows listed below.
   - Each file gets a header comment saying it is a migration snapshot and must never be edited. A future catalog change is a new migration with a new seed file.
   - *Alternative: keep deriving v2 from constants and only freeze v5.* Rejected because change B would silently change fresh-install seeds.
   - *Alternative: inline the literals in `migrations.ts`.* Rejected because about 90 rows would bury the migration logic.

3. **Ids for new rows follow the existing `slugify` rule, written out literally** (`CLEAN & JERKS` → `clean-jerks`, `CHEST-TO-BAR PULL-UPS` → `chest-to-bar-pull-ups`). They are not computed at migration time. Plain `INSERT`, not `INSERT OR IGNORE`: there are no user exercises yet, so a collision can only be a bug in the seed, and it should fail the migration loudly.

4. **`db/exercises.ts`'s `getExercises(db)`** returns `{ id, name, category }[]` for `archivedAt IS NULL`, `ORDER BY name`. The same file exports `ExerciseCategory` and `EXERCISE_CATEGORIES` (the display order GYMNASTICS → WEIGHTLIFTING → MONOSTRUCTURAL). The Library groups rows by category in JS. All names are uppercase ASCII, so SQLite's default `BINARY` ordering matches what a reader expects.

5. **`hooks/use-exercises.ts`'s `useExercises()`** returns `{ exercises, loaded }`. It has the same shape and mount-only loading as `use-first-run.ts`, with no `refresh`, since nothing can change the catalog while the app runs yet. `app/library/index.tsx` drops `EXERCISE_NAMES` and renders WORKOUTS immediately (still from constants). It renders the EXERCISES section only once `loaded`, as category subheadings plus non-interactive rows, inside the existing `ScrollView`.

## Catalog (authoritative list for v5)

`*` = already seeded in v2 (gets only its category).

- **GYMNASTICS (38):** AIR SQUATS\*, BACK EXT.\*, BAR MUSCLE-UPS, BAR-FACING BURPEES, BOX JUMP-OVERS, BOX JUMPS\*, BURPEE BOX JUMP-OVERS, BURPEE PULL-UPS, BURPEES\*, CHEST-TO-BAR PULL-UPS, GHD SIT-UPS, HAND-RELEASE PUSH-UPS, HANDSTAND PUSH-UPS, HANDSTAND WALK, HANGING KNEE RAISES, HOLLOW ROCKS, JUMPING LUNGES, JUMPING PULL-UPS\*, KNEES-TO-ELBOWS\*, LEGLESS ROPE CLIMBS, LUNGES, MOUNTAIN CLIMBERS, PISTOLS, PULL-UPS\*, PUSH-UPS\*, RING DIPS, RING MUSCLE-UPS, RING ROWS, ROPE CLIMBS, SIT-UPS, STEP-UPS, STRICT HANDSTAND PUSH-UPS, STRICT PULL-UPS, TOES-TO-BAR, TUCK JUMPS, V-UPS, WALKING LUNGES\*, WALL WALKS
- **WEIGHTLIFTING (35):** AMERICAN KB SWINGS, BACK SQUATS, CLEAN & JERKS, CLEANS, DB BOX STEP-OVERS, DB CLEANS, DB SNATCHES, DB THRUSTERS, DEADLIFTS, DEVIL PRESS, FARMER CARRY, FRONT SQUATS, GROUND-TO-OVERHEAD, HANG POWER CLEANS, HANG POWER SNATCHES, KB GOBLET SQUATS, KB SWINGS\*, OVERHEAD SQUATS, OVERHEAD WALKING LUNGES, POWER CLEANS, POWER SNATCHES, PUSH JERKS, PUSH PRESS\*, SANDBAG CLEANS, SHOULDER PRESS, SHOULDER-TO-OVERHEAD, SLAM BALLS, SNATCHES, SPLIT JERKS, SQUAT CLEANS, SQUAT SNATCHES, SUMO DEADLIFT HIGH PULLS, THRUSTERS\*, TURKISH GET-UPS, WALL BALL\*
- **MONOSTRUCTURAL (10):** BIKE, BIKE ERG, DOUBLE UNDERS\*, ROW, RUN, SHUTTLE RUNS, SINGLE UNDERS, SKI ERG, SLED PUSH, SWIM

Total 83 (14 existing + 69 new).

## Risks / Trade-offs

- [The v2 snapshot differs from what `buildBuiltinSeed` produced, so fresh and upgraded installs diverge] → generate the snapshot from `buildBuiltinSeed`'s own output with a throwaway script, compare it (ignoring `createdAt`) before deleting the function, and check a fresh install on a device.
- [The column is nullable in SQL, so a future writer could insert a category-less row] → the only writer today is this migration. Change D owns user-created exercises and can tighten the schema then (decision 1's alternative).
- [A long EXERCISES list makes the Library a long scroll] → accepted. Category headings keep it scannable, and search belongs to the editor (change D).

## Migration Plan

Forward-only, like every other migration: `DATABASE_VERSION` 4 → 5, a new `if (version === 4)` block that runs `ADD COLUMN`, then the 14 `UPDATE`s and 69 `INSERT`s in one `withTransactionAsync`, then `PRAGMA user_version = 5`. No `foreign_keys` toggling is needed (no table rebuild). Verify on a device in two ways: upgrading from the current release build (v4 DB with saved sessions, which must survive) and a fresh install (clear app data). There is no rollback beyond reinstalling, as with earlier migrations.
