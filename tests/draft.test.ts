// The editor's draft model (change wod-editor, design decision 1): conversions
// to and from the stored block, and validation.
import { describe, expect, it } from 'vitest';
import {
  Draft,
  EmomDraft,
  ForTimeDraft,
  addLine,
  addLineToSlot,
  draftFromBlock,
  draftLines,
  draftToStoredBlock,
  emptyDraft,
  emptyLine,
  removeLine,
  setLineReps,
  setRepDescription,
  setSameReps,
  switchFormat,
  updateLineFields,
  validateDraft,
} from '@/components/editor/draft';
import { START_POSITION, WodConfig, exerciseNameAt, fold, targetAt } from '@/constants/wod-engine';
import { V2_EXERCISES, V2_WORKOUTS } from '@/db/seeds/v2-builtins';
import { parseWorkoutRow } from '@/db/workouts';
import { builtin } from './fixtures';

const names = new Map(V2_EXERCISES.map((e) => [e.id, e.name]));
const ex = (id: string) => ({ id, name: names.get(id) ?? id });

/** Builds the config the app would run for a saved draft. */
function configOf(draft: Draft): WodConfig {
  const blocks = JSON.stringify([draftToStoredBlock(draft)]);
  return parseWorkoutRow({ id: 'draft', name: draft.name, blocks }, names).config;
}

const fran: ForTimeDraft = {
  format: 'forTime',
  name: 'my fran',
  rounds: '3',
  sameReps: false,
  cap: '',
  rows: [
    { ...emptyLine(), exercise: ex('thrusters'), reps: ['21', '15', '9'], load: '95/65 lb' },
    { ...emptyLine(), exercise: ex('pull-ups'), reps: ['21', '15', '9'] },
  ],
};

describe('built-ins round-trip', () => {
  for (const row of V2_WORKOUTS) {
    it(row.id, () => {
      const { config } = parseWorkoutRow(row, names);
      const draft = draftFromBlock(config.format.id, config.block, config.name);
      expect(draftToStoredBlock(draft)).toEqual(JSON.parse(row.blocks)[0]);
    });
  }

  it('opens FRAN with "same reps" off and FILTHY FIFTY with it on', () => {
    const franConfig = builtin('fran');
    expect((draftFromBlock('forTime', franConfig.block, 'FRAN') as ForTimeDraft).sameReps).toBe(false);
    const filthy = builtin('filthyFifty');
    expect((draftFromBlock('forTime', filthy.block, 'FILTHY FIFTY') as ForTimeDraft).sameReps).toBe(true);
  });
});

describe('drafts run as saved', () => {
  it('a 21-15-9 For Time runs THRUSTERS 21 ... PULL-UPS 9', () => {
    const config = configOf(fran);
    const reps = Array.from({ length: 90 }, (_, i) => ({ t: (i + 1) * 1000, ok: true }));
    const sequence: string[] = [];
    for (const e of fold(config, reps, Infinity).tagged) {
      const step = `${exerciseNameAt(config, e.pos)} ${e.target}`;
      if (sequence.at(-1) !== step) sequence.push(step);
    }
    expect(sequence).toEqual([
      'THRUSTERS 21', 'PULL-UPS 21', 'THRUSTERS 15', 'PULL-UPS 15', 'THRUSTERS 9', 'PULL-UPS 9',
    ]);
    expect(config.block.lines[0][0].load).toBe('95/65 lb');
  });

  it('"same reps" fills every round', () => {
    const draft: ForTimeDraft = {
      ...fran,
      rounds: '5',
      sameReps: true,
      rows: [{ ...emptyLine(), exercise: ex('burpees'), reps: ['10'] }],
    };
    const block = draftToStoredBlock(draft);
    expect(block.lines.map((round) => round[0].target)).toEqual([10, 10, 10, 10, 10]);
    expect(block.rounds).toBe(5);
  });

  it('turning "same reps" off splits the shared value per round, and on keeps the first', () => {
    const draft: ForTimeDraft = { ...fran, sameReps: true, rows: [{ ...fran.rows[0], reps: ['12'] }] };
    const split = setSameReps(draft, false);
    expect(split.rows[0].reps).toEqual(['12', '12', '12']);
    const joined = setSameReps({ ...split, rows: [{ ...split.rows[0], reps: ['7', '5', '3'] }] }, true);
    expect(joined.rows[0].reps).toEqual(['7']);
  });

  it('a 10-minute EMOM over 3 slots puts slot 1 in minute 10', () => {
    const draft: Draft = {
      format: 'emom',
      name: 'three',
      every: '60',
      intervals: '10',
      slots: [
        [{ ...emptyLine(), exercise: ex('burpees'), reps: '10' }],
        [{ ...emptyLine(), exercise: ex('kb-swings'), reps: '15' }],
        [{ ...emptyLine(), exercise: ex('air-squats'), reps: '20' }],
      ],
    };
    const config = configOf(draft);
    const minute10 = { ...START_POSITION, minuteIdx: 9 };
    expect(exerciseNameAt(config, minute10)).toBe('BURPEES');
    expect(targetAt(config, minute10)).toBe(10);
    expect(config.mode).toBe('EMOM · 10');
  });

  it('an AMRAP keeps its minutes and repeats its lines', () => {
    const draft: Draft = {
      format: 'amrap',
      name: 'twenty',
      minutes: '20',
      rows: [{ ...emptyLine(), exercise: ex('pull-ups'), reps: '5', repDescription: null }],
    };
    expect(configOf(draft).mode).toBe('20-MIN AMRAP');
  });
});

describe('exercise notes', () => {
  it('built-ins show no note', () => {
    for (const row of V2_WORKOUTS) {
      expect(builtin(row.id).exercises.every((e) => e.note === undefined)).toBe(true);
    }
  });

  it('joins the rep description and the load', () => {
    const draft: ForTimeDraft = {
      ...fran,
      rows: [{ ...fran.rows[0], repDescription: { amount: '500', unit: 'm' } }, fran.rows[1]],
    };
    const [thrusters, pullUps] = configOf(draft).exercises;
    expect(thrusters.note).toBe('500 m · 95/65 lb');
    expect(pullUps.note).toBeUndefined();
  });
});

describe('summary', () => {
  it('rounds that all repeat the first show once, as N ROUNDS FOR TIME', () => {
    const config = configOf({
      ...fran,
      rounds: '5',
      sameReps: true,
      rows: [
        { ...emptyLine(), exercise: ex('burpees'), reps: ['10'] },
        { ...emptyLine(), exercise: ex('air-squats'), reps: ['15'] },
      ],
    });
    expect(config.mode).toBe('5 ROUNDS FOR TIME');
    expect(config.exercises.map((e) => e.detail)).toEqual(['10 reps', '15 reps']);
    expect(config.description).toBe('5 rounds · burpees + air squats');
  });

  it('built-ins keep their summary', () => {
    expect(builtin('fran').mode).toBe('FOR TIME');
    expect(builtin('fran').exercises[0].detail).toBe('21 · 15 · 9');
    expect(builtin('filthyFifty').exercises[0].detail).toBe('50 reps');
    expect(builtin('cindy').exercises[0].detail).toBe('5 reps');
    expect(builtin('everyMinute').exercises[0].detail).toBe('10 / min');
  });

  it('a single described rep shows the description instead of the rep', () => {
    const config = configOf({
      ...fran,
      rounds: '1',
      sameReps: true,
      rows: [{ ...emptyLine(), exercise: ex('burpees'), reps: ['1'], repDescription: { amount: '500', unit: 'm' }, load: 'vest' }],
    });
    expect(config.exercises[0]).toEqual({ name: 'BURPEES', detail: '500 m', note: 'vest' });
  });
});

describe('rep description', () => {
  it('adding one fills empty reps with 1 and keeps typed ones', () => {
    const draft: ForTimeDraft = {
      ...fran,
      rows: [{ ...fran.rows[0], reps: ['', '5', ''] }],
    };
    const described = setRepDescription(draft, 0, { amount: '', unit: 'm' }) as ForTimeDraft;
    expect(described.rows[0].reps).toEqual(['1', '5', '1']);
    const cleared = setRepDescription({ ...described, rows: [{ ...described.rows[0], reps: ['', '', ''] }] }, 0, null) as ForTimeDraft;
    expect(cleared.rows[0].reps).toEqual(['', '', '']);
  });
});

describe('time cap (change for-time-cap)', () => {
  it('saves as the block\'s durationSeconds, and none when empty', () => {
    expect(draftToStoredBlock({ ...fran, cap: '10' }).durationSeconds).toBe(600);
    expect('durationSeconds' in draftToStoredBlock(fran)).toBe(false);
    expect(configOf({ ...fran, cap: '10' }).description).toBe('21-15-9 · thrusters + pull-ups · 10 min cap');
  });

  it('DUPLICATE keeps the cap', () => {
    const config = configOf({ ...fran, cap: '10' });
    const copy = draftFromBlock(config.format.id, config.block, 'COPY') as ForTimeDraft;
    expect(copy.cap).toBe('10');
    expect((draftFromBlock('forTime', builtin('fran').block, 'FRAN') as ForTimeDraft).cap).toBe('');
  });

  it('flags a zero cap and accepts none', () => {
    expect(validateDraft({ ...fran, cap: '0' }).cap).toBe('Time cap must be 1 or more');
    expect(validateDraft({ ...fran, cap: ' ' })).toEqual({});
  });

  it('is dropped when leaving FOR TIME', () => {
    const amrap = switchFormat({ ...fran, cap: '10' }, 'amrap');
    expect('cap' in amrap).toBe(false);
    expect((switchFormat(amrap, 'forTime') as ForTimeDraft).cap).toBe('');
  });
});

describe('validation', () => {
  it('flags an empty name and no lines', () => {
    const problems = validateDraft(emptyDraft('amrap', '  '));
    expect(problems.name).toBeDefined();
    expect(problems.lines).toBeDefined();
    expect(problems.minutes).toBeDefined();
  });

  it('flags a missing exercise and a zero', () => {
    const problems = validateDraft({
      ...fran,
      rows: [
        { ...emptyLine(), reps: ['21', '15', '9'] },
        { ...fran.rows[1], reps: ['21', '0', '9'] },
      ],
    });
    expect(problems['line:0']).toBe('Pick an exercise');
    expect(problems['line:1']).toBe('Reps must be 1 or more');
  });

  it('flags a zero rep-description amount', () => {
    const problems = validateDraft({
      ...fran,
      rows: [{ ...fran.rows[0], repDescription: { amount: '0', unit: 'm' } }],
    });
    expect(problems['line:0']).toBe('Amount must be 1 or more');
  });

  it('accepts a complete draft', () => {
    expect(validateDraft(fran)).toEqual({});
  });
});

describe('EMOM interval length (change emom-interval-length)', () => {
  const emom = (every: string, intervals = '10'): Draft => ({
    format: 'emom',
    name: 'every',
    every,
    intervals,
    slots: [
      [{ ...emptyLine(), exercise: ex('burpees'), reps: '10' }],
      [{ ...emptyLine(), exercise: ex('kb-swings'), reps: '15' }],
    ],
  });

  it('starts at 60 seconds', () => {
    expect((emptyDraft('emom') as { every: string }).every).toBe('60');
    expect((switchFormat(fran, 'emom') as { every: string }).every).toBe('60');
  });

  it('saves 90 seconds with intervalSeconds', () => {
    expect(draftToStoredBlock(emom('90'))).toMatchObject({ rounds: 10, durationSeconds: 900, intervalSeconds: 90 });
    const config = configOf(emom('90'));
    expect(config.mode).toBe('EVERY 1:30 · 10');
    expect(config.totalSeconds).toBe(900);
  });

  it('saves 60 seconds without it', () => {
    const block = draftToStoredBlock(emom('60'));
    expect(block).toMatchObject({ rounds: 10, durationSeconds: 600 });
    expect('intervalSeconds' in block).toBe(false);
  });

  it('DUPLICATE keeps the interval', () => {
    const config = configOf(emom('90', '6'));
    const copy = draftFromBlock('emom', config.block, 'COPY');
    expect(copy).toMatchObject({ every: '90', intervals: '6' });
    expect(draftToStoredBlock(copy)).toEqual(draftToStoredBlock(emom('90', '6')));
  });

  it('flags an interval out of 10 to 600 seconds, and no intervals', () => {
    expect(validateDraft(emom('5')).every).toBe('Interval must be 10 to 600 seconds');
    expect(validateDraft(emom('601')).every).toBe('Interval must be 10 to 600 seconds');
    expect(validateDraft(emom('90', '0')).intervals).toBe('Intervals must be 1 or more');
    expect(validateDraft(emom('10'))).toEqual({});
    expect(validateDraft(emom('600'))).toEqual({});
  });
});

describe('several exercises per EMOM interval (change emom-multi-exercise-intervals)', () => {
  const pair: EmomDraft = {
    format: 'emom',
    name: 'pair',
    every: '60',
    intervals: '6',
    slots: [
      [
        { ...emptyLine(), exercise: ex('pull-ups'), reps: '5' },
        { ...emptyLine(), exercise: ex('push-ups'), reps: '10' },
      ],
      [{ ...emptyLine(), exercise: ex('air-squats'), reps: '15' }],
    ],
  };

  it('adds PUSH-UPS to minute 1 and saves the minute as both, in order', () => {
    const start: EmomDraft = { ...pair, slots: [[pair.slots[0][0]], pair.slots[1]] };
    let draft = addLineToSlot(start, 0) as Draft;
    expect(draftLines(draft).map((l) => l.exercise?.id ?? null)).toEqual(['pull-ups', null, 'air-squats']);
    draft = setLineReps(updateLineFields(draft, 1, { exercise: ex('push-ups') }), 1, '10');
    expect(draftToStoredBlock(draft).lines).toEqual([
      [{ exerciseId: 'pull-ups', target: 5 }, { exerciseId: 'push-ups', target: 10 }],
      [{ exerciseId: 'air-squats', target: 15 }],
    ]);
    const config = configOf(draft);
    expect(exerciseNameAt(config, { ...START_POSITION, minuteIdx: 2, exIdx: 1 })).toBe('PUSH-UPS');
    expect(config.exercises[0]).toMatchObject({ name: 'PULL-UPS + PUSH-UPS', detail: '5 + 10 / min' });
  });

  it('addLine appends a new interval', () => {
    expect((addLine(pair) as EmomDraft).slots.map((s) => s.length)).toEqual([2, 1, 1]);
  });

  it("removing an interval's only exercise removes the interval", () => {
    const removed = removeLine(pair, 2) as EmomDraft;
    expect(removed.slots.map((s) => s.map((l) => l.exercise?.id))).toEqual([['pull-ups', 'push-ups']]);
    const second = removeLine(pair, 1) as EmomDraft;
    expect(second.slots.map((s) => s.map((l) => l.exercise?.id))).toEqual([['pull-ups'], ['air-squats']]);
  });

  it('flags lines by their flat index', () => {
    const draft = setLineReps(pair, 1, '0');
    expect(validateDraft(draft)).toEqual({ 'line:1': 'Reps must be 1 or more' });
  });

  it('DUPLICATE keeps the lines per interval', () => {
    const config = configOf(pair);
    const copy = draftFromBlock('emom', config.block, 'COPY') as EmomDraft;
    expect(copy.slots.map((s) => s.map((l) => [l.exercise?.id, l.reps]))).toEqual([
      [['pull-ups', '5'], ['push-ups', '10']],
      [['air-squats', '15']],
    ]);
    expect(draftToStoredBlock(copy)).toEqual(draftToStoredBlock(pair));
  });

  it('switching formats flattens and splits the intervals', () => {
    const amrap = switchFormat(pair, 'amrap');
    expect(draftLines(amrap).map((l) => l.exercise?.id)).toEqual(['pull-ups', 'push-ups', 'air-squats']);
    const back = switchFormat(amrap, 'emom') as EmomDraft;
    expect(back.slots.map((s) => s.length)).toEqual([1, 1, 1]);
  });
});
