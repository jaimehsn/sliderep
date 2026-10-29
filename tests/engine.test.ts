// The engine's own invariants (change unified-engine, design.md decision 7):
// live judging (clock ticks interleaved with gestures) must end in exactly the
// state the result fold derives from the same events.
import { describe, expect, it } from 'vitest';
import { EngineEvent, EngineState, WodConfig, advanceTo, apply, capSeconds, fold, initial, intervalSeconds, isComplete, view } from '@/constants/wod-engine';
import { CASES, builtin, workout } from './fixtures';

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

function endOf(config: WodConfig, events: EngineEvent[]): number {
  const last = events.reduce((m, e) => Math.max(m, e.t), 0);
  if (config.format.repeat !== 'rounds') return Math.max(last, config.totalSeconds * 1000);
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
