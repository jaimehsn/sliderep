import { TaggedEvent, WodConfig, fold, intervalLines, isSequence } from '@/constants/wod-engine';
import type { LogEntry } from '@/components/judge/types';
import { WodResult, blockLogs, combineBlockResults, deriveResult } from '@/components/result/replay';
import type { AdjustmentChange } from '@/db/session-adjustments';

// The post-judging review (change no-rep-review): the judge accepts no-reps they
// gave, and the result is the plain `deriveResult` of a rewritten ("reviewed") log
// — no second scoring path. See design.md of that change, decision 1.

/** One in-play no-rep of the review list. `roundIdx` is the interval index on an EMOM, as on a `Split`. */
export type ReviewNoRep = {
  id: number;
  /** Workouts of several blocks: its block. */
  blockIdx?: number;
  roundIdx: number;
  exIdx: number;
  /** On its block's clock. */
  t: number;
  status: 'open' | 'accepted' | 'surplus';
};

type Review = { log: LogEntry[]; noReps: Omit<ReviewNoRep, 'blockIdx'>[]; changed: boolean };

/** Whether a position takes reps beyond its target: an EMOM interval's last line. */
function takesExtraReps(config: WodConfig, e: TaggedEvent): boolean {
  return config.advanceMode === 'onClock' && e.pos.exIdx === intervalLines(config, e.pos.minuteIdx).length - 1;
}

/** Index of the `target`-th event of `events` that `isValid` accepts, or -1. */
function nthValid(events: TaggedEvent[], target: number, isValid: (e: TaggedEvent) => boolean): number {
  let n = 0;
  for (let i = 0; i < events.length; i++) {
    if (isValid(events[i]) && ++n === target) return i;
  }
  return -1;
}

/**
 * One block's review. Its in-play events (those the engine would count had they
 * been reps) keep the position the original fold gave them; an accepted no-rep is a
 * valid rep there; a position that reaches its target before its last event loses
 * every later event of its own (surplus), unless it takes extra reps; and on
 * `rounds` (For Time / Chipper) the time between its original and new completing
 * rep is taken off every later event. Events not in play are left out.
 */
function review(config: WodConfig, log: LogEntry[], accepted: Set<number>): Review {
  const inPlay = fold(config, log, Infinity).tagged.filter((e) => e.inPlay);
  const isAccepted = (e: TaggedEvent) => !e.ok && e.id != null && accepted.has(e.id);
  const isValid = (e: TaggedEvent) => e.ok || isAccepted(e);
  const onClock = config.advanceMode === 'onClock';

  const groups = new Map<string, TaggedEvent[]>();
  for (const e of inPlay) {
    const key = `${onClock ? e.pos.minuteIdx : e.pos.roundIdx}:${e.pos.exIdx}`;
    const group = groups.get(key);
    if (group) group.push(e);
    else groups.set(key, [e]);
  }

  const surplus = new Set<TaggedEvent>();
  const shifts: { after: number; by: number }[] = [];
  for (const events of groups.values()) {
    if (takesExtraReps(config, events[0])) continue;
    const target = events[0].target;
    const completes = nthValid(events, target, isValid);
    if (completes === -1 || completes === events.length - 1) continue;
    for (const e of events.slice(completes + 1)) surplus.add(e);
    if (config.format.repeat !== 'rounds') continue;
    // Only a position that was complete gives time back.
    const original = nthValid(events, target, (e) => e.ok);
    if (original !== -1) shifts.push({ after: events[original].t, by: events[original].t - events[completes].t });
  }

  const shiftOf = (t: number) => shifts.reduce((sum, s) => (t > s.after ? sum + s.by : sum), 0);
  const kept = inPlay.filter((e) => !surplus.has(e));
  return {
    log: kept.map((e, k) => ({ id: e.id ?? k, ok: isValid(e), t: e.t - shiftOf(e.t) })),
    noReps: inPlay
      .filter((e) => !e.ok && e.id != null)
      .map((e) => ({
        id: e.id!,
        roundIdx: onClock ? e.pos.minuteIdx : e.pos.roundIdx,
        exIdx: e.pos.exIdx,
        t: e.t,
        status: surplus.has(e) ? 'surplus' : isAccepted(e) ? 'accepted' : 'open',
      })),
    changed: inPlay.some(isAccepted),
  };
}

/** The ids every saved package accepts. */
export function acceptedIds(changes: AdjustmentChange[]): Set<number> {
  return new Set(changes.filter((c) => c.type === 'acceptNoRep').map((c) => c.eventIdx));
}

/**
 * Every no-rep the judge can review, in time order, with its status under the
 * `accepted` ids: surplus wins over accepted, which wins over open.
 */
export function reviewNoReps(config: WodConfig, log: LogEntry[], accepted: Set<number>): ReviewNoRep[] {
  if (isSequence(config)) {
    const logs = blockLogs(config, log);
    return config.parts.flatMap((part, blockIdx) => review(part, logs[blockIdx], accepted).noReps.map((n) => ({ ...n, blockIdx })));
  }
  return review(config, log, accepted).noReps;
}

/**
 * The result with the saved packages' accepted no-reps. Without any, exactly
 * `deriveResult`; a block where no acceptance applies is derived from its own log.
 */
export function deriveAdjustedResult(config: WodConfig, log: LogEntry[], changes: AdjustmentChange[]): WodResult {
  const accepted = acceptedIds(changes);
  if (accepted.size === 0) return deriveResult(config, log);
  const derive = (part: WodConfig, own: LogEntry[]) => {
    const r = review(part, own, accepted);
    return deriveResult(part, r.changed ? r.log : own);
  };
  if (isSequence(config)) {
    // Each block on its own local log (boundaries from the original fold), so nothing moves between blocks.
    const logs = blockLogs(config, log);
    return combineBlockResults(config, config.parts.map((part, i) => derive(part, logs[i])));
  }
  return derive(config, log);
}
