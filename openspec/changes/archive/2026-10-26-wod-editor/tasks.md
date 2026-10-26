# Tasks

## 1. Data model and repository

- [x] 1.1 Add `exerciseId` and optional `load` to `WodLine`, and `load?` to `db/workouts.ts`'s `StoredLine`, read by the parser (design decision 2); verify `npx tsc --noEmit` passes and `pnpm test` stays green with no change under `tests/__goldens__/`
- [x] 1.2 Add `origin`/`ownerId` to `Workout` and every workout select, plus `createWorkout` and `archiveWorkout` (design decision 4); verify with `npx tsc --noEmit`, and that an archive call on a built-in id changes no row (checked on device in 6.1)
- [x] 1.3 Extend `deleteProfile` with the two workout statements in its transaction (design decision 5), and update the delete confirmation copy in `app/profile.tsx` to the spec's text; verify with `npx tsc --noEmit` and `pnpm lint`
- [x] 1.4 Document the new `db/workouts.ts` and `db/profile.ts` behavior in `CLAUDE.md`'s Storage section; verify the entries name `createWorkout`, `archiveWorkout`, the ownership fields and the profile-deletion rule

## 2. Draft model

- [x] 2.1 Create `components/editor/draft.ts` with the per-format `Draft` types, `emptyDraft`, `draftToStoredBlock`, `draftFromBlock` and `validateDraft` (design decisions 1 and 8); verify with `npx tsc --noEmit`
- [x] 2.2 Add `tests/draft.test.ts` covering:
  - each built-in round-trips through `draftFromBlock` → `draftToStoredBlock` to its seed block;
  - a 21-15-9 For Time builds a config whose fold runs THRUSTERS 21 … PULL-UPS 9;
  - "same reps" fills every round;
  - a 10-minute EMOM over a 3-slot sequence puts slot 1 in minute 10;
  - validation flags an empty name, no lines, a missing exercise and a zero.

  Verify that `pnpm test` passes.

## 3. Presentation of load and rep description

- [x] 3.1 Add `note` to `WodExercise` in `summarize()` and render it in `app/library/[id].tsx` and `components/judge/start-overlay.tsx` (design decision 3); verify that `pnpm test` stays green and that the built-ins show no note
- [x] 3.2 Update `CLAUDE.md`'s WOD System and judge component entries for `WodLine`'s new fields and `note`; verify the entries match the code

## 4. Editor screen

- [x] 4.1 Create `components/editor/exercise-picker.tsx` (design decision 7); verify with `npx tsc --noEmit` and `pnpm lint`
- [x] 4.2 Create `app/library/new.tsx` from the draft model:
  - name and format;
  - the For Time matrix with "same reps", the AMRAP list and the EMOM slots;
  - per-line rep description and load;
  - SAVE with validation messages, ✕;
  - the `from` param for duplicating, and the profile redirect.

  Verify with `npx tsc --noEmit` and `pnpm lint`. The device check is in 6.1.
- [x] 4.3 Add the `app/library/new.tsx` entry to `CLAUDE.md`'s Routing section, and `components/editor/`; verify the entry describes save → replace to the detail, and duplicate via `from`

## 5. Library, workout selection and refresh

- [x] 5.1 Give `hooks/use-workouts.ts` a `refresh`, and call it in a `useFocusEffect` in `app/library/index.tsx` and `app/session/wod.tsx`; verify with `npx tsc --noEmit`
- [x] 5.2 In `app/library/index.tsx`, add the NEW action with the profile gate and the "MINE" tag on own cards. In `app/library/[id].tsx`, add DUPLICATE (gated) and ARCHIVE for own workouts, with confirmation and `dismissTo('/library')` (design decision 6). Verify with `npx tsc --noEmit` and `pnpm lint`
- [x] 5.3 In `app/session/wod.tsx`, remove the "+ NEW WORKOUT" placeholder and show the "MINE" tag; verify with `pnpm lint`
- [x] 5.4 Update `CLAUDE.md`'s Library, workout selection and hooks entries, and `docs/ROADMAP.md`'s "Read-only library" assumption and the WOD editor plan order (D before C2a–d); verify both documents describe the shipped behavior

## 6. Device check

- [x] 6.1 On device, with a profile:
  - create a For Time (21-15-9, with a load), an AMRAP and a 10-minute EMOM over 3 slots;
  - duplicate FRAN as 15-12-9;
  - judge one of each and check the content, the summary note and the result;
  - archive one, and confirm it leaves the Library and workout selection while its saved session still opens in History.
- [x] 6.2 On device, without a profile, check that NEW and DUPLICATE ask to create one. Then, with a profile that has an own workout used by a session judged for someone else, delete the profile and check that the workout is listed nowhere. Foreign sessions have no screen, so the kept session and its workout can only be checked in the database.
- [x] 6.3 Run `openspec validate wod-editor --strict`, `npx tsc --noEmit`, `pnpm lint` and `pnpm test`; verify all pass
