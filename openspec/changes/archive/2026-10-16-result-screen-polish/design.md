# Design

## Context

- `app/session/result.tsx` computes `savedState: 'own' | 'foreign' | 'none'` from the role and profile alone, then fires `saveSession(...)` in an effect. On success it calls `setSessionId`; on failure it only does `console.error`. The banner never learns the outcome.
- `components/result/result-screen.tsx` maps `saved` to the banner text. It is shared with `app/history/[id].tsx`, which always passes `saved="own"` and renders its own ✕ header row above `<ResultScreen>`.
- The session group is a nested `Stack` (`app/session/_layout.tsx`) pushed from the hub, so the hub (`/`) sits underneath it. `expo-router` 57 exposes `router.dismissTo`.

## Goals / Non-Goals

**Goals:**
- Make the banner reflect the actual outcome of `saveSession` on the post-judging result.
- Give the post-judging result a ✕ to the hub, styled like the other screens' ✕.

**Non-Goals:**
- Retrying a failed save, or any error detail beyond the one banner line.
- Changing hardware-back behavior on the result.
- Touching History, the schema or `db/sessions.ts`.

## Decisions

**1. Save outcome lives in `session/result.tsx` as local state, and `saved` gains two values.**
`result.tsx` holds a `saveStatus: 'pending' | 'saved' | 'failed'`, set to `saved` in the `saveSession` `.then` and to `failed` in its `.catch` (keeping the `console.error`). The `saved` prop passed to `ResultScreen` is derived:
- `'none'` when `judgedAthleteId == null`, which never saves;
- else `'saving'` while pending, `'failed'` on error;
- else today's `'own'` / `'foreign'`.

`ResultScreen`'s `saved` union becomes `'own' | 'foreign' | 'none' | 'saving' | 'failed'`, with "Saving…" and "Couldn't save this session" as the two new labels.

*Alternative:* put the status into `use-session.tsx`'s context next to `sessionId`. That is rejected: nothing outside this screen needs it, and the screen already owns the save. History needs no change, since it keeps passing `'own'`.

**2. ADJUST RESULT already disappears on failure.**
It is gated on `sessionId != null`, which is never set when the save fails, so no extra condition is needed. The spec's "Save failed" scenario is satisfied by existing code.

**3. The ✕ lives in `session/result.tsx`, not in `ResultScreen`.**
`result.tsx` gets a header row with a ✕, copying `history/[id].tsx`'s existing header (right-aligned, same `closeBtn` styles). Putting it inside `ResultScreen` would give History two ✕ buttons.

**4. ✕ calls `router.dismissTo('/')`.**
This pops the whole session stack back to the hub. Unmounting `SessionProvider` clears the session context, as the "Leaving the flow clears it" scenario requires.

*Alternatives:*
- `router.dismissAll()` returns to the first screen of the nearest stack, which is likely `session/wod` rather than the hub.
- `router.replace('/')` would leave the hub instance below it on the stack, duplicating it.

## Risks / Trade-offs

- [`dismissTo('/')` from inside a nested stack might not reach the root hub on this router version] → Verify on device as part of the tasks. Fallback: `router.dismissAll()` followed by `router.back()`, or navigating via the parent navigator.
- [A save that resolves after the user has already tapped ✕] → The state update targets an unmounted component. This is harmless in React 19, and the session is still stored.
