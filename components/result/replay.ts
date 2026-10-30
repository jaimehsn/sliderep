import {
  START_POSITION,
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
  kpiAt,
  targetAt,
} from '@/constants/wod-engine';
import type { LogEntry } from '@/components/judge/types';

/**
 * One row of the result screen's split list. Times are ms on the session
 * clock; null where not applicable. `roundIdx`/`exIdx` identify the position
 * (for onClock WODs, `roundIdx` is the interval index and `exIdx` is always 0 —
 * see `db/session-adjustments.ts`) — only consumed by `session/adjust.tsx` to
 * know which position a tapped row corresponds to; the plain result screen
 * ignores them.
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
};

export type WodResult = {
  scoreLabel: string;
  scoreValue: string;
  splits: Split[];
};

function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * AMRAP's kpi.label is 'rounds' (plural) because its `current` is a cumulative
 * completed-rounds tally for the live header, not the round currently in progress
 * (that one increments together with `completedRounds`, one step later, inside
 * `advance()`). Split labels want the round in progress, so they read `roundIdx`
 * directly for that one case; every other format's kpi.current already is it.
 */
export function splitLabel(config: WodConfig, session: WodSession): string {
  const kpi = kpiAt(config, session);
  const isCumulativeTotal = kpi.label === 'rounds';
  const number = isCumulativeTotal ? session.roundIdx + 1 : kpi.current;
  const prefix = isCumulativeTotal ? 'Round' : titleCase(kpi.label);
  return `${prefix} ${number} — ${exerciseNameAt(config, session)}`;
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
    intervalLines(config, m).forEach((_, i) => {
      const session: WodSession = { ...START_POSITION, minuteIdx: m, exIdx: i };
      const target = targetAt(config, session);
      const reps = counted.filter((e) => e.pos.minuteIdx === m && e.pos.exIdx === i).length;
      const completed = reps >= target;
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
      });
    });
    if (intervalCompleted) intervalsCompleted += 1;
  }

  if (config.block.stopOnMiss) return stopAtFirstMiss(splits, totalIntervals);
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

export function deriveResult(config: WodConfig, log: LogEntry[]): WodResult {
  return config.advanceMode === 'onClock' ? deriveOnClock(config, log) : deriveOnTarget(config, log);
}
