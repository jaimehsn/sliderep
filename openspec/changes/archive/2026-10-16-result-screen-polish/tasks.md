# Tasks

## 1. Banner reflects the real save outcome

- [x] 1.1 Widen `ResultScreen`'s `saved` prop in `components/result/result-screen.tsx` to `'own' | 'foreign' | 'none' | 'saving' | 'failed'`, with labels "Saving…" and "Couldn't save this session", and verify `pnpm lint` passes and `app/history/[id].tsx` still compiles unchanged
- [x] 1.2 In `app/session/result.tsx`, add `saveStatus: 'pending' | 'saved' | 'failed'` (set it from the `saveSession` `.then`/`.catch`, keep the `console.error`) and derive the `saved` prop per design.md decision 1; verify on device that judging an identified athlete shows "Saving…" briefly, then "Saved on this phone — will be delivered to Leo once sync exists", and that judging anonymously still shows "Not saved" immediately
- [x] 1.3 Check the failure path by temporarily making `saveSession` reject (e.g. `throw` at the top of it, not committed): verify on device that the banner reads "Couldn't save this session", ADJUST RESULT does not appear and no session is stored, then revert the temporary change and verify `git diff db/sessions.ts` is empty
- [x] 1.4 Update `CLAUDE.md` (the `session/result.tsx` and `result-screen.tsx` entries) to describe the save-outcome banner states, and verify the text names "Saving…" and "Couldn't save this session"

## 2. ✕ on the post-judging result

- [x] 2.1 Add a header row with a ✕ to `app/session/result.tsx`, copying `app/history/[id].tsx`'s header and `closeBtn` styles, that calls `router.dismissTo('/')`; verify `pnpm lint` passes
- [x] 2.2 Verify on device that tapping ✕ on the result lands on the hub (not workout selection), that starting a NEW SESSION afterwards begins with no leftover role or other person, and that hardware back on the result still goes to workout selection; if `dismissTo('/')` does not reach the hub, apply design.md's fallback and re-verify
- [x] 2.3 Verify the History detail view still shows exactly one ✕ and "Saved in your history"
- [x] 2.4 Update `CLAUDE.md`'s `session/result.tsx` entry to mention the ✕ → hub, and verify it states that hardware back still goes to workout selection

## 3. Validate

- [x] 3.1 Run `openspec validate result-screen-polish --strict` and verify it reports the change as valid

## Workflow follow-up

- Archive with `/opsx:archive` once the device checks pass, syncing the deltas into `session-results`, `session-flow` and `session-storage`.
