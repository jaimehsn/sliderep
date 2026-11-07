# Proposal

## Why

The post-judging adjustment lets the judge rewrite a split's target or the workout's duration. That is a bigger tool than the problem it serves. What a judge actually wants to correct at the end of a session is their own call: a no-rep they gave that, on second thought, was a good rep.

This change narrows the adjustment to exactly that. The judge reviews the no-reps they gave and may accept any of them as reps. The result is then recomputed as if the athlete had not been made to repeat the rep. The position finishes on that rep, the reps the athlete did to make up for it are dropped, and on a For Time the time they took is given back.

## What Changes

- **BREAKING** The adjust screen no longer changes targets or durations. Instead, it lists the no-reps given during judging, each under its split, and each may be kept or accepted as a rep.
- **Accepting a no-rep:**
  - Its position reaches its target one valid rep earlier.
  - The events the athlete did in that position after the new completing rep are **surplus**: they no longer count. Those events are the made-up rep and any no-rep after it.
  - Reps never move to another position (the existing "no re-flow" rule). A position that takes reps beyond its target has nothing surplus: the last exercise of an EMOM interval is such a position.
- **Time compensation (For Time / Chipper):**
  - When a position loses surplus events, the time between its new and its original completing rep is taken off everything that follows in its block. So the splits, the TIME, the rests and the next positions move earlier.
  - AMRAP and EMOM have no compensation, because their end and their intervals are fixed by the clock.
  - On a workout of several blocks, the compensation stays inside the block. Every block keeps its start and is scored on its own clock.
- **Effects by format:**
  - A capped For Time whose last position gets its missing rep this way finishes, and is scored as TIME.
  - An AMRAP gains a rep only in a position that was short of its target.
  - An EMOM interval missed by a no-rep can become completed, and a stopping EMOM then stops later.
- **Packages:**
  - The 3-per-session, append-only packages stay. A package is now a set of accepted no-reps.
  - An accepted no-rep is final: later packages cannot turn it back into a no-rep.
  - A no-rep that has become surplus cannot be accepted.
- ADJUST RESULT is offered only while there is at least one no-rep left to accept, on top of today's conditions: owner was the judge, has a profile, saved session, fewer than 3 packages, right after judging.
- **BREAKING** Every saved adjustment package is deleted by a migration (schema v6). They are all target/duration packages from test sessions.
- The goldens with an `adjusted` result for target/duration changes lose it. Their recorded `result` lines stay untouched. New goldens pin accepted no-reps.

## Capabilities

### New Capabilities
<!-- none -->

### Modified Capabilities
- `result-adjustment`: replaces target and duration changes with accepting no-reps. Adds the surplus and time-compensation rules, final accepted no-reps, ADJUST RESULT only with no-reps left, and the deletion of the old packages. Removes the target/duration requirements.
- `session-results`: the AMRAP score requirement is replaced by one without its adjusted-duration and adjusted-target wording and scenarios ("AMRAP rounds and reps"), so the obsolete scenarios can go.

## Impact

- `constants/wod-engine.ts`: `TaggedEvent` gains the event's `id` and whether it was applied while its block was running (`inPlay`). Results are unchanged.
- `components/result/adjust.ts`: rewritten around a reviewed log, which the existing `deriveResult` folds. `components/result/replay.ts`: `blockLogs` keeps the original event ids.
- `db/session-adjustments.ts`: `AdjustmentChange` becomes `{ type: 'acceptNoRep', eventIdx }`. `db/migrations.ts`: v6 deletes every `session_adjustments` row.
- `app/session/adjust.tsx`: a new screen body. It lists no-reps with KEEP / REP, shows surplus ones, and has no duration or target fields.
- `components/result/result-screen.tsx`: ADJUST RESULT also needs a no-rep left to accept.
- `tests/fixtures.ts`, `tests/goldens.test.ts`, `tests/__goldens__/`: the old adjusted cases are retired, new no-rep cases are added, and a test covers the no-rep review states.
- `CLAUDE.md` and `docs/ROADMAP.md`: the adjustment and goldens descriptions.
