# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose

**SLIDEREP** is a CrossFit judging app for mobile. It lets a coach or peer judge count reps during a WOD (Workout of the Day), marking each rep as valid or no-rep, while tracking progress through rounds, exercises, and stations. The name comes from the gesture-based rep input.

The app supports four classic CrossFit WOD formats:
- **For Time** (FRAN 21-15-9: thrusters + pull-ups) — elapsed timer
- **AMRAP** (CINDY 12-min: pull-ups, push-ups, air squats) — countdown timer
- **EMOM** (10-min alternating: burpees + KB swings) — per-minute countdown
- **Chipper** (FILTHY FIFTY: 10 stations × 50 reps) — elapsed timer

## Commands

```bash
npm start              # Start Expo dev server
npm run android        # Run on Android emulator
npm run ios            # Run on iOS simulator
npm run web            # Run in browser
npm run lint           # Run ESLint
npm run reset-project  # Reset to blank Expo template
```

## Architecture

**Stack**: Expo 54 + React Native 0.81 + TypeScript + Expo Router 6

### Routing

File-based routing via Expo Router. All routes live in `app/`:
- `app/index.tsx` — WOD selection screen (list of available workouts)
- `app/judge/[type].tsx` — Judge screen for a specific WOD type (`forTime` | `amrap` | `emom` | `chipper`)
- `app/_layout.tsx` — root layout wrapping the full app with navigation stack

### WOD System

- `constants/wods.ts` — defines `WodConfig` and `WodSession` types, plus the four WOD configs (`forTime`, `amrap`, `emom`, `chipper`). Each config implements a common interface: `getTarget`, `getExerciseName`, `getKpi`, `getSegments`, `getHint`, `advance`, `isComplete`.
- `constants/hf.ts` — design tokens (colors, etc.) used throughout the UI

### Judge Screen Components (`components/judge/`)

- `reducer.ts` + `types.ts` — state machine for the judging session (`REP`, `NO_REP`, `RESET` actions)
- `hero-counter.tsx` — large rep count display
- `gesture-footer.tsx` — swipe/tap gesture area for recording reps
- `seg-bar.tsx` — segmented progress bar across exercises in the current round/station
- `dot-trail.tsx` — visual trail of recent reps (valid/invalid)
- `drop-strip.tsx` — animated feedback strip on rep input
- `event-log.tsx` — scrollable log of all rep events
- `invalid-badge.tsx` — sticky badge shown after a no-rep
- `timer-strip.tsx` — timer display (elapsed / countdown / per-minute depending on WOD type)
- `side-rails.tsx` — side UI rails

### Hook

- `hooks/use-judge.ts` — encapsulates the judging session state using `useReducer`, wiring the WOD config to the reducer

### Path Alias

`@/*` resolves to the project root (configured in `tsconfig.json`). Use this for all imports instead of relative paths across directories.
