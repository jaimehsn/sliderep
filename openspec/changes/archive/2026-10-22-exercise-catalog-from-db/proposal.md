# Proposal

## Why

The WOD editor (planned as four ordered changes: A exercise catalog → B workouts loaded from the DB → C engine v2 with blocks → D editor UI) needs a real exercise catalog to pick movements from, read from the database. Today the `exercises` table holds only the 14 movements the four example WODs happen to use, and nothing reads it: the Library rebuilds its exercise list from `constants/wods.ts`. This is change A: it makes the catalog complete, categorized, and the database its only source.

## What Changes

- The built-in exercise catalog grows from 14 to 83 movements, inserted by a new append-only migration (schema v5). The 14 existing rows keep their ids and names unchanged (including `BACK EXT.`).
- Every exercise gets a required category from a closed list: GYMNASTICS, WEIGHTLIFTING, MONOSTRUCTURAL. The 14 existing rows get theirs in the same migration (`DOUBLE UNDERS` is MONOSTRUCTURAL).
- Naming convention for built-in exercises: uppercase English, as written on a box whiteboard; each variant is its own exercise (`PULL-UPS`, `STRICT PULL-UPS`, `CHEST-TO-BAR PULL-UPS`). Isometric holds are left out (not countable as reps); distance and calorie movements (`ROW`, `RUN`, `FARMER CARRY`) carry no unit in their name.
- The Library's EXERCISES section lists the whole catalog from the database, grouped by category, alphabetical within each, instead of only the exercises the built-in workouts use. Archived exercises are not listed.
- The v2 migration's built-in seed is frozen as a literal snapshot, so later changes to `constants/wods.ts` (change B onward) can no longer alter what a fresh install seeds.
- No change to workouts, judging, sessions or results: workout lines still come from `constants/wods.ts` until change B.

## Capabilities

### New Capabilities

- `exercise-catalog`: the built-in exercise catalog: its contents, the closed category list, immutability of built-in exercises, and that exercises are read from storage.

### Modified Capabilities

- `library`: the "Workouts and exercises list" requirement changes from "every exercise used by the built-in workouts" to the full catalog, grouped by category.

## Impact

- **Code**: `db/migrations.ts` (schema v5; v2 switched to a frozen snapshot), a new `db/exercises.ts` repository, a new hook for screens, frozen seed data files under `db/`, `app/library/index.tsx`. `db/seed-builtins.ts` and `constants/wods.ts`'s `getWodDefinition` lose their consumers and are removed.
- **Database**: schema v4 → v5, `exercises.category` column added, 69 rows inserted and 14 rows given a category. No change to `sessions`, `session_adjustments` or `workouts`.
- **Docs**: `CLAUDE.md` (Storage, Library, WOD System entries).
- **Dependencies**: none.
