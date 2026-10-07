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
- `app/index.tsx` — WOD selection screen (list of available workouts)
- `app/judge/[type].tsx` — Judge screen for a specific WOD type (`forTime` | `amrap` | `emom` | `chipper`)
- `app/_layout.tsx` — root layout wrapping the full app with navigation stack

### WOD System

- `constants/wods.ts` — defines `WodConfig` and `WodSession` types, plus the four WOD configs (`forTime`, `amrap`, `emom`, `chipper`). Each config implements a common interface: `getTarget`, `getExerciseName`, `getKpi` (header progress: `label`, `current`, `total | null`), `advance`, `isComplete`, plus `advanceMode` (`onTarget` | `onClock`).
- `constants/hf.ts` — design tokens (colors, etc.) used throughout the UI

### Judge Screen Components (`components/judge/`)

The judging screen follows the **"Ghost · base"** design from Claude Design (a local copy of the handoff bundle lives in `design/`, which is git-ignored). Layout, top to bottom: header · exercise name · swipe band · count. Only the swipe band receives gestures.

- `reducer.ts` + `types.ts` — state machine for the judging session (`REP`, `NO_REP`, `RESET` actions)
- `judge-header.tsx` — timer (elapsed / countdown / per-minute depending on WOD type) on the left; round / minute / station progress with `round-pips.tsx` on the right. Not interactive.
- `round-pips.tsx` — row of squares: done (filled), current (ink outline), pending (hairline outline)
- `exercise-name.tsx` — current exercise name, shrinks to fit, turns accent after a no-rep; shows "TIME" when the clock has ended and awaits the judge's confirmation, or "DONE" once finished. Its wrapping zone (`app/judge/[type].tsx`) is a `Pressable` that confirms the end of AMRAP/EMOM WODs on tap — the only tap target outside the swipe band, since there is no header control for it yet (B16)
- `swipe-band.tsx` — the only interactive surface: swipe right = rep, swipe left = no-rep, tap = rep; edge ticks, a breathing dot that follows the finger and a travel line after each gesture
- `count-readout.tsx` — large rep count, plus reps left and the target
- `side-rails.tsx` — full-height edge lines (accent after a no-rep) and a strip that sweeps inward after each gesture
- `start-overlay.tsx` — pre-judging WOD summary and 10-second countdown (with sound cues)

### Hooks

- `hooks/use-judge.ts` — encapsulates the judging session state using `useReducer`, wiring the WOD config to the reducer; owns the timer, the gestures (`Pan` + `Tap`, thresholds from the design) and the animated styles
- `hooks/use-sound-cue.ts` — wraps a short local sound (`expo-audio`) in a stable, fire-and-forget `play()` callback

### Path Alias

`@/*` resolves to the project root (configured in `tsconfig.json`). Use this for all imports instead of relative paths across directories.
