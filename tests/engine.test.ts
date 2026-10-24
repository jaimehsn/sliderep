// The engine's own invariants (change unified-engine, design.md decision 7):
// live judging (clock ticks interleaved with gestures) must end in exactly the
// state the result fold derives from the same events.
import { describe, expect, it } from 'vitest';
import { EngineEvent, EngineState, WodConfig, advanceTo, apply, fold, initial } from '@/constants/wod-engine';
import { CASES, builtin } from './fixtures';

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
  return config.format.repeat === 'rounds' ? last : Math.max(last, config.totalSeconds * 1000);
}

describe('live = result', () => {
  for (const c of CASES) {
    it(c.name, () => {
      const config = builtin(c.wodId);
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
