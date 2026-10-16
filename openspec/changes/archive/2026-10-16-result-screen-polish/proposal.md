# Proposal

## Why

The result shown right after judging has two rough edges found while writing the baseline specs (decisions 2.5 and 2.6 in the archived `baseline-specs` proposal). Its banner claims the session was saved before the save has finished, and still claims it if the save fails. It is also the only screen in the session flow with no visible way out: hardware back is the only exit, and it leads to workout selection rather than the hub.

## What Changes

- The saved-state banner on the post-judging result reflects the real save outcome. It reads "Saving…" while the save is in progress, today's text once it succeeds, and "Couldn't save this session" if it fails. There is no retry.
- Sessions that are never saved (anonymous judged athlete) keep showing "Not saved" immediately, unchanged.
- The post-judging result gets a ✕ that closes the session and returns to the hub.
- Hardware back on the result keeps its current behavior (back to workout selection).
- The History detail view is unchanged. Its sessions are always already saved, and it already has its own ✕.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `session-results`: the "Saved-state banner" requirement now depends on the actual save outcome, adding the "Saving…" and "Couldn't save this session" states.
- `session-storage`: the "Failed saves are silent" requirement is removed. A failed save is now reported through the banner (see `session-results`).
- `session-flow`: the "Session flow navigation" requirement gains a ✕ on the post-judging result that returns to the hub.

## Impact

- **Code**:
  - `app/session/result.tsx`: tracks the save outcome and adds a header row with a ✕.
  - `components/result/result-screen.tsx`: two more banner states.
- **No changes** to the database schema, the stored data, `db/sessions.ts`, History, or any dependency.
- **Specs**: MODIFIED deltas for `session-results` and `session-flow`; a REMOVED delta for `session-storage`.
