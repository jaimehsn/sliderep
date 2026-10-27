import { START_POSITION, WodConfig, WodSession, capSeconds, exerciseNameAt, fold, formatTime, targetAt } from '@/constants/wod-engine';
import type { LogEntry } from '@/components/judge/types';
import { WodResult, Split, splitLabel, deriveResult } from '@/components/result/replay';
import type { AdjustmentChange } from '@/db/session-adjustments';

type Tagged = { t: number; roundIdx: number; exIdx: number; originalTarget: number };

/**
 * Each counted event's position from the engine fold over the *unmodified*
 * config/log. This is what "no re-flow" (docs/ROADMAP.md) rests on: positions
 * are fixed by this pass and never recomputed under adjusted targets — only each
 * position's own completion threshold changes.
 */
function tagOnTargetPositions(config: WodConfig, log: LogEntry[]): Tagged[] {
  return fold(config, log, Infinity).tagged
    .filter((e) => e.counted)
    .map((e) => ({ t: e.t, roundIdx: e.pos.roundIdx, exIdx: e.pos.exIdx, originalTarget: e.target }));
}

function latestTargetOverride(changes: AdjustmentChange[], roundIdx: number, exIdx: number): number | null {
  let value: number | null = null;
  for (const c of changes) {
    if (c.type === 'target' && c.roundIdx === roundIdx && c.exIdx === exIdx) value = c.newTarget;
  }
  return value;
}

function latestDurationOverride(changes: AdjustmentChange[]): number | null {
  let value: number | null = null;
  for (const c of changes) {
    if (c.type === 'duration') value = c.newDurationSeconds;
  }
  return value;
}

function groupInOrder(tagged: Tagged[]): { roundIdx: number; exIdx: number; events: Tagged[] }[] {
  const order: { roundIdx: number; exIdx: number; events: Tagged[] }[] = [];
  const index = new Map<string, number>();
  for (const t of tagged) {
    const key = `${t.roundIdx}:${t.exIdx}`;
    const i = index.get(key);
    if (i == null) {
      index.set(key, order.length);
      order.push({ roundIdx: t.roundIdx, exIdx: t.exIdx, events: [t] });
    } else {
      order[i].events.push(t);
    }
  }
  return order;
}

function deriveAdjustedOnTarget(config: WodConfig, log: LogEntry[], changes: AdjustmentChange[]): WodResult {
  const tagged = tagOnTargetPositions(config, log);
  const groups = groupInOrder(tagged);
  const cutoffSeconds = latestDurationOverride(changes);
  const cutoff = cutoffSeconds != null ? cutoffSeconds * 1000 : null;
  // A capped For Time's duration is its cap (change for-time-cap): a rep at the
  // (adjusted) cap or later doesn't count, as live. Uncapped formats keep `<=`.
  const cap = capSeconds(config);
  const capMs = cap != null ? (cutoffSeconds ?? cap) * 1000 : null;
  const inTime = (e: Tagged) => (capMs != null ? e.t < capMs : cutoff == null || e.t <= cutoff);

  type Resolved = { roundIdx: number; exIdx: number; target: number; kept: Tagged[]; completed: boolean };
  const resolved: Resolved[] = groups.map(({ roundIdx, exIdx, events }) => {
    const target = latestTargetOverride(changes, roundIdx, exIdx) ?? events[0].originalTarget;
    const timeFiltered = events.filter(inTime);
    const kept = timeFiltered.slice(0, target);
    return { roundIdx, exIdx, target, kept, completed: kept.length >= target };
  });

  const splits: Split[] = [];
  let lastSplitT = 0;
  for (const r of resolved) {
    const session: WodSession = { ...START_POSITION, roundIdx: r.roundIdx, exIdx: r.exIdx };
    const cumulativeMs = r.completed ? r.kept[r.kept.length - 1].t : null;
    const lapMs = cumulativeMs != null ? cumulativeMs - lastSplitT : null;
    if (cumulativeMs != null) lastSplitT = cumulativeMs;
    splits.push({
      label: splitLabel(config, session),
      reps: r.kept.length,
      target: r.target,
      completed: r.completed,
      cumulativeMs,
      lapMs,
      roundIdx: r.roundIdx,
      exIdx: r.exIdx,
    });
  }

  if (config.timerMode === 'elapsed' && cap != null) {
    // Every position of the block must be complete, including those never
    // reached (they have no group); otherwise it's the reps kept before the cap.
    const positions = config.block.lines.reduce((n, round) => n + round.length, 0);
    const complete = resolved.length === positions && resolved.every((r) => r.completed);
    if (complete) {
      const lastMs = splits.at(-1)?.cumulativeMs ?? 0;
      return { scoreLabel: 'TIME', scoreValue: formatTime(Math.round(lastMs / 1000)), splits };
    }
    const kept = resolved.reduce((n, r) => n + r.kept.length, 0);
    return { scoreLabel: 'SCORE', scoreValue: `CAP · ${kept} reps`, splits };
  }

  if (config.timerMode === 'elapsed') {
    const firstIncomplete = resolved.findIndex((r) => !r.completed);
    if (firstIncomplete === -1) {
      const lastMs = splits.at(-1)?.cumulativeMs ?? 0;
      return { scoreLabel: 'TIME', scoreValue: formatTime(Math.round(lastMs / 1000)), splits };
    }
    // Edge case (a raised target, or a shortened cap, now leaves the WOD
    // incomplete under the adjustment) — a minimal fallback, not a polished
    // partial-ForTime format: this isn't the common path.
    const partialReps = resolved[firstIncomplete].kept.length;
    return {
      scoreLabel: 'SCORE',
      scoreValue: `DNF — ${firstIncomplete}/${resolved.length} + ${partialReps}`,
      splits,
    };
  }

  // AMRAP: completed-rounds + partial reps, grouped by roundIdx — stops counting
  // full rounds at the first round containing any incomplete position, and the
  // partial reps are every rep that round's positions keep, not only the first
  // incomplete one's.
  let completedRounds = 0;
  let partialReps = 0;
  let i = 0;
  while (i < resolved.length) {
    const roundIdx = resolved[i].roundIdx;
    let j = i;
    let roundComplete = true;
    let roundKept = 0;
    while (j < resolved.length && resolved[j].roundIdx === roundIdx) {
      if (!resolved[j].completed) roundComplete = false;
      roundKept += resolved[j].kept.length;
      j++;
    }
    if (roundComplete) {
      completedRounds += 1;
      i = j;
      continue;
    }
    partialReps = roundKept;
    break;
  }

  return { scoreLabel: 'SCORE', scoreValue: `${completedRounds} + ${partialReps}`, splits };
}

function deriveAdjustedOnClock(config: WodConfig, log: LogEntry[], changes: AdjustmentChange[]): WodResult {
  const cutoffSeconds = latestDurationOverride(changes);
  const cutoffMs = cutoffSeconds != null ? cutoffSeconds * 1000 : null;
  const totalMinutes = cutoffSeconds != null ? Math.ceil(cutoffSeconds / 60) : Math.ceil(config.totalSeconds / 60);
  const okLog = log.filter((e) => e.ok);

  const splits: Split[] = [];
  let intervalsCompleted = 0;
  let totalValidReps = 0;

  for (let m = 0; m < totalMinutes; m++) {
    const session: WodSession = { ...START_POSITION, minuteIdx: m };
    const target = latestTargetOverride(changes, m, 0) ?? targetAt(config, session);
    const reps = okLog.filter((e) => Math.floor(e.t / 60000) === m && (cutoffMs == null || e.t <= cutoffMs)).length;
    const completed = reps >= target;
    if (completed) intervalsCompleted += 1;
    // "Total valid reps" stays unclamped by target changes (matching today's
    // unadjusted scoring, which never clamped per interval either) — a target
    // change affects completion, not the raw rep total. A duration cutoff is
    // the only thing that actually removes reps from this tally.
    totalValidReps += reps;
    splits.push({
      label: `Minute ${m + 1} — ${exerciseNameAt(config, session)}`,
      reps,
      target,
      completed,
      cumulativeMs: null,
      lapMs: null,
      roundIdx: m,
      exIdx: 0,
    });
  }

  return {
    scoreLabel: 'SCORE',
    scoreValue: `${intervalsCompleted}/${totalMinutes} · ${totalValidReps} reps`,
    splits,
  };
}

export function deriveAdjustedResult(config: WodConfig, log: LogEntry[], changes: AdjustmentChange[]): WodResult {
  if (changes.length === 0) return deriveResult(config, log);
  return config.advanceMode === 'onClock'
    ? deriveAdjustedOnClock(config, log, changes)
    : deriveAdjustedOnTarget(config, log, changes);
}
