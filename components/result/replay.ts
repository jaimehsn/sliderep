import {
  START_POSITION,
  TaggedEvent,
  WodConfig,
  WodSession,
  exerciseNameAt,
  fold,
  formatTime,
  kpiAt,
  targetAt,
} from '@/constants/wod-engine';
import type { LogEntry } from '@/components/judge/types';

/**
 * One row of the result screen's split list. Times are ms on the session
 * clock; null where not applicable. `roundIdx`/`exIdx` identify the position
 * (for onClock WODs, `roundIdx` is the minute index and `exIdx` is always 0 —
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

function deriveOnClock(config: WodConfig, log: LogEntry[]): WodResult {
  const totalMinutes = Math.ceil(config.totalSeconds / 60);
  const counted = fold(config, log, Infinity).tagged.filter((e) => e.counted);
  const splits: Split[] = [];
  let intervalsCompleted = 0;
  let totalValidReps = 0;

  for (let m = 0; m < totalMinutes; m++) {
    const session: WodSession = { ...START_POSITION, minuteIdx: m };
    const target = targetAt(config, session);
    const reps = counted.filter((e) => e.pos.minuteIdx === m).length;
    const completed = reps >= target;
    if (completed) intervalsCompleted += 1;
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
    const lastCounted = state.tagged.filter((e) => e.counted).at(-1);
    return {
      scoreLabel: 'TIME',
      scoreValue: formatTime(Math.round((lastCounted?.t ?? 0) / 1000)),
      splits,
    };
  }

  // AMRAP: the final state carries the completedRounds tally and `done` the
  // last round's partial reps on its current line.
  return {
    scoreLabel: 'SCORE',
    scoreValue: `${state.pos.completedRounds} + ${state.done}`,
    splits,
  };
}

export function deriveResult(config: WodConfig, log: LogEntry[]): WodResult {
  return config.advanceMode === 'onClock' ? deriveOnClock(config, log) : deriveOnTarget(config, log);
}
