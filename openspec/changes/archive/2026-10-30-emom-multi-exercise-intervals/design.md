# Design

## Context

- A stored EMOM block is already `lines: [[line, …], …]`, one entry per interval of the sequence. The type allows several lines per entry, but the engine reads only `[0]`: `lineAt` uses `lines[minuteIdx % length][0]` and `summarize` uses `([line]) => …`.
- Engine state for `perInterval`:
  - `raw` is the uncapped valid reps in the current interval, and `done` is `min(raw, target)`.
  - `advanceTo` resets both, keeping `exIdx` at 0.
  - `apply` never moves a perInterval position.
- `replay.ts` (`deriveOnClock`) builds one split per interval from the fold's counted events, keyed by `pos.minuteIdx`.
- `adjust.ts` (`deriveAdjustedOnClock`) doesn't use the fold for EMOM. It buckets ok events by `floor(t / intervalMs)`, up to the possibly raised duration, so a raised duration counts reps recorded after the original end. The EMOM goldens pin this.
- `Split` already carries `(roundIdx, exIdx)`, and target changes are keyed by them. `adjust.tsx` keys rows by `roundIdx:exIdx`.
- `use-judge.ts` plays the interval cue only when `minuteIdx` increases.
- `EmomDraft.slots` is a flat `RepsRow[]`, one row per interval. Every line helper (`addLine`, `removeLine`, `updateLineFields`, `setLineReps`, `setRepDescription`) and `new.tsx` address lines by a flat index into `draftLines(draft)`. `new.tsx` keys problems as `line:<i>` and passes that index to the picker.

## Goals / Non-Goals

**Goals:**
- An interval with one exercise produces exactly today's state, results and adjustments, so every existing golden stays byte-identical.
- One rule decides which exercise a rep belongs to, shared by live judging, results and adjustments.

**Non-Goals:**
- Progressive reps (C2b-3), rest intervals (C2c), a different score shape, or a sound on a change of exercise within an interval.
- Renaming `minuteIdx`. The position keeps `minuteIdx` for the interval and gains a meaningful `exIdx`, so a rename would still be pure churn.

## Decisions

### 1. Position: `(minuteIdx, exIdx)`, onTarget within the interval

- `lineAt` for `perInterval` returns `lines[minuteIdx % length][exIdx]`.
- `advanceTo`'s interval change resets `exIdx` to 0, along with `done` and `raw`.
- `apply` for `perInterval` then works as follows:
  - It increments `raw`.
  - If `raw` reaches the target and the current line isn't the interval's last, it moves to `exIdx + 1` with `done` and `raw` at 0.
  - Otherwise `done = min(raw, target)`, as today. `raw` now counts the current line, which is the same thing whenever an interval has one line.
- The event is tagged with the position it was applied at, as now.

A reached target on a non-last line moves on immediately, so the next rep belongs to the next line, mirroring For Time's `apply`. No-reps and events at or after the end are ignored, as today.

**Alternative considered:** treat an interval as a little For Time round that finishes. It would need a "finished interval" state the clock then leaves. Staying on the last line and counting extras into it keeps today's extra-reps rule (the `emom-extra-reps` golden) unchanged.

### 2. Results: one split per (interval, line)

`deriveOnClock` loops over intervals, then over the interval's lines.
- Each line's split counts the counted events tagged `(minuteIdx = m, exIdx = i)`. It is labelled with `intervalSplitLabel` for that position, which now takes `exIdx` too, and carries `roundIdx: m, exIdx: i`.
- An interval is completed when every one of its line splits is.
- The score is still intervals completed / total · all counted reps.
- With one line per interval, this is exactly today's list.

### 3. Adjustments: place reps within the bucket by the original targets

`deriveAdjustedOnClock` keeps its time buckets, because the goldens pin that a raised duration counts reps recorded after the original end.
- Within each bucket, it walks the ok events in time order. A line advances once its count reaches the line's **original** target, and the last line takes the rest. This is decision 1's rule.
- For every event inside the original duration, this gives exactly the fold's placement. It also extends to buckets after the original end, which the fold never placed.
- Target overrides, keyed `(m, i)`, are then compared to each line's count only to decide completion. Raising a line's target never moves reps to the next line ("no re-flow").
- With one line per interval, the walk puts every rep on line 0, so nothing changes.

**Alternative considered:** read placement from the fold's `tagged`. It covers no event after the original end, so a raised duration would need a second rule anyway. One walk shared by both paths is simpler.

The walk is a small exported engine helper, so live judging and adjustments can't diverge: `lineIndexAt(config, intervalIdx, repsSoFar)`, or an equivalent.

### 4. Breakdown row per interval

`summarize` for `perInterval` returns one `WodExercise` per sequence entry:
- `name` is the lines' exercises joined by " + ".
- `detail` is the lines' amounts joined by " + ", followed by " / min" or " / interval".
- `note` is the lines' notes joined by " · ".

A single-line entry is unchanged. The description (`joinNames` over all lines) and the mode label don't change.

### 5. Editor: `slots: RepsRow[][]`, flat line index kept

`EmomDraft.slots` becomes a list of intervals, each a non-empty list of lines.
- `draftLines` returns `slots.flat()`. Every existing helper keeps taking the flat index, mapped to `(slot, line)` by one internal helper. `new.tsx`'s per-line rendering, `line:<i>` problems and the picker index don't change.
- `addLine` on an EMOM appends a new one-line interval. That is "+ ADD MINUTE" / "+ ADD INTERVAL", as today.
- A new `addLineToSlot(draft, slotIdx)` appends a line to an interval, for "+ EXERCISE" under the interval's last line.
- `removeLine` drops an interval that becomes empty.
- `switchFormat` to EMOM gives each line its own interval, as today. Switching from EMOM flattens.
- `draftToStoredBlock` writes `slots.map((slot) => slot.map(toStoredLine))`. `draftFromBlock` reads each entry's lines. The built-ins round-trip unchanged.

The screen labels the first line of an interval `MIN n` / `INT n` and its following lines `+`. An interval's lines render as one group, with "+ EXERCISE" below them.

### 6. Goldens

`tests/fixtures.ts` gains a synthetic 6-minute EMOM:
- minute 1 is 5 PULL-UPS + 10 PUSH-UPS;
- minute 2 is 15 AIR SQUATS.

The cases are:
- all completed;
- the second exercise unfinished;
- extra reps after the last exercise;
- the first exercise's target raised (reps don't move);
- the second exercise's target lowered;
- the duration shortened;
- the duration raised, with reps after the original end that land on the interval's lines by the original targets.

They're recorded once as new files, and every existing golden stays byte-identical.

## Risks / Trade-offs

- [The live engine and the adjustment walk place a rep differently] → Both use decision 3's shared helper. The live = result engine test also runs over the new cases.
- [Several split rows share an interval number] → Rows are keyed by index in `result-screen.tsx` and by `roundIdx:exIdx` in `adjust.tsx`, so the keys stay unique. The device checks cover tapping the second line.
- [The breakdown row gets long with many exercises] → It wraps like any long name. Most EMOM intervals hold two or three movements.
