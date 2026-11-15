# Tasks

## 1. Test cases first (recorded before any engine edit)

- [x] 1.1 In `tests/fixtures.ts`, add `SHARED_CLOCK_WORKOUTS`, a separate list of rows in the new stored shape (design decision 8). It is not yet read by `workout()`, and is enabled in 2.2:
  - `example1`: 12 min cap; 15 RING MUSCLE-UPS; 5 rounds of 1 LEGLESS ROPE CLIMBS + 3 FRONT SQUATS; 15 RING MUSCLE-UPS.
  - `rowThenAmrap`: 12 min; 50 ROW; AMRAP 5 PULL-UPS, 10 PUSH-UPS, 15 AIR SQUATS.
  - `restedParts`: no cap; 1-round 10 BURPEES; 3 rounds of 5 THRUSTERS with 30 s rest.

  Write the log helpers and the golden case list for them, but leave the cases disabled until 2.4. Verify that `pnpm test` passes and that `git status` shows no recorded file changed.

## 2. Engine and storage

- [x] 2.1 In `constants/wod-engine.ts`, implement design decisions 1–4:
  - `checkWindow` allows several `rounds` parts plus an optional final `cycle` (with a limit), and rejects `once` in a continuous window;
  - `windowShape` is `cycle` when the last structure is one;
  - add the prefix path, `prefixLength` and `partAt`;
  - `lineAt`, `nextPosition` (entering the cycle without a tally) and the rest between rounds within one part only;
  - `kpiAt` within the part.

  Verify that `pnpm test` passes with every golden and presentation file unchanged.
- [x] 2.2 In `db/workouts.ts`, add `StoredWindowBlock` and its strict parser beside the legacy one, told apart by `'clock' in block` (design decision 8). Enable `SHARED_CLOCK_WORKOUTS` in `workout()`. Add engine tests covering:
  - each built-in rewritten in the new shape parses to a config deep-equal to the legacy row's;
  - the three new rows parse;
  - a `cycle` not last, a `cycle` without a limit, an empty structure list, an empty round and an `everySeconds` of 5 each throw.

  Verify that `pnpm test` passes.
- [x] 2.3 Implement the presentation of design decision 6: `describeMode`/`describeContent` for several parts, `sections` on `WodConfig` (absent for one part), and `durationLine` for several parts. Then design decision 5: `partLabel?` in `view`, passed through the sequence view, left undefined for one part. Add `engine.test.ts` assertions for the spec scenarios:
  - example 1's description;
  - `rowThenAmrap`'s mode and description;
  - the section titles;
  - `PART 2/3` with round 1/5 after the buy-in;
  - `rounds` 3 for the AMRAP part.

  Verify that every existing presentation file is byte-identical.
- [x] 2.4 In `components/result/replay.ts`, implement design decisions 3, 4 and 7:
  - `CAP · N reps` for a `cycle` window still in its prefix;
  - the cycle round label counted from the prefix;
  - `partIdx` on the splits of a window of several parts.

  Enable the new golden and presentation cases and record them, as new files only:
  - `example1-complete`, `example1-capped-in-rounds`, `rowthenamrap-reached`, `rowthenamrap-not-reached` and `restedparts-complete`;
  - `review-example1-buyin-no-rep` (time shifts across parts);
  - `review-rowthenamrap-row-no-rep` (no shift).

  Check each recorded file against the spec scenarios by hand: `6 + 7`, `CAP · 38 reps`, "Round 1 — PULL-UPS", and "Station 1 — RING MUSCLE-UPS" in parts 1 and 3. Verify that `git status` shows only new files under `tests/__goldens__/` and `tests/__presentation__/`.

## 3. Editor

- [x] 3.1 Rework `components/editor/draft.ts` to the draft of design decision 9:
  - `ContinuousDraft` with `RoundsPart`/`AmrapPart`, plus `EmomDraft` unchanged;
  - `TEMPLATES`, `applyTemplate` and `templateOf`;
  - `addPart`, `removePart` and `setPartKind`, with "+ PART" inserted before a final AMRAP;
  - part-aware line helpers and validation keys;
  - `draftToStoredBlock` writes only the new shape;
  - `draftFromWindow` maps every structure;
  - `workoutDraftFromConfig` keeps working.

  Adapt `tests/draft.test.ts` and add cases for:
  - each template;
  - switching templates keeping the lines;
  - "+ PART" before an AMRAP part;
  - AMRAP not last and missing minutes being refused;
  - example 1 saving and reparsing to the same config as its fixture;
  - DUPLICATE of FRAN, of an EMOM and of `rowThenAmrap`.

  Verify that `pnpm test` passes.
- [x] 3.2 In `components/editor/block-editor.tsx`:
  - replace the FORMAT segment with a template row (highlight from `templateOf`);
  - extract `PartEditor` from today's FOR TIME and AMRAP UIs, with a `PART n` header, a ROUNDS/AMRAP choice and ✕ only when there are several parts;
  - add "+ PART";
  - add the one time field labelled TIME CAP (MIN) or MINUTES.

  With one part, the block must render as before. Adapt `app/library/new.tsx` only if its problem routing needs it. Verify that `npx tsc --noEmit` and `pnpm lint` pass.

## 4. Screens

- [x] 4.1 Make the screens show parts:
  - `hooks/use-judge.ts` returns `partLabel`, and `app/session/run.tsx` shows `[blockLabel, partLabel]` joined by " · " in the existing slot;
  - `components/workout-breakdown.tsx` renders `sections` (top level and per block), used by the Library detail and the pre-start summary;
  - `components/result/result-screen.tsx` and `app/session/adjust.tsx` add a `PART n` subheading before each part's first split.

  Verify that `npx tsc --noEmit`, `pnpm lint` and `pnpm test` pass.
- [x] 4.2 Update `CLAUDE.md` for the window model's parts, the new stored shape, the editor's templates and parts, `partLabel` and the split subheadings. Mark E2 done in `docs/ROADMAP.md`. Verify that every symbol named exists in the code.

## 5. Device verification

- [x] 5.1 Create example 1 from the FOR TIME + BUY-IN/CASH-OUT template, and a 12-minute 50 cal ROW + CINDY from BUY-IN + AMRAP, both on a 360 × 640 dp screen. Check:
  - the editor's parts, ✕, "+ PART" and the time field label;
  - the Library card and detail, including the long description wrapping;
  - DUPLICATE of both, and of an older workout.
- [x] 5.2 Judge both. Check:
  - `PART n/N` and the per-part KPI;
  - remaining time during the row;
  - no cue on part changes;
  - the finish;
  - each result's score and `PART n` subheadings.

  Accept a buy-in no-rep on each and check that example 1's times move and the AMRAP's don't. Judge FRAN and one older multi-block workout and verify that they look as before.
- [x] 5.3 Run `openspec validate shared-clock --strict` and verify that it reports the change as valid.

## Workflow follow-up

- Archive with `/opsx:archive`, syncing the ADDED/MODIFIED requirements of `wod-formats`, `workout-editor`, `judging`, `session-results`, `result-adjustment` and `library`.
- Next: E3 `max-lines` (MAX reps, the global score and the box-AMRAP template; example 2).
