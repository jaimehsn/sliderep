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
- `app/index.tsx` — entry screen with a "SELECT WORKOUT" button to `/session/wod` and a "MY QR" button to `/my-qr`. Minimal stand-in for the real hub (B21)
- `app/session/wod.tsx` — pick a WOD; each card pushes to `/session/setup`
- `app/session/setup.tsx` — the owner picks their role (judge / judged), then scans the other person's QR or skips (`components/session/scan-person.tsx`), then hands off to `/judge/[id]` with `role`, `otherId` and `otherAlias` as route params. Shows "This session won't be saved" when judging and skipping (the only direction that's actually unsaved — see `docs/ROADMAP.md`'s Users table). No `session/_layout.tsx`/session context yet (B21) — everything here is plain route params
- `app/judge/[id].tsx` — Judge screen for a specific WOD (`fran` | `cindy` | `everyMinute` | `filthyFifty`); `ready` → judging → finished only. Redirects to `/session/setup` if reached without a resolved `role` param (e.g. a direct deep link). Derives `judgedAthleteId`/`judgedAlias`/`judgeId` from `role` + `otherId`/`otherAlias` and, once `judge.finished`, saves the session via `db/sessions.ts`'s `saveSession` — only when `judgedAthleteId` is non-null (an anonymous judged athlete is never saved, per the Users table)
- `app/my-qr.tsx` — shows the local athlete's QR (`constants/profile.ts`'s `STUB_PROFILE` — fixed, not persisted; the real local profile is B19). Deliberately high-contrast (white/black), inverted from the app's usual dark theme, for camera reliability
- `app/_layout.tsx` — root layout wrapping the full app with navigation stack; also opens the SQLite database (`SQLiteProvider`, `db/migrations.ts`'s `migrateDbIfNeeded`)

### WOD System

- `constants/wod-engine.ts` — the interpreter ("format = behavior"). `Format` (built-in, versioned: `repeat: rounds | cycle | perInterval`, `advance`, `timer`, `stop`, `score`) + `WodDefinition`/`Block`/`WodLine` (declarative WOD content) + `buildWodConfig(definition, format): WodConfig`, which derives `getTarget`/`getExerciseName`/`getKpi`/`advance`/`isComplete`/`advanceMode` generically. Also owns the `WodConfig`/`WodSession`/`WodKpi`/`WodExercise` types (re-exported from `wods.ts`). Scoped to what the 4 built-in WODs need — no rest steps, multi-block WODs or time caps yet.
- `constants/wods.ts` — defines `WodId` (`'fran' | 'cindy' | 'everyMinute' | 'filthyFifty'`, also each `WodDefinition`'s own `id`) and the four built-in `WodDefinition`s (`fran`→FRAN, `cindy`→CINDY, `everyMinute`→the EMOM workout, `filthyFifty`→Filthy Fifty, unified with For Time as a 1-round WOD). `getWodConfig(id)` looks up `{ definition, format }` and calls `buildWodConfig`; `getWodDefinition(id)` exposes that raw pair directly, for consumers (`db/seed-builtins.ts`) that need the declarative content itself rather than the interpreted `WodConfig`.
- `constants/hf.ts` — design tokens (colors, etc.) used throughout the UI

### Judge Screen Components (`components/judge/`)

The judging screen follows the **"Ghost · base"** design from Claude Design (a local copy of the handoff bundle lives in `design/`, which is git-ignored). Layout, top to bottom: header · exercise name · swipe band · count. Only the swipe band receives gestures.

- `reducer.ts` + `types.ts` — state machine for the judging session (`REP`, `NO_REP`, `FINISH`, `RESET` actions). Each logged event (`LogEntry`) carries `t`: ms on the session clock, which starts when judging begins (right after the countdown) — this raw log is what `components/result/` replays into splits and a score
- `judge-header.tsx` — timer (elapsed / countdown / per-minute depending on WOD type) on the left; round / minute / station progress with `round-pips.tsx` on the right. The timer block (label + time) is a `Pressable` calling `onAbortPress` — the only tap target outside the swipe band, wired in `app/judge/[id].tsx` to an `Alert.alert('Abort session?', 'Data will be lost.', …)` confirmation; Android's hardware back button triggers the same alert while judging is in progress
- `round-pips.tsx` — row of squares: done (filled), current (ink outline), pending (hairline outline)
- `exercise-name.tsx` — current exercise name, shrinks to fit, turns accent after a no-rep; shows "DONE" once finished. Not interactive — AMRAP/EMOM auto-finish when the clock reaches 0, exactly like For Time/Chipper already auto-finish on the last rep, so there is no manual confirmation tap anymore
- `swipe-band.tsx` — the only interactive surface: swipe right = rep, swipe left = no-rep, tap = rep; edge ticks, a breathing dot that follows the finger and a travel line after each gesture
- `count-readout.tsx` — large rep count, plus reps left and the target
- `side-rails.tsx` — full-height edge lines (accent after a no-rep) and a strip that sweeps inward after each gesture
- `start-overlay.tsx` — pre-judging WOD summary and 10-second countdown (with sound cues); shows who's being judged, flipped by the `role` prop (`athleteAlias` + `role: 'judge'|'judged'` → "Judging X" / "Judged by X")

### Session Setup Components (`components/session/`)

- `scan-person.tsx` — `ScanPerson`: used by `app/session/setup.tsx` after the role choice. "SCAN QR" (requests camera permission then, via `expo-camera`'s `CameraView`) or "SKIP — ANONYMOUS". Blocks self-scanning by comparing the scanned id to `constants/profile.ts`'s `STUB_PROFILE.athleteId` (role-agnostic: the owner's own id doesn't change). Not persisted — the result is only held in `app/session/setup.tsx`'s local state, threaded to `/judge/[id]` as route params

### Result Screen (`components/result/`)

Shown by `app/judge/[id].tsx` in place of the judging layout once `judge.finished` — still the same route; there is no separate `session/result` route yet (that's B21).

- `replay.ts` — `deriveResult(config, log)`: pure, derives score + splits from the raw log by replaying it against the existing `WodConfig` functions (`getTarget`, `getExerciseName`, `getKpi`, `advance`, `isComplete`, `advanceMode`). Nothing is stored; everything here is recomputed from `WOD + log` (see `docs/ROADMAP.md` → Exercise sessions).
- `result-screen.tsx` — renders the `WodResult`: score, then a scrollable split list. Also takes `athleteAlias` + `role` to flip "Judging X" / "Judged by X", same as `start-overlay.tsx`, and a `saved: 'own' | 'foreign' | 'none'` prop that renders the decided banner copy ("Saved in your history" / "Saved on this phone — will be delivered to X once sync exists" / "Not saved").

### Storage (`db/`)

- `migrations.ts` — `migrateDbIfNeeded(db)`, passed as `SQLiteProvider`'s `onInit` in `app/_layout.tsx`. `PRAGMA user_version`-based, forward-only, cascading (a fresh install runs every block in one call). Schema v1: all tables from `docs/ROADMAP.md`'s Storage & persistence schema draft are created up front, though only `sessions` has a consumer at that point. Schema v2 (B18): seeds `formats`/`exercises`/`workouts` via `seed-builtins.ts`, then rebuilds `sessions` (SQLite has no `ALTER TABLE ADD CONSTRAINT`) to add `wodId REFERENCES workouts(id)`, preserving any v1 rows — `device`/`athlete_profile` still wait for B19. `PRAGMA foreign_keys` is forced `OFF` around that rebuild (can't toggle mid-transaction) and set `ON` once, unconditionally, at the very end of the function.
- `seed-builtins.ts` — `buildBuiltinSeed(createdAt)`: pure function deriving the built-in `formats`/`exercises`/`workouts` rows from `constants/wods.ts`'s `getWodDefinition(id)` + `constants/wod-engine.ts`'s `Format`s — not transcribed by hand, so it can't drift from what the app actually runs on. Exercise ids are a local `slugify(name)`; workout ids reuse the existing `WodId` strings (`sessions.wodId` already stores them, since B15).
- `sessions.ts` — `saveSession(db, input)`: a single `withTransactionAsync` insert. Ids are a short local string (timestamp + random base36), not a real UUID — the ROADMAP's UUIDv7 is an unconfirmed assumption, not a decision, and this is revisable later without migrating rows.

### Shared UI

- `components/screen.tsx` — `Screen`: root wrapper every top-level screen uses instead of a bare `View`. Applies `useSafeAreaInsets()` as padding (status bar, notch, gesture bar) to its normal-flow children. **Don't rely on this padding to offset a `position: 'absolute'` child** — confirmed on `my-qr.tsx` that it doesn't (the close button stayed under the status bar until it was moved into normal flow, see that file); give any top-corner interactive element its own header row in normal flow instead, like `my-qr.tsx` and `start-overlay.tsx` do. `minBottomPadding` gives a floor for screens whose last element needs room even with a zero inset. Doesn't set a background color — screens still own their own theme via `style` (`my-qr.tsx` is intentionally inverted, light-on-dark).

### Hooks

- `hooks/use-judge.ts` — encapsulates the judging session state using `useReducer`, wiring the WOD config to the reducer; owns the timer, the gestures (`Pan` + `Tap`, thresholds from the design) and the animated styles
- `hooks/use-sound-cue.ts` — wraps a short local sound (`expo-audio`) in a stable, fire-and-forget `play()` callback

### Path Alias

`@/*` resolves to the project root (configured in `tsconfig.json`). Use this for all imports instead of relative paths across directories.
