# Tasks

## 1. Golden fixtures first

- [x] 1.1 Let a `GoldenCase` in `tests/fixtures.ts` name a synthetic workout as well as a built-in. Add a capped 21-15-9 THRUSTERS + PULL-UPS workout (10 min cap) and a capped one-round workout, both built through `parseWorkoutRow` (design decision 7). Verify that `pnpm test` stays green and no file under `tests/__goldens__/` changes.

## 2. Engine

- [x] 2.1 Add `capSeconds(config)`. Make `advanceTo` finish a capped `rounds` state at the cap, and `view` label the timer `elapsed · cap mm:ss` (design decisions 1, 2 and 5). Verify that `pnpm test` stays green with no golden change.
- [x] 2.2 Append ` · <m> min cap` to `describeContent` for a capped workout. Add `tests/engine.test.ts` cases covering:
  - the capped description;
  - the timer label;
  - finishing at the cap;
  - a rep at exactly the cap not counting;
  - an uncapped FRAN unchanged.

  Verify that `pnpm test` passes.

## 3. Results

- [x] 3.1 In `components/result/replay.ts`, score a capped, incomplete workout as `CAP · N reps` (design decision 3).
- [x] 3.2 In `components/result/adjust.ts`, for a capped workout, apply the adjusted cap with `t < cap` and check completeness over every position of the block (design decision 4). Uncapped For Time stays on its current path.
- [x] 3.3 Add golden cases for:
  - finished under the cap;
  - capped mid-position (the spec's CAP · 51 reps);
  - a rep exactly at the cap;
  - a shortened cap;
  - a raised cap;
  - a raised target on a capped workout.

  Record only these new files. Verify that every pre-existing golden is byte-identical (`git status tests/__goldens__` lists only new files) and that `pnpm test` passes.

## 4. Judging and presentation

- [x] 4.1 In `hooks/use-judge.ts`, play the end sound when a state finishes without being complete, instead of `repeat !== 'rounds'` (design decision 5). Verify with `npx tsc --noEmit`.
- [x] 4.2 Show `<m> min cap` as the duration line in `app/library/[id].tsx` and `components/judge/start-overlay.tsx`, and label the duration field as a cap in `app/session/adjust.tsx` for a capped workout. Verify with `npx tsc --noEmit` and `pnpm lint`.

## 5. Editor

- [x] 5.1 Add `cap` to `ForTimeDraft` in `components/editor/draft.ts`, with validation, `draftToStoredBlock`, `draftFromBlock` and `switchFormat` (design decision 6). Add `tests/draft.test.ts` cases for:
  - a cap saving as `durationSeconds`;
  - a cap round-tripping through DUPLICATE;
  - a 0 cap being flagged;
  - the built-ins' round-trip unchanged.

  Verify that `pnpm test` passes.
- [x] 5.2 Add the optional TIME CAP (MIN) field next to ROUNDS in `app/library/new.tsx`, with its problem message. Verify with `npx tsc --noEmit` and `pnpm lint`.

## 6. Docs

- [x] 6.1 Update `CLAUDE.md`:
  - the WOD System entry (cap, `capSeconds`, the `<` edge rule vs AMRAP/EMOM's `<=`);
  - the result `replay.ts`/`adjust.ts` entries;
  - `use-judge`'s end sound;
  - the editor `draft.ts` entry.

  Also update `docs/ROADMAP.md`:
  - mark C2a done in the WOD editor plan;
  - settle the "For Time with time cap" assumption as decided (CAP · N reps).

  Verify that both documents match the code.

## 7. Verification

- [x] 7.1 Run `openspec validate for-time-cap --strict`, `npx tsc --noEmit`, `pnpm lint` and `pnpm test`. Verify that all pass and that no pre-existing golden changed.
- [x] 7.2 On device:
  - create a 21-15-9 with a 2 min cap;
  - judge it past the cap, and check "ELAPSED · CAP 02:00", the end sound at 02:00 and "CAP · N reps";
  - judge it again finishing under the cap, and check that it shows TIME and plays no end sound;
  - adjust the capped session's cap down, and check the score;
  - duplicate it, and check that the cap is kept;
  - check that FRAN is unchanged.
