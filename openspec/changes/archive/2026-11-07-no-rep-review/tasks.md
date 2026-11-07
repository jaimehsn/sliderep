# Tasks

## 1. Engine: event ids and in-play

- [x] 1.1 In `constants/wod-engine.ts`:
  - give `EngineEvent` an optional `id`;
  - give `TaggedEvent` the optional `id` and `inPlay`, set by `apply` (the "ignored" test without `!ok`) and by the sequence `apply` (`false` between blocks and after the end).

  In `components/result/replay.ts`, make `blockLogs` keep each event's original `id` instead of renumbering (design decision 2). Add `tests/engine.test.ts` cases: ids survive an unsorted log and a sequence; `inPlay` is false after a For Time's end, during a rest and between blocks, and true for a no-rep while running. Verify with `pnpm test` (no golden file changes) and `npx tsc --noEmit`.

## 2. Reviewed result

- [x] 2.1 In `db/session-adjustments.ts`, replace `AdjustmentChange` with `{ type: 'acceptNoRep'; eventIdx: number }` and update its comments. In `db/migrations.ts`, add the v6 block `DELETE FROM session_adjustments` and keep the final `foreign_keys` handling (design decision 5). Verify with `npx tsc --noEmit`. The compile errors left over are the ones in `adjust.ts`, the adjust screen and the fixtures, which the next tasks fix.
- [x] 2.2 Rewrite `components/result/adjust.ts` around `reviewedLog` (design decision 1):
  - in-play filter, acceptances, surplus per position (skipping an interval's last line), and time back on `rounds` only, then `deriveResult`;
  - per block through `blockLogs` and `combineBlockResults` on a sequence;
  - unknown or non-no-rep `eventIdx` ignored;
  - `deriveAdjustedResult` keeps its signature, and with no changes it stays `deriveResult`.

  Add `reviewNoReps(config, log, accepted)` with the `open`/`accepted`/`surplus` statuses (design decision 3). Remove the target/duration code: `tagOnTargetPositions`, `deriveAdjustedOnTarget` and `deriveAdjustedOnClock`. Verify with `npx tsc --noEmit` on this file.
- [x] 2.3 Add `tests/review.test.ts` for `reviewNoReps`:
  - open by default;
  - accepted;
  - a later no-rep made surplus;
  - surplus winning over a pending acceptance;
  - no-reps after a For Time's end or in a rest not listed;
  - EMOM last-line no-reps never surplus;
  - block-local `t` and `blockIdx` on a sequence.

  Verify that `pnpm test` passes.

## 3. Goldens

- [x] 3.1 Retire the target/duration cases (design decision 7), with no `-u` run. Delete each of these cases, with its `tests/__goldens__/<name>.json`, because the plain case shown pins the same log:
  - `fran-adjusted-target-down`, `fran-adjusted-target-up` → `fran-complete`
  - `cindy-adjusted-target`, `cindy-adjusted-duration`, `cindy-adjusted-target-up` → `cindy-partial-round`
  - `emom-adjusted-duration` → `emom-all-completed`
  - `fran-cap-adjusted-raised` → `fran-cap-mid-position`
  - `fran-cap-adjusted-target-up` → `fran-cap-finished-under`
  - `emom90-adjusted-duration`, `emom90-adjusted-target-up` → `emom90-all-completed`
  - `pair-adjusted-target-first-up`, `pair-adjusted-duration-shorter` → `pair-all-completed`
  - `deathby-adjusted-target-up`, `deathby-adjusted-target-down` → `deathby-stopped-13`
  - `rested-adjusted-target-down` → `rested-completed`
  - `tabata-reps-in-rest-adjusted` → `tabata-reps-in-rest`
  - `tabata-adjusted-target-up` → `tabata-all-completed`
  - `buyin-adjusted-target-down`, `buyin-adjusted-legacy-change` → `buyin-complete`
  - `amrap-then-for-time-adjusted-cap` → `amrap-then-for-time-capped`

  Keep `emom-adjusted-target`, `fran-cap-adjusted-shorter`, `pair-adjusted-target-second-down` and `pair-adjusted-duration-raised`, whose logs are unique:
  - drop their `changes`;
  - delete the `adjusted` key from their golden files by hand, leaving every `result` line as recorded;
  - add a comment in `tests/fixtures.ts` saying their names predate this change.

  Verify that `pnpm test` passes, and that `git diff --stat tests/__goldens__` shows only deletions.
- [x] 3.2 Add new golden cases with `changes: [{ type: 'acceptNoRep', eventIdx }]` on synthetic logs, one per spec rule:
  - **FRAN:** a no-rep in the last position (the 04:49 → 04:46 example); a no-rep in round 1 giving time back to every later split; and a no-rep made surplus by an earlier acceptance.
  - **FRAN CAP 10:** the last position's missing rep was a no-rep (the result becomes TIME); and a no-rep in a completed position (CAP · N unchanged).
  - **RESTED:** time given back across a rest.
  - **CINDY:** a no-rep in a completed position (+0); and a no-rep in the unfinished round (+1).
  - **EVERY MINUTE:** a missed minute completed; and a no-rep beyond the target on a last line.
  - **The two-exercise-minute EMOM:** a first-line no-rep whose surplus keeps the second line's reps.
  - **DEATH BY:** a no-rep in the missed minute moving the stop.
  - **BUY-IN AMRAP:** a no-rep in the buy-in, with the AMRAP group and score unchanged.

  Record each new file once with a plain `pnpm test`, and check every recorded value against the delta spec's scenarios before committing. Verify that `pnpm test` passes.

## 4. Screens

- [x] 4.1 In `components/result/result-screen.tsx`, show ADJUST RESULT only when, on top of today's conditions, `reviewNoReps` over the saved acceptances has an `open` no-rep. Verify with `npx tsc --noEmit` and `pnpm lint`.
- [x] 4.2 Rebuild the body of `app/session/adjust.tsx` (design decision 6):
  - `pending` is a set of event ids, and the preview is over the saved ids plus the pending ones;
  - show `WITHOUT ADJUSTMENTS <score>` when the reviewed score differs from the unadjusted one;
  - splits are not tappable; each one has its no-rep rows with time, `NO-REP` and `KEEP`/`REP`, `ACCEPTED` or `SURPLUS`;
  - no-reps without a split go after their block's last split, under their position's label;
  - remove the duration row, the target inputs and the `MAX_REPS` usage;
  - SAVE PACKAGE stores the pending ids as `acceptNoRep` changes.

  Verify with `npx tsc --noEmit` and `pnpm lint`.
- [x] 4.3 Device check on Android: judge FRAN with a no-rep in the last position and one in round 1, then accept both (one per package) and check the time against the spec examples. Then:
  - check SURPLUS appears when an earlier no-rep is accepted;
  - check ADJUST RESULT disappears once no no-rep is left;
  - check a session with no no-reps has no ADJUST RESULT;
  - check the CINDY and EMOM effects;
  - check the update from a build with an old package (v6 deletes it).

  Check the layout at 360 × 640 dp and at 1.3× font scale with many no-reps in one split, a long exercise name and a multi-block workout's group titles.

## 5. Documentation

- [x] 5.1 Update `CLAUDE.md`:
  - the `session/adjust.tsx`, `adjust.ts`, `session-adjustments.ts`, `result-screen.tsx`, `migrations.ts` (v6) and engine `TaggedEvent` descriptions;
  - the goldens paragraph: target/duration cases retired by this change as a second documented exception, plus the new no-rep cases.

  Update `docs/ROADMAP.md`'s modifications text in *WOD hierarchy*, *Exercise sessions* and *Design* (`session/adjust.tsx` line) to "accept no-reps". Verify by reading the touched sections against the code.

## Workflow follow-up

- At archive, update `openspec/specs/result-adjustment/spec.md`'s Purpose: it still says "a split's target or the workout's duration".
- Archive the change after the device check.
