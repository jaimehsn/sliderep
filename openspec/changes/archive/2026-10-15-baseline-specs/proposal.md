# Proposal

## Why

SlideRep's backlog (B1–B25) is complete, but its behavior is only recorded as decision history (`docs/ROADMAP.md`) and as a code map (`CLAUDE.md`). There is no behavior contract that future changes can be expressed against. This change captures what the app does today as a spec baseline, so every later change (keep-awake, a WOD editor, sync…) becomes a reviewable delta instead of new prose.

## What Changes

- Document the app's current, observable behavior as specs with WHEN/THEN scenarios, split into ten capabilities.
- Specs describe what the app does **today**, verified against the code, not what the ROADMAP originally drafted. Where the two differ, the code wins and the gap is noted.
- Behavior that exists in code but was never explicitly decided is written as-is and listed under **Open Questions**, not silently promoted to a decision.
- **No code or behavior changes.** `docs/ROADMAP.md` stays as decision history and `CLAUDE.md` as the code map; the specs are a new, behavior-only layer.

## Capabilities

### New Capabilities

- `wod-formats`: The four built-in formats (For Time, AMRAP, EMOM, Chipper as a 1-round For Time) and their rules for advancing, completing and scoring, plus the four built-in WODs (FRAN, CINDY, the EMOM workout, Filthy Fifty).
- `judging`: Live rep counting during a WOD: swipe right or tap = rep, swipe left = no-rep, the pre-start summary and countdown, the timer modes (elapsed, countdown, per-minute), automatic finish, and aborting a session in progress.
- `session-flow`: The path from picking a WOD to seeing the result: choosing a role (judge / judged), scanning the other person's QR or skipping, self-scan rejection, "Judging X" / "Judged by X" labelling, and back-navigation being blocked inside the flow.
- `session-results`: Deriving the score and splits from the raw event log by replay (nothing derived is stored), and the result banner (saved in your history / saved for delivery to X / not saved).
- `result-adjustment`: Post-judging adjustments: available only right after finishing when the owner was the registered judge, at most 3 adjustment packages per session, editable split targets and duration, and reps never re-flowed across positions.
- `session-storage`: Which sessions are persisted (only when the judged athlete is registered), how own vs. foreign sessions are defined, deletion rules, and that nothing leaves the device (no backup).
- `athlete-profile`: The single local profile: create, edit the alias, delete (own sessions removed, foreign kept), and the owner's QR code.
- `history`: Listing the owner's own sessions, viewing a session's (possibly adjusted) result without adjusting, and deleting a session.
- `library`: Read-only browsing of the built-in workouts and the deduplicated list of exercises.
- `app-shell`: The hub and its entry points, the one-time first-run prompt (create profile / continue anonymous), and the Settings screen (profile link, app version).

### Modified Capabilities

None. `openspec/specs/` is empty; this change creates the baseline.

## Impact

- **Code**: none. No app source, dependency, schema or configuration changes.
- **OpenSpec**: on archive, creates `openspec/specs/<capability>/spec.md` for the ten capabilities above. Later changes declare MODIFIED/ADDED deltas against them.
- **Docs**: overlap with `docs/ROADMAP.md` and `CLAUDE.md` is accepted. If a decision changes, the spec delta is the source of truth for behavior; the ROADMAP keeps the why.

## Open Questions

Observed in code (or documented as an interpretation call) but never explicitly confirmed. The specs record them as current behavior; each can be confirmed or changed later with its own change.

- **EMOM extra reps**: during judging, the live count stops at the minute's target, but the result counts every valid rep (a minute can show 12/10, and all 12 add to the total). **Decision (2026-10-15): confirmed as is.**
- **Adjustment duration cutoff**: a shortened duration drops events by raw timestamp (`t > newDuration`), for every format. A raised duration has no effect on AMRAP and adds empty, uncompleted minutes to EMOM. **Decision (2026-10-15): confirmed as is, including raised durations.**
- **EMOM adjusted total**: the adjusted total of valid reps stays unclamped by target changes; a target change only flips whether a minute counts as complete. (For Time/Chipper/AMRAP differ by design: a lowered target there stops counting the position's reps above it.) **Decision (2026-10-15): confirmed as is, consistent with EMOM extra reps.**
- **First-run back press**: leaving the first-run prompt with the hardware back button leaves it unanswered, so it is asked again on the next launch. **Decision (2026-10-15): confirmed as is (back = "answer later").**
- **Failed save**: if saving a finished session fails, nothing is shown to the user (the error is only logged), and the result banner still says the session was saved. **Decision (2026-10-15): change — the banner must reflect the real save outcome (nothing or "Saving…" while pending, today's text on success, "Couldn't save this session" on failure; no retry). Follow-up change: `result-screen-polish`.**
- **No ✕ on the post-judging result**: the result shown right after judging has no close action; the only way out is the hardware back button. **Decision (2026-10-15): change — add a ✕ to the post-judging result that returns to the hub. Follow-up change: `result-screen-polish` (together with the failed-save banner).**
- **Judged without a profile**: when the owner has no profile and chooses "I'll be judged", the session is not saved, but no "won't be saved" warning is shown (that warning only exists for judge + skip). **Decision (2026-10-15): change — when the owner has no profile and chooses "I'll be judged", show the same "This session won't be saved" warning (CONTINUE / GO BACK) before starting. Follow-up change: `judged-without-profile-warning`.**

### Follow-up changes

Each describes behavior that differs from this baseline, so each will be a MODIFIED/ADDED delta against the archived specs. Start each with `/opsx:propose`.

- `result-screen-polish`: the result banner reflects the real save outcome; a ✕ on the post-judging result returns to the hub. Touches `session-results`, `session-storage`, `session-flow`.
- `judged-without-profile-warning`: warn "This session won't be saved" before starting when the owner has no profile and is judged. Touches `session-flow`.
