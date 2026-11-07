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
  {
    // Change emom-multi-exercise-intervals: 6 minutes, minute 1 is 5 PULL-UPS + 10
    // PUSH-UPS, minute 2 is 15 AIR SQUATS.
    id: 'emomPair',
    name: 'EMOM PAIR',
    blocks: JSON.stringify([{
      formatId: 'emom',
      lines: [
        [{ exerciseId: 'pull-ups', target: 5 }, { exerciseId: 'push-ups', target: 10 }],
        [{ exerciseId: 'air-squats', target: 15 }],
      ],
      rounds: 6,
      durationSeconds: 360,
    }]),
  },
  {
    // Change emom-progressive-reps: 6 minutes alternating BURPEES 3 (+1) and KB SWINGS 10 (+2), no stop.
    id: 'ladder',
    name: 'LADDER',
    blocks: JSON.stringify([{
      formatId: 'emom',
      lines: [[{ exerciseId: 'burpees', target: 3, increment: 1 }], [{ exerciseId: 'kb-swings', target: 10, increment: 2 }]],
      rounds: 6,
      durationSeconds: 360,
    }]),
  },
  {
    // Change emom-progressive-reps: Death by BURPEES (1, +1), at most 20 minutes, stopping at the first miss.
    id: 'deathBy',
    name: 'DEATH BY',
    blocks: JSON.stringify([{
      formatId: 'emom',
      lines: [[{ exerciseId: 'burpees', target: 1, increment: 1 }]],
      rounds: 20,
      durationSeconds: 1200,
      stopOnMiss: true,
    }]),
  },
  {
    // Change rest-steps: 3 rounds of BURPEES 5, 60 s of rest between rounds.
    id: 'rested',
    name: 'RESTED',
    blocks: JSON.stringify([{
      formatId: 'forTime',
      lines: [0, 1, 2].map(() => [{ exerciseId: 'burpees', target: 5 }]),
      rounds: 3,
      restSeconds: 60,
    }]),
  },
  {
    // Change rest-steps: the same with a 2 min cap.
    id: 'restedCapped',
    name: 'RESTED CAPPED',
    blocks: JSON.stringify([{
      formatId: 'forTime',
      lines: [0, 1, 2].map(() => [{ exerciseId: 'burpees', target: 5 }]),
      rounds: 3,
      durationSeconds: 120,
      restSeconds: 60,
    }]),
  },
  {
    // Change rest-steps: a Tabata, 8 intervals of 30 s with 20 s of work, AIR SQUATS 8.
    id: 'tabata',
    name: 'TABATA',
    blocks: JSON.stringify([{
      formatId: 'emom',
      lines: [[{ exerciseId: 'air-squats', target: 8 }]],
      rounds: 8,
      durationSeconds: 240,
      intervalSeconds: 30,
      workSeconds: 20,
    }]),
  },
  {
    // Change multi-block-workouts: For Time BURPEES 20 → scoring 5-min AMRAP of
    // PULL-UPS 5 / AIR SQUATS 15 → For Time BURPEES 20.
    id: 'buyInAmrap',
    name: 'BUY-IN AMRAP',
    scoringBlock: 1,
    blocks: JSON.stringify([
      { formatId: 'forTime', lines: [[{ exerciseId: 'burpees', target: 20 }]], rounds: 1 },
      { formatId: 'amrap', lines: [[{ exerciseId: 'pull-ups', target: 5 }, { exerciseId: 'air-squats', target: 15 }]], durationSeconds: 300 },
      { formatId: 'forTime', lines: [[{ exerciseId: 'burpees', target: 20 }]], rounds: 1 },
    ]),
  },
  {
    // Change multi-block-workouts: 4-min AMRAP of BURPEES 10, 60 s of rest, then a
    // scoring 4-min AMRAP of AIR SQUATS 15.
    id: 'twoAmraps',
    name: 'TWO AMRAPS',
    scoringBlock: 1,
    blocks: JSON.stringify([
      { formatId: 'amrap', lines: [[{ exerciseId: 'burpees', target: 10 }]], durationSeconds: 240, restAfterSeconds: 60 },
      { formatId: 'amrap', lines: [[{ exerciseId: 'air-squats', target: 15 }]], durationSeconds: 240 },
    ]),
  },
  {
    // Change multi-block-workouts: 3-min AMRAP of BURPEES 10, then a scoring 2-round
    // For Time of AIR SQUATS 10 with a 5 min cap.
    id: 'amrapThenForTime',
    name: 'AMRAP THEN FOR TIME',
    scoringBlock: 1,
    blocks: JSON.stringify([
      { formatId: 'amrap', lines: [[{ exerciseId: 'burpees', target: 10 }]], durationSeconds: 180 },
      { formatId: 'forTime', lines: [[{ exerciseId: 'air-squats', target: 10 }], [{ exerciseId: 'air-squats', target: 10 }]], rounds: 2, durationSeconds: 300 },
    ]),
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

/**
 * Change no-rep-review: events in time order where `accept` marks a no-rep the judge
 * accepts — the log records it as a no-rep, and the case's changes accept its index.
 */
function reviewed(events: { t: number; kind: Kind | 'accept' }[]): { log: LogEntry[]; changes: AdjustmentChange[] } {
  const sorted = [...events].sort((a, b) => a.t - b.t);
  return {
    log: toLog(sorted.map((e) => ({ t: e.t, kind: e.kind === 'accept' ? 'noRep' : e.kind }))),
    changes: sorted.flatMap((e, i) => (e.kind === 'accept' ? [{ type: 'acceptNoRep' as const, eventIdx: i }] : [])),
  };
}

const accept = (t: number) => ({ t, kind: 'accept' as const });
const noRep = (t: number) => ({ t, kind: 'noRep' as Kind });

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
const DEATH_BY_12 = Array.from({ length: 12 }, (_, m) => m + 1); // 1, 2, … 12
const RESTED_ROUNDS = [...run(2000, 5, 2000), ...run(72000, 5, 2000), ...run(142000, 5, 2000)];
const TABATA_8 = [8, 8, 8, 8, 8, 8, 8, 8];
const BUY_IN_RUN = [...run(2000, 20, 2000), ...run(42000, 90, 3000), ...run(342000, 20, 2000)];
const TABATA_REST_REPS = [{ t: 25000, kind: 'rep' as Kind }, { t: 52000, kind: 'rep' as Kind }];

export const CASES: GoldenCase[] = [
  // FRAN (For Time, 3 rounds)
  { name: 'fran-complete', wodId: 'fran', log: toLog(run(2000, FRAN_REPS, 2000)) },
  { name: 'fran-mid-round', wodId: 'fran', log: toLog(run(2000, 30, 2000)) },
  { name: 'fran-no-reps', wodId: 'fran', log: toLog(withNoReps(2000, FRAN_REPS, 2000, 5)) },
  { name: 'fran-reps-after-last', wodId: 'fran', log: toLog(run(2000, FRAN_REPS + 3, 2000)) },
  { name: 'fran-empty', wodId: 'fran', log: [] },
  { name: 'fran-unsorted', wodId: 'fran', log: toLog(run(2000, 30, 2000).reverse()) },

  // FILTHY FIFTY (For Time, 1 round of 10 stations)
  { name: 'filthy-complete', wodId: 'filthyFifty', log: toLog(run(1000, FILTHY_REPS, 1000)) },
  { name: 'filthy-mid-station', wodId: 'filthyFifty', log: toLog(run(1000, 137, 1000)) },

  // CINDY (12-min AMRAP of 5/10/15)
  { name: 'cindy-partial-round', wodId: 'cindy', log: toLog(run(3000, 239, 3000)) },
  { name: 'cindy-reps-after-12min', wodId: 'cindy', log: toLog(run(3000, 243, 3000)) },
  { name: 'cindy-no-reps', wodId: 'cindy', log: toLog(withNoReps(3000, 200, 3000, 7)) },
  { name: 'cindy-empty', wodId: 'cindy', log: [] },
  // Change fix-amrap-partial-reps: "+ N" is the whole unfinished round (CINDY rounds are 30 reps).
  { name: 'cindy-two-lines-into-round', wodId: 'cindy', log: toLog(run(3000, 195, 3000)) },
  { name: 'cindy-round-just-finished', wodId: 'cindy', log: toLog(run(3000, 180, 3000)) },

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
    // Named before change no-rep-review, which retired its target/duration change: only its result stays pinned.
    name: 'emom-adjusted-target',
    wodId: 'everyMinute',
    log: toLog(perMinute([10, 12, 10, 15, 10, 15, 10, 15, 10, 15])),
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
    // Named before change no-rep-review, which retired its target/duration change: only its result stays pinned.
    name: 'fran-cap-adjusted-shorter',
    wodId: 'franCap10',
    log: toLog(run(6000, FRAN_REPS, 6000)),
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
  { name: 'e2mom8-all-completed', wodId: 'e2mom8', log: toLog(perInterval(120000, EMOM_TARGETS.slice(0, 8))) },
  { name: 'e2mom8-missed-intervals', wodId: 'e2mom8', log: toLog(perInterval(120000, [10, 15, 4, 15, 10, 0, 10, 12])) },

  // Change emom-multi-exercise-intervals: EMOM PAIR, 6 minutes alternating
  // 5 PULL-UPS + 10 PUSH-UPS (15 reps) and 15 AIR SQUATS.
  { name: 'pair-all-completed', wodId: 'emomPair', log: toLog(perMinute([15, 15, 15, 15, 15, 15])) },
  // Minute 1: 5 PULL-UPS and 7 PUSH-UPS; minute 3: 3 PULL-UPS only.
  { name: 'pair-second-unfinished', wodId: 'emomPair', log: toLog(perMinute([12, 15, 3, 15, 15, 0])) },
  // Extra reps after the last exercise stay on it (minute 1: PUSH-UPS 12, minute 4: AIR SQUATS 18).
  { name: 'pair-extra-reps', wodId: 'emomPair', log: toLog(perMinute([17, 15, 15, 18, 15, 15])) },
  {
    // Named before change no-rep-review, which retired its target/duration change: only its result stays pinned.
    name: 'pair-adjusted-target-second-down',
    wodId: 'emomPair',
    log: toLog(perMinute([12, 15, 15, 15, 15, 15])),
  },
  {
    // Named before change no-rep-review, which retired its target/duration change: only its result stays pinned.
    // 8 reps after the end (at or after 6:00), which don't count.
    name: 'pair-adjusted-duration-raised',
    wodId: 'emomPair',
    log: toLog([...perMinute([15, 15, 15, 15, 15, 15]), ...run(361000, 8, 2000)]),
  },

  // Change emom-progressive-reps: LADDER (3 +1 / 10 +2, no stop) and DEATH BY
  // (BURPEES 1 +1, 20 minutes at most, stopping at the first miss).
  { name: 'ladder-all-completed', wodId: 'ladder', log: toLog(perMinute([3, 10, 4, 12, 5, 14])) },
  { name: 'ladder-missed-minute', wodId: 'ladder', log: toLog(perMinute([3, 10, 2, 12, 5, 14])) },
  // Minutes 1–12 completed, minute 13 ends with 9 of 13.
  { name: 'deathby-stopped-13', wodId: 'deathBy', log: toLog(perMinute([...DEATH_BY_12, 9])) },
  { name: 'deathby-all-completed', wodId: 'deathBy', log: toLog(perMinute(Array.from({ length: 20 }, (_, m) => m + 1))) },
  { name: 'deathby-empty', wodId: 'deathBy', log: [] },
  {
    name: 'deathby-rep-after-stop',
    wodId: 'deathBy',
    log: toLog([...perMinute([...DEATH_BY_12, 9]), { t: 790000, kind: 'rep' }]),
  },

  // Change rest-steps: RESTED (3 × BURPEES 5, 60 s rest), RESTED CAPPED (the same,
  // 2 min cap) and TABATA (8 × 30 s, 20 s of work, AIR SQUATS 8). Each round starts
  // 2 s after the previous rest ends: round 1 ends at 10 s, round 2 runs 72–80 s,
  // round 3 runs 142–150 s.
  { name: 'rested-completed', wodId: 'rested', log: toLog(RESTED_ROUNDS) },
  {
    // A crafted rep inside round 1's rest (live never records one): not counted.
    name: 'rested-rep-in-rest',
    wodId: 'rested',
    log: toLog([...RESTED_ROUNDS, { t: 40000, kind: 'rep' as Kind }].sort((a, b) => a.t - b.t)),
  },
  // Round 2 ends at 80 s; its rest runs past the 120 s cap: CAP · 10 reps.
  { name: 'rested-capped-in-rest', wodId: 'restedCapped', log: toLog(RESTED_ROUNDS.slice(0, 10)) },
  { name: 'tabata-all-completed', wodId: 'tabata', log: toLog(perInterval(30000, TABATA_8)) },
  {
    // Crafted reps in the rests of intervals 1 and 2: not counted.
    name: 'tabata-reps-in-rest',
    wodId: 'tabata',
    log: toLog([...perInterval(30000, TABATA_8), ...TABATA_REST_REPS].sort((a, b) => a.t - b.t)),
  },

  // Change multi-block-workouts. BUY-IN AMRAP: the buy-in runs 2–40 s (ends at 40 s),
  // the AMRAP 40–340 s (90 reps from 42 s, 4 + 10), the cash-out from 342 s (ends at
  // 380 s, 00:40 on its own clock).
  { name: 'buyin-complete', wodId: 'buyInAmrap', log: toLog(BUY_IN_RUN) },
  {
    // TWO AMRAPS: 70 reps in block 1 (7 + 0), a rep in the 240–300 s rest (not
    // counted), 50 reps in block 2 from 303 s (3 + 5).
    name: 'two-amraps-rep-in-rest',
    wodId: 'twoAmraps',
    log: toLog([...run(3000, 70, 3000), { t: 270000, kind: 'rep' as Kind }, ...run(303000, 50, 3000)]),
  },
  // AMRAP THEN FOR TIME: 40 reps in the 3-min AMRAP (4 + 0), then the capped For
  // Time from 180 s: 20 reps finish it (00:40), 15 reach the cap (CAP · 15 reps).
  { name: 'amrap-then-for-time-complete', wodId: 'amrapThenForTime', log: toLog([...run(3000, 40, 3000), ...run(182000, 20, 2000)]) },
  { name: 'amrap-then-for-time-capped', wodId: 'amrapThenForTime', log: toLog([...run(3000, 40, 3000), ...run(182000, 15, 2000)]) },

  // Change no-rep-review: accepted no-reps (design.md decision 1). FRAN's last
  // position: 81 reps to 2:42, then PULL-UPS 7 to 4:40, a no-rep at 4:43, the 8th at
  // 4:46 and the 9th at 4:49 — accepted, it completes at 4:46 and 4:49 is surplus.
  {
    name: 'review-fran-last-position',
    wodId: 'fran',
    ...reviewed([...run(2000, 81, 2000), ...run(268000, 7, 2000), accept(283000), ...run(286000, 2, 3000)]),
  },
  // Round 1 THRUSTERS: a no-rep at 3 s, then 21 reps 4–44 s; accepted, they complete
  // at 42 s and every later event moves 2 s earlier: 03:02 becomes 03:00.
  { name: 'review-fran-round-1', wodId: 'fran', ...reviewed([accept(3000), ...run(4000, 21, 2000), ...run(46000, 69, 2000)]) },
  // Round 1 THRUSTERS: a no-rep at 30 s among 20 reps to 41 s, a no-rep at 42 s, the
  // 21st at 44 s; accepting the first makes the 42 s no-rep and the 44 s rep surplus,
  // 3 s back: 03:02 becomes 02:59.
  {
    name: 'review-fran-later-no-rep-surplus',
    wodId: 'fran',
    ...reviewed([...run(2000, 14, 2000), accept(30000), ...run(32000, 5, 2000), { t: 41000, kind: 'rep' }, noRep(42000), { t: 44000, kind: 'rep' }, ...run(46000, 69, 2000)]),
  },
  // FRAN CAP 10: 81 reps to 8:02, PULL-UPS 8 to 9:20, a no-rep at 9:47, the cap:
  // CAP · 89 reps; accepted, the last position completes: TIME 09:47.
  { name: 'review-fran-cap-completes', wodId: 'franCap10', ...reviewed([...run(2000, 81, 6000), ...run(490000, 8, 10000), accept(587000)]) },
  // A no-rep at 2 s, then 51 reps from 5 s every 10 s to the cap: the THRUSTERS'
  // 21st rep becomes surplus, the 52nd valid rep takes its place: still CAP · 51 reps.
  { name: 'review-fran-cap-completed-position', wodId: 'franCap10', ...reviewed([accept(2000), ...run(5000, 51, 10000)]) },
  // RESTED: a no-rep at 1 s before round 1's 5 reps; accepted, round 1 ends at 8 s,
  // its rest 2 s earlier, and the TIME 02:30 becomes 02:28.
  { name: 'review-rested-across-rest', wodId: 'rested', ...reviewed([accept(1000), ...RESTED_ROUNDS]) },
  // CINDY 14 + 7 (427 reps every 1.5 s): a no-rep at 0.7 s in round 1's PULL-UPS,
  // a completed position — still 14 + 7.
  { name: 'review-cindy-completed-position', wodId: 'cindy', ...reviewed([accept(700), ...run(1500, 427, 1500)]) },
  // The same, with the no-rep at 10:45 among the unfinished round's PUSH-UPS (2/10): 14 + 8.
  { name: 'review-cindy-unfinished-round', wodId: 'cindy', ...reviewed([...run(1500, 427, 1500), accept(645000)]) },
  // EVERY MINUTE: 9 BURPEES and a no-rep in minute 1, then the targets: 9/10 · 124
  // reps; accepted, 10/10 · 125 reps.
  { name: 'review-emom-missed-minute', wodId: 'everyMinute', ...reviewed([...perMinute([9, ...EMOM_TARGETS.slice(1)]), accept(30000)]) },
  // Every target met, and a no-rep in minute 1 after its 10 BURPEES: 10/10 · 126 reps.
  { name: 'review-emom-beyond-target', wodId: 'everyMinute', ...reviewed([...perMinute(EMOM_TARGETS), accept(30000)]) },
  // EMOM PAIR minute 1: 4 PULL-UPS, a no-rep, a 5th PULL-UP and 10 PUSH-UPS; accepted,
  // the 5th PULL-UP is surplus and PUSH-UPS keeps its 10.
  {
    name: 'review-pair-first-line',
    wodId: 'emomPair',
    ...reviewed([...run(1000, 4, 2000), accept(8000), { t: 9000, kind: 'rep' }, ...run(11000, 10, 2000), ...perMinute([0, 15, 15, 15, 15, 15])]),
  },
  // DEATH BY: 12 minutes completed, 12 reps and a no-rep in minute 13 (12 + 12);
  // accepted, minute 13 is completed and it stops at the empty minute 14: 13 + 0.
  { name: 'review-deathby-missed-minute', wodId: 'deathBy', ...reviewed([...perMinute([...DEATH_BY_12, 12]), accept(750000)]) },
  // BUY-IN AMRAP: a no-rep at 1 s in the buy-in; accepted, the buy-in's TIME is 00:38
  // instead of 00:40, the AMRAP block (the score) and the cash-out unchanged.
  { name: 'review-buyin-no-rep', wodId: 'buyInAmrap', ...reviewed([accept(1000), ...BUY_IN_RUN]) },
];
