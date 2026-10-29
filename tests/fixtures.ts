// Synthetic golden-log fixtures (design.md of change unified-engine, decision 7).
// Configs are built from the frozen v2 seed through the real row parser, so the
// tests run the actual built-ins without SQLite. Never edit a case's log once
// its golden is recorded — add a new case instead.
import type { LogEntry } from '@/components/judge/types';
import type { WodConfig } from '@/constants/wod-engine';
import type { AdjustmentChange } from '@/db/session-adjustments';
import { V2_EXERCISES, V2_WORKOUTS } from '@/db/seeds/v2-builtins';
import { WorkoutRow, parseWorkoutRow } from '@/db/workouts';

const names = new Map(V2_EXERCISES.map((e) => [e.id, e.name]));

export function builtin(id: string): WodConfig {
  const row = V2_WORKOUTS.find((w) => w.id === id);
  if (!row) throw new Error(`No built-in ${id}`);
  return parseWorkoutRow(row, names).config;
}

// Synthetic workouts for cases no built-in covers (change for-time-cap: the
// built-ins have no time cap; change emom-interval-length: nor an interval other
// than 60 s). Stored rows like any own workout's, parsed by the
// same row parser.
const ft = (thrusters: number, pullUps: number) => [
  { exerciseId: 'thrusters', target: thrusters },
  { exerciseId: 'pull-ups', target: pullUps },
];
export const SYNTHETIC_WORKOUTS: WorkoutRow[] = [
  {
    // 21-15-9 THRUSTERS + PULL-UPS, 10 min cap.
    id: 'franCap10',
    name: 'FRAN CAP 10',
    blocks: JSON.stringify([{ formatId: 'forTime', lines: [ft(21, 21), ft(15, 15), ft(9, 9)], rounds: 3, durationSeconds: 600 }]),
  },
  {
    // One-round chipper of 3 stations at 20 reps, 5 min cap.
    id: 'chipperCap5',
    name: 'CHIPPER CAP 5',
    blocks: JSON.stringify([{
      formatId: 'forTime',
      lines: [[
        { exerciseId: 'burpees', target: 20 },
        { exerciseId: 'air-squats', target: 20 },
        { exerciseId: 'kb-swings', target: 20 },
      ]],
      rounds: 1,
      durationSeconds: 300,
    }]),
  },
  {
    // Change emom-interval-length: 10 intervals of 90 s alternating BURPEES 10 / KB SWINGS 15.
    id: 'emom90',
    name: 'EMOM 90',
    blocks: JSON.stringify([{
      formatId: 'emom',
      lines: [[{ exerciseId: 'burpees', target: 10 }], [{ exerciseId: 'kb-swings', target: 15 }]],
      rounds: 10,
      durationSeconds: 900,
      intervalSeconds: 90,
    }]),
  },
  {
    // Change emom-interval-length: 8 intervals of 120 s (E2MOM) of the same pair.
    id: 'e2mom8',
    name: 'E2MOM 8',
    blocks: JSON.stringify([{
      formatId: 'emom',
      lines: [[{ exerciseId: 'burpees', target: 10 }], [{ exerciseId: 'kb-swings', target: 15 }]],
      rounds: 8,
      durationSeconds: 960,
      intervalSeconds: 120,
    }]),
  },
];

/** A golden case's workout: a built-in by id, or one of `SYNTHETIC_WORKOUTS`. */
export function workout(id: string): WodConfig {
  const row = SYNTHETIC_WORKOUTS.find((w) => w.id === id);
  return row ? parseWorkoutRow(row, names).config : builtin(id);
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

/** EMOM of `intervalMs` intervals: `reps[i]` valid reps in interval i, starting 1 s in, 2 s apart. */
function perInterval(intervalMs: number, reps: number[]) {
  return reps.flatMap((n, i) => run(i * intervalMs + 1000, n, 2000));
}

export type GoldenCase = {
  name: string;
  /** A built-in id, or a `SYNTHETIC_WORKOUTS` id. */
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

  // Change for-time-cap: synthetic capped workouts (FRAN CAP 10 is 90 reps, the
  // chipper 60). A rep at the cap or later doesn't count.
  { name: 'fran-cap-finished-under', wodId: 'franCap10', log: toLog(run(2000, FRAN_REPS, 2000)) },
  // Round 1 (42 reps) and 9 THRUSTERS of round 2: the spec's CAP · 51 reps.
  { name: 'fran-cap-mid-position', wodId: 'franCap10', log: toLog(run(5000, 51, 10000)) },
  {
    name: 'fran-cap-rep-at-cap',
    wodId: 'franCap10',
    log: toLog([...run(5000, 51, 10000), { t: 600000, kind: 'rep' }, { t: 600500, kind: 'rep' }]),
  },
  {
    name: 'fran-cap-adjusted-shorter',
    wodId: 'franCap10',
    log: toLog(run(6000, FRAN_REPS, 6000)),
    changes: [{ type: 'duration', newDurationSeconds: 480 }],
  },
  {
    name: 'fran-cap-adjusted-raised',
    wodId: 'franCap10',
    log: toLog(run(5000, 51, 10000)),
    changes: [{ type: 'duration', newDurationSeconds: 900 }],
  },
  {
    name: 'fran-cap-adjusted-target-up',
    wodId: 'franCap10',
    log: toLog(run(2000, FRAN_REPS, 2000)),
    changes: [{ type: 'target', roundIdx: 0, exIdx: 0, newTarget: 24 }],
  },
  { name: 'chipper-cap-finished-under', wodId: 'chipperCap5', log: toLog(run(1000, 60, 4000)) },
  { name: 'chipper-cap-mid-station', wodId: 'chipperCap5', log: toLog(run(3000, 47, 5000)) },

  // Change emom-interval-length: synthetic EMOMs of 10 × 90 s and 8 × 120 s
  // (BURPEES 10 / KB SWINGS 15 alternating).
  { name: 'emom90-all-completed', wodId: 'emom90', log: toLog(perInterval(90000, EMOM_TARGETS)) },
  {
    // Interval 2 gets 6 reps plus one 0.5 s after the 90 s boundary, before its own run.
    name: 'emom90-missed-intervals',
    wodId: 'emom90',
    log: toLog([...perInterval(90000, [10, 6, 10, 0, 8, 15, 10, 15, 3, 15]), { t: 90500, kind: 'rep' as Kind }].sort((a, b) => a.t - b.t)),
  },
  {
    name: 'emom90-reps-at-or-after-end',
    wodId: 'emom90',
    log: toLog([...perInterval(90000, EMOM_TARGETS), { t: 900000, kind: 'rep' }, { t: 905000, kind: 'rep' }]),
  },
  {
    name: 'emom90-adjusted-duration',
    wodId: 'emom90',
    log: toLog(perInterval(90000, EMOM_TARGETS)),
    changes: [{ type: 'duration', newDurationSeconds: 540 }],
  },
  {
    name: 'emom90-adjusted-target-up',
    wodId: 'emom90',
    log: toLog(perInterval(90000, EMOM_TARGETS)),
    changes: [{ type: 'target', roundIdx: 1, exIdx: 0, newTarget: 18 }],
  },
  { name: 'e2mom8-all-completed', wodId: 'e2mom8', log: toLog(perInterval(120000, EMOM_TARGETS.slice(0, 8))) },
  { name: 'e2mom8-missed-intervals', wodId: 'e2mom8', log: toLog(perInterval(120000, [10, 15, 4, 15, 10, 0, 10, 12])) },
];
