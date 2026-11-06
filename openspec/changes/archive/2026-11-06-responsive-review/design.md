# Design

## Context

See `proposal.md` for the motivation and `specs/phone-layout/spec.md` for the contract.

Current state, from reading the code (nothing here has been measured on a device yet):

- **Text:** screens import `Text` and `TextInput` straight from React Native, in about 24 files with 188 text elements. Nothing limits font scaling.
- **Limits:** no input has `maxLength`, and `parseCount` has no upper bound.
- **Judging layout (`app/session/run.tsx`):** the header is 140 and the band is about 220, and two zones share what's left, 92:288.
  - On 360 × 640 with system bars, about 570 dp is usable, so the zones get about 50 and 160.
  - The count's line height is 170, which doesn't fit 160 even with two digits. `BLOCK n/N` plus the exercise name also needs more than 50.
  - Three digits at size 190 come to an estimated 365 dp wide, including the reps-left column.
- **Result and adjust:** the header and score are fixed above a `flex: 1` scroller, so they can squeeze the splits down to nothing.
- **Forms:** `profile`, `first-run`, `settings`, `setup` and `scan-person` are centered `View`s with no scrolling.

## Goals / Non-Goals

**Goals:**

- Meet `phone-layout` with the fewest moving parts: one text module, one sizing function, and local style fixes.
- Keep the app's look on common phones unchanged, except where something actually doesn't fit.

**Non-Goals:**

- A shared layout system, breakpoints or scaled design tokens.
- Any change to the engine, storage or results. Goldens don't change.
- Automated layout tests. Only the pure logic gets vitest coverage; layout is checked by hand.

## Decisions

### A thin text module instead of a global default

`components/text.tsx` exports `Text` and `TextInput`, which wrap React Native's with `maxFontSizeMultiplier={1.3}` unless the caller passes its own. Screens change only their import line, not each element. An ESLint `no-restricted-imports` rule forbids `Text` and `TextInput` from `react-native` outside this module, so new screens can't miss it.

**Alternatives:**

- **`Text.defaultProps`:** this was the first idea, but `Text` is a plain function component in RN 0.88 with React 19, where function components' `defaultProps` are no longer supported. It isn't reliable, and `TextInput` would need the same trick.
- **Setting the prop on all 188 elements:** noisy, and easy to forget in the next screen.

### Fixed numbers opt out explicitly

The timer, count, reps left and both scores pass `allowFontScaling={false}`. `Animated.Text` (count, exercise name) doesn't go through the module, so these two set their props directly: the count opts out, and the exercise name caps at 1.3.

### The rep count's size comes from a pure function

`components/judge/count-size.ts` exports `countFontSize(zoneWidth, zoneHeight, targetDigits)`, returning the largest size up to 190 at which the count and the reps-left column fit. `CountReadout` reads its zone from `onLayout` and passes the digits of the **target**, not the current count, so the size doesn't jump at 99 → 100 and only changes with a new target. The reps-left size follows the same ratio.

Measured digit-width constants live next to the function, and vitest covers it: 2 digits on a large zone gives 190, each more digit gives less, and a short zone is limited by height. It handles any digit count, because an EMOM increment can pass 999.

**Alternative:** `adjustsFontSizeToFit`, as `exercise-name.tsx` does. It's less code, but it fits on current content, so the size would jump as digits change, and it's harder to keep the count and the reps-left column in proportion.

### The judging screen fits by shrinking its zones

The header and band keep their design size down to where they don't fit. On short screens the band gives up height first, with a floor that keeps it comfortable to swipe, and the exercise zone gets a minimum height that holds `BLOCK n/N` plus the name. The band is the input surface, so its floor comes before the count's size: the count is what shrinks in the end, through `countFontSize`.

This uses `useWindowDimensions` in `run.tsx` for one height threshold, not a general scale. The exact floor is tuned against 360 × 640 during the manual review.

The header's tags and the timer get `numberOfLines={1}`, and the timer block can shrink, so a long cap label or a timer of 100:00 or more doesn't push the KPI out.

### Result and adjust scroll as one

On the result screen, the header, score and splits all go inside the one `ScrollView`, so a long header can't squeeze the splits. On adjust, the title row with ✕ stays fixed, and the score, duration row and splits scroll. `keyboardShouldPersistTaps="handled"` keeps a tap on another row or on SAVE PACKAGE working with the keyboard open, and SAVE PACKAGE stays outside the scroller.

Both scores use `numberOfLines={1}` with `adjustsFontSizeToFit`, in a full-width container. Scores change only once, so a jump doesn't matter here.

**Alternative:** keep the score fixed above the scroller. It's nicer to see while scrolling splits, but it's the very thing that breaks on short screens.

### Forms scroll inside, centered when they fit

`profile`, `first-run`, `settings`, the `setup` phases and `scan-person`'s choice view wrap their content in a `ScrollView` with `flexGrow: 1` and centered content. They look the same when everything fits. `scan-person`'s camera view stays as it is, since it fills the screen and has no text fields.

### Header rows: the text takes the space

In any row with a name and an exit, the text side gets `flex: 1` and the exit stays at its own size. This is the fix for `setup.tsx`, and the rule for checking the rest.

### Limits live in input and validation

- **Input:** `maxLength` on the name (40), alias (24), reps (3) and adjust target (3) fields.
- **Validation:** `draft.ts` holds `MAX_NAME_LENGTH` and `MAX_REPS`, checked in `validateWorkoutDraft` and `lineProblem`, since DUPLICATE can prefill values `maxLength` never saw. A separate `copyName(name)` there builds the DUPLICATE name, and `app/library/new.tsx` calls it instead of its inline template.
- **Stored data:** no read path enforces a limit. Old long names, aliases from QRs and old adjustments still load and just wrap.

`parseCount` stays general, since rounds, minutes and intervals have no such limit.

## Risks / Trade-offs

- [Android's `maxLength` also applies to text set from code, so an existing 30-character alias may show cut off in the profile field] → The stored alias only changes when the owner edits and saves. CREATE and SAVE check the trimmed length, and the QR screen reads the stored value. The apply step checks this on the device and, if the field does cut it, sets `maxLength` only when the current alias already fits.
- [`adjustsFontSizeToFit` behaves differently across Android versions] → It's only used for scores and the exercise name, where the first is new and the second already ships. A failure shows as a smaller or clipped score, and the manual review looks for it.
- [Layout changes can't be tested automatically here, and the owner runs the emulator checks when convenient] → Every requirement has a concrete manual scenario, and the change isn't archived until the owner has done them.
- [Text limits can't produce the old long data they tolerate] → Saved names over 40 can't be typed once the limit is in. Wrapping rules are checked at 40, and longer text uses the same rules.
- [The ESLint rule touches all 24 files in one go] → The import swap is mechanical and lands as its own group, verified by `tsc` and lint.

## Open Questions

- ~~The exact height threshold and band floor on the judging screen.~~ Settled in the manual review (task 7.3, 2026-11-06): the computed values were kept unchanged. The band shrinks once the screen is shorter than the design, down to a 160 floor, and the exercise zone keeps a 64 minimum (`app/session/run.tsx`).
