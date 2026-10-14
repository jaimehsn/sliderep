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
- `app/index.tsx` — the hub (B21). A header row (app name + an adaptive shortcut: "MY QR" → `/my-qr` if a profile exists, else "PROFILE" → `/profile`), a real "NEW SESSION" button to `/session/wod`, a real "HISTORY" row to `/history` (B23), and two disabled placeholder rows (LIBRARY / SETTINGS, "coming soon") for B24/B25, not built yet. On mount, checks `hooks/use-first-run.ts`'s `firstRunDone` flag (B22) — `router.push('/first-run')` if it's unset and there's no profile yet; if a profile already exists (e.g. created before this flag existed) it backfills the flag silently instead of prompting
- `app/first-run.tsx` — one-time "Create profile" / "Continue anonymous" prompt (B22), pushed from the hub. "CREATE PROFILE" marks the flag done then `router.replace('/profile')` (so `/profile`'s own ✕ returns to the hub, not back here); "CONTINUE ANONYMOUS" marks it done then `router.back()`. No way to dismiss without picking one — a raw hardware-back leaves the flag unset, so it's just asked again next launch, matching "it can be skipped... profile created later" (decided in *Design: screens and routes*)
- `app/history/index.tsx` — list of "own" sessions (B23; the owner was the judged athlete — a `judge`-role session where the *other* person was judged never appears here, per the decided design). `useFocusEffect` + `db/sessions.ts`'s `getOwnSessions` (refetches on return from a delete in the detail screen). Each row shows the WOD, a local date formatter (no `Intl` dependency), and a quick unadjusted score (`deriveResult`) — the detail screen is what shows the accurate, possibly-adjusted one. Empty state when there's no profile or zero sessions
- `app/history/[id].tsx` — detail: result + splits, no adjusting, with delete (B23). Loads the row with `db/sessions.ts`'s `getSession`, redirects to `/history` if it's gone (already deleted / stale link). Renders `<ResultScreen>` with `role="judged"`/`saved="own"` (always true here) and the real `sessionId` but `canAdjust={false}` — `ResultScreen` already fetches and applies any already-approved adjustments on its own (B12), so this gets the *correct* result for free, just without the "ADJUST RESULT" button. "DELETE SESSION" (destructive `Alert.alert`) calls `db/sessions.ts`'s `deleteSession`
- `app/_layout.tsx` — root layout wrapping the full app with navigation stack (just `index`/`+not-found` — `session/*`, `profile`, `my-qr` aren't declared here, matching the existing pattern that file-based routes don't need an explicit entry unless they need per-screen options); also opens the SQLite database (`SQLiteProvider`, `db/migrations.ts`'s `migrateDbIfNeeded`)
- `app/profile.tsx` — create the local profile (alias only), edit its alias, or delete it (own sessions go, foreign ones stay — `db/profile.ts`'s `deleteProfile`). One combined screen for B19; the ROADMAP's draft `settings.tsx`/`profile-create.tsx` split is deferred to B25. Links to `/my-qr` when a profile exists
- `app/my-qr.tsx` — shows the local athlete's QR, read from `hooks/use-profile.ts` (redirects to `/profile` if there isn't one yet). Deliberately high-contrast (white/black), inverted from the app's usual dark theme, for camera reliability

#### The session flow (`app/session/`, B21)

`session/_layout.tsx` wraps the whole group in `hooks/use-session.tsx`'s `SessionProvider` (an in-memory React context — the project's first) and sets `gestureEnabled: false` on its own nested `Stack` (blocks the OS edge-swipe-back across the whole flow; every screen here has its own explicit ✕/back-link exit instead). A nested Stack doesn't inherit the root's `screenOptions`, so `headerShown`/`contentStyle` are repeated here too.

- `session/wod.tsx` — pick a WOD; each card pushes to `/session/setup`
- `session/setup.tsx` — the owner picks their role (judge / judged), then scans the other person's QR or skips (`components/session/scan-person.tsx`), then calls `useSession()`'s `setSetup({ wodId, role, otherId, otherAlias })` (`otherId`/`otherAlias` are real `string | null` now, not the `''`-sentinel route params they used to be) and `router.replace('/session/run')`. Shows "This session won't be saved" when judging and skipping (the only direction that's actually unsaved — see `docs/ROADMAP.md`'s Users table). Reads `hooks/use-profile.ts`'s local profile to pass `selfId` to `ScanPerson` (self-scan block)
- `session/run.tsx` — judging mechanics only (what used to be `app/judge/[id].tsx`'s `ready`/`judging` phases): `useJudge(setup.wodId)`, the countdown/judging UI, abort (timer tap or hardware back while judging — `Alert.alert('Abort session?', ...)`). Redirects to `/session/wod` if reached with no `setup` in context (e.g. a direct deep link — there's nothing to resume without a `wodId`). On `judge.finished`, stashes `{ log, startedAt, endT }` into `useSession()`'s `setOutcome(...)` and `router.replace('/session/result')` — no judge-identity derivation or saving here, that's `session/result.tsx`'s job entirely
- `session/result.tsx` — derives `judgedAthleteId`/`judgedAlias`/`judgeId`/`savedState`/`canAdjust` from `useSession()`'s `setup` + `hooks/use-profile.ts` (same logic `judge/[id].tsx` used to have), saves the session via `db/sessions.ts`'s `saveSession` — only when `judgedAthleteId` is non-null (an anonymous judged athlete is never saved, per the Users table) — captures the returned id into `setSessionId`, and renders `<ResultScreen>` with it. Redirects to `/session/wod` if reached with no `setup`/`outcome` in context
- `session/adjust.tsx` — post-judging adjustment screen (B12), reached only from the result screen's "ADJUST RESULT" button (`components/result/result-screen.tsx`), once, right after finishing. Fully DB-driven from a `sessionId` route param alone (`db/sessions.ts`'s `getSession` + `db/session-adjustments.ts`'s `getAdjustments`) — doesn't touch the session context at all. Each split row is tappable to set a new target for that position, plus a duration field when the format has one (AMRAP seconds, EMOM whole minutes); "SAVE PACKAGE" writes one `session_adjustments` row (`addAdjustment`), up to 3 per session

### WOD System

- `constants/wod-engine.ts` — the interpreter ("format = behavior"). `Format` (built-in, versioned: `repeat: rounds | cycle | perInterval`, `advance`, `timer`, `stop`, `score`) + `WodDefinition`/`Block`/`WodLine` (declarative WOD content) + `buildWodConfig(definition, format): WodConfig`, which derives `getTarget`/`getExerciseName`/`getKpi`/`advance`/`isComplete`/`advanceMode` generically. Also owns the `WodConfig`/`WodSession`/`WodKpi`/`WodExercise` types (re-exported from `wods.ts`). Scoped to what the 4 built-in WODs need — no rest steps, multi-block WODs or time caps yet.
- `constants/wods.ts` — defines `WodId` (`'fran' | 'cindy' | 'everyMinute' | 'filthyFifty'`, also each `WodDefinition`'s own `id`) and the four built-in `WodDefinition`s (`fran`→FRAN, `cindy`→CINDY, `everyMinute`→the EMOM workout, `filthyFifty`→Filthy Fifty, unified with For Time as a 1-round WOD). `getWodConfig(id)` looks up `{ definition, format }` and calls `buildWodConfig`; `getWodDefinition(id)` exposes that raw pair directly, for consumers (`db/seed-builtins.ts`) that need the declarative content itself rather than the interpreted `WodConfig`.
- `constants/hf.ts` — design tokens (colors, etc.) used throughout the UI

### Judge Screen Components (`components/judge/`)

The judging screen follows the **"Ghost · base"** design from Claude Design (a local copy of the handoff bundle lives in `design/`, which is git-ignored). Layout, top to bottom: header · exercise name · swipe band · count. Only the swipe band receives gestures.

- `reducer.ts` + `types.ts` — state machine for the judging session (`REP`, `NO_REP`, `FINISH`, `RESET` actions). Each logged event (`LogEntry`) carries `t`: ms on the session clock, which starts when judging begins (right after the countdown) — this raw log is what `components/result/` replays into splits and a score
- `judge-header.tsx` — timer (elapsed / countdown / per-minute depending on WOD type) on the left; round / minute / station progress with `round-pips.tsx` on the right. The timer block (label + time) is a `Pressable` calling `onAbortPress` — the only tap target outside the swipe band, wired in `app/session/run.tsx` to an `Alert.alert('Abort session?', 'Data will be lost.', …)` confirmation; Android's hardware back button triggers the same alert while judging is in progress
- `round-pips.tsx` — row of squares: done (filled), current (ink outline), pending (hairline outline)
- `exercise-name.tsx` — current exercise name, shrinks to fit, turns accent after a no-rep; shows "DONE" once finished. Not interactive — AMRAP/EMOM auto-finish when the clock reaches 0, exactly like For Time/Chipper already auto-finish on the last rep, so there is no manual confirmation tap anymore
- `swipe-band.tsx` — the only interactive surface: swipe right = rep, swipe left = no-rep, tap = rep; edge ticks, a breathing dot that follows the finger and a travel line after each gesture
- `count-readout.tsx` — large rep count, plus reps left and the target
- `side-rails.tsx` — full-height edge lines (accent after a no-rep) and a strip that sweeps inward after each gesture
- `start-overlay.tsx` — pre-judging WOD summary and 10-second countdown (with sound cues); shows who's being judged, flipped by the `role` prop (`athleteAlias` + `role: 'judge'|'judged'` → "Judging X" / "Judged by X")

### Session Setup Components (`components/session/`)

- `scan-person.tsx` — `ScanPerson`: used by `app/session/setup.tsx` after the role choice. "SCAN QR" (requests camera permission then, via `expo-camera`'s `CameraView`) or "SKIP — ANONYMOUS". Blocks self-scanning by comparing the scanned id to a `selfId` prop (the local profile's id, passed down from `hooks/use-profile.ts`; `null` when there's no profile yet — role-agnostic, the owner's own id doesn't change). Not persisted — the result is only held in `app/session/setup.tsx`'s local state, handed to `hooks/use-session.tsx`'s `setSetup` (B21)

### Result Screen (`components/result/`)

Shown by `app/session/result.tsx` (B21 split this out of what used to be `app/judge/[id].tsx`'s inline finished-phase render).

- `replay.ts` — `deriveResult(config, log)`: pure, derives score + splits from the raw log by replaying it against the existing `WodConfig` functions (`getTarget`, `getExerciseName`, `getKpi`, `advance`, `isComplete`, `advanceMode`). Nothing is stored; everything here is recomputed from `WOD + log` (see `docs/ROADMAP.md` → Exercise sessions). Each `Split` carries its `(roundIdx, exIdx)` position (minute index as `roundIdx`, `exIdx: 0`, for onClock/EMOM) — unused by `result-screen.tsx` itself, consumed by `adjust.ts`/`session/adjust.tsx` (B12).
- `adjust.ts` — `deriveAdjustedResult(config, log, changes)`: B12's adjusted-result derivation. Delegates straight to `deriveResult` when `changes` is empty. Otherwise: for onClock (EMOM) formats, position *is* time (`Math.floor(t/60000)`), so target/duration overrides apply directly per minute bucket. For onTarget formats (For Time/Chipper/AMRAP), first replays the *unmodified* config to tag each event with the position it was originally assigned (`tagOnTargetPositions`) — this is what keeps a target change from "re-flowing" later events into a different round/line, per `docs/ROADMAP.md`'s Exercise sessions decision — then applies target/duration overrides only within each position's own fixed bucket of events.
- `result-screen.tsx` — renders the `WodResult`: score, then a scrollable split list. Also takes `athleteAlias` + `role` to flip "Judging X" / "Judged by X", same as `start-overlay.tsx`, and a `saved: 'own' | 'foreign' | 'none'` prop that renders the decided banner copy ("Saved in your history" / "Saved on this phone — will be delivered to X once sync exists" / "Not saved"). New props `sessionId`/`canAdjust` (B12): loads this session's `session_adjustments` (`db/session-adjustments.ts`, refetched via `useFocusEffect` so returning from `/session/adjust` updates the score) and feeds them into `deriveAdjustedResult`; shows an "ADJUST RESULT" button to `/session/adjust` while `canAdjust` and fewer than 3 packages exist.

### Storage (`db/`)

- `migrations.ts` — `migrateDbIfNeeded(db)`, passed as `SQLiteProvider`'s `onInit` in `app/_layout.tsx`. `PRAGMA user_version`-based, forward-only, cascading (a fresh install runs every block in one call). Schema v1: all tables from `docs/ROADMAP.md`'s Storage & persistence schema draft are created up front, though only `sessions` has a consumer at that point. Schema v2 (B18): seeds `formats`/`exercises`/`workouts` via `seed-builtins.ts`, then rebuilds `sessions` (SQLite has no `ALTER TABLE ADD CONSTRAINT`) to add `wodId REFERENCES workouts(id)`, preserving any v1 rows — `device`/`athlete_profile` still wait for B19. `PRAGMA foreign_keys` is forced `OFF` around that rebuild (can't toggle mid-transaction) and set `ON` once, unconditionally, at the very end of the function. Schema v3 (B22): adds `app_state`, a single-row table (`id = 1`) for the `firstRunDone` flag — the only app-wide flag that exists so far. Schema v4 (B23): a plain `ALTER TABLE sessions ADD COLUMN judgeAlias TEXT` (no rebuild needed this time, unlike v1→v2 — SQLite supports `ADD COLUMN` directly) — an alias snapshot for the judge, symmetric to the existing `judgedAlias`, needed so History's detail view (opened long after the live session context is gone) has something to show.
- `app-state.ts` — `getFirstRunDone`/`setFirstRunDone` against `app_state` (B22). No-row read means "not done," same convention as `athlete_profile`; wrapped for screens by `hooks/use-first-run.ts`'s `useFirstRun()` (`{ done, loaded, markDone }`).
- `seed-builtins.ts` — `buildBuiltinSeed(createdAt)`: pure function deriving the built-in `formats`/`exercises`/`workouts` rows from `constants/wods.ts`'s `getWodDefinition(id)` + `constants/wod-engine.ts`'s `Format`s — not transcribed by hand, so it can't drift from what the app actually runs on. Exercise ids are a local `slugify(name)`; workout ids reuse the existing `WodId` strings (`sessions.wodId` already stores them, since B15).
- `sessions.ts` — `saveSession(db, input)`: a single `withTransactionAsync` insert, returning the new row's id (B12 needs it to attach adjustments). Ids are a short local string (timestamp + random base36, `makeId()` — exported, reused by `profile.ts`/`session-adjustments.ts`), not a real UUID — the ROADMAP's UUIDv7 is an unconfirmed assumption, not a decision, and this is revisable later without migrating rows. `getSession(db, id)` reloads a saved row (events JSON parsed back to `StoredEvent[]`), for screens reached only by `sessionId` route param (`session/adjust.tsx`, `history/[id].tsx`). `getOwnSessions(db, athleteId)` (B23) is the same shape, filtered to `judgedAthleteId = athleteId` — exactly what `history/index.tsx` lists. `deleteSession(db, id)` (B23) removes a session and its `session_adjustments` in one transaction (same cascade pattern `profile.ts`'s `deleteProfile` uses).
- `profile.ts` — `getProfile`/`createProfile`/`updateAlias`/`deleteProfile` against the single-row `athlete_profile` table (B19). `deleteProfile` applies the decided retention rule in one transaction: deletes this profile's own sessions (and their `session_adjustments`) by `judgedAthleteId`, keeps foreign ones. Wrapped for screens by `hooks/use-profile.ts`'s `useProfile()` (`{ profile, loaded, refresh }`).
- `session-adjustments.ts` — `getAdjustments`/`addAdjustment` against `session_adjustments` (B12). `AdjustmentChange` is a `{ type: 'target', roundIdx, exIdx, newTarget }` / `{ type: 'duration', newDurationSeconds }` union, JSON-stored per row; `addAdjustment` enforces the decided 3-per-session cap in app code (the schema has no `CHECK` on `seq`).

### Shared UI

- `components/screen.tsx` — `Screen`: root wrapper every top-level screen uses instead of a bare `View`. Applies `useSafeAreaInsets()` as padding (status bar, notch, gesture bar) to its normal-flow children. **Don't rely on this padding to offset a `position: 'absolute'` child** — confirmed on `my-qr.tsx` that it doesn't (the close button stayed under the status bar until it was moved into normal flow, see that file); give any top-corner interactive element its own header row in normal flow instead, like `my-qr.tsx` and `start-overlay.tsx` do. `minBottomPadding` gives a floor for screens whose last element needs room even with a zero inset. Doesn't set a background color — screens still own their own theme via `style` (`my-qr.tsx` is intentionally inverted, light-on-dark).

### Hooks

- `hooks/use-judge.ts` — encapsulates the judging session state using `useReducer`, wiring the WOD config to the reducer; owns the timer, the gestures (`Pan` + `Tap`, thresholds from the design) and the animated styles
- `hooks/use-sound-cue.ts` — wraps a short local sound (`expo-audio`) in a stable, fire-and-forget `play()` callback
- `hooks/use-profile.ts` — `useProfile()`: loads the local `AthleteProfile` (`db/profile.ts`) on mount, exposes `{ profile, loaded, refresh }`. No shared context for this one — every screen that needs it calls this independently (unlike the session flow's `use-session.tsx`, this state isn't scoped to a route subtree, so a context wouldn't fit the same way)
- `hooks/use-first-run.ts` — `useFirstRun()`: same shape as `use-profile.ts`, wrapping `db/app-state.ts`'s `firstRunDone` flag (`{ done, loaded, markDone }`). Read by `app/index.tsx` to decide whether to push `/first-run`
- `hooks/use-session.tsx` — the project's first React context. `SessionProvider` (mounted by `app/session/_layout.tsx`, so its state's lifetime is exactly the `session/` group's mount lifetime — popping out to the hub clears it for free, no manual reset needed) + `useSession()` (throws outside the provider). Holds `setup` (`{ wodId, role, otherId, otherAlias }`, written by `session/setup.tsx`), `outcome` (`{ log, startedAt, endT }`, written by `session/run.tsx` once judging finishes) and `sessionId` (written by `session/result.tsx` once saved) — this is what lets `run.tsx` hand off the raw judging log to `result.tsx` across a real route boundary, instead of trying to serialize it into a URL param

### Path Alias

`@/*` resolves to the project root (configured in `tsconfig.json`). Use this for all imports instead of relative paths across directories.
