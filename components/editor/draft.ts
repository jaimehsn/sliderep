// The workout editor's state, as plain data (change wod-editor, design decision 1).
// Pure TS — no React, no DB — so conversions and validation are covered by vitest.
// Number fields are kept as the strings typed into the form; `validateDraft`
// reports anything that isn't a whole number of 1 or more, and the stored block
// is only built from a draft that validated. A block is a clock plus its parts, or
// an EMOM, started from a template (change shared-clock).
import { isIntervalWindow, isSequence } from '@/constants/wod-engine';
import type { Window, WodConfig, WodLine } from '@/constants/wod-engine';
import type { StoredLine, StoredStructure, StoredWindowBlock } from '@/db/workouts';

export type RepUnit = 'm' | 'cal' | 's';

export type DraftExercise = { id: string; name: string };

/** What every line carries, whatever the part. */
export type LineFields = {
  exercise: DraftExercise | null;
  /** Rep description ("500 m"); null when the line has none. */
  repDescription: { amount: string; unit: RepUnit } | null;
  /** Free text, '' for none. */
  load: string;
};

/** Rounds row: reps per round, or `reps[0]` for every round while `sameReps` is on. */
export type ForTimeRow = LineFields & { reps: string[] };
export type RepsRow = LineFields & { reps: string };
/**
 * EMOM row: `increment` is the reps added each time its interval comes round, '' meaning 0
 * (change emom-progressive-reps). `max`: a MAX line (change max-lines), only an interval's
 * last line; its reps and increment are ignored.
 */
export type EmomRow = RepsRow & { increment: string; max?: boolean };

/**
 * A part of a FOR TIME or AMRAP block (change shared-clock). ROUNDS: a For Time's
 * content — `rounds` (1 is a buy-in, cash-out or chipper), "same reps", `rest`
 * between its rounds in seconds ('' for none, change rest-steps) and its rows.
 * AMRAP: lines with fixed reps, repeated until the block's time ends; only last.
 */
export type RoundsPart = { kind: 'rounds'; rounds: string; sameReps: boolean; rest: string; rows: ForTimeRow[] };
export type AmrapPart = { kind: 'amrap'; rows: RepsRow[] };
export type PartDraft = RoundsPart | AmrapPart;

/**
 * A block with one clock and its parts (change shared-clock). `minutes`: the block's
 * time in whole minutes — its cap ('' for none, change for-time-cap) when no part is
 * an AMRAP, its required duration when the last part is.
 */
export type ContinuousDraft = { format: 'continuous'; name: string; minutes: string; parts: PartDraft[] };
/**
 * `every`: interval length in seconds (10–600); `intervals`: how many (change emom-interval-length).
 * `slots`: the interval sequence, each a non-empty list of lines done in order (change
 * emom-multi-exercise-intervals). Line helpers take the flat index into `slots.flat()`.
 * `stopOnMiss`: end at the first missed interval (change emom-progressive-reps).
 * `work`: work time per interval in seconds, the rest of it is rest, '' for none (change rest-steps).
 */
export type EmomDraft = {
  format: 'emom';
  name: string;
  every: string;
  intervals: string;
  work: string;
  stopOnMiss: boolean;
  slots: EmomRow[][];
};
export type Draft = ContinuousDraft | EmomDraft;

/** What the line helpers edit: one part's lines, or an EMOM's sequence. */
export type LineSet = PartDraft | EmomDraft;

function isEmom(set: LineSet): set is EmomDraft {
  return 'slots' in set;
}

/** The templates a block starts from (change shared-clock): they only fill its time setting and parts. */
export type TemplateId = 'forTime' | 'amrap' | 'emom' | 'buyInCashOut' | 'buyInAmrap' | 'everyBuyInMax';
export const TEMPLATES: { id: TemplateId; label: string }[] = [
  { id: 'forTime', label: 'FOR TIME' },
  { id: 'amrap', label: 'AMRAP' },
  { id: 'emom', label: 'EMOM' },
  { id: 'buyInCashOut', label: 'FOR TIME + BUY-IN/CASH-OUT' },
  { id: 'buyInAmrap', label: 'BUY-IN + AMRAP' },
  { id: 'everyBuyInMax', label: 'EVERY + BUY-IN + MAX' },
];

export function emptyLine(): LineFields {
  return { exercise: null, repDescription: null, load: '' };
}

function roundsPart(rounds = '1'): RoundsPart {
  return { kind: 'rounds', rounds, sameReps: true, rest: '', rows: [] };
}

function amrapPart(): AmrapPart {
  return { kind: 'amrap', rows: [] };
}

function emomRow(max = false): EmomRow {
  return { ...emptyLine(), reps: '', increment: '', ...(max ? { max: true } : {}) };
}

export function emptyDraft(template: TemplateId, name = ''): Draft {
  if (template === 'emom') return { format: 'emom', name, every: '60', intervals: '', work: '', stopOnMiss: false, slots: [] };
  // The box's "AMRAP" (change max-lines): every 3:00 × 5, 2:00 of work, a buy-in then a MAX line.
  if (template === 'everyBuyInMax') {
    return { format: 'emom', name, every: '180', intervals: '5', work: '120', stopOnMiss: false, slots: [[emomRow(), emomRow(), emomRow(true)]] };
  }
  const parts: PartDraft[] =
    template === 'forTime' ? [roundsPart()] :
    template === 'amrap' ? [amrapPart()] :
    template === 'buyInCashOut' ? [roundsPart(), roundsPart(''), roundsPart()] :
    [roundsPart(), amrapPart()];
  return { format: 'continuous', name, minutes: '', parts };
}

/** The template a block still matches, or null once its parts were changed into another shape. */
export function templateOf(draft: Draft): TemplateId | null {
  if (draft.format === 'emom') return draft.slots.flat().some((row) => row.max) ? 'everyBuyInMax' : 'emom';
  const shape = draft.parts.map((p) => (p.kind === 'amrap' ? 'A' : parseCount(p.rounds) === 1 ? '1' : 'R')).join('');
  if (draft.parts.length === 1) return draft.parts[0].kind === 'amrap' ? 'amrap' : 'forTime';
  if (shape === '1R1') return 'buyInCashOut';
  if (shape === '1A') return 'buyInAmrap';
  return null;
}

// The part a template puts the block's existing lines in.
function mainPart(template: TemplateId): number {
  return template === 'buyInCashOut' || template === 'buyInAmrap' ? 1 : 0;
}

/** The lines of one part or of an EMOM's sequence, in order. */
export function setLines(set: LineSet): LineFields[] {
  return isEmom(set) ? set.slots.flat() : set.rows;
}

/** The block's lines in order, every part's. */
export function draftLines(draft: Draft): LineFields[] {
  return draft.format === 'emom' ? draft.slots.flat() : draft.parts.flatMap((p): LineFields[] => p.rows);
}

/**
 * Picks a template (change shared-clock): its time setting and parts replace the block's,
 * and every line keeps its exercise, description and load in the template's main part
 * (the rounds part, the AMRAP part, or one EMOM interval each); reps start empty.
 */
export function applyTemplate(draft: Draft, template: TemplateId): Draft {
  if (templateOf(draft) === template) return draft;
  const lines = draftLines(draft).map(({ exercise, repDescription, load }) => ({ exercise, repDescription, load }));
  const next = emptyDraft(template, draft.name);
  // EVERY + BUY-IN + MAX: the lines are its one interval's buy-in, before a new MAX line (change max-lines).
  if (template === 'everyBuyInMax' && next.format === 'emom' && lines.length > 0) {
    return { ...next, slots: [[...lines.map((l) => ({ ...l, reps: '', increment: '' })), emomRow(true)]] };
  }
  if (template === 'everyBuyInMax') return next;
  if (next.format === 'emom') return { ...next, slots: lines.map((l) => [{ ...l, reps: '', increment: '' }]) };
  const main = mainPart(template);
  return {
    ...next,
    parts: next.parts.map((part, i) => {
      if (i !== main) return part;
      return part.kind === 'rounds'
        ? { ...part, rows: lines.map((l) => ({ ...l, reps: [''] })) }
        : { ...part, rows: lines.map((l) => ({ ...l, reps: '' })) };
    }),
  };
}

// ─── Parts (change shared-clock) ────────────────────────────────────────────

/** Whether the block ends in an AMRAP part — then `minutes` is its required duration, not a cap. */
export function endsInAmrap(draft: ContinuousDraft): boolean {
  return draft.parts[draft.parts.length - 1]?.kind === 'amrap';
}

/** "+ PART": a 1-round part at the end, or just before a final AMRAP part. */
export function addPart(draft: ContinuousDraft): ContinuousDraft {
  const at = endsInAmrap(draft) ? draft.parts.length - 1 : draft.parts.length;
  return { ...draft, parts: [...draft.parts.slice(0, at), roundsPart(), ...draft.parts.slice(at)] };
}

/** Removes a part, never the only one. */
export function removePart(draft: ContinuousDraft, index: number): ContinuousDraft {
  if (draft.parts.length <= 1) return draft;
  return { ...draft, parts: draft.parts.filter((_, i) => i !== index) };
}

export function updatePart(draft: ContinuousDraft, index: number, part: PartDraft): ContinuousDraft {
  return { ...draft, parts: draft.parts.map((p, i) => (i === index ? part : p)) };
}

/** Turns a part into ROUNDS (1 round) or AMRAP, keeping its lines and their first round's reps. */
export function setPartKind(draft: ContinuousDraft, index: number, kind: PartDraft['kind']): ContinuousDraft {
  const part = draft.parts[index];
  if (!part || part.kind === kind) return draft;
  const next: PartDraft = part.kind === 'rounds'
    ? { kind: 'amrap', rows: part.rows.map((row) => ({ ...row, reps: row.reps[0] ?? '' })) }
    : { ...roundsPart(), rows: part.rows.map((row) => ({ ...row, reps: [row.reps] })) };
  return updatePart(draft, index, next);
}

// ─── Lines (of one part, or of an EMOM's sequence) ──────────────────────────

// EMOM: applies `fn` to the line at flat index `index`, keeping the intervals.
function mapEmomLine(slots: EmomRow[][], index: number, fn: (row: EmomRow) => EmomRow): EmomRow[][] {
  let i = 0;
  return slots.map((slot) => slot.map((row) => (i++ === index ? fn(row) : row)));
}

// Applies `fn` to line `index` of a set, whatever its rows' shape.
function mapLine<T extends LineSet>(set: T, index: number, fn: <R extends LineFields>(row: R) => R): T {
  if (isEmom(set)) return { ...set, slots: mapEmomLine(set.slots, index, fn) };
  const part = set as PartDraft;
  return (part.kind === 'rounds'
    ? { ...part, rows: part.rows.map((row, i) => (i === index ? fn(row) : row)) }
    : { ...part, rows: part.rows.map((row, i) => (i === index ? fn(row) : row)) }) as T;
}

/** Appends an empty line (no exercise yet): a new interval on an EMOM. */
export function addLine<T extends LineSet>(set: T): T {
  if (isEmom(set)) return { ...set, slots: [...set.slots, [{ ...emptyLine(), reps: '', increment: '' }]] };
  const part = set as PartDraft;
  return (part.kind === 'rounds'
    ? { ...part, rows: [...part.rows, { ...emptyLine(), reps: [''] }] }
    : { ...part, rows: [...part.rows, { ...emptyLine(), reps: '' }] }) as T;
}

/** EMOM: appends an empty line to interval `slotIdx` of the sequence, before its MAX line if it ends in one (change max-lines). */
export function addLineToSlot(draft: EmomDraft, slotIdx: number): EmomDraft {
  return {
    ...draft,
    slots: draft.slots.map((slot, i) => {
      if (i !== slotIdx) return slot;
      const at = slot[slot.length - 1]?.max ? slot.length - 1 : slot.length;
      return [...slot.slice(0, at), emomRow(), ...slot.slice(at)];
    }),
  };
}

/** Whether the EMOM line at flat index `index` is the last of its interval — the only line that may be MAX. */
export function isLastInSlot(draft: EmomDraft, index: number): boolean {
  let start = 0;
  for (const slot of draft.slots) {
    if (index < start + slot.length) return index === start + slot.length - 1;
    start += slot.length;
  }
  return false;
}

/** EMOM: marks or unmarks the line at flat index `index` as MAX, only an interval's last line (change max-lines). */
export function setLineMax(draft: EmomDraft, index: number, on: boolean): EmomDraft {
  if (on && !isLastInSlot(draft, index)) return draft;
  return {
    ...draft,
    slots: mapEmomLine(draft.slots, index, ({ max: _max, ...row }) => (on ? { ...row, reps: '', increment: '', max: true } : row)),
  };
}

export function removeLine<T extends LineSet>(set: T, index: number): T {
  if (isEmom(set)) {
    // An interval left without lines leaves the sequence.
    let i = 0;
    return { ...set, slots: set.slots.map((slot) => slot.filter(() => i++ !== index)).filter((slot) => slot.length > 0) };
  }
  const part = set as PartDraft;
  return (part.kind === 'rounds'
    ? { ...part, rows: part.rows.filter((_, i) => i !== index) }
    : { ...part, rows: part.rows.filter((_, i) => i !== index) }) as T;
}

/** Patches a line's exercise, rep description or load. */
export function updateLineFields<T extends LineSet>(set: T, index: number, patch: Partial<LineFields>): T {
  return mapLine(set, index, (row) => ({ ...row, ...patch }));
}

/**
 * Sets or clears a line's rep description. Adding one fills the line's empty
 * reps with 1, the usual case for a distance, calories or time ("ROW 500 m").
 */
export function setRepDescription<T extends LineSet>(set: T, index: number, repDescription: LineFields['repDescription']): T {
  const had = setLines(set)[index]?.repDescription != null;
  const next = updateLineFields(set, index, { repDescription });
  if (had || !repDescription) return next;
  const one = (reps: string) => (reps.trim() === '' ? '1' : reps);
  return mapLine(next, index, (row) => {
    const reps = (row as unknown as { reps: string | string[] }).reps;
    return { ...row, reps: Array.isArray(reps) ? reps.map(one) : one(reps) };
  });
}

/** Sets a line's reps: AMRAP/EMOM ignore `roundIdx`; a ROUNDS part writes round 0 while "same reps" is on. */
export function setLineReps<T extends LineSet>(set: T, index: number, value: string, roundIdx = 0): T {
  if (isEmom(set) || set.kind === 'amrap') return mapLine(set, index, (row) => ({ ...row, reps: value }));
  const r = set.sameReps ? 0 : roundIdx;
  return {
    ...set,
    rows: set.rows.map((row, i) => {
      if (i !== index) return row;
      const reps = [...row.reps];
      while (reps.length <= r) reps.push('');
      reps[r] = value;
      return { ...row, reps };
    }),
  };
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

/** The reps a ROUNDS part's row has in a given round (0-based). */
export function forTimeReps(part: RoundsPart, row: ForTimeRow, roundIdx: number): string {
  return part.sameReps ? (row.reps[0] ?? '') : (row.reps[roundIdx] ?? '');
}

/**
 * Turning "same reps" off splits each row into one value per round, prefilled
 * with the shared one; turning it on keeps the first round's value for all.
 */
export function setSameReps(part: RoundsPart, on: boolean): RoundsPart {
  if (on === part.sameReps) return part;
  const rounds = parseCount(part.rounds) ?? 1;
  return {
    ...part,
    sameReps: on,
    rows: part.rows.map((row) => ({
      ...row,
      reps: on ? [row.reps[0] ?? ''] : Array.from({ length: rounds }, () => row.reps[0] ?? ''),
    })),
  };
}

/** Longest workout name the editor accepts, after trimming (change responsive-review). */
export const MAX_NAME_LENGTH = 40;

/** Most reps a line can be written with: three digits (change responsive-review). An EMOM increment may go past it over time. */
export const MAX_REPS = 999;

/** DUPLICATE's name: the source's name + " COPY", the source's part shortened only as much as the limit needs. */
export function copyName(name: string): string {
  const suffix = ' COPY';
  const base = name.length + suffix.length > MAX_NAME_LENGTH ? name.slice(0, MAX_NAME_LENGTH - suffix.length).trimEnd() : name;
  return `${base}${suffix}`;
}

/** The name as saved: trimmed and upper-cased, like the built-ins. */
export function savedName(draft: Draft): string {
  return draft.name.trim().toUpperCase();
}

// ─── Validation ─────────────────────────────────────────────────────────────

/**
 * Problems keyed by field. EMOM: 'every', 'intervals', 'work', 'lines', and 'line:<i>'
 * for the i-th line. FOR TIME / AMRAP block: 'minutes', then each part's as
 * 'part:<p>:<key>' — 'rounds', 'rest', 'kind' (an AMRAP part that isn't last),
 * 'lines' and 'line:<i>' (see `partProblems`). Also 'name'. Empty when the draft can be saved.
 */
export type DraftProblems = Record<string, string>;

function lineProblem(line: LineFields, reps: string[]): string | null {
  if (!line.exercise) return 'Pick an exercise';
  if (reps.some((r) => parseCount(r) == null)) return 'Reps must be 1 or more';
  if (reps.some((r) => parseCount(r)! > MAX_REPS)) return `Reps must be ${MAX_REPS} or less`;
  if (line.repDescription && parseCount(line.repDescription.amount) == null) return 'Amount must be 1 or more';
  return null;
}

function validatePart(part: PartDraft, last: boolean): DraftProblems {
  const problems: DraftProblems = {};
  if (part.rows.length === 0) problems.lines = 'Add at least one exercise';
  if (part.kind === 'amrap') {
    if (!last) problems.kind = 'AMRAP can only be the last part';
    part.rows.forEach((row, i) => {
      const problem = lineProblem(row, [row.reps]);
      if (problem) problems[`line:${i}`] = problem;
    });
    return problems;
  }
  const rounds = parseCount(part.rounds);
  if (rounds == null) problems.rounds = 'Rounds must be 1 or more';
  if (part.rest.trim() !== '') {
    const rest = parseCount(part.rest);
    if (rest == null || rest > 600) problems.rest = 'Rest must be 1 to 600 seconds';
    else if (rounds != null && rounds < 2) problems.rest = 'Rest needs 2 rounds or more';
  }
  part.rows.forEach((row, i) => {
    const reps = part.sameReps ? [row.reps[0] ?? ''] : Array.from({ length: rounds ?? 1 }, (_, r) => row.reps[r] ?? '');
    const problem = lineProblem(row, reps);
    if (problem) problems[`line:${i}`] = problem;
  });
  return problems;
}

export function validateDraft(draft: Draft): DraftProblems {
  const problems: DraftProblems = {};
  if (savedName(draft) === '') problems.name = 'Name is required';

  if (draft.format === 'continuous') {
    if (endsInAmrap(draft)) {
      if (parseCount(draft.minutes) == null) problems.minutes = 'Minutes must be 1 or more';
    } else if (draft.minutes.trim() !== '' && parseCount(draft.minutes) == null) {
      problems.minutes = 'Time cap must be 1 or more';
    }
    draft.parts.forEach((part, p) => {
      for (const [key, problem] of Object.entries(validatePart(part, p === draft.parts.length - 1))) {
        problems[`part:${p}:${key}`] = problem;
      }
    });
    return problems;
  }

  if (draft.slots.length === 0) problems.lines = 'Add at least one exercise';
  const every = parseInterval(draft.every);
  if (every == null) problems.every = 'Interval must be 10 to 600 seconds';
  if (parseCount(draft.intervals) == null) problems.intervals = 'Intervals must be 1 or more';
  if (draft.work.trim() !== '') {
    const work = parseCount(draft.work);
    if (work == null || (every != null && work >= every)) problems.work = 'Work must be 1 or more and shorter than EVERY';
  }
  draft.slots.flat().forEach((line, i) => {
    // A MAX line has no reps or increment to check (change max-lines).
    const problem = line.max
      ? lineProblem(line, [])
      : lineProblem(line, [line.reps]) ?? (parseIncrement(line.increment) == null ? 'Increment must be 0 or more' : null);
    if (problem) problems[`line:${i}`] = problem;
  });
  return problems;
}

/** One part's problems with its `part:<p>:` prefix taken off, for its own editor. */
export function partProblems(problems: DraftProblems, index: number): DraftProblems {
  const prefix = `part:${index}:`;
  return Object.fromEntries(
    Object.entries(problems).filter(([k]) => k.startsWith(prefix)).map(([k, v]) => [k.slice(prefix.length), v]),
  );
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

function toStoredStructure(part: PartDraft): StoredStructure {
  if (part.kind === 'amrap') return { kind: 'cycle', lines: part.rows.map((row) => toStoredLine(row, count(row.reps))) };
  const rounds = count(part.rounds);
  return {
    kind: 'rounds',
    rounds: Array.from({ length: rounds }, (_, r) => part.rows.map((row) => toStoredLine(row, count(forTimeReps(part, row, r))))),
    ...(part.rest.trim() !== '' ? { restSeconds: count(part.rest) } : {}),
  };
}

/**
 * The block to store, in the window shape (change shared-clock; see `db/workouts.ts`'s
 * `StoredWindowBlock`), optional fields only when set. The draft must have validated.
 */
export function draftToStoredBlock(draft: Draft): StoredWindowBlock {
  if (draft.format === 'continuous') {
    return {
      clock: { kind: 'continuous', ...(draft.minutes.trim() !== '' ? { limitSeconds: count(draft.minutes) * 60 } : {}) },
      structures: draft.parts.map(toStoredStructure),
    };
  }
  const every = parseInterval(draft.every);
  if (every == null) throw new Error(`Invalid interval "${draft.every}": validate the draft first`);
  return {
    clock: {
      kind: 'intervals',
      everySeconds: every,
      count: count(draft.intervals),
      ...(draft.work.trim() !== '' ? { workSeconds: count(draft.work) } : {}),
      ...(draft.stopOnMiss ? { stopOnMiss: true } : {}),
    },
    intervals: draft.slots.map((slot) => slot.map((row) => {
      if (row.max) {
        // A MAX line: no target or increment (change max-lines).
        const { target: _target, ...line } = toStoredLine(row, 0);
        return { ...line, max: true as const };
      }
      const stored = toStoredLine(row, count(row.reps));
      const increment = parseIncrement(row.increment);
      if (increment) stored.increment = increment;
      return stored;
    })),
  };
}

// ─── Window → draft (DUPLICATE) ─────────────────────────────────────────

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
 * The draft a workout's window (a block, in the editor) opens as, every part kept.
 * Throws for a window the editor can't express (rounds that don't share their
 * exercises) — none can exist, since the built-ins and everything the editor saves share them.
 */
export function draftFromWindow(window: Window, name: string): Draft {
  if (isIntervalWindow(window)) {
    const { clock } = window;
    return {
      format: 'emom',
      name,
      every: String(clock.everySeconds),
      intervals: String(clock.count),
      work: clock.workSeconds ? String(clock.workSeconds) : '',
      stopOnMiss: clock.stopOnMiss ?? false,
      slots: window.intervals.map((entry) => entry.flatMap((s) => (s.kind === 'once' ? s.lines : [])).map((line) => ({
        ...toLineFields(line),
        ...(line.max
          ? { reps: '', increment: '', max: true }
          : { reps: String(line.target), increment: line.increment ? String(line.increment) : '' }),
      }))),
    };
  }
  const limit = window.clock.limitSeconds;
  return {
    format: 'continuous',
    name,
    minutes: limit ? String(limit / 60) : '',
    parts: window.structures.map((structure): PartDraft => {
      if (structure.kind === 'cycle') {
        return { kind: 'amrap', rows: structure.lines.map((line) => ({ ...toLineFields(line), reps: String(line.target) })) };
      }
      if (structure.kind !== 'rounds') throw new Error(`No editor part for a "${structure.kind}" structure`);
      const lines = structure.rounds;
      const [first = []] = lines;
      const sameShape = lines.every(
        (round) => round.length === first.length && round.every((l, i) => l.exerciseId === first[i].exerciseId),
      );
      if (!sameShape) throw new Error('Rounds must share their exercises');
      const rows: ForTimeRow[] = first.map((line, i) => ({
        ...toLineFields(line),
        reps: lines.map((round) => String(round[i].target)),
      }));
      const sameReps = rows.every((row) => row.reps.every((r) => r === row.reps[0]));
      return {
        kind: 'rounds',
        rounds: String(lines.length),
        sameReps,
        rest: structure.restSeconds ? String(structure.restSeconds) : '',
        rows: sameReps ? rows.map((row) => ({ ...row, reps: [row.reps[0]] })) : rows,
      };
    }),
  };
}

// ─── Workouts of several blocks (change multi-block-workouts) ───────────────
//
// A workout is a list of block drafts: each block is a `Draft` with its own
// `name` left empty (the workout's name is kept once, here), plus the rest after it.

export type BlockDraft = { draft: Draft; restAfter: string };
export type WorkoutDraft = { name: string; scoringBlock: number; blocks: BlockDraft[] };

export function emptyWorkoutDraft(name = ''): WorkoutDraft {
  return { name, scoringBlock: 0, blocks: [{ draft: emptyDraft('forTime'), restAfter: '' }] };
}

/** Adds a FOR TIME block at the end. */
export function addBlock(workout: WorkoutDraft): WorkoutDraft {
  return { ...workout, blocks: [...workout.blocks, { draft: emptyDraft('forTime'), restAfter: '' }] };
}

/** Removes a block (never the only one); the scoring block stays where it was, or moves to block 0 if it was removed. */
export function removeBlock(workout: WorkoutDraft, index: number): WorkoutDraft {
  if (workout.blocks.length <= 1) return workout;
  const blocks = workout.blocks.filter((_, i) => i !== index);
  // The new last block has no rest after it.
  blocks[blocks.length - 1] = { ...blocks[blocks.length - 1], restAfter: '' };
  const s = workout.scoringBlock;
  return { ...workout, blocks, scoringBlock: s === index ? 0 : s > index ? s - 1 : s };
}

export function updateBlock(workout: WorkoutDraft, index: number, patch: Partial<BlockDraft>): WorkoutDraft {
  return { ...workout, blocks: workout.blocks.map((b, i) => (i === index ? { ...b, ...patch } : b)) };
}

/** The workout's name as saved: trimmed and upper-cased. */
export function savedWorkoutName(workout: WorkoutDraft): string {
  return workout.name.trim().toUpperCase();
}

/**
 * 'name' once, then each block's problems keyed `block:<index>:<key>` (its own
 * 'name' problem ignored), and `block:<index>:restAfter` for a REST AFTER that
 * isn't 1–600 seconds.
 */
export function validateWorkoutDraft(workout: WorkoutDraft): DraftProblems {
  const problems: DraftProblems = {};
  const name = savedWorkoutName(workout);
  if (name === '') problems.name = 'Name is required';
  else if (name.length > MAX_NAME_LENGTH) problems.name = `Name must be ${MAX_NAME_LENGTH} characters or less`;
  workout.blocks.forEach(({ draft, restAfter }, i) => {
    for (const [key, problem] of Object.entries(validateDraft(draft))) {
      if (key !== 'name') problems[`block:${i}:${key}`] = problem;
    }
    if (i < workout.blocks.length - 1 && restAfter.trim() !== '') {
      const rest = parseCount(restAfter);
      if (rest == null || rest > 600) problems[`block:${i}:restAfter`] = 'Rest must be 1 to 600 seconds';
    }
  });
  return problems;
}

/** A block's problems with its `block:<index>:` prefix taken off, for its own editor. */
export function blockProblems(problems: DraftProblems, index: number): DraftProblems {
  const prefix = `block:${index}:`;
  return Object.fromEntries(
    Object.entries(problems).filter(([k]) => k.startsWith(prefix)).map(([k, v]) => [k.slice(prefix.length), v]),
  );
}

/** The stored blocks: each block's window shape, with `restAfterSeconds` only when set (never on the last). */
export function workoutToStoredBlocks(workout: WorkoutDraft): StoredWindowBlock[] {
  return workout.blocks.map(({ draft, restAfter }, i) => {
    const block = draftToStoredBlock(draft);
    const rest = i < workout.blocks.length - 1 ? parseCount(restAfter) : null;
    return rest != null ? { ...block, restAfterSeconds: rest } : block;
  });
}

/** The workout draft a workout opens as for DUPLICATE: every block, its rest and the scoring block. */
export function workoutDraftFromConfig(config: WodConfig, name: string): WorkoutDraft {
  if (!isSequence(config)) {
    return { name, scoringBlock: 0, blocks: [{ draft: draftFromWindow(config.window, ''), restAfter: '' }] };
  }
  return {
    name,
    scoringBlock: config.scoringBlock,
    blocks: config.parts.map((part, i) => ({
      draft: draftFromWindow(part.window, ''),
      restAfter: config.restAfter[i] > 0 ? String(config.restAfter[i]) : '',
    })),
  };
}
