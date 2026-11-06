# Tasks

Layout checks on emulators and on the phone are done **by the owner, manually, when they choose**. The apply step never starts an emulator or runs group 7: it finishes groups 1 to 6, hands over group 7's checklist, and leaves those boxes for the owner's results.

## 1. Quick fixes

- [x] 1.1 Make `app/history/index.tsx`'s list a `ScrollView`, keeping the look of the rows. Verify with `pnpm exec tsc --noEmit` and `pnpm lint`.
- [x] 1.2 In `app/session/setup.tsx`'s header row, give the text side `flex: 1` so the name wraps and ✕ / "‹ ROLE" keep their size. Read every other row with a name and an exit, `session/result` and `history/[id]` included, and apply the same rule where it's missing. Verify with `tsc` and lint.

## 2. Input limits

- [x] 2.1 In `components/editor/draft.ts`, add `MAX_NAME_LENGTH` (40), `MAX_REPS` (999) and `copyName(name)`, and enforce both limits in `validateWorkoutDraft` and `lineProblem`. Keep `parseCount` general. Cover in `tests/draft.test.ts`: names of 40 and 41 characters, reps of 999 and 1000, and `copyName` on a short name, on a 40-character name and on a cut that lands on a space. Verify with `pnpm test`, with no golden changed.
- [x] 2.2 Add `maxLength` to the name and reps fields in `app/library/new.tsx` and `components/editor/block-editor.tsx`, and use `copyName` for DUPLICATE. Verify with `tsc` and lint.
- [x] 2.3 In `app/profile.tsx`, add the 24-character alias limit to the field and to CREATE and SAVE. Handle the existing-longer-alias case from `design.md`'s risks so that opening the screen never changes the stored alias. Verify with `tsc` and lint.
- [x] 2.4 In `app/session/adjust.tsx`, limit a target to three digits on the field, leaving duration unlimited. Verify with `tsc` and lint.

## 3. Text scaling

- [x] 3.1 Add `components/text.tsx`, with `Text` and `TextInput` defaulting `maxFontSizeMultiplier` to 1.3 and overridable by the caller. Verify with `tsc`.
- [x] 3.2 Swap the `Text` / `TextInput` imports to it in all screens and components, changing import lines only. Verify with `tsc` and lint.
- [x] 3.3 Add an ESLint `no-restricted-imports` rule forbidding `Text` and `TextInput` from `react-native` outside `components/text.tsx`. Verify that `pnpm lint` passes, and that a temporary direct import fails it.
- [x] 3.4 Set `allowFontScaling={false}` on the judging timer, count, reps left and both scores, and `maxFontSizeMultiplier={1.3}` on the exercise name's `Animated.Text`. Verify with `tsc` and lint.

## 4. Judging screen

- [x] 4.1 Add `components/judge/count-size.ts` with `countFontSize(zoneWidth, zoneHeight, targetDigits)`, and test it in `tests/`: 2 digits in a large zone gives 190, more digits give less, a short zone is limited by height, and 4 digits still fit. Verify with `pnpm test`.
- [x] 4.2 Use it in `components/judge/count-readout.tsx`, read from the zone's `onLayout`, with the reps-left size in the same proportion. Verify with `tsc` and lint.
- [x] 4.3 In `app/session/run.tsx`, add the short-screen rule from `design.md`: a smaller band with a floor, and a minimum exercise zone that holds `BLOCK n/N` and the name. Start with values computed for 360 × 640, leaving final tuning to group 7. Verify with `tsc` and lint.
- [x] 4.4 In `components/judge/judge-header.tsx`, put tags and timer on one line and let the timer block shrink. Verify with `tsc` and lint.

## 5. Result and adjust

- [x] 5.1 In `components/result/result-screen.tsx`, move the header and score inside the `ScrollView` and fit the score to one line in a full-width container. Verify with `tsc` and lint.
- [x] 5.2 In `app/session/adjust.tsx`, keep the title row fixed, scroll the score, duration row and splits, keep SAVE PACKAGE outside the scroller, add `keyboardShouldPersistTaps="handled"`, and fit the score to one line. Verify with `tsc` and lint.

## 6. Forms and docs

- [x] 6.1 Wrap the content of `app/profile.tsx`, `app/first-run.tsx`, `app/settings.tsx`, the `app/session/setup.tsx` phases and `components/session/scan-person.tsx`'s choice view in a centered, `flexGrow: 1` `ScrollView`, with the camera view left as it is. Verify with `tsc` and lint.
- [x] 6.2 Update `docs/ROADMAP.md`: the product context's target (popular portrait phones, Android-tested), and the responsive review in Known issues. Update `CLAUDE.md` for `components/text.tsx`, `count-size.ts`, the limits and the scrolling changes. Verify by reading both against the code.
- [x] 6.3 Run `openspec validate responsive-review --strict`, `pnpm exec tsc --noEmit`, `pnpm lint` and `pnpm test`. Verify that all pass and `git diff` shows no change in `tests/__goldens__/`.

## 7. Manual review (owner only, not part of apply)

Run on three devices: a 360 × 640 emulator, a roughly 412 × 915 emulator, and the owner's phone.

Stress data, created in the app:

- A 24-character alias.
- `STRESS`, named with 40 characters: a For Time block with a 150-rep line and a 10-minute cap, an EMOM block of 30 intervals with two exercises per interval, and a scoring AMRAP block.
- `BIG`: a one-block For Time with a single 999-rep line.
- Enough saved sessions to overflow History (8 sessions of a 1-rep workout are enough, as "I'll be judged" with SKIP).

Checks:

- [x] 7.1 Every screen at 1× stays inside the screen, including the hub, Library and its detail, the workout picker, Settings, My QR, the first-run prompt (fresh install), the workout editor with three blocks, and the exercise picker.
- [x] 7.2 Set the system font size to 1.3× and repeat 7.1, and then to the largest setting on one list screen and the judging screen: text stops growing at 1.3×, and the timer, count, reps left and scores don't grow at all.
- [x] 7.3 Judge `STRESS` on the 360 × 640 emulator: `BLOCK n/N` and the name are visible, the count, reps left and target are fully visible at 150, and swiping is comfortable. Tune the band's floor and threshold here if needed, and record the values in `design.md`.
- [x] 7.4 Judge `BIG` past 100 reps: the count's size doesn't jump at 99 → 100. Confirm that two-digit targets on the large emulator look the same as today.
- [x] 7.5 On the result, with the longest banner (owner as judge with a scanned QR) and a long score: all of it can be reached by scrolling, and the score stays on one line. Do the same on adjust with the keyboard open, including tapping another row and SAVE PACKAGE.
- [x] 7.6 With the keyboard open on 360 × 640: all buttons on the profile screen and every field in the editor can be reached.
- [x] 7.7 In History, scroll to the oldest session and open it. In `setup`, with `STRESS`, ✕ and "‹ ROLE" stay on screen and work.
- [x] 7.8 Limits: the name stops at 40, the alias at 24, reps and adjusted targets at 3 digits. Duplicating `STRESS` gives a 40-character name ending in " COPY". The My QR screen with a 24-character alias scans from a second device.

## Workflow follow-up

- Archive the change once the owner has completed group 7.
