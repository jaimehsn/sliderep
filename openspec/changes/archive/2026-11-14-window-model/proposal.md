# Proposal

## Why

Workouts from a real box don't fit the current model, where a workout is a list of blocks and each block is one format (For Time, AMRAP or EMOM) with its own clock. Two kinds of workout come up: several structures under one clock (a buy-in, then 5 rounds, then a cash-out, all inside a 12-minute cap), and structures inside each interval (every 3:00, run + burpees, then max power snatches). The explore session of 2026-11-12 decided to replace "one format per block" with **windows** (how the clock runs) that hold **structures** (what is done inside them), and to deliver this in four changes: E1 `window-model` → E2 `shared-clock` → E3 `max-lines` → E4 `max-distance`.

This change is **E1**. It moves the engine, the parser and every consumer from `Format` + `Block` onto the window model, with no visible change and every saved result identical. E2–E4 then only add structures and rules on top of it. They don't rewrite the engine again. This follows the pattern `unified-engine` used before C2.

## What Changes

- A new in-memory workout model in `constants/wod-engine.ts`:
  - A **window** is a clock plus its content.
  - The clock is **continuous** (optional time limit: a For Time cap or an AMRAP duration) or **intervals** (every X s × N, optional work time, optional stop at the first miss).
  - The content is a list of **structures**: `rounds` (For Time / Chipper), `cycle` (AMRAP) or `once` (an EMOM interval's lines).
  - In this change, a continuous window holds exactly one `rounds` or `cycle` structure, and each interval of the sequence holds exactly one `once` structure. These are the shapes that exist today. E2 and E3 lift these limits.
- `WodConfig` carries a `window` instead of `format` + `block`. The timer, advance mode and engine dispatch are **derived from the window**. `Format`, `FORMATS`, the three `*_FORMAT` constants and `WodDefinition` are removed. **BREAKING** (internal API only).
- The engine's rules are not changed. Each `format.repeat` read becomes a read of the window's shape. Positions (`WodSession`), tagged events, splits, scores, labels, mode and description strings stay exactly as they are.
- `engineVersion` becomes one engine-wide constant, `ENGINE_VERSION = 1`. It has the same value every built-in format carried, so new sessions store the same number.
- Stored workouts are **translated on read**. `db/workouts.ts` maps each stored block (`formatId` `forTime` / `amrap` / `emom` and its fields) to a window. It stays strict: an unknown `formatId` or a block that breaks today's invariants throws. Nothing is migrated: the database schema stays v6, no row changes, and the editor keeps writing the same stored blocks.
- The multi-block layer (`parts`, `restAfter`, `scoringBlock`) stays as it is. Each part is now a window. The UI keeps calling them blocks.
- Consumers move to the window: `components/result/replay.ts`, `components/result/adjust.ts` and the editor's DUPLICATE path (`components/editor/draft.ts`, `draftFromBlock` → `draftFromWindow`). Engine and draft tests are adapted.
- A new **presentation snapshot** is recorded on the current code before the refactor: mode, description, exercises, duration line, timer and totals of every built-in and synthetic workout. It must match afterwards, just like the result goldens, which are never re-recorded.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `wod-formats`: "Format semantics are versioned" becomes one engine-wide rule version instead of a version per built-in format, because formats stop being objects. The requirement also states that results saved before an engine extension keep deriving the same score and splits.

## Impact

- **Code**:
  - `constants/wod-engine.ts`: model types; `buildWodConfig(name, window)`; dispatch on the window; formats removed.
  - `db/workouts.ts`: stored block → window translation; `StoredBlock` unchanged.
  - `components/result/replay.ts` and `components/result/adjust.ts`: they read the window.
  - `components/editor/draft.ts`: DUPLICATE from a window.
  - `tests/engine.test.ts`, `tests/draft.test.ts` and `tests/fixtures.ts`: config construction.
  - A new `tests/presentation.test.ts` with its snapshot.
- **Unchanged**: screens, hooks, `session/run.tsx`, `use-judge.ts` (it uses the engine API only), `StoredBlock`, the seeds and migrations.
- **Database**: none. Schema stays v6, `formats` stays seeded and unread, and `sessions.engineVersion` keeps receiving 1.
- **Docs**: `CLAUDE.md` (WOD System, Storage `workouts.ts`, Result Screen, Workout Editor `draft.ts`) and `docs/ROADMAP.md` (WOD format as data: the window/structure plan and E1–E4).
- **Dependencies**: none.
