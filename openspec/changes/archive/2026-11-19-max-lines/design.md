# Design

## Context

Since `window-model` (E1) and `shared-clock` (E2), an EMOM block is an interval window. Each entry of its rotating sequence is one `once` structure: lines done in order, the next becoming current when one reaches its target. The last line already takes any extra reps: `raw` stays uncapped, while the live `done` is capped at the target. A MAX line is that last line with no target and an uncapped count. See proposal.md for why.

Also relevant:
- **Fold and missed intervals:** results come from the same fold as live judging (`fold`). A stopping EMOM ends at the first interval that `intervalMissed` reports.
- **No-rep review:** it rebuilds a reviewed log per position. An EMOM interval's last line is already exempt from surplus.
- **Storage:** stored blocks come in two layouts, the legacy one and the window one the editor writes since E2.

## Goals / Non-Goals

**Goals:**
- Add MAX lines to interval windows with the smallest change to the engine's positions and rules, so that every recorded golden and presentation snapshot is unchanged.
- One flag carries the behavior everywhere: engine, parser, draft, results and screens.

**Non-Goals:**
- MAX in continuous windows (a BUY-IN + AMRAP of one exercise covers it).
- A global score across blocks.
- MAX by distance segments (E4).
- Several MAX lines in one interval.

## Decisions

### 1. A flag on the line, not a new structure kind
`WodLine.max?: true`, allowed only on the last line of an interval entry. The ROADMAP's model lists MAX as a structure. Here, though, it only ever lives inside an interval entry, as its last line, and an entry is already a `once` list of lines. A `{ kind: 'max' }` structure would need entries holding two structures and a second position axis. The flag keeps `WodSession` (`minuteIdx`, `exIdx`) and the whole fold as they are.

- **Alternative:** a `max` structure after the `once`. Rejected: it changes the shape rules and the positions for no behavior a flag can't give. If E4 needs a segment size, it can go on the same line.

### 2. A MAX line's target is 0, and the engine reads the flag where the target matters
The parser gives a MAX line `target: 0`. `targetAt` returns 0 for it, with no increment. The engine then reads the flag in these places:

- **`apply`:** on a MAX line `done = raw` instead of `min(raw, target)`. Moving on from a buy-in line is unchanged: a MAX line is always last, so nothing ever moves past it.
- **`intervalMissed`:** unchanged. "Not on the last line, or short of its target" already means "MAX never reached", because a MAX line's target is 0.
- **Stopping EMOM, a whole interval skipped with no reps:** today this counts as missed because every target is at least 1. An interval whose first line is MAX is never missed, so the skip rule checks that first.
- **`intervalLineAt`:** unchanged, since it only walks the lines before the last.
- **`view`:** returns `max` (true while the current line is MAX). `target` is 0 there.

Alternative: leave `target` undefined. Rejected, because every reader of `target` would need a null case. A 0 that only means something next to the flag is a smaller change.

### 3. `checkWindow` enforces the placement
`buildWodConfig` throws in three cases:
- a `max` line anywhere in a continuous window;
- a `max` line not last in its interval entry;
- a `max` line with an increment.

The parser is stricter on the stored row. It rejects:
- `max` together with `target` or `increment`;
- `max` in a legacy block.

Then it maps `max` to `target: 0`.

### 4. Stored shape: `{ exerciseId, max: true, repDescription?, load? }`
This goes only in `StoredWindowBlock` intervals. It is written only when set, so blocks without MAX are byte-identical to what E2 writes.

### 5. Results: one rule for "has MAX"
`hasMaxLines(config)` is true when any interval line is `max`. When it is true:
- **Splits:** `deriveOnClock` keeps one split per line. A MAX split has `max: true` and `target: 0`, and is completed when every line before it in its interval was completed (the line was reached).
- **Interval completion:** an interval is completed when all its splits are, as now.
- **Score:** `"<sum of MAX split reps> reps"`. On a stopping EMOM, `stopAtFirstMiss` keeps the splits up to the missed interval, and the score is the MAX total over the kept splits, not `<completed> + <reps>`.
- **Several blocks:** `combineBlockResults` is unchanged. It takes the scoring part's score, and each group title shows its own block's score.

The two screens that list splits show a MAX split as `<reps>` with no "/target". The adjust screen's rows stay the same.

### 6. No-rep review needs no new rule
`review` already exempts an interval's last line from surplus, so an accepted no-rep on a MAX line becomes a rep there. An accepted no-rep on a buy-in line completes that line. Later events stay where they were applied, as for any EMOM, so no rep moves onto the MAX line. New goldens pin both cases.

### 7. Judging: `CountReadout` gets a `max` prop
With `max`, the right-hand column shows "MAX" in place of the reps left and "of N". The size comes from `countFontSize` with three digits, as at `MAX_REPS`, because there is no target to size from and the count must not jump at 99 → 100. `useJudge` passes `view().max` through. Nothing changes for cues or gestures.

### 8. Editor
- **Draft rows:** `EmomRow.max: boolean`.
  - `setLineMax(draft, index, on)` only acts on the last line of an interval.
  - `addLineToSlot` inserts before a MAX last line.
  - Validation skips reps and increment on a MAX line.
  - `draftToStoredBlock` writes `max: true` with no target, and `draftFromWindow` reads it back.
- **Template:** `TemplateId` gains `everyBuyInMax`.
  - `emptyDraft` gives EVERY 180, INTERVALS 5, WORK 120 and one slot of two empty lines plus an empty MAX line.
  - `applyTemplate` to it puts the existing lines into that one slot before a new MAX line, with reps cleared.
  - Any other template clears `max`.
  - `templateOf` returns `everyBuyInMax` for an EMOM draft with a MAX line, and `emom` otherwise.
- **UI:** the EMOM line editor shows a MAX checkbox on each interval's last line. When it is on, REPS and +/ROUND are hidden.

### 9. Summary
A MAX line's amount is "MAX" in the joined detail, for example "200 m + 8 + MAX / interval". The note and the description are unchanged. The mode is any EMOM's ("E3MOM · 5" for example 2).

### 10. `engineVersion` stays 1
No stored workout has a MAX line, so every recorded log folds exactly as before. The new behavior is reachable only from new rows.

## Risks / Trade-offs

- **[Risk]** A `target` of 0 leaks somewhere that divides by it or reads it as "done" (a reps-left display, a split's completed flag). → Every reader is listed in decision 2 and decision 5. New presentation snapshots pin `view` on a MAX line, and new goldens pin the splits.
- **[Risk]** The count font size for MAX doesn't fit 3-digit counts on the smallest screen. → It uses the same `countFontSize(…, 3)` the readout already uses for 100+ targets. The 360 × 640 device check covers it.
- **[Trade-off]** "38 reps" alone doesn't say it's a MAX total. It reads clearly next to the workout name, and differs from the plain EMOM's "4/5 · 30 reps" form.
- **[Trade-off]** The stopping score drops "<completed> +" when MAX lines exist. A box scoring a stopping MAX EMOM cares about the reps, and the splits still show where it stopped.
