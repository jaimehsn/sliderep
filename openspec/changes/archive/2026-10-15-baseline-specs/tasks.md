# Tasks

No code is built in this change. These tasks check the baseline specs against the app and settle the open questions in `proposal.md` before archiving.

## 1. Review specs against the app

- [X] 1.1 Review `specs/wod-formats/spec.md` against FRAN, CINDY, EVERY MINUTE and FILTHY FIFTY in the app, and verify each scenario matches what the app does (fix the spec, not the code, on mismatch)
- [X] 1.2 Review `specs/judging/spec.md` by running one session per format, and verify gestures, timers, auto-finish and abort match the scenarios
- [X] 1.3 Review `specs/session-flow/spec.md` by walking judge+scan, judge+skip, judged+scan and judged+skip, and verify each path matches its scenarios
- [X] 1.4 Review `specs/session-results/spec.md` against the result screen for one session per format, and verify scores, splits and banners match
- [X] 1.5 Review `specs/result-adjustment/spec.md` by saving packages that lower a target, raise a target and shorten a duration, and verify the adjusted result matches the scenarios
- [X] 1.6 Review `specs/session-storage/spec.md` against the four save combinations, and verify which ones appear in History and which are saved as foreign
- [X] 1.7 Review `specs/athlete-profile/spec.md` by creating, renaming and deleting a profile, and verify own sessions are removed and foreign ones kept
- [X] 1.8 Review `specs/history/spec.md`, `specs/library/spec.md` and `specs/app-shell/spec.md` against their screens (including the first-run prompt on a fresh install), and verify the scenarios match

## 2. Settle the open questions

Confirming a question keeps the spec as written. Choosing different behavior keeps the spec as written here too (it describes today's app) and opens a separate change with a MODIFIED delta.

- [x] 2.1 Decide on EMOM extra reps (live count capped, result counts all), and verify the decision is recorded in `proposal.md` → Open Questions
- [x] 2.2 Decide on the adjustment duration cutoff by raw timestamp, and verify the decision is recorded in `proposal.md`
- [x] 2.3 Decide on the unclamped EMOM adjusted total, and verify the decision is recorded in `proposal.md`
- [x] 2.4 Decide on the first-run prompt reappearing after a hardware back, and verify the decision is recorded in `proposal.md`
- [x] 2.5 Decide on silent failed saves (and the banner still saying "saved"), and verify the decision is recorded in `proposal.md`
- [x] 2.6 Decide on the missing ✕ on the post-judging result, and verify the decision is recorded in `proposal.md`
- [x] 2.7 Decide on the missing "won't be saved" warning when judged without a profile, and verify the decision is recorded in `proposal.md`
- [x] 2.8 List every question decided as "change it" as a follow-up change name in `proposal.md`, and verify each one has a name

## 3. Validate

- [x] 3.1 Run `openspec validate baseline-specs --strict` after any spec edits from groups 1–2, and verify it reports the change as valid

## Workflow follow-up

- Archive with `/opsx:archive` to create `openspec/specs/<capability>/spec.md` for all ten capabilities.
- Verify `openspec list --specs` shows the ten capabilities after archiving.
- Start each follow-up change from 2.8 with `/opsx:propose`.
