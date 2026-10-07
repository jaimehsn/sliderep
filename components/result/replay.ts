import { WodConfig, WodSession } from '@/constants/wods';
import { LogEntry } from '@/components/judge/types';
import { formatTime } from '@/components/judge/reducer';

/** One row of the result screen's split list. Times are ms on the session clock; null where not applicable. */
export type Split = {
  label: string;
  reps: number;
  target: number;
  completed: boolean;
  cumulativeMs: number | null;
  lapMs: number | null;
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
function splitLabel(config: WodConfig, session: WodSession): string {
  const kpi = config.getKpi(session);
  const isCumulativeTotal = kpi.label === 'rounds';
  const number = isCumulativeTotal ? session.roundIdx + 1 : kpi.current;
  const prefix = isCumulativeTotal ? 'Round' : titleCase(kpi.label);
  return `${prefix} ${number} — ${config.getExerciseName(session)}`;
}

function deriveOnClock(config: WodConfig, log: LogEntry[]): WodResult {
  const totalMinutes = Math.ceil(config.totalSeconds / 60);
  const splits: Split[] = [];
  let intervalsCompleted = 0;
  let totalValidReps = 0;

  for (let m = 0; m < totalMinutes; m++) {
    const session: WodSession = { ...config.initialSession, minuteIdx: m };
    const target = config.getTarget(session);
    const reps = log.filter((e) => e.ok && Math.floor(e.t / 60000) === m).length;
    const completed = reps >= target;
    if (completed) intervalsCompleted += 1;
    totalValidReps += reps;
    splits.push({
      label: `Minute ${m + 1} — ${config.getExerciseName(session)}`,
      reps,
      target,
      completed,
      cumulativeMs: null,
      lapMs: null,
    });
  }

  return {
    scoreLabel: 'SCORE',
    scoreValue: `${intervalsCompleted}/${totalMinutes} · ${totalValidReps} reps`,
    splits,
  };
}

function deriveOnTarget(config: WodConfig, log: LogEntry[]): WodResult {
  const sorted = [...log].sort((a, b) => a.t - b.t);
  const splits: Split[] = [];
  let session = config.initialSession;
  let done = 0;
  let lastEventT = 0;
  let lastSplitT = 0;
  let stopped = false;

  for (const entry of sorted) {
    if (!entry.ok) continue;
    lastEventT = entry.t;
    done += 1;
    const target = config.getTarget(session);
    if (done >= target && !config.isComplete(session)) {
      splits.push({
        label: splitLabel(config, session),
        reps: done,
        target,
        completed: true,
        cumulativeMs: entry.t,
        lapMs: entry.t - lastSplitT,
      });
      lastSplitT = entry.t;
      const nextSession = config.advance(session);
      if (config.isComplete(nextSession)) {
        stopped = true;
        break;
      }
      session = nextSession;
      done = 0;
    }
  }

  if (!stopped && done > 0) {
    splits.push({
      label: splitLabel(config, session),
      reps: done,
      target: config.getTarget(session),
      completed: false,
      cumulativeMs: null,
      lapMs: null,
    });
  }

  if (config.timerMode === 'elapsed') {
    return {
      scoreLabel: 'TIME',
      scoreValue: formatTime(Math.round(lastEventT / 1000)),
      splits,
    };
  }

  // AMRAP: the walk never stops early (isComplete is always false), so `session`
  // here carries the final completedRounds tally and `done` the last round's partial reps.
  return {
    scoreLabel: 'SCORE',
    scoreValue: `${session.completedRounds} + ${done}`,
    splits,
  };
}

export function deriveResult(config: WodConfig, log: LogEntry[]): WodResult {
  return config.advanceMode === 'onClock' ? deriveOnClock(config, log) : deriveOnTarget(config, log);
}
