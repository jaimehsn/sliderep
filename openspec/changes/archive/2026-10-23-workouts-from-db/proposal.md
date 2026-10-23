# Proposal

## Why

The WOD editor plan (A exercise catalog → **B workouts loaded from the DB** → C engine v2 → D editor UI) needs workouts to come from storage before an editor can add any. Today the `workouts` table is seeded by schema v2 but nothing reads it: every screen builds its workout from `constants/wods.ts` through a closed `WodId` union, and two screens silently fall back to FRAN when the id is unknown. This is change B: the database becomes the only source of workouts, with no visible change beyond one label.

## What Changes

- Workouts are read from the `workouts` table (exercise names resolved from `exercises`, format rules resolved from the built-in formats in code). `constants/wods.ts` is removed; workout ids become plain strings.
- A workout's mode label and one-line description are derived from its content (format, rounds/duration, lines, exercise names) instead of being hand-written. The four built-ins keep their current text, except **FILTHY FIFTY's mode reads FOR TIME instead of CHIPPER** (consistent with the decided "Chipper = For Time"; its progress still reads by station).
- Workout selection loads the list once and hands the chosen workout to the rest of the session flow in memory; role selection no longer takes a workout id from the route. Reaching role selection without a chosen workout returns to workout selection (today it silently becomes FRAN).
- Archived workouts are hidden from workout selection and the Library, but still load for any saved session that references them (History, adjusting). Exercise names resolve even for archived exercises. Nothing archives anything yet; this fixes the rule before change D can.
- No schema change, no migration, no change to judging, scoring, saving or adjusting rules.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `wod-formats`: the "Built-in workouts" requirement now states workouts are read from storage; new requirements for the derived mode/description (FILTHY FIFTY → FOR TIME) and for archived-workout visibility.
- `session-flow`: "Session flow navigation" extends the no-configured-session redirect to role selection.

## Impact

- **Code**: new `db/workouts.ts` (list/get, blocks JSON → definition) and a hook for the list; `constants/wod-engine.ts` (formats-by-id map, derived mode/description, `WodDefinition` loses `mode`); `hooks/use-session.tsx` (new `workout` slot, `setup.wodId` removed); `hooks/use-judge.ts` (takes a `WodConfig`); `app/session/{wod,setup,run,result,adjust}.tsx`, `app/history/{index,[id]}.tsx`, `app/library/{index,[id]}.tsx`; 7 type-only imports move from `constants/wods` to `constants/wod-engine`. `constants/wods.ts` is deleted.
- **Database**: read-only use of `workouts` and `exercises`; schema stays v5.
- **Docs**: `CLAUDE.md` (WOD System, routing, hooks, storage entries), `docs/ROADMAP.md` if it lists B as pending.
- **Dependencies**: none. Verification is on-device (the project has no test runner).
