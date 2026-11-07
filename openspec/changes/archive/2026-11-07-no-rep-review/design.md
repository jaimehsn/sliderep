# Design

## Context

- **Events:** a session stores `events: { t, kind: 'rep' | 'noRep' }[]`. Screens turn them into `LogEntry { id, ok, t }` with `id` = the index in that array (`session/adjust.tsx`, `history/[id].tsx`, `tests/fixtures.ts`'s `toLog`).
- **The fold:** `fold` sorts the events by `t` (a stable sort) and tags each one with the position it was applied at (`TaggedEvent { t, ok, pos, target, counted, block? }`). No-reps are tagged with their position too, `counted: false`. No-reps and reps are told apart from events the engine ignored (`finished`, `isResting`) only through `counted`, which is false for both.
- **Results:** `deriveResult` folds a log into splits and a score. On a workout of several blocks, `blockLogs` cuts the log per block on its block-local clock, but renumbers the events (`id: k`).
- **Today's adjustments:** `adjust.ts` (target/duration) is its own derivation, separate from `deriveResult`: `tagOnTargetPositions`, per-position buckets, cutoffs, and EMOM interval buckets. It is pinned by 24 goldens with an `adjusted` key.
- **Storage:** `session_adjustments` stores each package's `changes` as JSON. Schema is at v5.

## Goals / Non-Goals

**Goals:**
- The reviewed result comes from the same `deriveResult` as the unadjusted one, run on a rewritten log. No second scoring path is kept for adjustments.
- A session without packages is untouched: `deriveAdjustedResult` with no changes stays `deriveResult`. Every recorded `result` golden is unchanged.

**Non-Goals:**
- Turning a rep into a no-rep.
- Reading the old target/duration packages. They are deleted, not converted.
- Moving block starts on a workout of several blocks.

## Decisions

### 1. The reviewed log: accept, drop surplus, give time back, then fold

For one block (a one-block config, or one part with its `blockLogs` log), `reviewedLog(config, log, accepted)` builds a new log, and the result is `deriveResult(config, reviewedLog)`:

1. Fold the original log. Keep only the **in-play** events, meaning those the engine would have counted had they been reps (see decision 2). Every other event is left out of the reviewed log. Live judging never records any of them, so this only matters for synthetic logs.
2. Turn every accepted no-rep into a rep.
3. Group the in-play events by their position, using the same key `groupByPosition` uses: `roundIdx:exIdx` for onTarget, and `minuteIdx:exIdx` for onClock.
4. For each position that moves on at its target, find the new completing rep: the target-th valid rep, accepted ones included. Every event of that position after it is **surplus** and is dropped. A position that takes reps beyond its target is skipped. That is a perInterval line that is the last of its interval, and it never has surplus.
5. **Time back, `rounds` only:** for a position that was complete in the original fold and lost surplus, `g = t(original completing rep) - t(new completing rep)`. Every remaining event with `t > t(original completing rep)` moves `g` earlier. The amounts add up across positions.
6. Fold the result with the unchanged engine.

Why this works: after step 4, every position holds exactly as many valid reps as it did when it completed. The rewritten fold therefore completes each position on the same event that the review chose, and the next event lands in the next position, as it did live. There is no re-flow, and no position bookkeeping is needed beyond step 3.

Step 5 moves everything after the gap by the same amount, so the following hold:
- A rest that starts on a round's completing rep moves with it, and the events after the rest still fall after it.
- The cap check is unchanged, since every event moves earlier.

AMRAP and EMOM skip step 5. Their end is fixed by the clock, and EMOM positions *are* time.

**Alternative considered:** extend today's bucket derivation in `adjust.ts`, which keeps positions fixed and then re-scores, with "acceptances" and a time offset. That would mean re-implementing completion, laps, cap, rest and the stopping EMOM on the side, a second copy of the rules. `unified-engine` removed exactly that duplication.

### 2. `TaggedEvent` carries the event's id and whether it was in play

- `EngineEvent` gains an optional `id`, and `apply` copies it into `TaggedEvent.id`. `LogEntry` already has one, so `fold(config, log, …)` keeps it without a change at the call sites.
- `TaggedEvent.inPlay` is set to `!((finished && repeat !== 'cycle') || isResting(...))`. That is the engine's own "ignored" test without the `!ok` part, so for a rep `counted === inPlay`. On a sequence, events between blocks or after the end are tagged `inPlay: false`.
- `blockLogs` keeps the original `id` instead of renumbering. This is what lets a package name a no-rep by its stored index on a workout of several blocks.

Neither field enters a result, so no golden moves. `use-judge.ts` maps `tagged` back to `LogEntry` with its own index and doesn't change.

**Alternative considered:** pairing `tagged` with the log by sort order. This works today, but it depends silently on `fold`'s sort being stable and on nothing dropping an event. An explicit id costs one field.

### 3. One function lists the no-reps for the screen and the result

`reviewNoReps(config, log, accepted)` returns every in-play no-rep. Each entry has:
- `id`;
- its `blockIdx` (on a workout of several blocks);
- its split position, as `roundIdx`/`exIdx`, using the `Split` convention where the interval index goes in `roundIdx` on onClock;
- its block-local `t`;
- a `status`: `'surplus'` if the reviewed log dropped it (step 4), otherwise `'accepted'` if it is in `accepted`, otherwise `'open'`.

Surplus wins over accepted: a pending or saved acceptance can be made moot by an earlier one, and then it shows as surplus.

Users of the function:
- `session/adjust.tsx` renders the rows from this list. Rows with `'open'` are tappable, and the screen knows which accepted ones are still pending.
- `result-screen.tsx` shows ADJUST RESULT only while `some(status === 'open')`.

Surplus only grows as acceptances are added, because each one moves a completion earlier. So a no-rep that is surplus never becomes acceptable again, and nothing can be accepted "behind" a saved package.

### 4. Stored change: `{ type: 'acceptNoRep', eventIdx }`

- `AdjustmentChange` becomes this single shape. `eventIdx` is the index in `sessions.events`, which is the `LogEntry.id`.
- `deriveAdjustedResult(config, log, changes)` keeps its signature. It turns the changes into the accepted set (ids from every package). With an empty set it returns `deriveResult`. Otherwise it runs `reviewedLog` per block and `combineBlockResults` on a sequence.
- An `eventIdx` that is not an in-play no-rep is ignored rather than thrown on: a bad row must not break a result screen.
- `addAdjustment` keeps the 3-package cap.
- The screen prevents both re-accepting an accepted no-rep and accepting a surplus one, since it only offers `'open'` rows. Duplicates would be harmless anyway, because the derivation works on a set.

### 5. Migration v6 deletes the old packages

`DELETE FROM session_adjustments` in a v6 block. It needs no schema change, since `changes` is already free JSON. All existing rows are target/duration packages from test sessions (user decision). Deleting them keeps the code free of a dead change type.

**Alternative considered:** have the reader skip unknown change types. This keeps the rows, but they would sit there forever, applying nothing.

### 6. Adjust screen

The header with ✕ and "n of 3 packages used" stays, as do the scroller and SAVE PACKAGE below it. Inside the scroller:

- **Score:** the reviewed score, on one line and shrinking to fit as today.
- **Unadjusted score:** below it, in small text, `WITHOUT ADJUSTMENTS 04:49`, shown when it differs (`deriveResult` of the original log).
- **Splits:** they are no longer tappable. Under each split come its no-reps, matched on `(blockIdx, roundIdx, exIdx)`, one row each:
  - the time, as block-local `formatTime`;
  - `NO-REP`;
  - on the right: `KEEP` / `REP` (accent) for open and pending rows, `ACCEPTED` (dim, not tappable) for ones accepted in a saved package, and `SURPLUS` (dim, not tappable).
- **No-reps without a split:** a position reached with no-reps only has no split in the onTarget results. Its no-reps go after the block's last split, under that position's `splitLabel`.
- **Gone:** the duration row, the target inputs and the `MAX_REPS` field limits.

`pending` becomes a `Set<number>` of event ids. The preview is `deriveAdjustedResult` over the saved ids plus the pending ones.

### 7. Goldens

- **Retiring the old cases:** the 24 cases with target/duration `changes` lose them. `tests/goldens.test.ts` keeps writing `adjusted` only for cases with `changes`.
  - A case whose log is the same as another case's on the same workout is deleted, together with its golden file. Its `result` is already pinned by that other case.
  - The rest keep their name and file, minus the `changes`. The `adjusted` key is deleted from the file by hand, and every `result` line is left as recorded.
  - The change's tasks list each case and what happened to it.

  None of this re-records a golden (`-u` is never run). It retires the outputs of a function that no longer exists. CLAUDE.md's golden paragraph gains this as a second documented exception.
- **New cases:** one per rule in the delta spec, each with `changes: [{ type: 'acceptNoRep', eventIdx }]` on synthetic logs with no-reps at known indices. They are recorded once, as new files.
- **New test file:** `tests/review.test.ts` covers `reviewNoReps` statuses: open, accepted, surplus, surplus winning over accepted, and the in-play filtering.

## Risks / Trade-offs

- **[The time given back is an estimate]** `g` is the gap between two recorded reps, not the true cost of the extra rep. → This is the user's chosen rule (B in the exploration). It is applied the same way everywhere and pinned by goldens.
- **[Synthetic logs with ignored events behave differently once reviewed]** Events after a For Time's end, in a rest or between blocks are left out of the reviewed log, so a reviewed result of such a log can differ from its unadjusted one beyond the acceptance. → Live judging never records those events. Only goldens have them, and none of the new cases mix them with acceptances.
- **[Equal timestamps]** Two events with the same `t` keep their stored order, because the sort is stable and the reviewed log is built in fold order. → This is the same behaviour as today.
- **[Lost test packages]** The migration deletes data. → The user confirmed all of it is test data, and it is forward-only like every migration.

## Migration Plan

Schema v6 runs once on update, inside `migrateDbIfNeeded`'s cascade, and deletes every `session_adjustments` row. There is no rollback, consistent with the forward-only migrations. An older build would read an empty table and see unadjusted results.
