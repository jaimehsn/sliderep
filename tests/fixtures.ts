// Synthetic golden-log fixtures (design.md of change unified-engine, decision 7).
// Configs are built from the frozen v2 seed through the real row parser, so the
// tests run the actual built-ins without SQLite. Never edit a case's log once
// its golden is recorded — add a new case instead.
import type { LogEntry } from '@/components/judge/types';
import type { WodConfig } from '@/constants/wod-engine';
import type { AdjustmentChange } from '@/db/session-adjustments';
import { V2_EXERCISES, V2_WORKOUTS } from '@/db/seeds/v2-builtins';
import { parseWorkoutRow } from '@/db/workouts';

const names = new Map(V2_EXERCISES.map((e) => [e.id, e.name]));

export function builtin(id: string): WodConfig {
  const row = V2_WORKOUTS.find((w) => w.id === id);
  if (!row) throw new Error(`No built-in ${id}`);
  return parseWorkoutRow(row, names).config;
}

type Kind = 'rep' | 'noRep';

/** `count` events of one kind, the first at `from` ms, then every `gap` ms. */
function run(from: number, count: number, gap: number, kind: Kind = 'rep'): { t: number; kind: Kind }[] {
  return Array.from({ length: count }, (_, i) => ({ t: from + i * gap, kind }));
}

function toLog(events: { t: number; kind: Kind }[]): LogEntry[] {
  return events.map((e, i) => ({ id: i, ok: e.kind === 'rep', t: e.t }));
}

/** One valid rep every `gap` ms, plus a no-rep right after every `every`-th rep. */
function withNoReps(from: number, count: number, gap: number, every: number) {
  return run(from, count, gap).flatMap((e, i) =>
    (i + 1) % every === 0 ? [e, { t: e.t + gap / 2, kind: 'noRep' as Kind }] : [e],
  );
}

/** EMOM: `reps[m]` valid reps in minute m, starting 1 s into the minute, 2 s apart. */
function perMinute(reps: number[]) {
  return reps.flatMap((n, m) => run(m * 60000 + 1000, n, 2000));
}

export type GoldenCase = {
  name: string;
  wodId: string;
  log: LogEntry[];
  changes?: AdjustmentChange[];
};

const FRAN_REPS = 90; // 21+21+15+15+9+9
const FILTHY_REPS = 500;
const EMOM_TARGETS = [10, 15, 10, 15, 10, 15, 10, 15, 10, 15];

export const CASES: GoldenCase[] = [
  // FRAN (For Time, 3 rounds)
  { name: 'fran-complete', wodId: 'fran', log: toLog(run(2000, FRAN_REPS, 2000)) },
  { name: 'fran-mid-round', wodId: 'fran', log: toLog(run(2000, 30, 2000)) },
  { name: 'fran-no-reps', wodId: 'fran', log: toLog(withNoReps(2000, FRAN_REPS, 2000, 5)) },
  { name: 'fran-reps-after-last', wodId: 'fran', log: toLog(run(2000, FRAN_REPS + 3, 2000)) },
  {
    name: 'fran-adjusted-target-down',
    wodId: 'fran',
    log: toLog(run(2000, FRAN_REPS, 2000)),
    changes: [{ type: 'target', roundIdx: 0, exIdx: 0, newTarget: 15 }],
  },
  {
    name: 'fran-adjusted-target-up',
    wodId: 'fran',
    log: toLog(run(2000, FRAN_REPS, 2000)),
    changes: [{ type: 'target', roundIdx: 2, exIdx: 1, newTarget: 12 }],
  },
  { name: 'fran-empty', wodId: 'fran', log: [] },
  { name: 'fran-unsorted', wodId: 'fran', log: toLog(run(2000, 30, 2000).reverse()) },

  // FILTHY FIFTY (For Time, 1 round of 10 stations)
  { name: 'filthy-complete', wodId: 'filthyFifty', log: toLog(run(1000, FILTHY_REPS, 1000)) },
  { name: 'filthy-mid-station', wodId: 'filthyFifty', log: toLog(run(1000, 137, 1000)) },

  // CINDY (12-min AMRAP of 5/10/15)
  { name: 'cindy-partial-round', wodId: 'cindy', log: toLog(run(3000, 239, 3000)) },
  { name: 'cindy-reps-after-12min', wodId: 'cindy', log: toLog(run(3000, 243, 3000)) },
  { name: 'cindy-no-reps', wodId: 'cindy', log: toLog(withNoReps(3000, 200, 3000, 7)) },
  {
    name: 'cindy-adjusted-target',
    wodId: 'cindy',
    log: toLog(run(3000, 239, 3000)),
    changes: [{ type: 'target', roundIdx: 0, exIdx: 0, newTarget: 3 }],
  },
  {
    name: 'cindy-adjusted-duration',
    wodId: 'cindy',
    log: toLog(run(3000, 239, 3000)),
    changes: [{ type: 'duration', newDurationSeconds: 600 }],
  },
  { name: 'cindy-empty', wodId: 'cindy', log: [] },
  // Change fix-amrap-partial-reps: "+ N" is the whole unfinished round (CINDY rounds are 30 reps).
  { name: 'cindy-two-lines-into-round', wodId: 'cindy', log: toLog(run(3000, 195, 3000)) },
  { name: 'cindy-round-just-finished', wodId: 'cindy', log: toLog(run(3000, 180, 3000)) },
  {
    name: 'cindy-adjusted-target-up',
    wodId: 'cindy',
    log: toLog(run(3000, 239, 3000)),
    changes: [{ type: 'target', roundIdx: 2, exIdx: 0, newTarget: 8 }],
  },

  // EVERY MINUTE (10-min EMOM alternating 10 burpees / 15 KB swings)
  { name: 'emom-all-completed', wodId: 'everyMinute', log: toLog(perMinute(EMOM_TARGETS)) },
  { name: 'emom-missed-minutes', wodId: 'everyMinute', log: toLog(perMinute([10, 6, 10, 0, 8, 15, 10, 15, 3, 15])) },
  { name: 'emom-extra-reps', wodId: 'everyMinute', log: toLog(perMinute([12, 15, 14, 15, 10, 17, 10, 15, 10, 15])) },
  {
    name: 'emom-reps-at-or-after-10min',
    wodId: 'everyMinute',
    log: toLog([...perMinute(EMOM_TARGETS), { t: 600000, kind: 'rep' }, { t: 605000, kind: 'rep' }]),
  },
  {
    name: 'emom-no-reps',
    wodId: 'everyMinute',
    log: toLog([...perMinute([10, 15, 10]), ...run(30500, 4, 1000, 'noRep')].sort((a, b) => a.t - b.t)),
  },
  {
    name: 'emom-adjusted-target',
    wodId: 'everyMinute',
    log: toLog(perMinute([10, 12, 10, 15, 10, 15, 10, 15, 10, 15])),
    changes: [{ type: 'target', roundIdx: 1, exIdx: 0, newTarget: 12 }],
  },
  {
    name: 'emom-adjusted-duration',
    wodId: 'everyMinute',
    log: toLog(perMinute(EMOM_TARGETS)),
    changes: [{ type: 'duration', newDurationSeconds: 480 }],
  },
  { name: 'emom-empty', wodId: 'everyMinute', log: [] },
];
