# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose

**SLIDEREP** is a CrossFit judging app for mobile. It lets a coach or peer judge count reps during a WOD (Workout of the Day), marking each rep as valid or no-rep, while tracking progress through rounds, exercises, and stations. The name comes from the gesture-based rep input.

The app supports four classic CrossFit WOD formats:
- **For Time** (FRAN 21-15-9: thrusters + pull-ups) — elapsed timer
- **AMRAP** (CINDY 12-min: pull-ups, push-ups, air squats) — countdown timer
- **EMOM** (10-min alternating: burpees + KB swings) — per-minute countdown
- **Chipper** (FILTHY FIFTY: 10 stations × 50 reps) — elapsed timer

## Roadmap

Planned work and open design topics (data model, persistence, short-term tasks) live in `docs/ROADMAP.md`. Read it before starting feature work; all five Track A topics are decided there (Users, WOD hierarchy, WOD format as data, Exercise sessions, Storage & persistence, Design), and each lists its unconfirmed assumptions — validate them when they start to matter instead of assuming.

## Commands

```bash
pnpm start             # Start Expo dev server
pnpm start:clear       # Start Expo dev server with the Metro cache cleared
pnpm android           # Run on Android emulator
pnpm ios               # Run on iOS simulator
pnpm web               # Run in browser
pnpm lint              # Run ESLint
pnpm reset-project     # Reset to blank Expo template
```

## Architecture

**Stack**: Expo 57 + React Native 0.86 + TypeScript 6 + Expo Router 57

### Routing

File-based routing via Expo Router. All routes live in `app/`:
- `app/index.tsx` — WOD selection screen (list of available workouts); has a "MY QR" button to `/my-qr`
- `app/judge/[id].tsx` — Judge screen for a specific WOD (`fran` | `cindy` | `everyMinute` | `filthyFifty`)
- `app/my-qr.tsx` — shows the local athlete's QR (`constants/profile.ts`'s `STUB_PROFILE` — fixed, not persisted; the real local profile is B19). Deliberately high-contrast (white/black), inverted from the app's usual dark theme, for camera reliability
- `app/_layout.tsx` — root layout wrapping the full app with navigation stack

### WOD System

- `constants/wod-engine.ts` — the interpreter ("format = behavior"). `Format` (built-in, versioned: `repeat: rounds | cycle | perInterval`, `advance`, `timer`, `stop`, `score`) + `WodDefinition`/`Block`/`WodLine` (declarative WOD content) + `buildWodConfig(definition, format): WodConfig`, which derives `getTarget`/`getExerciseName`/`getKpi`/`advance`/`isComplete`/`advanceMode` generically. Also owns the `WodConfig`/`WodSession`/`WodKpi`/`WodExercise` types (re-exported from `wods.ts`). Scoped to what the 4 built-in WODs need — no rest steps, multi-block WODs or time caps yet.
- `constants/wods.ts` — defines `WodId` (`'fran' | 'cindy' | 'everyMinute' | 'filthyFifty'`, also each `WodDefinition`'s own `id`) and the four built-in `WodDefinition`s (`fran`→FRAN, `cindy`→CINDY, `everyMinute`→the EMOM workout, `filthyFifty`→Filthy Fifty, unified with For Time as a 1-round WOD). `getWodConfig(id)` looks up `{ definition, format }` and calls `buildWodConfig`.
- `constants/hf.ts` — design tokens (colors, etc.) used throughout the UI

### Judge Screen Components (`components/judge/`)

The judging screen follows the **"Ghost · base"** design from Claude Design (a local copy of the handoff bundle lives in `design/`, which is git-ignored). Layout, top to bottom: header · exercise name · swipe band · count. Only the swipe band receives gestures.

- `reducer.ts` + `types.ts` — state machine for the judging session (`REP`, `NO_REP`, `FINISH`, `RESET` actions). Each logged event (`LogEntry`) carries `t`: ms on the session clock, which starts when judging begins (right after the countdown) — this raw log is what `components/result/` replays into splits and a score
- `judge-header.tsx` — timer (elapsed / countdown / per-minute depending on WOD type) on the left; round / minute / station progress with `round-pips.tsx` on the right. Not interactive.
- `round-pips.tsx` — row of squares: done (filled), current (ink outline), pending (hairline outline)
- `exercise-name.tsx` — current exercise name, shrinks to fit, turns accent after a no-rep; shows "TIME" when the clock has ended and awaits the judge's confirmation, or "DONE" once finished. Its wrapping zone (`app/judge/[id].tsx`) is a `Pressable` that confirms the end of AMRAP/EMOM WODs on tap — the only tap target outside the swipe band, since there is no header control for it yet (B16)
- `swipe-band.tsx` — the only interactive surface: swipe right = rep, swipe left = no-rep, tap = rep; edge ticks, a breathing dot that follows the finger and a travel line after each gesture
- `count-readout.tsx` — large rep count, plus reps left and the target
- `side-rails.tsx` — full-height edge lines (accent after a no-rep) and a strip that sweeps inward after each gesture
- `start-overlay.tsx` — pre-judging WOD summary and 10-second countdown (with sound cues); shows who's being judged (`athleteAlias` prop)
- `scan-athlete.tsx` — first thing `app/judge/[id].tsx` shows (`'scan'` phase, before `'ready'`): "SCAN QR" (requests camera permission then, via `expo-camera`'s `CameraView`) or "SKIP — ANONYMOUS". Blocks self-judging by comparing the scanned `athleteId` to `constants/profile.ts`'s `STUB_PROFILE.athleteId`. Not persisted — the result is only held in `app/judge/[id].tsx`'s local state and shown in `start-overlay.tsx` / `result-screen.tsx`

### Result Screen (`components/result/`)

Shown by `app/judge/[id].tsx` in place of the judging layout once `judge.finished` — still the same route; there is no separate `session/result` route yet (that's B21).

- `replay.ts` — `deriveResult(config, log)`: pure, derives score + splits from the raw log by replaying it against the existing `WodConfig` functions (`getTarget`, `getExerciseName`, `getKpi`, `advance`, `isComplete`, `advanceMode`). Nothing is stored; everything here is recomputed from `WOD + log` (see `docs/ROADMAP.md` → Exercise sessions).
- `result-screen.tsx` — renders the `WodResult`: score, then a scrollable split list.

### Shared UI

- `components/screen.tsx` — `Screen`: root wrapper every top-level screen uses instead of a bare `View`. Applies `useSafeAreaInsets()` as padding (status bar, notch, gesture bar) to its normal-flow children. **Don't rely on this padding to offset a `position: 'absolute'` child** — confirmed on `my-qr.tsx` that it doesn't (the close button stayed under the status bar until it was moved into normal flow, see that file); give any top-corner interactive element its own header row in normal flow instead, like `my-qr.tsx` and `start-overlay.tsx` do. `minBottomPadding` gives a floor for screens whose last element needs room even with a zero inset. Doesn't set a background color — screens still own their own theme via `style` (`my-qr.tsx` is intentionally inverted, light-on-dark).

### Hooks

- `hooks/use-judge.ts` — encapsulates the judging session state using `useReducer`, wiring the WOD config to the reducer; owns the timer, the gestures (`Pan` + `Tap`, thresholds from the design) and the animated styles
- `hooks/use-sound-cue.ts` — wraps a short local sound (`expo-audio`) in a stable, fire-and-forget `play()` callback

### Path Alias

`@/*` resolves to the project root (configured in `tsconfig.json`). Use this for all imports instead of relative paths across directories.
