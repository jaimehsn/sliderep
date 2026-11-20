// The engine's own invariants (change unified-engine, design.md decision 7):
// live judging (clock ticks interleaved with gestures) must end in exactly the
// state the result fold derives from the same events.
import { describe, expect, it } from 'vitest';
import { EngineEvent, EngineState, START_POSITION, Structure, WodConfig, WodLine, advanceTo, apply, blockIndexOf, capSeconds, durationLine, fold, initial, intervalLineAt, intervalLines, intervalSeconds, isComplete, isResting, isSequence, restLeftSeconds, shapeOf, buildWodConfig, isIntervalWindow, maxSegment, targetAt, view } from '@/constants/wod-engine';
import { CASES, MAX_DISTANCE_WORKOUTS, MAX_LINE_WORKOUTS, SHARED_CLOCK_WORKOUTS, SYNTHETIC_WORKOUTS, asWindowBlock, builtin, workout } from './fixtures';
import { V2_EXERCISES, V2_WORKOUTS } from '@/db/seeds/v2-builtins';
import { LegacyStoredBlock, parseWorkoutRow } from '@/db/workouts';
import { V5_NEW_EXERCISES } from '@/db/seeds/v5-exercises';
import { blockLogs } from '@/components/result/replay';

const TICK_MS = 250;

/** What use-judge does: a tick every 250 ms, each gesture applied at its own t. */
function live(config: WodConfig, events: EngineEvent[], endT: number): EngineState {
  const sorted = [...events].sort((a, b) => a.t - b.t);
  let state = initial(config);
  let i = 0;
  for (let tick = TICK_MS; tick <= endT + TICK_MS; tick += TICK_MS) {
    while (i < sorted.length && sorted[i].t <= tick) {
      state = apply(config, state, sorted[i]);
      i++;
    }
    state = advanceTo(config, state, Math.min(tick, endT));
  }
  return state;
}

/** The config with its interval window stopping at the first miss (the window is data, so it is rebuilt). */
function withStop(config: WodConfig): WodConfig {
  const { window } = config;
  if (!isIntervalWindow(window)) throw new Error('Not an interval window');
  return buildWodConfig(config.name, { ...window, clock: { ...window.clock, stopOnMiss: true } });
}

function endOf(config: WodConfig, events: EngineEvent[]): number {
  const last = events.reduce((m, e) => Math.max(m, e.t), 0);
  if (shapeOf(config) !== 'rounds') return Math.max(last, config.totalSeconds * 1000);
  const cap = capSeconds(config);
  return cap != null ? Math.max(last, cap * 1000) : last;
}

describe('live = result', () => {
  for (const c of CASES) {
    it(c.name, () => {
      const config = workout(c.wodId);
      const endT = endOf(config, c.log);
      expect(live(config, c.log, endT)).toEqual(fold(config, c.log, endT));
    });
  }
});

describe('v1 rules', () => {
  const reps = (ts: number[]): EngineEvent[] => ts.map((t) => ({ t, ok: true }));

  it('For Time ignores events after the last rep', () => {
    const config = builtin('fran');
    const state = fold(config, reps(Array.from({ length: 93 }, (_, i) => (i + 1) * 1000)), Infinity);
    expect(state.finished).toBe(true);
    expect(state.tagged.filter((e) => e.counted)).toHaveLength(90);
    expect(state.t).toBe(90000); // clock frozen at the finishing rep
  });

  it('AMRAP finishes at its duration but still counts later events', () => {
    const config = builtin('cindy');
    const atEnd = advanceTo(config, initial(config), 720000);
    expect(atEnd.finished).toBe(true);
    expect(atEnd.t).toBe(720000);
    const after = apply(config, atEnd, { t: 725000, ok: true });
    expect(after.tagged[0].counted).toBe(true);
    expect(after.done).toBe(1);
  });

  it('EMOM caps the live count but not raw, and ignores reps at or after its last minute', () => {
    const config = builtin('everyMinute');
    const twelve = fold(config, reps(Array.from({ length: 12 }, (_, i) => 1000 + i * 2000)), 30000);
    expect(twelve.done).toBe(10);
    expect(twelve.raw).toBe(12);
    const late = fold(config, reps([600000, 605000]), Infinity);
    expect(late.finished).toBe(true);
    expect(late.tagged.every((e) => !e.counted)).toBe(true);
  });

  it('EMOM places a rep 60.2 s in into minute 2', () => {
    const config = builtin('everyMinute');
    const state = apply(config, initial(config), { t: 60200, ok: true });
    expect(state.pos.minuteIdx).toBe(1);
    expect(state.tagged[0].pos.minuteIdx).toBe(1);
  });
});

describe('time cap (change for-time-cap)', () => {
  const reps = (ts: number[]): EngineEvent[] => ts.map((t) => ({ t, ok: true }));
  const capped = workout('franCap10');

  it('reads the cap from a For Time only', () => {
    expect(capSeconds(capped)).toBe(600);
    expect(capSeconds(builtin('fran'))).toBeNull();
    expect(capSeconds(builtin('cindy'))).toBeNull();
  });

  it('describes and labels the cap', () => {
    expect(capped.description).toBe('21-15-9 · thrusters + pull-ups · 10 min cap');
    expect(capped.mode).toBe('FOR TIME');
    expect(view(capped, initial(capped)).timerLabel).toBe('elapsed · cap 10:00');
    expect(view(builtin('fran'), initial(builtin('fran'))).timerLabel).toBe('elapsed');
  });

  it('finishes at the cap, incomplete', () => {
    const state = fold(capped, reps([1000, 2000]), Infinity);
    expect(state.finished).toBe(true);
    expect(state.t).toBe(600000);
    expect(isComplete(capped, state)).toBe(false);
  });

  it('ignores a rep at exactly the cap', () => {
    const state = fold(capped, reps([599999, 600000]), Infinity);
    expect(state.tagged.map((e) => e.counted)).toEqual([true, false]);
  });

  it('finishing under the cap is complete', () => {
    const state = fold(capped, reps(Array.from({ length: 90 }, (_, i) => (i + 1) * 1000)), Infinity);
    expect(state.finished).toBe(true);
    expect(isComplete(capped, state)).toBe(true);
    expect(state.t).toBe(90000);
  });

  it('leaves an uncapped FRAN running on the clock', () => {
    const fran = builtin('fran');
    const state = advanceTo(fran, initial(fran), 3_600_000);
    expect(state.finished).toBe(false);
  });
});

describe('interval length (change emom-interval-length)', () => {
  const every90 = workout('emom90');
  const e2mom = workout('e2mom8');
  const everyMinute = builtin('everyMinute');

  it('reads the interval, 60 by default', () => {
    expect(intervalSeconds(every90)).toBe(90);
    expect(intervalSeconds(e2mom)).toBe(120);
    expect(intervalSeconds(everyMinute)).toBe(60);
  });

  it('is on interval 2 at 100 s', () => {
    const state = advanceTo(every90, initial(every90), 100000);
    expect(state.pos.minuteIdx).toBe(1);
    const v = view(every90, state);
    expect(v.exerciseName).toBe('KB SWINGS');
    expect(v.timerStr).toBe('01:20');
    expect(v.timerLabel).toBe('interval left');
    expect(v.kpi).toEqual({ label: 'interval', current: 2, total: 10 });
  });

  it('places a rep 90.5 s in into interval 2', () => {
    const state = fold(every90, [{ t: 89500, ok: true }, { t: 90500, ok: true }], 91000);
    expect(state.tagged.map((e) => e.pos.minuteIdx)).toEqual([0, 1]);
  });

  it('finishes after the last interval', () => {
    expect(advanceTo(every90, initial(every90), 899999).finished).toBe(false);
    const state = advanceTo(every90, initial(every90), 900000);
    expect(state.finished).toBe(true);
    expect(state.t).toBe(900000);
    expect(state.pos.minuteIdx).toBe(9);
    expect(fold(every90, [{ t: 900000, ok: true }], Infinity).tagged[0].counted).toBe(false);
  });

  it('labels mode and description', () => {
    expect(e2mom.mode).toBe('E2MOM · 8');
    expect(every90.mode).toBe('EVERY 1:30 · 10');
    expect(every90.description).toBe('10 × 1:30 · burpees + kb swings');
    expect(e2mom.description).toBe('8 × 2:00 · burpees + kb swings');
    expect(every90.exercises[0].detail).toBe('10 / interval');
  });

  it('leaves EVERY MINUTE unchanged', () => {
    expect(everyMinute.mode).toBe('EMOM · 10');
    expect(everyMinute.description).toBe('10 min · burpees + kb swings');
    expect(everyMinute.exercises[0].detail).toBe('10 / min');
    const v = view(everyMinute, advanceTo(everyMinute, initial(everyMinute), 75000));
    expect(v.timerStr).toBe('00:45');
    expect(v.timerLabel).toBe('min left');
    expect(v.kpi).toEqual({ label: 'minute', current: 2, total: 10 });
  });
});

describe('several exercises per interval (change emom-multi-exercise-intervals)', () => {
  const pair = workout('emomPair');
  const reps = (ts: number[]): EngineEvent[] => ts.map((t) => ({ t, ok: true }));
  const at = (n: number, from = 1000) => Array.from({ length: n }, (_, i) => from + i * 1000);

  it('moves to PUSH-UPS on the 5th PULL-UPS', () => {
    const four = fold(pair, reps(at(4)), 4500);
    expect(view(pair, four).exerciseName).toBe('PULL-UPS');
    expect(four.done).toBe(4);
    const five = fold(pair, reps(at(5)), 5500);
    const v = view(pair, five);
    expect(v.exerciseName).toBe('PUSH-UPS');
    expect(v.target).toBe(10);
    expect(five.done).toBe(0);
    expect(five.pos).toMatchObject({ minuteIdx: 0, exIdx: 1 });
  });

  it('starts a new minute on its first exercise', () => {
    // Minute 1 ends on PUSH-UPS; minute 3 is the pair again.
    const state = fold(pair, reps(at(7)), 121000);
    expect(state.pos).toMatchObject({ minuteIdx: 2, exIdx: 0 });
    expect(view(pair, state).exerciseName).toBe('PULL-UPS');
    expect(state.done).toBe(0);
  });

  it('keeps extra reps on the last exercise, the live count at its target', () => {
    const state = fold(pair, reps(at(17)), 30000);
    expect(state.pos).toMatchObject({ minuteIdx: 0, exIdx: 1 });
    expect(state.done).toBe(10);
    expect(state.raw).toBe(12);
    expect(state.tagged.map((e) => e.pos.exIdx)).toEqual([...Array(5).fill(0), ...Array(12).fill(1)]);
  });

  it('places reps like apply does', () => {
    const state = fold(pair, reps(at(17)), 30000);
    expect(state.tagged.map((_, k) => intervalLineAt(pair, 0, k))).toEqual(state.tagged.map((e) => e.pos.exIdx));
    expect(intervalLineAt(pair, 1, 40)).toBe(0);
  });

  it('shows a multi-exercise interval as one row', () => {
    expect(pair.exercises).toEqual([
      { name: 'PULL-UPS + PUSH-UPS', detail: '5 + 10 / min', note: undefined },
      { name: 'AIR SQUATS', detail: '15 / min', note: undefined },
    ]);
    expect(pair.mode).toBe('EMOM · 6');
    expect(pair.description).toBe('6 min · pull-ups, push-ups, air squats');
  });

  it('leaves single-exercise EMOMs unchanged', () => {
    const everyMinute = builtin('everyMinute');
    expect(everyMinute.exercises.map((e) => [e.name, e.detail])).toEqual([['BURPEES', '10 / min'], ['KB SWINGS', '15 / min']]);
    const state = fold(everyMinute, reps(at(12)), 30000);
    expect(state.pos).toMatchObject({ minuteIdx: 0, exIdx: 0 });
    expect(state.done).toBe(10);
    expect(state.raw).toBe(12);
  });
});

describe('progressive reps and stop at the first miss (change emom-progressive-reps)', () => {
  const deathBy = workout('deathBy');
  const ladder = workout('ladder');
  const at = (minuteIdx: number) => targetAt(deathBy, { ...START_POSITION, minuteIdx });
  /** `reps[m]` valid reps in minute m, 1 s in, 1.5 s apart. */
  const perMinute = (reps: number[]): EngineEvent[] =>
    reps.flatMap((n, m) => Array.from({ length: n }, (_, i) => ({ t: m * 60000 + 1000 + i * 1500, ok: true })));
  const deathByReps = (minutes: number) => Array.from({ length: minutes }, (_, m) => m + 1);

  it('grows a Death by target every minute', () => {
    expect([at(0), at(1), at(11)]).toEqual([1, 2, 12]);
  });

  it('grows a ladder target each time its entry comes round', () => {
    expect([0, 1, 2, 3, 4, 5].map((m) => targetAt(ladder, { ...START_POSITION, minuteIdx: m }))).toEqual([3, 10, 4, 12, 5, 14]);
  });

  it('stops at the end of a missed minute', () => {
    const events = perMinute([...deathByReps(12), 9]);
    const state = fold(deathBy, events, Infinity);
    expect(state.finished).toBe(true);
    expect(state.t).toBe(780000);
    expect(state.pos.minuteIdx).toBe(12);
    expect(state.raw).toBe(9);
    expect(isComplete(deathBy, state)).toBe(false);
    // Live: the tick that leaves minute 13 finishes instead of moving on.
    const before = advanceTo(deathBy, fold(deathBy, events, 779999), 779999);
    expect(before.finished).toBe(false);
    const after = advanceTo(deathBy, before, 780250);
    expect(after.finished).toBe(true);
    expect(after.pos.minuteIdx).toBe(12);
  });

  it('stops after a skipped empty minute', () => {
    const state = advanceTo(deathBy, fold(deathBy, perMinute([1]), 2000), 150000);
    expect(state.finished).toBe(true);
    expect(state.t).toBe(120000);
    expect(state.pos).toMatchObject({ minuteIdx: 1, exIdx: 0 });
    expect(state.done).toBe(0);
  });

  it('runs every interval when none is missed', () => {
    const state = fold(deathBy, perMinute(deathByReps(20)), Infinity);
    expect(state.finished).toBe(true);
    expect(state.t).toBe(1200000);
    expect(state.pos.minuteIdx).toBe(19);
  });

  it('shows the increment and the stop', () => {
    expect(deathBy.exercises).toEqual([{ name: 'BURPEES', detail: '1 (+1) / min', note: undefined }]);
    expect(deathBy.description).toBe('20 min · burpees · until failure');
    expect(deathBy.mode).toBe('EMOM · 20');
    expect(ladder.exercises.map((e) => e.detail)).toEqual(['3 (+1) / min', '10 (+2) / min']);
    expect(ladder.description).toBe('6 min · burpees + kb swings');
  });

  it('leaves plain EMOMs unchanged', () => {
    const everyMinute = builtin('everyMinute');
    expect(targetAt(everyMinute, { ...START_POSITION, minuteIdx: 8 })).toBe(10);
    const state = advanceTo(everyMinute, initial(everyMinute), 150000);
    expect(state.finished).toBe(false);
    expect(state.pos.minuteIdx).toBe(2);
  });
});

describe('rest (change rest-steps)', () => {
  const rested = workout('rested');
  const restedCapped = workout('restedCapped');
  const tabata = workout('tabata');
  const reps = (ts: number[]): EngineEvent[] => ts.map((t) => ({ t, ok: true }));
  /** `n` valid reps from `from` ms, 2 s apart. */
  const run = (from: number, n: number) => Array.from({ length: n }, (_, i) => from + i * 2000);

  it('rests between For Time rounds, without counting reps in the rest', () => {
    // Round 1 ends at 10 s; its rest lasts until 70 s.
    const afterRound1 = fold(rested, reps(run(2000, 5)), 30000);
    expect(afterRound1.pos.roundIdx).toBe(1);
    expect(afterRound1.restUntil).toBe(70000);
    expect(isResting(rested, afterRound1)).toBe(true);
    expect(restLeftSeconds(rested, afterRound1)).toBe(40);
    expect(view(rested, afterRound1).exerciseName).toBe('REST 00:40');
    expect(view(rested, afterRound1).kpi).toMatchObject({ label: 'round', current: 2 });

    const state = fold(rested, reps([...run(2000, 5), 40000, ...run(70000, 5)]), 90000);
    expect(state.tagged.find((e) => e.t === 40000)?.counted).toBe(false);
    // Round 2 ends at 78 s (the rep at 40 s didn't count): round 3 after its rest.
    expect(state.pos.roundIdx).toBe(2);
    expect(state.restUntil).toBe(138000);
    expect(isResting(rested, advanceTo(rested, state, 138000))).toBe(false);
  });

  it('finishes on the last rep, with no rest after the last round', () => {
    const state = fold(rested, reps([...run(2000, 5), ...run(70000, 5), ...run(140000, 5)]), Infinity);
    expect(state.finished).toBe(true);
    expect(isComplete(rested, state)).toBe(true);
    expect(isResting(rested, state)).toBe(false);
    expect(state.t).toBe(148000);
  });

  it('reaches the cap during a rest', () => {
    // Round 2 ends at 78 s: rest until 138 s, past the 120 s cap.
    const state = fold(restedCapped, reps([...run(2000, 5), ...run(70000, 5)]), Infinity);
    expect(state.finished).toBe(true);
    expect(state.t).toBe(120000);
    expect(isComplete(restedCapped, state)).toBe(false);
  });

  it('counts Tabata reps in work only, with a work/rest timer', () => {
    const state = fold(tabata, reps([1000, 3000, 21000, 25000]), 26000);
    expect(state.tagged.map((e) => e.counted)).toEqual([true, true, false, false]);
    expect(state.raw).toBe(2);
    expect(isResting(tabata, state)).toBe(true);
    expect(view(tabata, state)).toMatchObject({ timerStr: '00:04', timerLabel: 'rest left', exerciseName: 'REST 00:04' });
    const working = advanceTo(tabata, state, 37000);
    expect(isResting(tabata, working)).toBe(false);
    expect(view(tabata, working)).toMatchObject({ timerStr: '00:13', timerLabel: 'work left', exerciseName: 'AIR SQUATS' });
  });

  it('stops a stopping Tabata at the end of the missed work', () => {
    const stopping: WodConfig = withStop(tabata);
    // Intervals 1 and 2 completed, interval 3 ends its work with 5 of 8.
    const state = fold(stopping, reps([...run(1000, 8), ...run(31000, 8), ...run(61000, 5)]), Infinity);
    expect(state.finished).toBe(true);
    expect(state.t).toBe(80000);
    expect(state.pos.minuteIdx).toBe(2);
    // A whole interval skipped: missed at its work's end.
    const skipped = advanceTo(stopping, fold(stopping, reps(run(1000, 8)), 2000), 100000);
    expect(skipped.t).toBe(50000);
    expect(skipped.pos.minuteIdx).toBe(1);
  });

  it('shows the rest on the duration line', () => {
    expect(durationLine(rested)).toBe('60 s rest between rounds');
    expect(durationLine(restedCapped)).toBe('2 min cap · 60 s rest between rounds');
    expect(durationLine(tabata)).toBe('4 min · 20 s work / 10 s rest');
    expect(durationLine(withStop(tabata))).toBe('4 min max · until failure · 20 s work / 10 s rest');
    expect(durationLine(builtin('fran'))).toBe(null);
    expect(durationLine(builtin('cindy'))).toBe('12 min');
    expect(durationLine(workout('franCap10'))).toBe('10 min cap');
  });

  it('describes the rest and the work time', () => {
    expect(rested.description).toBe('3 rounds · burpees · 60 s rest');
    expect(rested.mode).toBe('3 ROUNDS FOR TIME');
    expect(restedCapped.description).toBe('3 rounds · burpees · 60 s rest · 2 min cap');
    expect(tabata.description).toBe('8 × 0:30 · air squats · 20 s work');
    expect(tabata.mode).toBe('EVERY 0:30 · 8');
  });

  it('leaves workouts without rest unchanged', () => {
    const fran = builtin('fran');
    const state = fold(fran, reps(run(2000, 22)), 60000);
    expect(state.pos.roundIdx).toBe(0);
    expect(state.restUntil).toBe(null);
    expect(isResting(fran, state)).toBe(false);
    expect(view(builtin('everyMinute'), advanceTo(builtin('everyMinute'), initial(builtin('everyMinute')), 75000)).timerLabel).toBe('min left');
  });
});

describe('several blocks (change multi-block-workouts)', () => {
  const buyIn = workout('buyInAmrap');
  const twoAmraps = workout('twoAmraps');
  const thenForTime = workout('amrapThenForTime');
  /** `n` valid reps from `from` ms, 1 s apart. */
  const reps = (from: number, n: number): EngineEvent[] => Array.from({ length: n }, (_, i) => ({ t: from + i * 1000, ok: true }));

  it('moves to the next block on a For Time block\'s last rep', () => {
    const state = fold(buyIn, reps(1000, 20), 20000);
    expect(state.finished).toBe(false);
    expect(blockIndexOf(state)).toBe(1);
    expect(state.seq?.start).toBe(20000);
    expect(view(buyIn, state)).toMatchObject({ blockLabel: 'BLOCK 2/3', timerLabel: 'remaining', timerStr: '05:00', exerciseName: 'PULL-UPS' });
    expect(isComplete(buyIn, state)).toBe(false);
  });

  it('starts the next block when an AMRAP block ends, and finishes on the last block', () => {
    const state = fold(buyIn, [...reps(1000, 20), ...reps(321000, 20)], Infinity);
    expect(state.seq?.ends).toEqual([20000, 320000, 340000]);
    expect(state.finished).toBe(true);
    expect(state.t).toBe(340000);
    expect(isComplete(buyIn, state)).toBe(true);
    expect(view(buyIn, state).exerciseName).toBe('DONE');
  });

  it('rests between blocks, ignoring gestures, and can jump across a block and its rest', () => {
    const resting = advanceTo(twoAmraps, initial(twoAmraps), 250000);
    expect(isResting(twoAmraps, resting)).toBe(true);
    expect(restLeftSeconds(twoAmraps, resting)).toBe(50);
    expect(view(twoAmraps, resting)).toMatchObject({ exerciseName: 'REST 00:50', timerLabel: 'rest left', blockLabel: 'BLOCK 2/2', target: 15 });
    const tapped = apply(twoAmraps, resting, { t: 251000, ok: true });
    expect(tapped.tagged.at(-1)).toMatchObject({ counted: false });
    expect(tapped.tagged.at(-1)?.block).toBeUndefined();
    const jumped = advanceTo(twoAmraps, initial(twoAmraps), 330000);
    expect(blockIndexOf(jumped)).toBe(1);
    expect(jumped.seq?.start).toBe(300000);
    expect(isResting(twoAmraps, jumped)).toBe(false);
    expect(view(twoAmraps, jumped).timerStr).toBe('03:30');
  });

  it('tags counted events with their block on the block-local position', () => {
    const state = fold(twoAmraps, [...reps(1000, 3), ...reps(301000, 2)], 310000);
    expect(state.tagged.map((e) => e.block)).toEqual([0, 0, 0, 1, 1]);
    expect(state.done).toBe(2);
  });

  it('is complete only on the last block', () => {
    const finished = fold(thenForTime, reps(181000, 20), Infinity);
    expect(finished.t).toBe(200000);
    expect(isComplete(thenForTime, finished)).toBe(true);
    const capped = fold(thenForTime, reps(181000, 15), Infinity);
    expect(capped.finished).toBe(true);
    expect(capped.t).toBe(480000);
    expect(isComplete(thenForTime, capped)).toBe(false);
  });

  it('labels the workout from its scoring block', () => {
    expect(buyIn.mode).toBe('5-MIN AMRAP · 3 BLOCKS');
    expect(buyIn.description).toBe('1 stations · 20 reps each → 5 min · pull-ups + air squats → 1 stations · 20 reps each');
    expect(thenForTime.mode).toBe('2 ROUNDS FOR TIME · 2 BLOCKS');
    expect(durationLine(buyIn)).toBe(null);
    expect(buyIn.parts?.map((p) => durationLine(p))).toEqual([null, '5 min', null]);
  });

  it('leaves one-block workouts without parts or a sequence state', () => {
    const fran = builtin('fran');
    expect(fran.parts).toBeUndefined();
    expect(initial(fran).seq).toBeUndefined();
    expect(view(fran, initial(fran)).blockLabel).toBe(null);
    expect(blockIndexOf(initial(fran))).toBe(0);
  });
});

describe('event ids and in-play (change no-rep-review)', () => {
  const fran = builtin('fran');
  const rested = workout('rested');
  const buyIn = workout('buyInAmrap');

  it('keeps each event id through an unsorted log', () => {
    const log = [{ id: 0, t: 3000, ok: true }, { id: 1, t: 1000, ok: false }, { id: 2, t: 2000, ok: true }];
    expect(fold(fran, log, Infinity).tagged.map((e) => e.id)).toEqual([1, 2, 0]);
  });

  it('gives no id to a tag whose event had none', () => {
    expect('id' in fold(fran, [{ t: 1000, ok: true }], Infinity).tagged[0]).toBe(false);
  });

  it('is in play for a no-rep while running, and not after a For Time end', () => {
    const reps = Array.from({ length: 90 }, (_, i) => ({ t: 1000 + i * 1000, ok: true }));
    const state = fold(fran, [{ t: 500, ok: false }, ...reps, { t: 95000, ok: false }], Infinity);
    expect(state.tagged[0]).toMatchObject({ counted: false, inPlay: true });
    expect(state.tagged.at(-1)).toMatchObject({ counted: false, inPlay: false });
    expect(state.tagged.filter((e) => e.ok).every((e) => e.counted === e.inPlay)).toBe(true);
  });

  it('is not in play during a rest', () => {
    const round1 = Array.from({ length: 5 }, (_, i) => ({ t: 1000 + i * 1000, ok: true }));
    const state = fold(rested, [...round1, { t: 30000, ok: false }], Infinity);
    expect(state.tagged.at(-1)).toMatchObject({ inPlay: false });
  });

  it('keeps ids on a sequence, in its tags and in the block logs, and is not in play between blocks', () => {
    const block1 = Array.from({ length: 20 }, (_, i) => ({ id: i, t: 1000 + i * 1000, ok: true }));
    const amrap = [{ id: 20, t: 25000, ok: false }];
    const state = fold(buyIn, [...block1, ...amrap], Infinity);
    expect(state.tagged.map((e) => e.id)).toEqual([...block1.map((e) => e.id), 20]);
    expect(state.tagged.at(-1)).toMatchObject({ block: 1, inPlay: true });
    if (!isSequence(buyIn)) throw new Error('BUY-IN AMRAP is a sequence');
    const logs = blockLogs(buyIn, [...block1, ...amrap]);
    expect(logs[1]).toEqual([{ id: 20, ok: false, t: 5000 }]);
    const twoAmraps = workout('twoAmraps');
    const between = fold(twoAmraps, [{ t: 250000, ok: false }], Infinity);
    expect(between.tagged[0]).toMatchObject({ inPlay: false });
  });
});

// Change window-model: stored blocks are translated into windows on read, strictly.
describe('stored blocks as windows', () => {
  const names = new Map(V2_EXERCISES.map((e) => [e.id, e.name]));
  const parse = (blocks: object[]) => parseWorkoutRow({ id: 'x', name: 'X', blocks: JSON.stringify(blocks) }, names);
  const burpees = [{ exerciseId: 'burpees', target: 10 }];

  it('translates every seed and synthetic row', () => {
    for (const row of [...V2_WORKOUTS, ...SYNTHETIC_WORKOUTS]) expect(() => parseWorkoutRow(row, names)).not.toThrow();
    expect(builtin('fran').window).toMatchObject({ clock: { kind: 'continuous' }, structures: [{ kind: 'rounds' }] });
    expect(builtin('cindy').window).toMatchObject({ clock: { kind: 'continuous', limitSeconds: 720 }, structures: [{ kind: 'cycle' }] });
    expect(builtin('everyMinute').window).toMatchObject({
      clock: { kind: 'intervals', everySeconds: 60, count: 10 },
      intervals: [[{ kind: 'once' }], [{ kind: 'once' }]],
    });
  });

  it('rejects blocks breaking the stored invariants', () => {
    expect(() => parse([{ formatId: 'forTime', lines: [burpees, burpees], rounds: 3 }])).toThrow(/rounds/);
    expect(() => parse([{ formatId: 'amrap', lines: [burpees, burpees], durationSeconds: 300 }])).toThrow(/AMRAP/);
    expect(() => parse([{ formatId: 'emom', lines: [burpees], rounds: 10, durationSeconds: 300 }])).toThrow(/EMOM/);
    expect(() => parse([{ formatId: 'tabata', lines: [burpees], rounds: 1 }])).toThrow(/unknown format/);
  });

  // Change shared-clock: several parts, a cycle only last and with a limit, no `once` in a continuous window.
  it('rejects windows outside the shapes allowed so far', () => {
    const line = { exerciseId: 'burpees', exercise: 'BURPEES', target: 10 };
    const rounds = { kind: 'rounds' as const, rounds: [[line]] };
    const cycle = { kind: 'cycle' as const, lines: [line] };
    const continuous = (structures: Structure[], limitSeconds?: number) =>
      buildWodConfig('X', { clock: { kind: 'continuous', limitSeconds }, structures });
    expect(() => continuous([cycle])).toThrow(/limit/);
    expect(() => continuous([rounds, cycle])).toThrow(/limit/);
    expect(() => continuous([{ kind: 'once', lines: [line] }, cycle], 600)).toThrow(/"rounds" and "cycle"/);
    expect(() => continuous([cycle, rounds], 600)).toThrow(/last/);
    expect(() => continuous([], 600)).toThrow(/at least one/);
    expect(() => continuous([rounds, { kind: 'rounds', rounds: [] }])).toThrow(/non-empty/);
    expect(() => continuous([rounds, rounds, cycle], 600)).not.toThrow();
  });
});

// Change shared-clock: the stored window shape, read beside the legacy one.
describe('stored window blocks', () => {
  const names = new Map([...V2_EXERCISES, ...V5_NEW_EXERCISES].map((e) => [e.id, e.name]));
  const parse = (blocks: object[]) => parseWorkoutRow({ id: 'x', name: 'X', blocks: JSON.stringify(blocks) }, names);
  const burpees = [{ exerciseId: 'burpees', target: 10 }];

  it('reads every built-in and synthetic workout the same in either shape', () => {
    for (const row of [...V2_WORKOUTS, ...SYNTHETIC_WORKOUTS]) {
      const blocks = (JSON.parse(row.blocks) as LegacyStoredBlock[]).map(asWindowBlock);
      expect(parseWorkoutRow({ ...row, blocks: JSON.stringify(blocks) }, names), row.id).toEqual(parseWorkoutRow(row, names));
    }
  });

  it('reads the workouts of several parts', () => {
    for (const row of SHARED_CLOCK_WORKOUTS) expect(() => parseWorkoutRow(row, names)).not.toThrow();
    expect(workout('example1').window).toMatchObject({
      clock: { kind: 'continuous', limitSeconds: 720 },
      structures: [{ kind: 'rounds' }, { kind: 'rounds' }, { kind: 'rounds' }],
    });
    expect(shapeOf(workout('rowThenAmrap'))).toBe('cycle');
  });

  it('rejects window blocks the app cannot write', () => {
    const rounds = { kind: 'rounds', rounds: [burpees] };
    const cycle = { kind: 'cycle', lines: burpees };
    expect(() => parse([{ clock: { kind: 'continuous', limitSeconds: 600 }, structures: [cycle, rounds] }])).toThrow(/last/);
    expect(() => parse([{ clock: { kind: 'continuous' }, structures: [rounds, cycle] }])).toThrow(/limit/);
    expect(() => parse([{ clock: { kind: 'continuous' }, structures: [] }])).toThrow(/at least one/);
    expect(() => parse([{ clock: { kind: 'continuous' }, structures: [{ kind: 'rounds', rounds: [[]] }] }])).toThrow(/non-empty/);
    expect(() => parse([{ clock: { kind: 'intervals', everySeconds: 5, count: 10 }, intervals: [burpees] }])).toThrow(/interval of 5 s/);
    expect(() => parse([{ clock: { kind: 'intervals', everySeconds: 60, count: 10, workSeconds: 60 }, intervals: [burpees] }])).toThrow(/work time/);
    expect(() => parse([{ clock: { kind: 'continuous' }, structures: [{ kind: 'rounds', rounds: [[{ exerciseId: 'nope', target: 1 }]] }] }])).toThrow(/unknown exercise/);
  });
});

// Change shared-clock: several parts under one clock.
describe('windows of several parts', () => {
  const reps = (n: number, from = 1000, gap = 1000) => Array.from({ length: n }, (_, i) => ({ t: from + i * gap, ok: true }));

  it('describes them part by part', () => {
    const example1 = workout('example1');
    expect(example1.mode).toBe('FOR TIME');
    expect(example1.description).toBe('15 ring muscle-ups → 5 rounds · legless rope climbs + front squats → 15 ring muscle-ups · 12 min cap');
    expect(example1.sections?.map((s) => s.title)).toEqual(['PART 1', 'PART 2 · 5 ROUNDS', 'PART 3']);
    expect(durationLine(example1)).toBe('12 min cap');
    const rowThenAmrap = workout('rowThenAmrap');
    expect(rowThenAmrap.mode).toBe('12-MIN AMRAP');
    expect(rowThenAmrap.description).toBe('50 row → amrap · pull-ups, push-ups, air squats');
    expect(rowThenAmrap.sections?.map((s) => s.title)).toEqual(['PART 1', 'PART 2 · AMRAP']);
    expect(workout('restedParts').sections?.[1].title).toBe('PART 2 · 3 ROUNDS · 30 s REST');
    expect(builtin('fran').sections).toBeUndefined();
  });

  it('shows the current part and its own progress', () => {
    const example1 = workout('example1');
    const first = view(example1, initial(example1));
    expect(first).toMatchObject({ partLabel: 'PART 1/3', kpi: { label: 'station', current: 1, total: 1 }, timerLabel: 'elapsed · cap 12:00' });
    const afterBuyIn = view(example1, fold(example1, reps(15), 16000));
    expect(afterBuyIn).toMatchObject({ partLabel: 'PART 2/3', exerciseName: 'LEGLESS ROPE CLIMBS', kpi: { label: 'round', current: 1, total: 5 } });
    const rowThenAmrap = workout('rowThenAmrap');
    // 50 row reps, then 3 AMRAP rounds of 30.
    const inAmrap = view(rowThenAmrap, fold(rowThenAmrap, reps(140), 141000));
    expect(inAmrap).toMatchObject({ partLabel: 'PART 2/2', exerciseName: 'PULL-UPS', kpi: { label: 'rounds', current: 3, total: null }, timerStr: '09:39' });
    expect('partLabel' in view(builtin('cindy'), initial(builtin('cindy')))).toBe(false);
  });

  it('starts a part on the last rep of the one before, with no rest between parts', () => {
    const rested = workout('restedParts');
    // BURPEES 1–10 s, then THRUSTERS at once: round 1 counts from 11 s.
    const s = fold(rested, [...reps(10), ...reps(5, 11000)], 20000);
    expect(s.tagged.every((e) => e.counted)).toBe(true);
    expect(isResting(rested, s)).toBe(true); // the rest between the part's rounds 1 and 2
    expect(restLeftSeconds(rested, s)).toBe(25);
  });

  it('ends a block ending in a cycle at its limit, in any part', () => {
    const rowThenAmrap = workout('rowThenAmrap');
    const s = fold(rowThenAmrap, reps(38, 5000, 10000), Infinity);
    expect(s).toMatchObject({ finished: true, t: 720000, pos: { roundIdx: 0, exIdx: 0 } });
    expect(isComplete(rowThenAmrap, s)).toBe(false);
  });
});

// Change max-lines: an interval's last line may be a MAX line, with no target.
describe('MAX lines', () => {
  const l = (exercise: string, target: number) => ({ exerciseId: exercise.toLowerCase(), exercise, target });
  const max = (exercise: string) => ({ exerciseId: exercise.toLowerCase(), exercise, target: 0, max: true as const });
  const emom = (entries: WodLine[][], extra: { everySeconds?: number; count?: number; workSeconds?: number; stopOnMiss?: boolean } = {}) =>
    buildWodConfig('X', {
      clock: { kind: 'intervals', everySeconds: 60, count: 5, ...extra },
      intervals: entries.map((lines) => [{ kind: 'once' as const, lines }]),
    });
  // every 3:00 × 5, 2:00 of work: 1 ROW, 8 BURPEES, then MAX POWER SNATCHES.
  const box = emom([[l('ROW', 1), l('BURPEES', 8), max('POWER SNATCHES')]], { everySeconds: 180, workSeconds: 120 });
  const reps = (from: number, n: number, gap = 2000): EngineEvent[] => Array.from({ length: n }, (_, i) => ({ t: from + i * gap, ok: true }));

  it('becomes current after its buy-in and counts with no cap', () => {
    let state = fold(box, reps(1000, 9), 20000);
    expect(view(box, state)).toMatchObject({ exerciseName: 'POWER SNATCHES', target: 0, done: 0, max: true });
    state = fold(box, reps(1000, 9 + 25), 70000);
    expect(view(box, state)).toMatchObject({ exerciseName: 'POWER SNATCHES', done: 25, max: true });
    expect(view(box, fold(box, reps(1000, 3), 7000)).max).toBeUndefined();
  });

  it("doesn't count a rep after the work time", () => {
    const state = fold(box, [...reps(1000, 9), { t: 125000, ok: true }], 130000);
    expect(state.tagged.at(-1)).toMatchObject({ counted: false, inPlay: false });
  });

  it('never misses an interval of only a MAX line, and stops on an unfinished buy-in', () => {
    const onlyMax = emom([[max('WALL BALL')], [l('BURPEES', 5), max('POWER SNATCHES')]], { stopOnMiss: true, count: 6 });
    // Minute 1 has no reps at all, and minute 2 its buy-in done: neither is missed.
    const kept = fold(onlyMax, reps(61000, 5), 125000);
    expect(kept.finished).toBe(false);
    expect(kept.pos.minuteIdx).toBe(2);
    // Minute 2 ends after 3 BURPEES of 5: the workout is complete at 2:00.
    const stopped = fold(onlyMax, reps(61000, 3), 125000);
    expect(stopped).toMatchObject({ finished: true, t: 120000, pos: { minuteIdx: 1, exIdx: 0 } });
    expect(live(onlyMax, reps(61000, 3), 125000)).toEqual(stopped);
  });

  it('runs live as it folds', () => {
    const events = [...reps(1000, 30), ...reps(181000, 12), ...reps(361000, 20)];
    expect(live(box, events, 900000)).toEqual(fold(box, events, 900000));
  });

  it('rejects a MAX line out of place', () => {
    expect(() => emom([[max('POWER SNATCHES'), l('BURPEES', 8)]])).toThrow(/last/);
    expect(() => emom([[{ ...max('POWER SNATCHES'), increment: 1 }]])).toThrow(/increment/);
    expect(() =>
      buildWodConfig('X', { clock: { kind: 'continuous', limitSeconds: 600 }, structures: [{ kind: 'cycle', lines: [max('BURPEES')] }] }),
    ).toThrow(/MAX/);
  });
});

describe('stored MAX lines', () => {
  const names = new Map([...V2_EXERCISES, ...V5_NEW_EXERCISES].map((e) => [e.id, e.name]));
  const parse = (blocks: object[]) => parseWorkoutRow({ id: 'x', name: 'X', blocks: JSON.stringify(blocks) }, names);
  const intervals = (lines: object[]) => [{ clock: { kind: 'intervals', everySeconds: 60, count: 5 }, intervals: [lines] }];
  const burpees = { exerciseId: 'burpees', target: 8 };

  it('reads the MAX workouts, a MAX line as target 0', () => {
    for (const row of MAX_LINE_WORKOUTS) expect(() => parseWorkoutRow(row, names)).not.toThrow();
    const [, , snatches] = intervalLines(workout('boxAmrap'), 0);
    expect(snatches).toMatchObject({ exercise: 'POWER SNATCHES', target: 0, max: true, load: '60/40 kg' });
  });

  it('rejects a MAX line with reps, an increment, out of place or in the legacy layout', () => {
    expect(() => parse(intervals([burpees, { exerciseId: 'power-snatches', max: true }]))).not.toThrow();
    expect(() => parse(intervals([burpees, { exerciseId: 'power-snatches', max: true, target: 5 }]))).toThrow(/reps/);
    expect(() => parse(intervals([burpees, { exerciseId: 'power-snatches', max: true, increment: 1 }]))).toThrow(/increment/);
    expect(() => parse(intervals([{ exerciseId: 'power-snatches', max: true }, burpees]))).toThrow(/last/);
    expect(() => parse([{ clock: { kind: 'continuous', limitSeconds: 600 }, structures: [{ kind: 'cycle', lines: [{ exerciseId: 'burpees', max: true }] }] }])).toThrow(/MAX/);
    expect(() => parse([{ formatId: 'emom', lines: [[{ exerciseId: 'burpees', max: true }]], rounds: 5, durationSeconds: 300 }])).toThrow(/MAX/);
    expect(() => parse(intervals([{ exerciseId: 'burpees' }]))).toThrow(/without reps/);
  });
});

describe('MAX segments (change max-distance)', () => {
  const ev = (t: number): EngineEvent => ({ t, ok: true });

  it('every max-distance workout builds', () => {
    for (const w of MAX_DISTANCE_WORKOUTS) expect(() => workout(w.id)).not.toThrow();
  });

  it("shows EXAMPLE 3's minute 3 count in reps, with its 5 m segment", () => {
    const config = workout('example3');
    let s = initial(config);
    for (const t of [121000, 125000, 129000]) s = apply(config, s, ev(t));
    const v = view(config, s);
    expect(v.exerciseName).toBe('HANDSTAND WALK');
    expect(v.done).toBe(3);
    expect(v.max).toBe(true);
    expect(v.segment).toEqual({ amount: 5, unit: 'm' });
  });

  it('has no segment on a MAX line without a rep description, nor on an ordinary line', () => {
    const box = workout('boxAmrap');
    let s = initial(box);
    for (const t of [5000, ...Array.from({ length: 8 }, (_, i) => 40000 + i * 2000), 60000]) s = apply(box, s, ev(t));
    expect(view(box, s).max).toBe(true);
    expect('segment' in view(box, s)).toBe(false);
    const ex3 = workout('example3');
    expect('segment' in view(ex3, initial(ex3))).toBe(false);
  });

  it('maxSegment reads only MAX lines', () => {
    const line: WodLine = { exerciseId: 'run', exercise: 'RUN', target: 1, repDescription: { amount: 200, unit: 'm' } };
    expect(maxSegment(line)).toBeNull();
    expect(maxSegment({ ...line, target: 0, max: true })).toEqual({ amount: 200, unit: 'm' });
    expect(maxSegment(undefined)).toBeNull();
  });
});
