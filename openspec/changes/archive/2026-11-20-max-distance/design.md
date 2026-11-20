# Design

## Context

Since `max-lines` (E3), a MAX line (`WodLine.max`) is the last line of an EMOM interval, with `target` 0. It counts every valid rep of its work time, and a block with MAX lines scores `<N> reps` (`replay.ts`). A line can already carry `repDescription` (`{ amount, unit: 'm' | 'cal' | 's' }`), written from the editor's EACH REP field. On a MAX line it is stored and shown as a note, but nothing computes with it.

See proposal.md for why.

## Goals / Non-Goals

**Goals:**
- Read a MAX line's `repDescription` as its segment, everywhere a MAX count is shown: judging, splits, score and review.
- Change nothing about what counts. The engine's state, the fold and the stored log stay as they are, so every recorded golden and presentation snapshot is unchanged.

**Non-Goals:**
- A new field or stored shape.
- Editor changes (EACH REP already exists on every line, MAX included).
- Partial segments.
- Converting between units (m and ft).
- Catalog additions.

## Decisions

### 1. The segment is the line's `repDescription`
A helper `maxSegment(line)` returns `line.max && line.repDescription ? line.repDescription : null`. The count stays in reps (segments). Only the shown amount is `reps × amount`.

- **Alternative:** a dedicated `segment` field on MAX lines. Rejected: it would duplicate EACH REP, which already means "each rep is 5 m", and need a new stored key and editor field.

### 2. `view` adds `segment` beside `max`
`view` returns `segment: { amount, unit }` only while the current line is a MAX line with a segment, and leaves it absent otherwise. This keeps every existing snapshot byte-identical. `done` stays the rep count.

`useJudge` passes it through, and `CountReadout` gets a `unit` prop:
- With a unit, the big number is `done × amount` and the side shows the unit (`m`, `cal`, `s`) where "MAX" was, at the same 0.8 size.
- It sizes for `max(3, digits of the shown total)` digits, so the size holds up to 999. It shrinks once only, at 1000 m and above, which is rare within one interval's work time.

### 3. Splits carry `segment`
A MAX split from `deriveOnClock` gets `segment?: { amount, unit }` from its line. `reps` stays the count. Two helpers in `replay.ts` keep the screens free of arithmetic:

- `splitAmount(split)`: returns `"60 m"` for a split with a segment, `"12"` for a MAX split without one, and `"12/15"` for any other split.
- **The MAX score:** totals per unit are accumulated in a `Map` keyed by `'reps'` or the unit. That gives first-seen order in the splits, which follow the interval sequence. The result is formatted as `"<N> reps"` or `"<N> <unit>"`, joined by `" · "`. With only rep-counting MAX lines, this is exactly E3's `"<N> reps"`.

Both screens' split rows (`result-screen.tsx`, `session/adjust.tsx`) render `splitAmount(split)`, replacing the inline expression E3 added.

### 4. No-rep review needs no new rule
`review` turns an accepted no-rep into a rep at its position. The reviewed fold counts it, and the split and score multiply as above. A new golden pins it.

### 5. `engineVersion` stays 1
Counting is unchanged. A saved session on an own workout with EACH REP on a MAX line, possible only since E3 (2026-11-16), will show its score in that unit instead of reps. It is a change of presentation, and none of the four built-ins or any recorded golden has such a line. The proposal records it.

## Risks / Trade-offs

- **[Risk]** A workout already saved with EACH REP on a MAX line, which the owner meant as a note rather than a segment, now shows a different number. → Only workouts created in the last days can have one. EACH REP's editor label already says it applies to each rep.
- **[Trade-off]** `s` as a segment unit (seconds) is allowed but odd for a count. Refusing it would need an editor rule for little gain.
- **[Trade-off]** A total of 1000 or more shrinks the count once. That doesn't happen in a work interval of a few minutes at 5 m per swipe, unless the segments are large.
