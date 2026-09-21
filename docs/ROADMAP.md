# SlideRep — Roadmap

Working agreement: work is split in two tracks. **Track A** (foundations) is defined step by step, in conversation, *before* any feature work. **Track B** (short-term tasks) is implemented right after Track A's setup is done. **All five Track A topics are decided**; Track B is next. Each topic lists its unconfirmed assumptions — validate them when they start to matter instead of assuming.

## Product context

- Android app, personal use for now (scope may change later: iOS, stores).
- **One judge counts one athlete's reps at a time**, minimizing visual attention.
- UI language: **English**.
- Visual style: current tokens in `constants/hf.ts` (dark + mono) are the reference.
- Package manager: **pnpm**.
- No tests for now (verify with `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm exec expo export`, and manual device checks).

## Track A — Foundations for scale (to be defined together)

Goal: persist the **minimum information needed** for the app to work, while keeping data and results long-term.

1. **Users** — ✅ **decided**, see [Users (decided)](#users-decided) below.
2. **Workouts / WODs** — ✅ **decided**: (a) hierarchy, see [WOD hierarchy (decided)](#wod-hierarchy-decided); (b) format as data, see [WOD format as data (decided)](#wod-format-as-data-decided). Events and competitions are **not modeled for now**.
3. **Exercise sessions** — ✅ **decided**, see [Exercise sessions (decided)](#exercise-sessions-decided).
4. **Storage & persistence** — ✅ **decided**, see [Storage & persistence (decided)](#storage--persistence-decided).
5. **Design** — ✅ **decided**, see [Design: screens and routes (decided)](#design-screens-and-routes-decided).

Each topic is closed with concrete questions to the owner before writing code. Historic persistence, multi-athlete and competitions are re-evaluated inside this track.

### Users (decided)

**One entity: `Athlete`.** "Judge" is not a user type: it is a **circumstantial role** an athlete takes in a session. The only minimum athlete data is **name / alias**.

**Registered vs. anonymous** — judge and judged athlete can each be either. A session **belongs to the judged athlete**:

| Judge | Judged | Outcome |
|---|---|---|
| anonymous | anonymous | lost (shown, not saved) |
| registered | anonymous | lost (shown, not saved): the anonymous athlete can still see it momentarily |
| anonymous | registered | saved, **judge unknown** |
| registered | registered | saved **with known judge** (ideal case) |

**Identity: local now, accounts-ready.**
- "Registered" = has a **local profile** (UUID + alias) on the device. No login, no backend.
- **Nothing is valid/verified until real accounts exist.** Two separate concepts are reserved: `judgeId` (who claims to have judged; may be null) and a verification status that is always "unverified" for now.
- Every record carries stable UUIDs and a reserved field to link an account later without migrating data.

**Identifying the judged athlete: QR / code.** The athlete shows a QR with their ID from their own app and the judge scans it (works offline).

**Result delivery: stays on the judge's device**, tied to the judged athlete's ID, and is delivered once sync/accounts exist. Until then only whoever holds that phone can see it.

**Self-judging: not allowed.** If `judgeId == athleteId` it is blocked.

Consequences (to confirm in later topics):
- Choosing QR over a local list assumes **one local profile per device**; the owner **chooses their role (judge or judged) at the start of each session** (decided in topic 3, see Exercise sessions), and other athletes are only known through their QR.
- The judge's device stores an **alias snapshot** of the judged athlete in each session (their profile is not on that phone).
- Needs a "My QR" screen and a QR scanner (new UI work, see Design: screens and routes).
- A QR is forgeable; acceptable because nothing is verified until accounts exist (signatures once there is a backend).
- Privacy: the judge's phone stores other athletes' data → retention/deletion policy decided in topic 4 (see Storage & persistence).
- An anonymous athlete may have an optional alias shown only during the session (not persisted). *Assumption, not confirmed.*

Conceptual draft (not code):
- `Athlete { id: UUID, alias, createdAt, accountId?: null }`
- Device state: `currentAthleteId?: UUID` (null = anonymous)
- Session participant: `{ athleteId?: UUID, alias }` (`athleteId` null = anonymous)
- Versioned QR payload: `{ v: 1, athleteId, alias }`

### WOD hierarchy (decided)

Today a WOD's identity **is** its format: `WodType = 'forTime' | 'amrap' | 'emom' | 'chipper'` is the key in the `/judge/[type]` route (`app/judge/[type].tsx`), in the list in `app/index.tsx`, in `WOD_TYPES` (`components/judge/reducer.ts`) and in `getWodConfig` (`constants/wods.ts`); there is one WOD per format. The new model separates format from content.

**Modeled levels:** `Exercise` (catalog) and `Workout` / WOD (template). **`Event` and `Competition` are not modeled for now.**

**Format is data.** Formats (For Time, AMRAP, EMOM, Chipper…) stop being code functions and are described declaratively (advance rules, timer, score). The design of that description is decided in [WOD format as data (decided)](#wod-format-as-data-decided).

**Ownership.** Any athlete can create Exercises and WODs; the creator is the `ownerId`. There is no "Organizer" role.

**Lifecycle**
- The four current WODs and a base exercise catalog are **built-in** (read-only, distinguished by `origin: 'builtin'`).
- Athletes create their own (`ownerId`), can **archive** them, and **duplicating** creates an independent copy with `derivedFrom`.
- **Exercises and WODs are immutable**: they are never edited, only duplicated.

**Everything is reps.** A target is always a number of reps, and the log stores reps only. A **rep is one completion of what the WOD line describes**: "Handstand Walk, 10 m" → the rep counts when the 10 m are completed (`Row 50 cal` = 1 rep, `Plank 60 s` = 1 rep, `3 × HSW 10 m` = 3 reps).

**Exercise / WOD line**
- `Exercise`: name (English) only — **no unit**.
- WOD line: exercise, `target` (reps), optional **`repDescription: { amount, unit }`** and a **prescribed load**. The same exercise can ask 10 m in one WOD and 20 m in another, so the description lives on the line, not on the exercise. Without a description, a rep is a normal repetition.
- `unit` comes from a **closed list**, initially `m`, `cal`, `s` (extendable later).
- The description is **purely descriptive**: it enters no calculation. The UI may derive a display text ("3 reps × 10 m = 30 m").
- No movement-standard text.

**Modifications (post-judging adjustment, per session)**
- They live **in each session**, not in the WOD. A session stores: reference to the immutable WOD + event log + its list of modifications.
- Only **after judging has finished** (while judging, the effective WOD is always the original).
- **Append-only list, max 3 per session, no way out** (no fork, no consolidation).
- One modification is a **package** of changes approved by the judge in one go.
- Scope: only **reps / targets** and **duration / time cap**. They cannot change format, exercises, structure, load or the rep description.
- **Only a registered judge can approve.** With an anonymous judge the session accepts no modifications. `approvedBy = judgeId` is stored (unverified until accounts exist, as in Users). *Interpretation of "not being able to modify results".*
- **Effective WOD / adjusted result is derived** from `WOD + modifications (+ log)` and is **never stored**.

Consequences (to confirm in later topics):
- **Adjustments need each rep's position.** Decided in topic 3: events store only the raw input + session time; the **position** (and whether a rep counted) is **derived by replaying the log against the original WOD with the pinned engine version** (see Exercise sessions). This raises the priority of splits (B7).
- Modifications only exist for **saved sessions** (registered judged athlete). Decided in topic 3: the result screen of an unsaved session allows **no** adjustments. *Assumption.*
- **Engine only sees reps:** since units are descriptive, the current counting gesture works as is and format rules only deal with rep counts.
- **No partial credit inside a rep:** if the athlete completes 7 of the 10 m when time runs out, that rep does not count.
- **Anonymous ownership:** a null `ownerId` would collide with "built-in" → use a separate origin field (`builtin` | `user`). Decided in topic 4: anonymous athletes **cannot** create persistent WODs/Exercises; user content always has a real `ownerId` (see Storage & persistence).
- **Format as data** implies a small rules vocabulary; it is defined in [WOD format as data (decided)](#wod-format-as-data-decided) and must be in place before rewriting `constants/wods.ts`.
- The route will use the **WOD id** instead of the format.

Conceptual draft (not code):
- `Exercise { id, name, origin: 'builtin'|'user', ownerId?, derivedFrom?, archivedAt? }`
- `Workout { id, name, blocks: [{ formatId, lines: [{ exerciseId, target /* reps */, repDescription?: { amount, unit }, load? }], rounds/intervals/duration… }], scoringBlock, origin, ownerId?, derivedFrom?, archivedAt? }` (block content shape: see WOD format as data)
- `unit ∈ { 'm', 'cal', 's' }` (closed list, extendable)
- `Format` = declarative behavior data, composed of primitives (see WOD format as data).
- `SessionAdjustment { id, changes: [reps/target or duration change], approvedBy: judgeId, approvedAt }` (≤ 3 per session, only after judging)
- Derived, not persisted: `effectiveWorkout = apply(workout, adjustments)`

### WOD format as data (decided)

Today a format is a `WodConfig` made of functions (`constants/wods.ts`: `getTarget`, `advance`, `isComplete`, `getKpi`, `getSegments`, `getHint`…), and the reducer advances on reaching the target (`components/judge/reducer.ts:10`). Rereading the code showed a **real EMOM bug**: it advances a minute on reaching the target (`reducer.ts:10`) **and** every 60 s (`hooks/use-judge.ts:45`), so it skips minutes. "When does it advance" must be an explicit format rule.

**Expressiveness: composable primitives.** A **closed** vocabulary expressed as data. A new format is created by combining primitives **without writing code**; only a new primitive needs code. No formula language.

**Boundary: format = behavior; WOD = content.**
- The format defines the rules: advance trigger, repetition, timer, stop condition, score.
- The WOD defines lines, reps per round/interval, number of rounds/intervals and duration.

**Chipper is unified with For Time** (Chipper = a 1-round For Time). "Station 4/10" vs "round 2/3" is derived from whether there is one round or several.

**The vocabulary must be able to express (now or mid-term):** work/rest intervals (Tabata), progressive reps per interval (Death by / ascending EMOM), buy-in and cash-out, and rests between rounds or blocks.

**Composition by blocks.** A WOD is a **sequence of blocks**; **each block has its own format and timer** (e.g. 400 m + 12-min AMRAP + 400 m, with the AMRAP countdown starting after the buy-in). The WOD **designates one scoring block**; the others are timed but do not score.

**EMOM / intervals:** if the target is reached before the minute ends, the app **waits for the clock** (shows "done · rest"); the interval only advances when the clock does. **Extra reps are ignored.**

**EMOM / interval score:** **intervals completed out of total** (primary) + **total valid reps** (secondary). An interval is completed if its target is reached within its slot. Both are **derived from the log**, never stored.

**Authorship: built-in formats only for now**, immutable and **versioned**; the model is ready for user formats but there is no editor. A new format ships with an app version.

Primitives (draft vocabulary, not code):
- **Step:** `work` (counts reps up to a target) | `rest` (timed, no counting).
- **`advance`:** `onTarget` | `onClock(seconds)`. `rest` steps are always `onClock`.
- **`repeat`:** `once` | `rounds(n)` (with reps per round) | `cycle` (until stop) | `perInterval` (one slot per interval; alternating targets or a **per-interval target vector** for progressive reps).
- **`timer`:** `elapsed` | `countdown(duration)` | `intervalCountdown(seconds)`.
- **`stop`:** `whenAllDone` | `atDuration` | `afterIntervals(n)`, with an optional `cap` (time cap).
- **`score`:** `time` | `roundsPlusReps` | `intervalsCompleted+totalReps` | `totalReps`.
- **Block:** `{ format, content }`; the WOD is a sequence of blocks plus the scoring-block index.

Current formats as compositions:
- **For Time** (FRAN, Filthy Fifty): `rounds(n)` + `onTarget` + `elapsed` + `whenAllDone` + `time`. Chipper = `rounds(1)`.
- **AMRAP** (CINDY): `cycle` + `onTarget` + `countdown` + `atDuration` + `roundsPlusReps`.
- **Intervals / EMOM:** `perInterval` + `onClock(60)` + `intervalCountdown` + `afterIntervals(n)` + `intervalsCompleted+totalReps`. Tabata = same primitives with `work` + `rest` steps of fixed seconds.

Assumptions (not confirmed, to validate when they matter):
- **For Time with time cap:** score = time; if the cap runs out unfinished, score = total reps completed. **AMRAP:** rounds + partial reps.
- **Missed interval** (the minute ends before the target): its partial reps are kept in the log.
- **Presentation** (KPI, section label, segment window, hint) is **derived from the structure** by the engine, with optional overrides; today these are `WodConfig` functions. Open: how the "CHIPPER" label (`mode` in the current UI) is shown after unifying with For Time.
- A rest is a timed step that advances by clock only.

Consequences:
- A **primitive interpreter** replaces `WodConfig` / `getWodConfig` (Track B 9, now bigger: engine + blocks).
- **Engine versioning:** since results are derived from `WOD + format + log`, the semantics of a primitive **never change silently**; a format carries a schema/engine version.
- **Log position** is no longer just (round, line): it is `(block, round/interval, line)` and is **derived by replay**, not stored (see Exercise sessions).
- **Post-judging modifications:** a target change addresses a `(block, round/interval, line)` coordinate of the replayed result (see Exercise sessions).
- **B3 (robust EMOM)** is absorbed by the `onClock` rule derived from `elapsed`; **B6 (end of WOD)** is expressed with `stop`; **B8's EMOM score question** is resolved.

### Exercise sessions (decided)

A **session** is one run of one WOD, judged for one athlete. It builds on Users (registered/anonymous, `judgeId`, unverified) and on the immutable WOD + built-in versioned format.

**Roles at session start: the owner chooses their role each session.** The device owner says whether they are the judge or the judged athlete, then scans the other person's QR or leaves them anonymous. Fully symmetric, consistent with "everyone is an athlete and judge is a circumstantial role". This amends the Users assumption "owner = usual judge". Self-judging stays blocked (`judgeId == athleteId`).

**Clock: no pause, no reset.** Once started, the clock runs. The only way out is **abort, which discards the session**. The timer's tap-to-pause and long-press-reset gestures are removed. One **session clock** (ms since start, after the countdown) spans all blocks; events are stamped with it, and block timers are derived from it.

**No recovery.** Nothing is persisted while judging. If the app is closed or killed mid-WOD, the session is lost: no drafts, no "aborted" sessions. A session is saved **once, atomically, when it finishes**, and only if the judged athlete is registered (Users table).

**Event = raw input + session time only.** `{ t, kind: 'rep' | 'noRep' }`. Position `(block, round/interval, line)`, whether a rep counted or was ignored, splits and score are all **derived by replaying the log against the original WOD with the pinned engine version**.

**Stored vs. derived**
- Stored: session header, raw events, adjustments.
- Derived (never stored): positions, counted/ignored, splits, score, effective WOD, adjusted result.
- Adjusted result: replay under the **original** WOD to get each event's position, then apply the approved target/duration changes **per position**. Reps are **not re-flowed** across segments, and events after an adjusted end are excluded. *Interpretation to validate when designing the adjustment screen.*

Conceptual draft (not code):
- `Session { id, wodId, engineVersion, judgedAthleteId, judgedAlias, judgeId?, verification: 'unverified', startedAt, endT, events: Event[], adjustments: SessionAdjustment[] }`
- `Event { t /* ms on the session clock */, kind: 'rep' | 'noRep' }`
- Transient (memory only): the in-progress session; the result screen of an unsaved session is built from it and discarded.

Consequences:
- **The engine must be deterministic** given `(WOD, engineVersion, events)`, and its semantics can never change silently. This is now load-bearing: a set of golden logs is advisable once tests are introduced.
- **Risk to watch:** with no recovery, and keep-awake out of scope, a screen timeout or Android killing the app mid-WOD loses the session, and JS timers may not run reliably with the screen off. Revisit keep-awake (or recovery) if this bites.
- Session setup needs a role/QR screen (B14); persistence happens only at finish (B15).

Assumptions (not confirmed):
- A no-rep carries no extra data (no reason/category).
- A session has no "aborted" state; it is either finished and saved (registered judged athlete) or gone.
- The session header fields above (`engineVersion`, `endT`, alias snapshot) are a first cut; the storage layout is in Storage & persistence (decided).

### Storage & persistence (decided)

Nothing is persisted today (no storage or auth dependency). Verified in the Expo SDK 57 docs: `expo-sqlite` ships with Expo Go (no dev build), supports transactions (`withTransactionAsync`), `PRAGMA user_version` migrations and `SQLiteProvider` / `useSQLiteContext`; `android.allowBackup` defaults to `true`.

**Engine: SQLite via `expo-sqlite`.** Saving a session is one transaction; queries by athlete, WOD and date; referential integrity.

**Built-ins are seeded into the DB by migrations.** Built-in WODs, Exercises and formats are inserted by **append-only migrations**, in the same tables as user content (`origin: 'builtin'`). They are never modified or deleted; a change = a new row.

**Anonymous athletes cannot create content.** Without a local profile, no WODs or Exercises are created (create the profile first). Every user-content `ownerId` is real; there are no null-owner orphans. *Resolves the open question of topic 2.*

**Retention.** The owner can **delete their own sessions** (where they are the judged athlete). **Foreign sessions are kept until delivered** (future sync) and then purged.

**Backup: `android.allowBackup: false`.** Nothing leaves the device, not even to Google Drive. Losing or changing the phone loses everything, including the owner's own sessions, until sync/accounts exist. *Accepted risk.*

**Deleting the profile = deleting what is theirs:** own sessions and own content are removed; foreign sessions pending delivery are kept.

Schema draft (not code):
- `PRAGMA user_version` (schema version); `foreign_keys = ON`; WAL.
- `device { deviceId }` · `athlete_profile { id, alias, createdAt, accountId NULL }` (single row)
- `formats { id, version, definition /*JSON*/, engineVersion, origin }`
- `exercises { id, name, origin, ownerId?, derivedFrom?, archivedAt?, createdAt }`
- `workouts { id, name, blocks /*JSON*/, scoringBlock, origin, ownerId?, derivedFrom?, archivedAt?, createdAt }`
- `sessions { id, wodId FK, engineVersion, judgedAthleteId, judgedAlias, judgeId?, verification, startedAt, endT, events /*JSON*/, createdAt }` — **immutable rows**
- `session_adjustments { id, sessionId FK, seq 1..3, changes /*JSON*/, approvedBy, approvedAt }` — **insert-only**, `UNIQUE(sessionId, seq)`
- **Own vs. foreign:** `judgedAthleteId == athlete_profile.id` → own (deletable); otherwise foreign (retained until delivered).

Consequences:
- **Session save** = a single `withTransactionAsync` at finish, only when the judged athlete is registered (B15).
- **Migrations:** numbered, forward-only, run at startup inside a transaction; seeding built-ins is just another migration.
- **Content deleted with the profile:** an own WOD/Exercise still referenced by a retained foreign session **cannot be deleted** (it would break that session on delivery). Rule added by me: it is kept **without an owner** until those sessions are purged. Since `blocks` are JSON, a reference table (`workout_exercises`) or equivalent is needed to detect dependencies.
- **Foreign sessions accumulate** until sync exists; without it, the only way to empty them is clearing the app's data from Android. Also, a judged athlete cannot ask for their session to disappear from the judge's phone before delivery.
- **`judgeId` / `judgedAthleteId` are UUIDs without a foreign key** (other athletes are not local rows); the alias travels as a snapshot.
- **No backup and no recovery:** consistent with topic 3; real protection will come with accounts/sync.

Assumptions (not confirmed):
- **UUIDv7 ids** generated on device, `createdAt` on every record and a `deviceId` per install make future sync easy. Since sessions are immutable and adjustments append-only, syncing would be a conflict-free union (own deletions will need tombstones when the time comes).
- **`events` as a single JSON column** (read whole to replay the log; never queried per event). Adjustments live in their own table so the session row is never mutated.
- **No ORM for now:** raw `expo-sqlite` with a thin typed repository layer (Drizzle stays an option).
- **No encryption:** low-sensitivity data (alias and reps); SQLCipher does not work in Expo Go anyway.
- **Screen flows** for creating a profile, deleting a profile and warning that a session will not be saved/delivered are decided in Design: screens and routes (topic 5). One small addition: the first-run flag (`firstRunDone`) needs a minimal app-state table in the DB.

### Design: screens and routes (decided)

Today only `/` (WOD list, `app/index.tsx`) and `/judge/[type]` (`app/judge/[type].tsx`, phases ready → countdown → judging) exist, plus `+not-found`, inside a header-less `Stack` (`app/_layout.tsx`).

**Navigation: hub with a stack, no bottom bar.** A home screen with a big **New session** button and links to History, WODs (library) and Settings; everything else stacks. The judging screen and the result are full screen.

**First run: skippable prompt.** Once, the app offers **Create profile** or **Continue anonymous**; it can be skipped and the profile created later. Without a profile everything works, but nothing is saved.

**Sections in the first version:** **History** (my sessions), **Library** (WODs and Exercises, read-only) and **Settings**. There is **no** "sessions I judged" list.

**Adjustments only if the owner was the judge.** The registered judge is the local profile, so `approvedBy` is real. If the owner was the judged athlete, that session accepts no adjustments on this phone.

**The adjustment window is only the result screen, once, right after finishing.** After leaving it, it cannot be reopened.

**Judging controls:** a **✕ in the timer strip** (outside the gesture area) opens "Abort session? Data will be lost". In AMRAP / EMOM a **Finish** button appears in the same place when the clock reaches 0. Android's back button also asks for confirmation.

**Unsaved-session warning:** a banner in the **setup** (when the judged athlete is anonymous: "This session won't be saved") and another on the **result**.

**"My QR":** a shortcut on the **hub** (when there is a profile) and also in Settings.

Route map (draft):

```
app/
  _layout.tsx           root Stack; SQLiteProvider (B17); first-run prompt
  index.tsx             Hub: New session · My QR (if profile) · History · WODs · Settings
  my-qr.tsx             My QR full screen, high contrast (needs a profile)
  profile-create.tsx    modal: create profile (alias)
  settings.tsx          profile (edit alias, delete what's mine) · version
  history/index.tsx     my sessions (where I am the judged athlete)
  history/[id].tsx      detail: result and splits · delete (no adjusting)
  library/index.tsx     WODs and Exercises (read-only)
  library/[id].tsx      WOD detail
  session/_layout.tsx   in-memory session context; blocks the back gesture
  session/wod.tsx       pick a WOD (today's list from app/index.tsx)
  session/setup.tsx     role (judge / athlete) · scan the other person's QR or anonymous · "won't be saved" banner
  session/run.tsx       ready → countdown → judging (today's app/judge/[type].tsx) + ✕ / Finish
  session/result.tsx    score + splits + save banner · Adjust (only if owner = judge and saved)
  session/adjust.tsx    up to 3 packages (reps/targets, duration)
```

Flow: **Hub → wod → setup → run → result (→ adjust)**. The `/judge/[type]` route and the `WOD_KEYS` / `VALID_TYPES` / `WOD_TYPES` lists go away (B13). Session state lives in memory in the context of `session/_layout.tsx`; routes only carry ids. Nothing is persisted while judging (Exercise sessions).

Consequences:
- **Foreign sessions appear on no screen:** they are stored on the judge's phone, cannot be seen or deleted, and are purged only on delivery (Storage & persistence). Together with the single adjustment window, **a judge only sees the result of what they judged on the result screen, right after finishing**.
- **History** lists only sessions where the owner is the judged athlete; they are read-only and deletable, **with no adjustments** (the owner was not the judge).
- **Result banners:** "saved in your history" (owner = judged), "saved on this phone; will be delivered to <alias> once sync exists" (foreign session) and "not saved" (anonymous judged athlete).
- **Camera and QR:** scanning asks for camera permission when "Scan QR" is tapped; QR generation/reading libraries are to be chosen when implementing B10/B11.
- **Style:** every new screen follows the `constants/hf.ts` tokens; only the judging screen aims to minimize looking at the phone.

Assumptions (not confirmed):
- **Flow order:** the WOD is chosen first and the roles second (today's WOD list becomes the first step of "New session").
- **Settings contains the profile** (there is no separate Profile screen); deleting what's mine asks for explicit confirmation.
- **Read-only library:** "duplicate" makes no sense until a WOD editor exists.
- **Open:** whether Settings should show an "N sessions pending delivery" counter (no list) for transparency.

## Track B — Short-term tasks (after Track A setup)

### Independent of Track A

1. **Housekeeping** — ✅ **done**
   - Removed `package-lock.json` (`git rm`); CLAUDE.md and README commands now use pnpm. `scripts/reset-project.js` was left untouched (it generates text for a blank template).
   - UI text translated to English in `app/index.tsx` (`10 stations · 50 reps each`, `select a workout`, `+ NEW WORKOUT`, `coming soon`), `components/judge/start-overlay.tsx` (`START`) and `app/+not-found.tsx` (`Screen not found`, `Back to home`). `components/judge/gesture-footer.tsx` was already in English.
   - Fixed the `import/no-duplicates` warning in `components/judge/hero-counter.tsx`.
2. **Tap = rep** — today only the swipe works (confirmed). In `hooks/use-judge.ts` the `Gesture.Pan().onEnd` only fires if the pan activated. Add `Gesture.Tap()` → `handleRep` and compose with `Gesture.Exclusive(pan, tap)`. Check whether `runOnJS` is deprecated in worklets 0.10 (`scheduleOnRN`).
3. **Robust EMOM** — the minute advance uses a separate 60 s `setInterval` (`use-judge.ts`) that desyncs from `elapsed` when pausing/resuming, and `minuteIdx` is not clamped at 10. Worse, the minute also advances on reaching the target (`reducer.ts:10`), so minutes get skipped (double advance). Derive the minute from `elapsed` (`floor(elapsed / 60)`), clamp, and wait for the clock after the target is reached. *Absorbed by the `onClock` rule of the format engine (see WOD format as data); it can also be fixed earlier on the current code.*
4. **Sound cues** with `expo-audio` — countdown, EMOM minute change, end of time.
5. **Volume buttons as rep / no-rep** — needs a native module → **dev build** (not Expo Go; EAS profile `preview3` already has `developmentClient`). Evaluate the library before committing.

### Depends on Track A (session/data model shapes them)

6. **End-of-WOD state** — For Time / Chipper finish automatically on the last rep (stop timer, freeze final time). AMRAP / EMOM show "TIME" and the judge confirms the end (to count partial reps of the last round). Today the app just sits there.
7. **Splits** — `LogEntry` (`components/judge/types.ts`, `reducer.ts`) gains `t` (ms on the session clock). Splits, positions and scores are **derived** by replaying the raw log with the engine; **no position is stored** in the event (see Exercise sessions).
8. **Result screen** — main score per format (time for For Time / Chipper, rounds + partial reps for AMRAP) plus splits per exercise/round. Reuse `formatTime` from `reducer.ts` and the `HF` tokens. EMOM / interval score (decided): intervals completed out of total + total valid reps, both derived from the log.
9. **`WodConfig` → declarative, serializable `WodDefinition`** (blocks, lines, reps, duration; each line may carry an optional descriptive `repDescription`) plus a **versioned, built-in `Format` described by composable primitives** and an **interpreter** that runs a sequence of blocks; the current WODs become data (Chipper becomes a 1-round For Time). No editor yet.
10. **"My QR" screen** — shows the local athlete's versioned QR payload (`{ v: 1, athleteId, alias }`). Requires a local profile (create/edit alias). Screen: `my-qr` (shortcut on the hub, also in Settings).
11. **QR scanner** — the judge scans the judged athlete's QR at session start; block self-judging (`judgeId == athleteId`); store an alias snapshot in the session. Lives in `session/setup`; camera permission is requested when "Scan QR" is tapped.
12. **Post-judging adjustment screen** — after judging ends, a **registered** judge approves up to 3 modification packages (reps/targets, duration) for a saved session; the adjusted result is **derived**, never stored. Blocked for anonymous judges. Screen: `session/adjust`, reachable **only from `session/result`, once, right after finishing**, and only when the **owner was the judge** and the session was saved.
13. **Route by WOD id** — replace the format-keyed route `/judge/[type]` and the `WOD_KEYS` / `VALID_TYPES` / `WOD_TYPES` lists with lookups by WOD id (depends on the format engine, see WOD format as data).
14. **Session flow screens** — `session/wod` (pick the WOD), then `session/setup`: the owner picks their role (judge / judged), scans the other person's QR or leaves them anonymous; shows the "This session won't be saved" banner when the judged athlete is anonymous; blocks self-judging. Expands B10/B11.
15. **Persist finished session** — a single atomic save at finish, only when the judged athlete is registered; nothing is persisted while judging (no drafts, no aborted sessions). Depends on B17.
16. **Remove pause/reset, add abort** — drop the timer's tap-to-pause and long-press-reset (`TimerStrip` `onPress`/`onLongPress`, `toggleTimer`/`resetTimer` in `hooks/use-judge.ts`); add an **abort** action with confirmation that discards the session. Control: a **✕ in the timer strip** (outside the gesture area) with "Abort session? Data will be lost"; Android back also confirms; in AMRAP / EMOM a **Finish** button appears in the same place at 0.
17. **Storage layer** — `pnpm exec expo install expo-sqlite`; open the DB with `SQLiteProvider`; set `foreign_keys = ON` and WAL; migration runner based on `PRAGMA user_version` (forward-only, transactional); schema v1 (see Storage & persistence). Thin typed repositories, no ORM.
18. **Seed built-ins by migration** — the four current WODs become built-in `formats` (For Time, AMRAP, Intervals), `exercises` and `workouts`, inserted by an append-only migration (Chipper becomes a 1-round For Time).
19. **Local profile** — create (required before creating any content), edit alias, delete-what's-mine with the retention rule (own sessions and own content go; foreign sessions pending delivery stay; own content still referenced by them is kept without an owner).
20. **`android.allowBackup: false`** in `app.json` so nothing leaves the device.
21. **Route map + hub + session context** — implement the route tree of Design: screens and routes (hub `app/index.tsx`, `session/_layout.tsx` with the in-memory session context and back-blocking); remove `/judge/[type]`. Done together with B13.
22. **First-run prompt** — one-time "Create profile / Continue anonymous" with a `firstRunDone` flag in a minimal app-state table (depends on B17 and B19).
23. **History** — `history/index` (my sessions, where I am the judged athlete) and `history/[id]` (result, splits, delete; no adjusting).
24. **Library** — `library/index` (WODs and Exercises) and `library/[id]` (WOD detail), read-only.
25. **Settings + profile creation** — `settings` (edit alias, delete what's mine with explicit confirmation, app version) and the `profile-create` modal.

### Out of scope for now

Undo last rep, keep-awake, tests, iOS / store release.

## Known issues (code)

- Tap is announced ("tap = rep" in the footer) but does not count — see B2.
- EMOM timing desync — see B3.
- EMOM double advance: a minute advances on reaching the target (`components/judge/reducer.ts:10`) **and** every 60 s (`hooks/use-judge.ts:45`), so minutes are skipped — see B3.
- No final state: the timer keeps running after completion / at 00:00 — see B6.
- Timer tap pauses and long-press resets the clock, but the gesture keeps counting reps while paused and the reset does not clear the reps (`hooks/use-judge.ts:129-131`) — see B16.
