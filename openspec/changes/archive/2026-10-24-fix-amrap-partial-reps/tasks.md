# Tasks

## 1. Unadjusted AMRAP score

- [x] 1.1 In `components/result/replay.ts`, compute the AMRAP "+ N" as the counted tagged events in the final state's round (design decision 1) and update the comment above it; verify that `pnpm test` fails only on the CINDY goldens listed in design decision 4 with a `result` change, and only on their `scoreValue` line
- [x] 1.2 Hand-edit the `result.scoreValue` line of `cindy-partial-round`, `cindy-no-reps`, `cindy-adjusted-target` and `cindy-adjusted-duration` to the values in design decision 4 (never `vitest -u`); verify that the only remaining failures are those cases' `adjusted` score

## 2. Adjusted AMRAP score

- [x] 2.1 In `components/result/adjust.ts`, sum `kept.length` over every position of the first incomplete round (design decision 2) and update its comment; hand-edit the `adjusted.scoreValue` of `cindy-adjusted-target` (7 + 29) and `cindy-adjusted-duration` (6 + 20); verify `pnpm test` passes and `git diff tests/__goldens__` touches only the six `scoreValue` lines in design decision 4

## 3. Pin the scenarios

- [x] 3.1 Add `cindy-two-lines-into-round` (195 reps), `cindy-round-just-finished` (180 reps) and `cindy-adjusted-target-up` (239 reps, round 3 pull-ups raised to 8) to `tests/fixtures.ts`; run `pnpm test` to record their goldens and verify they read `6 + 15`, `6 + 0` and adjusted `2 + 30`
- [x] 3.2 State the golden exception (hand correction only for a deviation from the spec, in its own change) in `CLAUDE.md`'s golden paragraph and the header of `tests/goldens.test.ts`; verify both say the same, and run `npx tsc --noEmit`, `pnpm lint` and `pnpm test` cleanly

## 4. Device check

- [x] 4.1 On device, reopen the CINDY session from the report in History and verify it now reads `6 + 15`; judge a new CINDY that ends partway into a round's push-ups and verify the score adds the pull-ups too
- [x] 4.2 Run `openspec validate fix-amrap-partial-reps --strict` and verify it passes
