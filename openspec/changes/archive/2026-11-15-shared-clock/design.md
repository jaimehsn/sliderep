# Design

## Context

- **The model after E1** (`constants/wod-engine.ts`):
  - A `ContinuousWindow` is `{ clock: { kind: 'continuous', limitSeconds? }, structures: Structure[] }`.
  - `checkWindow` allows exactly one `rounds` or `cycle` structure. A `cycle` needs a limit.
  - The rules dispatch on `shapeOf(config)`: `rounds` | `cycle` | `perInterval`.
- **Positions:** a position is `WodSession` (`roundIdx`, `exIdx`, `completedRounds`, `minuteIdx`). In a `cycle` window, `roundIdx` and `completedRounds` both grow by one per finished round. The AMRAP split label reads `roundIdx + 1`.
- **Readers of the shape:**
  - `components/result/adjust.ts` gives back time only when `shapeOf(config) === 'rounds'`.
  - `replay.ts` scores by `timerMode` and `capSeconds`.
- **Storage and the editor:**
  - `db/workouts.ts` translates legacy `StoredBlock`s (`formatId` …) into windows on read.
  - The editor's `Draft` is `ForTimeDraft | AmrapDraft | EmomDraft`, picked by a FORMAT segment (`DRAFT_FORMATS`).
  - The editor writes legacy blocks through `draftToStoredBlock`.
- **The display:**
  - `view` returns `blockLabel` (`BLOCK n/N`), which `session/run.tsx` shows above the exercise name.
  - `WorkoutBreakdown` groups by block.
  - The result screen groups splits by block (`WodResult.groups`).
- **Safety nets:** `tests/__goldens__/` (results) and `tests/__presentation__/` (mode, description, rows, duration, timer, first view) must stay byte-identical. CLAUDE.md forbids re-recording them.

## Goals / Non-Goals

**Goals:**
- A continuous window of several `rounds` parts, optionally ending in a `cycle`, judged and scored by the existing rules with no new engine rule set.
- Every one-part window keeps its exact positions, so the goldens, the presentation files and the adjust logic stay untouched.
- One writer: the editor saves only the new stored shape.

**Non-Goals:**
- Parts inside interval windows, and MAX lines (E3/E4).
- Rest between parts.
- A cue on a part change.
- Part names such as BUY-IN or CASH-OUT. Parts are numbered.
- Migrating stored rows.
- Changing `engineVersion`.

## Decisions

### 1. A buy-in is a 1-round `rounds` part, not `once`

A continuous window's parts are `rounds` (1 or more rounds) and optionally a final `cycle`. `once` stays the interval-entry kind.

`once`'s semantics are the EMOM's: the last line takes extra reps. A 1-round `rounds` is exactly a Chipper: station progress, finishing on the last line's target. That is what a buy-in or cash-out needs, and it keeps the continuous engine on one kind of finite structure.

*Alternative:* allow `once` in continuous windows. Rejected because it adds a third behavior for the same thing.

### 2. Flat positions across parts; `WodSession` unchanged

A continuous window is read as a **path**:
- the `rounds` of every `rounds` part, concatenated (the *prefix*);
- then, optionally, the `cycle`.

The position rules are:
- `roundIdx` indexes the prefix. In the cycle it keeps counting, so it is `prefixLength + k` for the k-th cycle round.
- `completedRounds` counts only cycle rounds.
- A one-part window's prefix is its rounds, or empty for an AMRAP. So every existing window keeps the exact positions it has today: the goldens and the adjust logic, which key on `(roundIdx, exIdx)`, see no difference.

Engine changes:
- `lineAt` reads the prefix while `roundIdx < prefixLength`, then the cycle.
- `nextPosition` moves through the prefix like rounds. Past its last line it enters the cycle (`roundIdx = prefixLength`, no tally) or completes, and in the cycle it tallies as today.
- The rest between rounds applies only between two rounds of the same part.

Helpers:
- `partAt(config, roundIdx)` gives the part index plus the round within the part.
- `prefixLength(window)` gives the prefix length.

*Alternative:* add a `partIdx` to `WodSession`. Rejected because it changes every tagged position and split, the adjust keys and the goldens' JSON for no behavioral gain.

*Alternative:* run the parts through the multi-block sequence layer. Rejected because that layer restarts a block-local clock per block, while parts share one limit counted from the window start.

### 3. The shape stays the dispatch key

`windowShape` becomes "`cycle` if the last structure is a `cycle`, else `rounds`". The existing per-shape rules then give exactly the agreed behavior:

| Concern | `rounds` | `cycle` |
|---|---|---|
| Timer | elapsed, plus its cap label | remaining for the whole window |
| End | last rep, or the cap | the duration |
| No-rep review time shift | yes, across parts | none |
| End cue on finishing | when capped | always |
| `capSeconds` | the limit | null |

Two rules are new:
- `isCompleteAt` for `rounds` compares against the flat prefix length. This is unchanged code, because the prefix *is* the rounds.
- A `cycle` window whose state never left the prefix scores `CAP · N reps` in `replay.ts`: `state.pos.roundIdx < prefixLength`, and N is every counted event. Otherwise it scores today's `completedRounds + reps of the current round`.

### 4. KPI and labels within the part

`kpiAt` maps `roundIdx` through `partAt`:
- a 1-round part gives `station` k/n;
- a part of several rounds gives `round` k/N, k counted within the part;
- the cycle gives `rounds` with `completedRounds`.

For a one-part window this is the current output.

`splitLabel`'s cycle case numbers rounds as `roundIdx - prefixLength + 1`. That is `roundIdx + 1` when there is no prefix, as today.

### 5. Part label in the view

`view` gains `partLabel` (`PART n/N`, null for a one-part window). The sequence view passes it through from the current block. Between blocks it is null.

`use-judge.ts` returns it, and `session/run.tsx` shows `[blockLabel, partLabel]` joined by " · " in the existing slot. The view is a new field, not a change to `blockLabel`, so the presentation snapshot's recorded `view` objects stay equal.

`tests/presentation.test.ts` serializes the whole `view(config, initial(config))` object with `JSON.stringify`, so a `partLabel: null` key would change every file. The field is therefore optional (`partLabel?: string`) and left `undefined` on one-part windows, which `JSON.stringify` drops. The snapshot reads `WodConfig` field by field, so `sections` doesn't reach it. It is still absent on one-part windows, for symmetry.

### 6. Presentation of several parts

- **`describeMode` and `describeContent`:** with one structure, the current code runs unchanged. With several:
  - the mode is `FOR TIME` or `<m>-MIN AMRAP`;
  - the description is the parts joined by " → ", plus ` · <m> min cap` for a capped `rounds` window.
  - Each part reads as follows:
    - a 1-round part: `<amount> <name>` per line, joined by ", ", where `amountOf`'s "500 m" form is reused for a described single rep;
    - a part of several rounds: its scheme as `describeScheme` gives it, plus ` · <s> s rest`;
    - the cycle: `amrap · <names>`.
- **`sections`:** `WodConfig` gains `sections?: { title: string; exercises: WodExercise[] }[]`, present only with several parts.
  - Titles: `PART n`, `PART n · 5 ROUNDS`, `PART n · 5 ROUNDS · 60 s REST` or `PART n · AMRAP`.
  - Each part's exercises come from today's `summarize` logic applied to that part alone.
  - `exercises` stays the flat concatenation, for any reader that ignores sections.
- **`durationLine`:** only the limit (`12 min cap` / `12 min`). Rests show in the section titles.
- **Breakdown:** `WorkoutBreakdown` renders `sections` when present, both top-level and inside each block of a sequence.

### 7. Split part index and subheadings

When the window has several parts, `Split` gains `partIdx?`, set in `deriveOnTarget` from `partAt(pos.roundIdx)`.

`result-screen.tsx` and `session/adjust.tsx` print a `PART n` subheading before the first split of each part, inside the block group when there is one. No new grouping object is needed. Lap times keep running across parts, because it is one clock.

`reviewNoReps` already places each no-rep under its split's position, so the adjust screen gets the subheadings from the splits.

### 8. New stored block shape, read alongside the legacy one

```ts
type StoredWindowBlock =
  | { clock: { kind: 'continuous'; limitSeconds?: number };
      structures: ({ kind: 'rounds'; rounds: StoredLine[][]; restSeconds?: number }
                 | { kind: 'cycle'; lines: StoredLine[] })[];
      restAfterSeconds?: number }
  | { clock: { kind: 'intervals'; everySeconds: number; count: number; workSeconds?: number; stopOnMiss?: boolean };
      intervals: StoredLine[][];            // each sequence entry's lines
      restAfterSeconds?: number };
type StoredBlock = LegacyStoredBlock | StoredWindowBlock;   // told apart by `'clock' in block`
```

The stored shape mirrors the window one-to-one, so the parser only resolves exercise names and checks the window.

Strict checks:
- at least one structure;
- every round and every line list non-empty;
- `cycle` only last, and only with `limitSeconds`;
- `everySeconds` from 10 to 600;
- `count` ≥ 1;
- `workSeconds` below `everySeconds`;
- otherwise it throws, like the legacy path.

The editor writes only this shape (`draftToStoredBlock`), EMOMs and one-part blocks included. Optional fields are written only when set, as today.

A test checks that each built-in written in the new shape parses to a config equal to the legacy row's. That proves the two readers agree.

*Alternative:* keep writing the legacy shape when it fits. Rejected by the user: one writer.

*Alternative:* migrate to the new shape. Rejected because it rewrites stored rows for no gain.

### 9. The editor's block draft

```ts
type RoundsPart = { kind: 'rounds'; rounds: string; sameReps: boolean; rest: string; rows: ForTimeRow[] };
type AmrapPart  = { kind: 'amrap'; rows: RepsRow[] };
type ContinuousDraft = { format: 'continuous'; name: string; minutes: string; parts: (RoundsPart | AmrapPart)[] };
type Draft = ContinuousDraft | EmomDraft;
```

- **`minutes`** is the one time field. Its label is `TIME CAP (MIN)` (optional) when no part is AMRAP, and `MINUTES` (required) when the last part is AMRAP.
- **Part helpers:** `addPart`, `removePart` and `setPartKind`. Line helpers take a part index.
- **Problem keys:**
  - `minutes`;
  - `part:<p>:rounds`, `part:<p>:rest`, `part:<p>:lines`, and `part:<p>:kind` for an AMRAP part that isn't last;
  - `part:<p>:line:<i>`;
  - EMOM keys unchanged.
- **Templates:**
  - `TEMPLATES` (id + label) and `applyTemplate(draft, id)`, which carries today's line-keeping behavior of `switchFormat` into the template's main part.
  - `templateOf(draft)` gives the highlighted template, or none when the parts no longer match one.
- **Where existing logic moves:**
  - `ForTimeDraft`'s per-round reps and `sameReps` logic moves to `RoundsPart`.
  - `AmrapDraft`'s logic moves to `AmrapPart`.
  - `draftFromWindow` maps every structure back.
- **UI:**
  - `block-editor.tsx` swaps the FORMAT segment for a template row.
  - The current FOR TIME and AMRAP UIs move into a `PartEditor`, shown under a `PART n` header with a ROUNDS/AMRAP choice and ✕ only when there are several parts.
  - "+ PART" goes at the end.
  - With one part, the block renders as before.

### 10. `engineVersion` stays 1

No stored log was judged on a window of several parts, and every one-part window keeps its rules. The new cases are added to the goldens. They are not a new version of old ones.

## Risks / Trade-offs

- **Flat `roundIdx` leaks the prefix into positions** → Mitigation: every reader that shows a number goes through `partAt` (`kpiAt`, `splitLabel`), and tests cover labels in all three parts of example 1.
- **The presentation snapshot serializes the whole first `view`**, so a new view field could change recorded files → Mitigation: `partLabel` is `undefined`, never `null`, on one-part windows (decision 5).
- **The editor rewrite is the largest piece** (draft types and the block editor) → Mitigation: `draft.ts` stays pure and is tested first. The UI is a re-arrangement of existing field components. One part renders as before.
- **Long descriptions** ("15 ring muscle-ups → 5 rounds · … · 12 min cap") may wrap on 360 dp cards → Mitigation: cards already wrap descriptions. The device check covers the longest example.
- **A buy-in reached by an old AMRAP log is impossible**: there are no old logs on new shapes, so the `cycle` rule "counts events after the end" is harmless in the prefix as well.

## Migration Plan

There is no data migration. Ship the reader first within the same change, so that the new-shape parsing and the equality test exist before the editor starts writing the new shape. Rollback is not possible once new-shape rows exist, because an older build would throw on them. This is acceptable for a single-device app on a feature branch.
