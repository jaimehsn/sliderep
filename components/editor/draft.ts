// The workout editor's state, as plain data (change wod-editor, design decision 1).
// Pure TS — no React, no DB — so conversions and validation are covered by vitest.
// Number fields are kept as the strings typed into the form; `validateDraft`
// reports anything that isn't a whole number of 1 or more, and the stored block
// is only built from a draft that validated.
import type { Block, WodLine } from '@/constants/wod-engine';
import type { StoredBlock, StoredLine } from '@/db/workouts';

export type DraftFormat = 'forTime' | 'amrap' | 'emom';
export type RepUnit = 'm' | 'cal' | 's';

export type DraftExercise = { id: string; name: string };

/** What every line carries, whatever the format. */
export type LineFields = {
  exercise: DraftExercise | null;
  /** Rep description ("500 m"); null when the line has none. */
  repDescription: { amount: string; unit: RepUnit } | null;
  /** Free text, '' for none. */
  load: string;
};

/** For Time row: reps per round, or `reps[0]` for every round while `sameReps` is on. */
export type ForTimeRow = LineFields & { reps: string[] };
export type RepsRow = LineFields & { reps: string };
/** EMOM row: `increment` is the reps added each time its interval comes round, '' meaning 0 (change emom-progressive-reps). */
export type EmomRow = RepsRow & { increment: string };

/** `cap` is the time cap in whole minutes, '' for none (change for-time-cap). */
export type ForTimeDraft = { format: 'forTime'; name: string; rounds: string; sameReps: boolean; cap: string; rows: ForTimeRow[] };
export type AmrapDraft = { format: 'amrap'; name: string; minutes: string; rows: RepsRow[] };
/**
 * `every`: interval length in seconds (10–600); `intervals`: how many (change emom-interval-length).
 * `slots`: the interval sequence, each a non-empty list of lines done in order (change
 * emom-multi-exercise-intervals). Line helpers take the flat index into `draftLines`.
 * `stopOnMiss`: end at the first missed interval (change emom-progressive-reps).
 */
export type EmomDraft = {
  format: 'emom';
  name: string;
  every: string;
  intervals: string;
  stopOnMiss: boolean;
  slots: EmomRow[][];
};
export type Draft = ForTimeDraft | AmrapDraft | EmomDraft;

export const DRAFT_FORMATS: { id: DraftFormat; label: string }[] = [
  { id: 'forTime', label: 'FOR TIME' },
  { id: 'amrap', label: 'AMRAP' },
  { id: 'emom', label: 'EMOM' },
];

export function emptyLine(): LineFields {
  return { exercise: null, repDescription: null, load: '' };
}

export function emptyDraft(format: DraftFormat, name = ''): Draft {
  if (format === 'forTime') return { format, name, rounds: '1', sameReps: true, cap: '', rows: [] };
  if (format === 'amrap') return { format, name, minutes: '', rows: [] };
  return { format, name, every: '60', intervals: '', stopOnMiss: false, slots: [] };
}

/** The draft's lines in order, whatever the format. */
export function draftLines(draft: Draft): LineFields[] {
  return draft.format === 'emom' ? draft.slots.flat() : draft.rows;
}

// EMOM: applies `fn` to the line at flat index `index`, keeping the intervals.
function mapEmomLine(slots: EmomRow[][], index: number, fn: (row: EmomRow) => EmomRow): EmomRow[][] {
  let i = 0;
  return slots.map((slot) => slot.map((row) => (i++ === index ? fn(row) : row)));
}

/** Switches format keeping the name and each line's exercise, description and load; reps start empty. */
export function switchFormat(draft: Draft, format: DraftFormat): Draft {
  if (format === draft.format) return draft;
  const lines = draftLines(draft).map(({ exercise, repDescription, load }) => ({ exercise, repDescription, load }));
  const next = emptyDraft(format, draft.name);
  if (next.format === 'forTime') return { ...next, rows: lines.map((l) => ({ ...l, reps: [''] })) };
  if (next.format === 'amrap') return { ...next, rows: lines.map((l) => ({ ...l, reps: '' })) };
  return { ...next, slots: lines.map((l) => [{ ...l, reps: '', increment: '' }]) };
}

/** Appends an empty line (no exercise yet) in the format's shape. */
export function addLine(draft: Draft): Draft {
  if (draft.format === 'forTime') return { ...draft, rows: [...draft.rows, { ...emptyLine(), reps: [''] }] };
  if (draft.format === 'amrap') return { ...draft, rows: [...draft.rows, { ...emptyLine(), reps: '' }] };
  return { ...draft, slots: [...draft.slots, [{ ...emptyLine(), reps: '', increment: '' }]] };
}

/** EMOM: appends an empty line to interval `slotIdx` of the sequence. */
export function addLineToSlot(draft: EmomDraft, slotIdx: number): EmomDraft {
  return {
    ...draft,
    slots: draft.slots.map((slot, i) => (i === slotIdx ? [...slot, { ...emptyLine(), reps: '', increment: '' }] : slot)),
  };
}

export function removeLine(draft: Draft, index: number): Draft {
  if (draft.format === 'forTime') return { ...draft, rows: draft.rows.filter((_, i) => i !== index) };
  if (draft.format === 'amrap') return { ...draft, rows: draft.rows.filter((_, i) => i !== index) };
  // An interval left without lines leaves the sequence.
  let i = 0;
  const slots = draft.slots.map((slot) => slot.filter(() => i++ !== index)).filter((slot) => slot.length > 0);
  return { ...draft, slots };
}

/** Patches a line's exercise, rep description or load, whatever the format. */
export function updateLineFields(draft: Draft, index: number, patch: Partial<LineFields>): Draft {
  if (draft.format === 'forTime') {
    return { ...draft, rows: draft.rows.map((row, i) => (i === index ? { ...row, ...patch } : row)) };
  }
  if (draft.format === 'amrap') {
    return { ...draft, rows: draft.rows.map((row, i) => (i === index ? { ...row, ...patch } : row)) };
  }
  return { ...draft, slots: mapEmomLine(draft.slots, index, (row) => ({ ...row, ...patch })) };
}

/**
 * Sets or clears a line's rep description. Adding one fills the line's empty
 * reps with 1, the usual case for a distance, calories or time ("ROW 500 m").
 */
export function setRepDescription(draft: Draft, index: number, repDescription: LineFields['repDescription']): Draft {
  const had = draftLines(draft)[index]?.repDescription != null;
  const next = updateLineFields(draft, index, { repDescription });
  if (had || !repDescription) return next;
  const one = (reps: string) => (reps.trim() === '' ? '1' : reps);
  if (next.format === 'forTime') {
    return { ...next, rows: next.rows.map((row, i) => (i === index ? { ...row, reps: row.reps.map(one) } : row)) };
  }
  if (next.format === 'amrap') {
    return { ...next, rows: next.rows.map((row, i) => (i === index ? { ...row, reps: one(row.reps) } : row)) };
  }
  return { ...next, slots: mapEmomLine(next.slots, index, (row) => ({ ...row, reps: one(row.reps) })) };
}

/** Sets a line's reps: AMRAP/EMOM ignore `roundIdx`; For Time writes round 0 while "same reps" is on. */
export function setLineReps(draft: Draft, index: number, value: string, roundIdx = 0): Draft {
  if (draft.format === 'forTime') {
    const r = draft.sameReps ? 0 : roundIdx;
    return {
      ...draft,
      rows: draft.rows.map((row, i) => {
        if (i !== index) return row;
        const reps = [...row.reps];
        while (reps.length <= r) reps.push('');
        reps[r] = value;
        return { ...row, reps };
      }),
    };
  }
  if (draft.format === 'amrap') {
    return { ...draft, rows: draft.rows.map((row, i) => (i === index ? { ...row, reps: value } : row)) };
  }
  return { ...draft, slots: mapEmomLine(draft.slots, index, (row) => ({ ...row, reps: value })) };
}

/** EMOM: sets the increment of the line at flat index `index` (change emom-progressive-reps). */
export function setLineIncrement(draft: EmomDraft, index: number, value: string): EmomDraft {
  return { ...draft, slots: mapEmomLine(draft.slots, index, (row) => ({ ...row, increment: value })) };
}

/** A whole number of 1 or more, or null. */
export function parseCount(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const n = Number(trimmed);
  return n >= 1 ? n : null;
}

/** An EMOM line's increment: '' is 0, otherwise a whole number of 0 or more; null when invalid. */
export function parseIncrement(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === '') return 0;
  return /^\d+$/.test(trimmed) ? Number(trimmed) : null;
}

/** An EMOM interval length: whole seconds from 10 to 600, or null. */
export function parseInterval(value: string): number | null {
  const n = parseCount(value);
  return n != null && n >= 10 && n <= 600 ? n : null;
}

/** The reps a For Time row has in a given round (0-based). */
export function forTimeReps(draft: ForTimeDraft, row: ForTimeRow, roundIdx: number): string {
  return draft.sameReps ? (row.reps[0] ?? '') : (row.reps[roundIdx] ?? '');
}

/**
 * Turning "same reps" off splits each row into one value per round, prefilled
 * with the shared one; turning it on keeps the first round's value for all.
 */
export function setSameReps(draft: ForTimeDraft, on: boolean): ForTimeDraft {
  if (on === draft.sameReps) return draft;
  const rounds = parseCount(draft.rounds) ?? 1;
  return {
    ...draft,
    sameReps: on,
    rows: draft.rows.map((row) => ({
      ...row,
      reps: on ? [row.reps[0] ?? ''] : Array.from({ length: rounds }, () => row.reps[0] ?? ''),
    })),
  };
}

/** The name as saved: trimmed and upper-cased, like the built-ins. */
export function savedName(draft: Draft): string {
  return draft.name.trim().toUpperCase();
}

// ─── Validation ─────────────────────────────────────────────────────────────

/**
 * Problems keyed by field: 'name', 'rounds', 'cap', 'minutes', 'every', 'intervals', 'lines', and 'line:<i>'
 * for the i-th line. Empty when the draft can be saved.
 */
export type DraftProblems = Record<string, string>;

function lineProblem(line: LineFields, reps: string[]): string | null {
  if (!line.exercise) return 'Pick an exercise';
  if (reps.some((r) => parseCount(r) == null)) return 'Reps must be 1 or more';
  if (line.repDescription && parseCount(line.repDescription.amount) == null) return 'Amount must be 1 or more';
  return null;
}

export function validateDraft(draft: Draft): DraftProblems {
  const problems: DraftProblems = {};
  if (savedName(draft) === '') problems.name = 'Name is required';

  const lines = draftLines(draft);
  if (lines.length === 0) problems.lines = 'Add at least one exercise';

  if (draft.format === 'forTime') {
    const rounds = parseCount(draft.rounds);
    if (rounds == null) problems.rounds = 'Rounds must be 1 or more';
    if (draft.cap.trim() !== '' && parseCount(draft.cap) == null) problems.cap = 'Time cap must be 1 or more';
    draft.rows.forEach((row, i) => {
      const reps = draft.sameReps ? [row.reps[0] ?? ''] : Array.from({ length: rounds ?? 1 }, (_, r) => row.reps[r] ?? '');
      const problem = lineProblem(row, reps);
      if (problem) problems[`line:${i}`] = problem;
    });
  } else {
    if (draft.format === 'amrap' && parseCount(draft.minutes) == null) problems.minutes = 'Minutes must be 1 or more';
    if (draft.format === 'emom') {
      if (parseInterval(draft.every) == null) problems.every = 'Interval must be 10 to 600 seconds';
      if (parseCount(draft.intervals) == null) problems.intervals = 'Intervals must be 1 or more';
    }
    lines.forEach((line, i) => {
      const problem = lineProblem(line, [(line as RepsRow).reps])
        ?? (draft.format === 'emom' && parseIncrement((line as EmomRow).increment) == null ? 'Increment must be 0 or more' : null);
      if (problem) problems[`line:${i}`] = problem;
    });
  }
  return problems;
}

// ─── Draft → stored block ───────────────────────────────────────────────────

function toStoredLine(line: LineFields, target: number): StoredLine {
  if (!line.exercise) throw new Error('Line without an exercise: validate the draft first');
  const stored: StoredLine = { exerciseId: line.exercise.id, target };
  if (line.repDescription) {
    stored.repDescription = { amount: count(line.repDescription.amount), unit: line.repDescription.unit };
  }
  const load = line.load.trim();
  if (load !== '') stored.load = load;
  return stored;
}

function count(value: string): number {
  const n = parseCount(value);
  if (n == null) throw new Error(`Invalid count "${value}": validate the draft first`);
  return n;
}

/** The block to store, in the same layout as the built-ins (see `Block`). The draft must have validated. */
export function draftToStoredBlock(draft: Draft): StoredBlock {
  if (draft.format === 'forTime') {
    const rounds = count(draft.rounds);
    return {
      formatId: 'forTime',
      lines: Array.from({ length: rounds }, (_, r) =>
        draft.rows.map((row) => toStoredLine(row, count(forTimeReps(draft, row, r)))),
      ),
      rounds,
      ...(draft.cap.trim() !== '' ? { durationSeconds: count(draft.cap) * 60 } : {}),
    };
  }
  if (draft.format === 'amrap') {
    return {
      formatId: 'amrap',
      lines: [draft.rows.map((row) => toStoredLine(row, count(row.reps)))],
      durationSeconds: count(draft.minutes) * 60,
    };
  }
  const intervals = count(draft.intervals);
  const every = parseInterval(draft.every);
  if (every == null) throw new Error(`Invalid interval "${draft.every}": validate the draft first`);
  return {
    formatId: 'emom',
    lines: draft.slots.map((slot) => slot.map((row) => {
      const stored = toStoredLine(row, count(row.reps));
      const increment = parseIncrement(row.increment);
      if (increment) stored.increment = increment;
      return stored;
    })),
    rounds: intervals,
    durationSeconds: intervals * every,
    // Omitted at their defaults, so a plain 60-second EMOM is stored exactly like the built-in.
    ...(every !== 60 ? { intervalSeconds: every } : {}),
    ...(draft.stopOnMiss ? { stopOnMiss: true } : {}),
  };
}

// ─── Stored block → draft (DUPLICATE) ───────────────────────────────────────

function toLineFields(line: WodLine): LineFields {
  return {
    exercise: { id: line.exerciseId, name: line.exercise },
    repDescription: line.repDescription
      ? { amount: String(line.repDescription.amount), unit: line.repDescription.unit }
      : null,
    load: line.load ?? '',
  };
}

/**
 * The draft a workout's block opens as. Throws for a block the editor can't
 * express (a For Time whose rounds don't share their exercises) — none can exist,
 * since the built-ins and everything the editor saves share them.
 */
export function draftFromBlock(formatId: string, block: Block, name: string): Draft {
  if (formatId === 'forTime') {
    const [first = []] = block.lines;
    const sameShape = block.lines.every(
      (round) => round.length === first.length && round.every((l, i) => l.exerciseId === first[i].exerciseId),
    );
    if (!sameShape) throw new Error('For Time rounds must share their exercises');
    const rows: ForTimeRow[] = first.map((line, i) => ({
      ...toLineFields(line),
      reps: block.lines.map((round) => String(round[i].target)),
    }));
    const sameReps = rows.every((row) => row.reps.every((r) => r === row.reps[0]));
    return {
      format: 'forTime',
      name,
      rounds: String(block.rounds ?? block.lines.length),
      sameReps,
      cap: block.durationSeconds ? String(block.durationSeconds / 60) : '',
      rows: sameReps ? rows.map((row) => ({ ...row, reps: [row.reps[0]] })) : rows,
    };
  }
  if (formatId === 'amrap') {
    return {
      format: 'amrap',
      name,
      minutes: String((block.durationSeconds ?? 0) / 60),
      rows: (block.lines[0] ?? []).map((line) => ({ ...toLineFields(line), reps: String(line.target) })),
    };
  }
  if (formatId === 'emom') {
    return {
      format: 'emom',
      name,
      every: String(block.intervalSeconds ?? 60),
      intervals: String(block.rounds ?? (block.durationSeconds ?? 0) / (block.intervalSeconds ?? 60)),
      stopOnMiss: block.stopOnMiss ?? false,
      slots: block.lines.map((interval) => interval.map((line) => ({
        ...toLineFields(line),
        reps: String(line.target),
        increment: line.increment ? String(line.increment) : '',
      }))),
    };
  }
  throw new Error(`Unknown format ${formatId}`);
}
