import {
  START_POSITION,
  SequenceConfig,
  TaggedEvent,
  WodConfig,
  WodSession,
  capSeconds,
  exerciseNameAt,
  fold,
  formatTime,
  intervalLines,
  intervalSeconds,
  intervalUnit,
  isComplete,
  isSequence,
  stopsOnMiss,
  kpiAt,
  partCount,
  partIndexAt,
  prefixLength,
  targetAt,
} from '@/constants/wod-engine';
import type { LogEntry } from '@/components/judge/types';

/**
 * One row of the result screen's split list. Times are ms on the session
 * clock; null where not applicable. `roundIdx`/`exIdx` identify the position
 * (for onClock WODs, `roundIdx` is the interval index and `exIdx` its line) — only
 * consumed by `session/adjust.tsx` to list each no-rep under its split; the plain
 * result screen ignores them.
 */
export type Split = {
  label: string;
  reps: number;
  target: number;
  completed: boolean;
  cumulativeMs: number | null;
  lapMs: number | null;
  roundIdx: number;
  exIdx: number;
  /** Workouts of several blocks: the block it belongs to (change multi-block-workouts). */
  blockIdx?: number;
  /** A block of several parts: the part it belongs to (change shared-clock); absent otherwise. */
  partIdx?: number;
  /** A MAX line's split (change max-lines): its reps with no target, completed when the line was reached. */
  max?: true;
};

/** One block's splits on a workout of several blocks, headed "BLOCK n · mode · score". */
export type SplitGroup = { blockIdx: number; title: string; splits: Split[] };

export type WodResult = {
  scoreLabel: string;
  scoreValue: string;
  splits: Split[];
  /** Workouts of several blocks only: `splits` grouped per block (change multi-block-workouts). */
  groups?: SplitGroup[];
};

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * AMRAP's kpi.label is 'rounds' (plural) because its `current` is a cumulative
 * completed-rounds tally for the live header, not the round currently in progress
 * (that one increments together with `completedRounds`, one step later, inside
 * `advance()`). Split labels want the round in progress, so they read `roundIdx`
 * directly for that one case — counted from the cycle's start, after any parts before
 * it (change shared-clock); every other format's kpi.current already is it, within its part.
 */
export function splitLabel(config: WodConfig, session: WodSession): string {
  const kpi = kpiAt(config, session);
  const isCumulativeTotal = kpi.label === 'rounds';
  const number = isCumulativeTotal ? session.roundIdx - prefixLength(config) + 1 : kpi.current;
  const prefix = isCumulativeTotal ? 'Round' : titleCase(kpi.label);
  return `${prefix} ${number} — ${exerciseNameAt(config, session)}`;
}

/**
 * The "PART n" subheading before split `i`, or null (change shared-clock): before the
 * first split of each part of a block of several parts, the result and adjust screens'.
 */
export function partHeading(splits: Split[], i: number): string | null {
  const { partIdx, blockIdx } = splits[i];
  if (partIdx == null) return null;
  const prev = splits[i - 1];
  return !prev || prev.partIdx !== partIdx || prev.blockIdx !== blockIdx ? `PART ${partIdx + 1}` : null;
}

/** An EMOM split's label: "Minute N — X" with 60-second intervals, "Interval N — X" otherwise (X: the interval's `exIdx`-th line). */
export function intervalSplitLabel(config: WodConfig, intervalIdx: number, exIdx: number): string {
  const session: WodSession = { ...START_POSITION, minuteIdx: intervalIdx, exIdx };
  return `${titleCase(intervalUnit(config))} ${intervalIdx + 1} — ${exerciseNameAt(config, session)}`;
}

/**
 * Stopping EMOM (change emom-progressive-reps): keeps the splits up to and including
 * the first interval with an exercise short of its target, scored "<completed> + <its
 * reps>", or "<total> + 0" when none is missed. Shared by the plain and adjusted results.
 */
export function stopAtFirstMiss(splits: Split[], totalIntervals: number): WodResult {
  const missed = splits.find((s) => !s.completed)?.roundIdx;
  if (missed == null) return { scoreLabel: 'SCORE', scoreValue: `${totalIntervals} + 0`, splits };
  const kept = splits.filter((s) => s.roundIdx <= missed);
  const reps = kept.filter((s) => s.roundIdx === missed).reduce((n, s) => n + s.reps, 0);
  return { scoreLabel: 'SCORE', scoreValue: `${missed} + ${reps}`, splits: kept };
}

function deriveOnClock(config: WodConfig, log: LogEntry[]): WodResult {
  const totalIntervals = Math.ceil(config.totalSeconds / intervalSeconds(config));
  const counted = fold(config, log, Infinity).tagged.filter((e) => e.counted);
  const splits: Split[] = [];
  let intervalsCompleted = 0;
  let totalValidReps = 0;

  // One split per line of each interval; an interval is completed when all its lines are.
  for (let m = 0; m < totalIntervals; m++) {
    let intervalCompleted = true;
    intervalLines(config, m).forEach((line, i) => {
      const session: WodSession = { ...START_POSITION, minuteIdx: m, exIdx: i };
      const target = targetAt(config, session);
      const reps = counted.filter((e) => e.pos.minuteIdx === m && e.pos.exIdx === i).length;
      // A MAX line is completed once reached: every line before it completed (change max-lines).
      const completed = line.max ? intervalCompleted : reps >= target;
      if (!completed) intervalCompleted = false;
      totalValidReps += reps;
      splits.push({
        label: intervalSplitLabel(config, m, i),
        reps,
        target,
        completed,
        cumulativeMs: null,
        lapMs: null,
        roundIdx: m,
        exIdx: i,
        ...(line.max ? { max: true as const } : {}),
      });
    });
    if (intervalCompleted) intervalsCompleted += 1;
  }

  // A block with MAX lines scores their reps (change max-lines), up to where it stopped.
  if (splits.some((s) => s.max)) {
    const kept = stopsOnMiss(config) ? stopAtFirstMiss(splits, totalIntervals).splits : splits;
    return { scoreLabel: 'SCORE', scoreValue: `${kept.reduce((n, s) => n + (s.max ? s.reps : 0), 0)} reps`, splits: kept };
  }
  if (stopsOnMiss(config)) return stopAtFirstMiss(splits, totalIntervals);
  return {
    scoreLabel: 'SCORE',
    scoreValue: `${intervalsCompleted}/${totalIntervals} · ${totalValidReps} reps`,
    splits,
  };
}

/** Counted events grouped by the position the fold applied them at, in order. */
function groupByPosition(tagged: TaggedEvent[]): { pos: WodSession; target: number; events: TaggedEvent[] }[] {
  const groups: { pos: WodSession; target: number; events: TaggedEvent[] }[] = [];
  const index = new Map<string, number>();
  for (const e of tagged) {
    if (!e.counted) continue;
    const key = `${e.pos.roundIdx}:${e.pos.exIdx}`;
    const i = index.get(key);
    if (i == null) {
      index.set(key, groups.length);
      groups.push({ pos: e.pos, target: e.target, events: [e] });
    } else {
      groups[i].events.push(e);
    }
  }
  return groups;
}

function deriveOnTarget(config: WodConfig, log: LogEntry[]): WodResult {
  const state = fold(config, log, Infinity);
  const splits: Split[] = [];
  let lastSplitT = 0;

  for (const { pos, target, events } of groupByPosition(state.tagged)) {
    const completed = events.length >= target;
    const lastT = events[events.length - 1].t;
    splits.push({
      label: splitLabel(config, pos),
      reps: events.length,
      target,
      completed,
      cumulativeMs: completed ? lastT : null,
      lapMs: completed ? lastT - lastSplitT : null,
      roundIdx: pos.roundIdx,
      exIdx: pos.exIdx,
      ...(partCount(config) > 1 ? { partIdx: partIndexAt(config, pos.roundIdx) } : {}),
    });
    if (completed) lastSplitT = lastT;
  }

  if (config.timerMode === 'elapsed') {
    const counted = state.tagged.filter((e) => e.counted);
    // Ended at its time cap without finishing (change for-time-cap): total valid reps.
    if (capSeconds(config) != null && !isComplete(config, state)) {
      return { scoreLabel: 'SCORE', scoreValue: `CAP · ${counted.length} reps`, splits };
    }
    const lastCounted = counted.at(-1);
    return {
      scoreLabel: 'TIME',
      scoreValue: formatTime(Math.round((lastCounted?.t ?? 0) / 1000)),
      splits,
    };
  }

  // A block ending in a cycle that never got past the parts before it (change
  // shared-clock): every valid rep, as a For Time at its cap.
  if (state.pos.roundIdx < prefixLength(config)) {
    return { scoreLabel: 'SCORE', scoreValue: `CAP · ${state.tagged.filter((e) => e.counted).length} reps`, splits };
  }

  // AMRAP: completed rounds from the final state's tally, plus every counted rep
  // of the unfinished round (all its lines, not only the current one). Right
  // after a round ends the state is on the next round with no reps yet: + 0.
  const roundReps = state.tagged.filter((e) => e.counted && e.pos.roundIdx === state.pos.roundIdx).length;
  return {
    scoreLabel: 'SCORE',
    scoreValue: `${state.pos.completedRounds} + ${roundReps}`,
    splits,
  };
}

// ─── Workouts of several blocks (change multi-block-workouts) ───────────────

/**
 * Each block's own log on its block-local clock: the events the sequence fold
 * applied in that block, shifted by the block's start, each keeping its original
 * `id` (change no-rep-review: an accepted no-rep is named by it). Block boundaries come
 * from this one fold over the original config, so an adjustment never moves a
 * block's start or a rep from one block to another.
 */
export function blockLogs(config: SequenceConfig, log: LogEntry[]): LogEntry[][] {
  const state = fold(config, log, Infinity);
  const ends = state.seq!.ends;
  const starts = config.parts.map((_, i) => (i === 0 ? 0 : ends[i - 1] + config.restAfter[i - 1] * 1000));
  return config.parts.map((_, i) =>
    state.tagged
      .filter((e) => e.block === i)
      .map((e, k) => ({ id: e.id ?? k, ok: e.ok, t: e.t - starts[i] })),
  );
}

/** The scoring block's score, every block's splits in order, and one group per block. */
export function combineBlockResults(config: SequenceConfig, results: WodResult[]): WodResult {
  const groups = results.map((r, blockIdx) => ({
    blockIdx,
    title: `BLOCK ${blockIdx + 1} · ${config.parts[blockIdx].mode} · ${r.scoreValue}`,
    splits: r.splits.map((s) => ({ ...s, blockIdx })),
  }));
  const scoring = results[config.scoringBlock];
  return { scoreLabel: scoring.scoreLabel, scoreValue: scoring.scoreValue, splits: groups.flatMap((g) => g.splits), groups };
}

export function deriveResult(config: WodConfig, log: LogEntry[]): WodResult {
  if (isSequence(config)) {
    const logs = blockLogs(config, log);
    return combineBlockResults(config, config.parts.map((part, i) => deriveResult(part, logs[i])));
  }
  return config.advanceMode === 'onClock' ? deriveOnClock(config, log) : deriveOnTarget(config, log);
}
