// The editor's draft model (change wod-editor, design decision 1): conversions
// to and from the stored block, and validation. Since change shared-clock a FOR
// TIME or AMRAP block is a time setting plus parts, started from a template, and
// is stored in the window shape.
import { describe, expect, it } from 'vitest';
import {
  ContinuousDraft,
  Draft,
  EmomDraft,
  RoundsPart,
  addBlock,
  addLine,
  addLineToSlot,
  addPart,
  applyTemplate,
  blockProblems,
  copyName,
  draftFromWindow,
  draftLines,
  draftToStoredBlock,
  emptyDraft,
  emptyLine,
  emptyWorkoutDraft,
  partProblems,
  removeBlock,
  removeLine,
  removePart,
  setLineIncrement,
  setLineReps,
  setPartKind,
  setRepDescription,
  setSameReps,
  templateOf,
  updateBlock,
  updateLineFields,
  validateDraft,
  validateWorkoutDraft,
  WorkoutDraft,
  workoutDraftFromConfig,
  workoutToStoredBlocks,
} from '@/components/editor/draft';
import { ContinuousWindow, START_POSITION, WodConfig, exerciseNameAt, fold, targetAt } from '@/constants/wod-engine';
import { V2_EXERCISES, V2_WORKOUTS } from '@/db/seeds/v2-builtins';
import { V5_NEW_EXERCISES } from '@/db/seeds/v5-exercises';
import { LegacyStoredBlock, StoredWindowBlock, parseWorkoutRow } from '@/db/workouts';
import { SHARED_CLOCK_WORKOUTS, SYNTHETIC_WORKOUTS, asWindowBlock, builtin, workout as fixtureWorkout } from './fixtures';

const names = new Map([...V2_EXERCISES, ...V5_NEW_EXERCISES].map((e) => [e.id, e.name]));
const ex = (id: string) => ({ id, name: names.get(id) ?? id });

/** Builds the config the app would run for a saved draft. */
function configOf(draft: Draft): WodConfig {
  const blocks = JSON.stringify([draftToStoredBlock(draft)]);
  return parseWorkoutRow({ id: 'draft', name: draft.name, blocks }, names).config;
}

/** A one-part FOR TIME block: its ROUNDS part, plus the block's cap in minutes. */
function forTime(part: Partial<RoundsPart>, minutes = '', name = 'my fran'): ContinuousDraft {
  return { format: 'continuous', name, minutes, parts: [{ ...(emptyDraft('forTime') as ContinuousDraft).parts[0] as RoundsPart, ...part }] };
}

/** The only ROUNDS part of a one-part block. */
function only(draft: Draft): RoundsPart {
  if (draft.format !== 'continuous' || draft.parts[0].kind !== 'rounds') throw new Error('not a ROUNDS block');
  return draft.parts[0];
}

/** A continuous stored block's only structure. */
function structureOf(block: StoredWindowBlock) {
  if (!('structures' in block)) throw new Error('not a continuous block');
  return block.structures[0];
}

const franPart: Partial<RoundsPart> = {
  rounds: '3',
  sameReps: false,
  rows: [
    { ...emptyLine(), exercise: ex('thrusters'), reps: ['21', '15', '9'], load: '95/65 lb' },
    { ...emptyLine(), exercise: ex('pull-ups'), reps: ['21', '15', '9'] },
  ],
};
const fran = forTime(franPart);

describe('built-ins round-trip', () => {
  for (const row of V2_WORKOUTS) {
    it(row.id, () => {
      const { config } = parseWorkoutRow(row, names);
      const draft = draftFromWindow(config.window, config.name);
      expect(draftToStoredBlock(draft)).toEqual(asWindowBlock(JSON.parse(row.blocks)[0]));
    });
  }

  it('opens FRAN with "same reps" off and FILTHY FIFTY with it on', () => {
    expect(only(draftFromWindow(builtin('fran').window, 'FRAN')).sameReps).toBe(false);
    expect(only(draftFromWindow(builtin('filthyFifty').window, 'FILTHY FIFTY')).sameReps).toBe(true);
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
    const [structure] = (config.window as ContinuousWindow).structures;
    expect(structure.kind === 'rounds' && structure.rounds[0][0].load).toBe('95/65 lb');
  });

  it('"same reps" fills every round', () => {
    const draft = forTime({ rounds: '5', sameReps: true, rows: [{ ...emptyLine(), exercise: ex('burpees'), reps: ['10'] }] });
    const structure = structureOf(draftToStoredBlock(draft));
    expect(structure.kind === 'rounds' && structure.rounds.map((round) => round[0].target)).toEqual([10, 10, 10, 10, 10]);
  });

  it('turning "same reps" off splits the shared value per round, and on keeps the first', () => {
    const part = only(forTime({ ...franPart, sameReps: true, rows: [{ ...franPart.rows![0], reps: ['12'] }] }));
    const split = setSameReps(part, false);
    expect(split.rows[0].reps).toEqual(['12', '12', '12']);
    const joined = setSameReps({ ...split, rows: [{ ...split.rows[0], reps: ['7', '5', '3'] }] }, true);
    expect(joined.rows[0].reps).toEqual(['7']);
  });

  it('a 10-minute EMOM over 3 slots puts slot 1 in minute 10', () => {
    const draft: Draft = {
      format: 'emom',
      stopOnMiss: false,
      work: '',
      name: 'three',
      every: '60',
      intervals: '10',
      slots: [
        [{ ...emptyLine(), exercise: ex('burpees'), reps: '10', increment: '' }],
        [{ ...emptyLine(), exercise: ex('kb-swings'), reps: '15', increment: '' }],
        [{ ...emptyLine(), exercise: ex('air-squats'), reps: '20', increment: '' }],
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
      format: 'continuous',
      name: 'twenty',
      minutes: '20',
      parts: [{ kind: 'amrap', rows: [{ ...emptyLine(), exercise: ex('pull-ups'), reps: '5', repDescription: null }] }],
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
    const draft = forTime({ ...franPart, rows: [{ ...franPart.rows![0], repDescription: { amount: '500', unit: 'm' } }, franPart.rows![1]] });
    const [thrusters, pullUps] = configOf(draft).exercises;
    expect(thrusters.note).toBe('500 m · 95/65 lb');
    expect(pullUps.note).toBeUndefined();
  });
});

describe('summary', () => {
  it('rounds that all repeat the first show once, as N ROUNDS FOR TIME', () => {
    const config = configOf(forTime({
      rounds: '5',
      sameReps: true,
      rows: [
        { ...emptyLine(), exercise: ex('burpees'), reps: ['10'] },
        { ...emptyLine(), exercise: ex('air-squats'), reps: ['15'] },
      ],
    }));
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
    const config = configOf(forTime({
      rounds: '1',
      sameReps: true,
      rows: [{ ...emptyLine(), exercise: ex('burpees'), reps: ['1'], repDescription: { amount: '500', unit: 'm' }, load: 'vest' }],
    }));
    expect(config.exercises[0]).toEqual({ name: 'BURPEES', detail: '500 m', note: 'vest' });
  });
});

describe('rep description', () => {
  it('adding one fills empty reps with 1 and keeps typed ones', () => {
    const part = only(forTime({ ...franPart, rows: [{ ...franPart.rows![0], reps: ['', '5', ''] }] }));
    const described = setRepDescription(part, 0, { amount: '', unit: 'm' });
    expect(described.rows[0].reps).toEqual(['1', '5', '1']);
    const cleared = setRepDescription({ ...described, rows: [{ ...described.rows[0], reps: ['', '', ''] }] }, 0, null);
    expect(cleared.rows[0].reps).toEqual(['', '', '']);
  });
});

describe('time cap (change for-time-cap)', () => {
  it("saves as the block's limit, and none when empty", () => {
    expect(draftToStoredBlock({ ...fran, minutes: '10' }).clock).toEqual({ kind: 'continuous', limitSeconds: 600 });
    expect('limitSeconds' in draftToStoredBlock(fran).clock).toBe(false);
    expect(configOf({ ...fran, minutes: '10' }).description).toBe('21-15-9 · thrusters + pull-ups · 10 min cap');
  });

  it('DUPLICATE keeps the cap', () => {
    const copy = draftFromWindow(configOf({ ...fran, minutes: '10' }).window, 'COPY') as ContinuousDraft;
    expect(copy.minutes).toBe('10');
    expect((draftFromWindow(builtin('fran').window, 'FRAN') as ContinuousDraft).minutes).toBe('');
  });

  it('flags a zero cap and accepts none', () => {
    expect(validateDraft({ ...fran, minutes: '0' }).minutes).toBe('Time cap must be 1 or more');
    expect(validateDraft({ ...fran, minutes: ' ' })).toEqual({});
  });

  it('is dropped when picking another template', () => {
    const amrap = applyTemplate({ ...fran, minutes: '10' }, 'amrap') as ContinuousDraft;
    expect(amrap.minutes).toBe('');
    expect((applyTemplate(amrap, 'forTime') as ContinuousDraft).minutes).toBe('');
  });
});

describe('validation', () => {
  it('flags an empty name and no lines', () => {
    const problems = validateDraft(emptyDraft('amrap', '  '));
    expect(problems.name).toBeDefined();
    expect(problems['part:0:lines']).toBeDefined();
    expect(problems.minutes).toBeDefined();
  });

  it('flags a missing exercise and a zero', () => {
    const problems = validateDraft(forTime({
      ...franPart,
      rows: [
        { ...emptyLine(), reps: ['21', '15', '9'] },
        { ...franPart.rows![1], reps: ['21', '0', '9'] },
      ],
    }));
    expect(problems['part:0:line:0']).toBe('Pick an exercise');
    expect(problems['part:0:line:1']).toBe('Reps must be 1 or more');
    expect(partProblems(problems, 0)['line:1']).toBe('Reps must be 1 or more');
  });

  it('flags a zero rep-description amount', () => {
    const problems = validateDraft(forTime({ ...franPart, rows: [{ ...franPart.rows![0], repDescription: { amount: '0', unit: 'm' } }] }));
    expect(problems['part:0:line:0']).toBe('Amount must be 1 or more');
  });

  it('accepts a complete draft', () => {
    expect(validateDraft(fran)).toEqual({});
  });
});

describe('input limits (change responsive-review)', () => {
  const workoutOf = (name: string, draft: Draft = fran): WorkoutDraft => ({ name, scoringBlock: 0, blocks: [{ draft, restAfter: '' }] });

  it('accepts a 40-character name and flags 41, after trimming', () => {
    expect(validateWorkoutDraft(workoutOf('A'.repeat(40)))).toEqual({});
    expect(validateWorkoutDraft(workoutOf(`  ${'A'.repeat(40)}  `))).toEqual({});
    expect(validateWorkoutDraft(workoutOf('A'.repeat(41))).name).toBe('Name must be 40 characters or less');
  });

  it('accepts 999 reps and flags 1000', () => {
    const withReps = (reps: string[]) => forTime({ ...franPart, rows: [{ ...franPart.rows![0], reps }, franPart.rows![1]] });
    expect(validateDraft(withReps(['999', '15', '9']))).toEqual({});
    expect(validateDraft(withReps(['21', '1000', '9']))['part:0:line:0']).toBe('Reps must be 999 or less');
    expect(validateWorkoutDraft(workoutOf('BIG', withReps(['1000', '15', '9'])))['block:0:part:0:line:0']).toBe('Reps must be 999 or less');
  });

  it('does not limit an EMOM increment', () => {
    const emom = setLineIncrement(
      { ...emptyDraft('emom', 'LADDER'), intervals: '10', slots: [[{ ...emptyLine(), exercise: ex('thrusters'), reps: '900', increment: '' }]] } as EmomDraft,
      0,
      '200',
    );
    expect(validateDraft(emom)).toEqual({});
  });

  it('builds the DUPLICATE name within the limit', () => {
    expect(copyName('FRAN')).toBe('FRAN COPY');
    expect(copyName('A'.repeat(35))).toBe(`${'A'.repeat(35)} COPY`);
    expect(copyName('A'.repeat(40))).toBe(`${'A'.repeat(35)} COPY`);
    expect(copyName(`${'A'.repeat(34)} BCDEF`)).toBe(`${'A'.repeat(34)} COPY`); // the cut lands on a space
    expect(copyName('A'.repeat(40)).length).toBeLessThanOrEqual(40);
  });
});

describe('EMOM interval length (change emom-interval-length)', () => {
  const emom = (every: string, intervals = '10'): EmomDraft => ({
    format: 'emom',
    stopOnMiss: false,
    work: '',
    name: 'every',
    every,
    intervals,
    slots: [
      [{ ...emptyLine(), exercise: ex('burpees'), reps: '10', increment: '' }],
      [{ ...emptyLine(), exercise: ex('kb-swings'), reps: '15', increment: '' }],
    ],
  });

  it('starts at 60 seconds', () => {
    expect((emptyDraft('emom') as EmomDraft).every).toBe('60');
    expect((applyTemplate(fran, 'emom') as EmomDraft).every).toBe('60');
  });

  it('saves 90 seconds as the interval clock', () => {
    expect(draftToStoredBlock(emom('90')).clock).toEqual({ kind: 'intervals', everySeconds: 90, count: 10 });
    const config = configOf(emom('90'));
    expect(config.mode).toBe('EVERY 1:30 · 10');
    expect(config.totalSeconds).toBe(900);
  });

  it('DUPLICATE keeps the interval', () => {
    const config = configOf(emom('90', '6'));
    const copy = draftFromWindow(config.window, 'COPY');
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
    stopOnMiss: false,
    work: '',
    name: 'pair',
    every: '60',
    intervals: '6',
    slots: [
      [
        { ...emptyLine(), exercise: ex('pull-ups'), reps: '5', increment: '' },
        { ...emptyLine(), exercise: ex('push-ups'), reps: '10', increment: '' },
      ],
      [{ ...emptyLine(), exercise: ex('air-squats'), reps: '15', increment: '' }],
    ],
  };

  it('adds PUSH-UPS to minute 1 and saves the minute as both, in order', () => {
    const start: EmomDraft = { ...pair, slots: [[pair.slots[0][0]], pair.slots[1]] };
    let draft = addLineToSlot(start, 0);
    expect(draftLines(draft).map((l) => l.exercise?.id ?? null)).toEqual(['pull-ups', null, 'air-squats']);
    draft = setLineReps(updateLineFields(draft, 1, { exercise: ex('push-ups') }), 1, '10');
    const block = draftToStoredBlock(draft);
    expect('intervals' in block && block.intervals).toEqual([
      [{ exerciseId: 'pull-ups', target: 5 }, { exerciseId: 'push-ups', target: 10 }],
      [{ exerciseId: 'air-squats', target: 15 }],
    ]);
    const config = configOf(draft);
    expect(exerciseNameAt(config, { ...START_POSITION, minuteIdx: 2, exIdx: 1 })).toBe('PUSH-UPS');
    expect(config.exercises[0]).toMatchObject({ name: 'PULL-UPS + PUSH-UPS', detail: '5 + 10 / min' });
  });

  it('addLine appends a new interval', () => {
    expect(addLine(pair).slots.map((s) => s.length)).toEqual([2, 1, 1]);
  });

  it("removing an interval's only exercise removes the interval", () => {
    expect(removeLine(pair, 2).slots.map((s) => s.map((l) => l.exercise?.id))).toEqual([['pull-ups', 'push-ups']]);
    expect(removeLine(pair, 1).slots.map((s) => s.map((l) => l.exercise?.id))).toEqual([['pull-ups'], ['air-squats']]);
  });

  it('flags lines by their flat index', () => {
    expect(validateDraft(setLineReps(pair, 1, '0'))).toEqual({ 'line:1': 'Reps must be 1 or more' });
  });

  it('DUPLICATE keeps the lines per interval', () => {
    const copy = draftFromWindow(configOf(pair).window, 'COPY') as EmomDraft;
    expect(copy.slots.map((s) => s.map((l) => [l.exercise?.id, l.reps]))).toEqual([
      [['pull-ups', '5'], ['push-ups', '10']],
      [['air-squats', '15']],
    ]);
    expect(draftToStoredBlock(copy)).toEqual(draftToStoredBlock(pair));
  });

  it('switching templates flattens and splits the intervals', () => {
    const amrap = applyTemplate(pair, 'amrap');
    expect(draftLines(amrap).map((l) => l.exercise?.id)).toEqual(['pull-ups', 'push-ups', 'air-squats']);
    expect((applyTemplate(amrap, 'emom') as EmomDraft).slots.map((s) => s.length)).toEqual([1, 1, 1]);
  });
});

describe('EMOM progression and stop (change emom-progressive-reps)', () => {
  const deathBy: EmomDraft = {
    format: 'emom',
    name: 'death by burpees',
    every: '60',
    intervals: '30',
    stopOnMiss: true,
    work: '',
    slots: [[{ ...emptyLine(), exercise: ex('burpees'), reps: '1', increment: '1' }]],
  };

  it('saves a Death by with its increment and the stop', () => {
    expect(draftToStoredBlock(deathBy)).toEqual({
      clock: { kind: 'intervals', everySeconds: 60, count: 30, stopOnMiss: true },
      intervals: [[{ exerciseId: 'burpees', target: 1, increment: 1 }]],
    });
    const config = configOf(deathBy);
    expect(targetAt(config, { ...START_POSITION, minuteIdx: 2 })).toBe(3);
    expect(config.description).toBe('30 min · burpees · until failure');
  });

  it('writes neither a 0 or empty increment nor the stop when off', () => {
    const plain: EmomDraft = {
      ...deathBy,
      stopOnMiss: false,
      slots: [[{ ...deathBy.slots[0][0], increment: '0' }], [{ ...deathBy.slots[0][0], increment: '' }]],
    };
    const block = draftToStoredBlock(plain);
    expect('stopOnMiss' in block.clock).toBe(false);
    expect('intervals' in block && block.intervals.flat().every((l) => !('increment' in l))).toBe(true);
  });

  it('flags an invalid increment on its line', () => {
    const bad: EmomDraft = { ...deathBy, slots: [[{ ...deathBy.slots[0][0], increment: 'x' }]] };
    expect(validateDraft(bad)).toEqual({ 'line:0': 'Increment must be 0 or more' });
    expect(validateDraft(deathBy)).toEqual({});
  });

  it('DUPLICATE keeps the increment and the stop', () => {
    const copy = draftFromWindow(configOf(deathBy).window, 'COPY') as EmomDraft;
    expect(copy.stopOnMiss).toBe(true);
    expect(copy.slots[0][0].increment).toBe('1');
    expect(draftToStoredBlock(copy)).toEqual(draftToStoredBlock(deathBy));
  });

  it('new EMOM lines start with no increment and the stop off', () => {
    const fresh = addLine(emptyDraft('emom') as EmomDraft);
    expect(fresh.stopOnMiss).toBe(false);
    expect(fresh.slots[0][0].increment).toBe('');
    expect(addLineToSlot(fresh, 0).slots[0][1].increment).toBe('');
    expect((applyTemplate(fran, 'emom') as EmomDraft).slots[0][0].increment).toBe('');
  });
});

describe('setLineIncrement', () => {
  it('sets the increment of a line by its flat index', () => {
    const draft: EmomDraft = {
      format: 'emom',
      name: 'x',
      every: '60',
      intervals: '4',
      stopOnMiss: false,
      work: '',
      slots: [
        [{ ...emptyLine(), exercise: ex('pull-ups'), reps: '5', increment: '' }, { ...emptyLine(), exercise: ex('push-ups'), reps: '10', increment: '' }],
        [{ ...emptyLine(), exercise: ex('air-squats'), reps: '15', increment: '' }],
      ],
    };
    expect(setLineIncrement(draft, 1, '2').slots.map((s) => s.map((l) => l.increment))).toEqual([['', '2'], ['']]);
  });
});

describe('rest fields (change rest-steps)', () => {
  const rested = forTime({ rounds: '5', sameReps: true, rest: '60', rows: [{ ...emptyLine(), exercise: ex('burpees'), reps: ['10'] }] }, '', 'rested');
  const tabata: EmomDraft = {
    format: 'emom',
    name: 'tabata',
    every: '30',
    intervals: '8',
    work: '20',
    stopOnMiss: false,
    slots: [[{ ...emptyLine(), exercise: ex('air-squats'), reps: '8', increment: '' }]],
  };

  it('saves a rested For Time and a Tabata with their fields', () => {
    expect(structureOf(draftToStoredBlock(rested))).toMatchObject({ kind: 'rounds', restSeconds: 60 });
    expect(configOf(rested).description).toBe('5 rounds · burpees · 60 s rest');
    expect(draftToStoredBlock(tabata)).toEqual({
      clock: { kind: 'intervals', everySeconds: 30, count: 8, workSeconds: 20 },
      intervals: [[{ exerciseId: 'air-squats', target: 8 }]],
    });
    expect(validateDraft(rested)).toEqual({});
    expect(validateDraft(tabata)).toEqual({});
  });

  it('writes neither field when empty', () => {
    expect('restSeconds' in structureOf(draftToStoredBlock(fran))).toBe(false);
    expect('workSeconds' in draftToStoredBlock({ ...tabata, work: '' }).clock).toBe(false);
  });

  it('flags rest on one round, rest out of range and work not shorter than EVERY', () => {
    const restOf = (patch: Partial<RoundsPart>) => validateDraft(forTime({ ...only(rested), ...patch }))['part:0:rest'];
    expect(restOf({ rounds: '1' })).toBe('Rest needs 2 rounds or more');
    expect(restOf({ rest: '0' })).toBe('Rest must be 1 to 600 seconds');
    expect(restOf({ rest: '601' })).toBe('Rest must be 1 to 600 seconds');
    expect(validateDraft({ ...tabata, work: '30' }).work).toBe('Work must be 1 or more and shorter than EVERY');
    expect(validateDraft({ ...tabata, work: 'x' }).work).toBe('Work must be 1 or more and shorter than EVERY');
  });

  it('DUPLICATE keeps both', () => {
    expect(only(draftFromWindow(configOf(rested).window, 'COPY')).rest).toBe('60');
    const tabataCopy = draftFromWindow(configOf(tabata).window, 'COPY') as EmomDraft;
    expect(tabataCopy.work).toBe('20');
    expect(draftToStoredBlock(tabataCopy)).toEqual(draftToStoredBlock(tabata));
  });

  it('switching template starts both empty', () => {
    expect(only(applyTemplate(tabata, 'forTime')).rest).toBe('');
    expect((applyTemplate(rested, 'emom') as EmomDraft).work).toBe('');
  });
});

describe('workouts of several blocks (change multi-block-workouts)', () => {
  const block = (draft: Draft) => ({ draft: { ...draft, name: '' }, restAfter: '' });
  const amrap: ContinuousDraft = { format: 'continuous', name: '', minutes: '5', parts: [{ kind: 'amrap', rows: [{ ...emptyLine(), exercise: ex('pull-ups'), reps: '5' }] }] };
  const buyIn = forTime({ rows: [{ ...emptyLine(), exercise: ex('burpees'), reps: ['20'] }] }, '', '');
  const three: WorkoutDraft = {
    name: ' buy-in ',
    scoringBlock: 1,
    blocks: [block(buyIn), { ...block(amrap), restAfter: '30' }, block(buyIn)],
  };
  const windowRows = (row: { blocks: string }) => (JSON.parse(row.blocks) as LegacyStoredBlock[]).map(asWindowBlock);

  it('stores one block as its window, and the built-ins round-trip through the workout draft', () => {
    expect(workoutToStoredBlocks({ name: 'my fran', scoringBlock: 0, blocks: [block(fran)] })).toEqual([draftToStoredBlock(fran)]);
    for (const row of V2_WORKOUTS) {
      const { config } = parseWorkoutRow(row, names);
      const workout = workoutDraftFromConfig(config, config.name);
      expect(workout.blocks).toHaveLength(1);
      expect(workout.scoringBlock).toBe(0);
      expect(workoutToStoredBlocks(workout)).toEqual(windowRows(row));
    }
  });

  it('stores three blocks with their rest and runs as a sequence scored by its marked block', () => {
    const stored = workoutToStoredBlocks(three);
    expect(stored.map((b) => b.restAfterSeconds)).toEqual([undefined, 30, undefined]);
    const { config } = parseWorkoutRow({ id: 'w', name: 'BUY-IN', blocks: JSON.stringify(stored), scoringBlock: 1 }, names);
    expect(config.parts).toHaveLength(3);
    expect(config.restAfter).toEqual([0, 30, 0]);
    expect(config.mode).toBe('5-MIN AMRAP · 3 BLOCKS');
  });

  it('adds FOR TIME blocks and keeps the scoring marker on removal', () => {
    const added = addBlock(emptyWorkoutDraft('x'));
    expect(added.blocks.map((b) => templateOf(b.draft))).toEqual(['forTime', 'forTime']);
    expect(removeBlock(three, 0).scoringBlock).toBe(0); // the AMRAP moved to index 0
    expect(removeBlock(three, 2).scoringBlock).toBe(1);
    expect(removeBlock(three, 1).scoringBlock).toBe(0); // the scoring block itself removed
    expect(removeBlock(three, 2).blocks[1].restAfter).toBe(''); // the new last block has no rest after it
    expect(removeBlock(emptyWorkoutDraft('x'), 0).blocks).toHaveLength(1);
  });

  it('keys block problems by block, the name once', () => {
    const bad = updateBlock({ ...three, name: ' ' }, 1, { draft: { ...amrap, minutes: '0' }, restAfter: '601' });
    const problems = validateWorkoutDraft(bad);
    expect(problems.name).toBe('Name is required');
    expect(problems['block:1:minutes']).toBe('Minutes must be 1 or more');
    expect(problems['block:1:restAfter']).toBe('Rest must be 1 to 600 seconds');
    expect(Object.keys(problems).some((k) => k.endsWith(':name'))).toBe(false);
    expect(blockProblems(problems, 1)).toEqual({ minutes: 'Minutes must be 1 or more', restAfter: 'Rest must be 1 to 600 seconds' });
    expect(validateWorkoutDraft(three)).toEqual({});
  });

  it('DUPLICATE keeps every block, the rest and the scoring block', () => {
    for (const id of ['buyInAmrap', 'twoAmraps', 'amrapThenForTime']) {
      const row = SYNTHETIC_WORKOUTS.find((w) => w.id === id)!;
      const { config } = parseWorkoutRow(row, names);
      const workout = workoutDraftFromConfig(config, `${config.name} COPY`);
      expect(workout.scoringBlock).toBe(row.scoringBlock);
      expect(workoutToStoredBlocks(workout)).toEqual(windowRows(row));
    }
  });
});

describe('templates and parts (change shared-clock)', () => {
  const line = (id: string, reps: string[]) => ({ ...emptyLine(), exercise: ex(id), reps });

  it('fills each template with its parts', () => {
    const kinds = (draft: Draft) => (draft.format === 'continuous' ? draft.parts.map((p) => (p.kind === 'amrap' ? 'AMRAP' : p.rounds)) : null);
    expect(kinds(emptyDraft('forTime'))).toEqual(['1']);
    expect(kinds(emptyDraft('amrap'))).toEqual(['AMRAP']);
    expect(kinds(emptyDraft('buyInCashOut'))).toEqual(['1', '', '1']);
    expect(kinds(emptyDraft('buyInAmrap'))).toEqual(['1', 'AMRAP']);
    expect(emptyDraft('emom').format).toBe('emom');
    for (const id of ['forTime', 'amrap', 'emom', 'buyInCashOut', 'buyInAmrap'] as const) expect(templateOf(emptyDraft(id))).toBe(id);
  });

  it('keeps the lines in the main part when switching template', () => {
    const switched = applyTemplate(fran, 'buyInAmrap') as ContinuousDraft;
    expect(switched.parts.map((p) => p.rows.map((r) => r.exercise?.id))).toEqual([[], ['thrusters', 'pull-ups']]);
    expect(switched.parts[1].kind).toBe('amrap');
    const cashOut = applyTemplate(fran, 'buyInCashOut') as ContinuousDraft;
    expect(cashOut.parts.map((p) => p.rows.length)).toEqual([0, 2, 0]);
    expect(applyTemplate(fran, 'forTime')).toBe(fran);
  });

  it('adds a part at the end, or before a final AMRAP part, and removes any but the only one', () => {
    const buyInAmrap = emptyDraft('buyInAmrap') as ContinuousDraft;
    expect(addPart(buyInAmrap).parts.map((p) => p.kind)).toEqual(['rounds', 'rounds', 'amrap']);
    expect(addPart(fran).parts.map((p) => p.kind)).toEqual(['rounds', 'rounds']);
    const three = emptyDraft('buyInCashOut') as ContinuousDraft;
    expect(removePart(three, 1).parts.map((p) => (p.kind === 'rounds' ? p.rounds : ''))).toEqual(['1', '1']);
    expect(removePart(fran, 0)).toBe(fran);
    expect(templateOf(addPart(fran))).toBeNull();
  });

  it('turns a part into AMRAP and back, keeping its lines', () => {
    const amrap = setPartKind(fran, 0, 'amrap');
    expect(amrap.parts[0]).toMatchObject({ kind: 'amrap', rows: [{ reps: '21' }, { reps: '21' }] });
    expect(setPartKind(amrap, 0, 'rounds').parts[0]).toMatchObject({ kind: 'rounds', rounds: '1', rows: [{ reps: ['21'] }, { reps: ['21'] }] });
  });

  it('refuses an AMRAP part that is not last, and a block ending in AMRAP without minutes', () => {
    const buyInAmrap: ContinuousDraft = {
      format: 'continuous',
      name: 'x',
      minutes: '',
      parts: [
        { kind: 'rounds', rounds: '1', sameReps: true, rest: '', rows: [line('row', ['50'])] },
        { kind: 'amrap', rows: [{ ...emptyLine(), exercise: ex('pull-ups'), reps: '5' }] },
      ],
    };
    expect(validateDraft(buyInAmrap)).toEqual({ minutes: 'Minutes must be 1 or more' });
    const reversed = { ...buyInAmrap, minutes: '12', parts: [buyInAmrap.parts[1], buyInAmrap.parts[0]] };
    expect(validateDraft(reversed)).toEqual({ 'part:0:kind': 'AMRAP can only be the last part' });
    expect(validateDraft({ ...buyInAmrap, minutes: '12' })).toEqual({});
  });

  it('flags a part without lines', () => {
    expect(validateDraft(emptyDraft('buyInCashOut', 'x'))).toMatchObject({ 'part:0:lines': expect.any(String), 'part:1:rounds': expect.any(String), 'part:2:lines': expect.any(String) });
  });

  it('saves example 1 as one block of three parts, read back as the fixture', () => {
    const example1: ContinuousDraft = {
      format: 'continuous',
      name: 'example 1',
      minutes: '12',
      parts: [
        { kind: 'rounds', rounds: '1', sameReps: true, rest: '', rows: [line('ring-muscle-ups', ['15'])] },
        { kind: 'rounds', rounds: '5', sameReps: true, rest: '', rows: [line('legless-rope-climbs', ['1']), line('front-squats', ['3'])] },
        { kind: 'rounds', rounds: '1', sameReps: true, rest: '', rows: [line('ring-muscle-ups', ['15'])] },
      ],
    };
    expect(validateDraft(example1)).toEqual({});
    const fixture = SHARED_CLOCK_WORKOUTS.find((w) => w.id === 'example1')!;
    expect(draftToStoredBlock(example1)).toEqual(JSON.parse(fixture.blocks)[0]);
    expect(configOf(example1).description).toBe(fixtureWorkout('example1').description);
  });

  it('DUPLICATE keeps every part', () => {
    for (const row of SHARED_CLOCK_WORKOUTS) {
      const { config } = parseWorkoutRow(row, names);
      expect(workoutToStoredBlocks(workoutDraftFromConfig(config, 'COPY'))).toEqual(JSON.parse(row.blocks));
    }
    const copy = workoutDraftFromConfig(fixtureWorkout('rowThenAmrap'), 'COPY').blocks[0].draft as ContinuousDraft;
    expect(copy.minutes).toBe('12');
    expect(copy.parts.map((p) => p.kind)).toEqual(['rounds', 'amrap']);
    expect(templateOf(copy)).toBe('buyInAmrap');
  });
});
