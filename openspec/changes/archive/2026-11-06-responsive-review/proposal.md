# Proposal

## Why

The app now targets the popular phones held in portrait, not just the owner's phone, but its layouts were only ever checked on one device. Two overflows already reached a real phone (`docs/ROADMAP.md` → Known issues, 2026-10-30), and reading the screens shows more: History can't scroll, a long name can push the setup screen's exit off screen, and nothing bounds names, aliases, reps or the system font size.

## What Changes

- **Supported phones:** the layout contract is portrait phones from 360 × 640 dp up. Tablets, open foldables, screens narrower than 360 dp, landscape and iOS stay out.
- **Text size:** the judging timer, the rep count, the reps left and the result scores ignore the system font size. All other text follows it up to 1.3×.
- **Input limits:** workout names up to 40 characters, aliases up to 24, reps and adjusted targets up to 999. Limits apply to new input only; saved data is never cut.
- **Fixes:**
  - History's list scrolls.
  - The setup screen's exit stays on screen with any name.
  - The rep count and scores shrink to fit instead of clipping or wrapping.
  - The result and adjust screens scroll their score together with the splits.
  - Form screens scroll when their content doesn't fit, including with the keyboard open.
  - The judging screen fits 360 × 640 with its longest content.
- **Device review:** one stress data set, checked on every screen by the owner, manually, on two emulators and their phone.
- No engine, storage or result change: goldens stay as they are.

## Capabilities

### New Capabilities

- `phone-layout`: which phones the app supports, how text follows the system font size, and that content stays reachable and inside the screen on them.

### Modified Capabilities

- `history`: the session list scrolls.
- `workout-editor`: limits on the name and on reps, and how DUPLICATE fits " COPY" within the name's limit.
- `athlete-profile`: limit on the alias.
- `result-adjustment`: limit on an adjusted target.

## Impact

- **Screens:** `app/history/index.tsx`, `app/session/setup.tsx`, `app/session/adjust.tsx`, `app/profile.tsx`, `app/first-run.tsx`, `app/settings.tsx`, `app/library/new.tsx`.
- **Components:** `components/judge/` (count readout, header, exercise name), `components/result/result-screen.tsx`, `components/session/scan-person.tsx`, `components/editor/`.
- **New:** a thin shared text module, whose import replaces React Native's `Text` / `TextInput` in about 24 files, and an ESLint rule that keeps it in use.
- **Pure logic and tests:** `components/editor/draft.ts` and `tests/draft.test.ts`, plus a small pure sizing function for the rep count with its own vitest test.
- **Docs:** `docs/ROADMAP.md` (product context, the Known issues item) and `CLAUDE.md`.
- **Dependencies, schema and engine:** none changed.
