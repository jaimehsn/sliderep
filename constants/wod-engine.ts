// The interpreter: turns a declarative workout window (how the clock runs + the
// structures done inside it) into a WodConfig (structure + presentation), and runs
// it as one incremental engine for both live judging and results (see the Engine
// section). Behavior — timer, advance, end, score — is derived from the window
// (change window-model; docs/ROADMAP.md → WOD format as data).
//
// Scope: the shapes the For Time / AMRAP / EMOM formats had, with a For Time cap
// (change for-time-cap), EMOM interval length (change emom-interval-length),
// several exercises per EMOM interval (change emom-multi-exercise-intervals),
// progressive EMOM reps and the stop (change emom-progressive-reps), rest between
// For Time rounds or within EMOM intervals (change rest-steps), and workouts of
// several windows (change multi-block-workouts, where the UI calls them blocks).

export type WodSession = {
  roundIdx: number;
  exIdx: number;
  completedRounds: number;
  /** perInterval: the interval index (a minute only with 60-second intervals; change emom-interval-length kept the name). */
  minuteIdx: number;
};

/** Header progress: `current` of `total` (e.g. round 2/3), or just `current` when there is no total (AMRAP). */
export type WodKpi = { label: string; current: number; total: number | null };

/** One row of a workout's exercise list. `note`: rep description and/or load ("500 m · 95/65 lb"), when the line has either. */
export type WodExercise = { name: string; detail: string; note?: string };

/** One part's rows in a window of several parts (change shared-clock). */
export type WodSection = { title: string; exercises: WodExercise[] };

/** The rules version every config carries and every saved session records (change window-model: one for the whole engine). */
export const ENGINE_VERSION = 1;

export type WodConfig = {
  /** Derived from the window's content (e.g. "12-MIN AMRAP"), never hand-written. */
  mode: string;
  name: string;
  /** One-line card description, derived from content (e.g. "21-15-9 · thrusters + pull-ups"). */
  description: string;
  timerMode: 'elapsed' | 'remaining' | 'minLeft';
  totalSeconds: number;
  /** onTarget: the position advances as soon as its target is reached. onClock: only the clock advances it. Plain data (read by session/adjust.tsx). */
  advanceMode: 'onTarget' | 'onClock';
  /** `ENGINE_VERSION` — stored on a saved session so replay always uses the pinned engine semantics. */
  engineVersion: number;
  exercises: WodExercise[];
  /**
   * A window of several parts only (change shared-clock): each part's exercise rows under
   * its title ("PART 2 · 5 ROUNDS"); `exercises` is then their concatenation.
   */
  sections?: WodSection[];
  /** The data the engine interprets (see the model section below). */
  window: Window;
  /**
   * A workout of several windows (change multi-block-workouts, "blocks" in the UI):
   * one config per window, the rest after each in seconds (0 for none) and the one
   * that scores. Absent on a one-window config; on a sequence, `window`/`timerMode`/
   * `advanceMode`/`totalSeconds`/`engineVersion` are the scoring part's.
   */
  parts?: WodConfig[];
  restAfter?: number[];
  scoringBlock?: number;
};

export type SequenceConfig = WodConfig & { parts: WodConfig[]; restAfter: number[]; scoringBlock: number };

/** Whether the config is a workout of several blocks — the one check (change multi-block-workouts). */
export function isSequence(config: WodConfig): config is SequenceConfig {
  return config.parts != null && config.parts.length > 1;
}

// ─── WOD content ────────────────────────────────────────────────────────────

export type WodLine = {
  /** The catalog id the line was stored with — what a duplicate writes back. */
  exerciseId: string;
  exercise: string;
  /** Always reps (see docs/ROADMAP.md → WOD hierarchy). Purely descriptive, never computed on. */
  target: number;
  repDescription?: { amount: number; unit: 'm' | 'cal' | 's' };
  /** Prescribed load as free text ("95/65 lb"). Descriptive only, never computed on. */
  load?: string;
  /** Intervals: reps added to `target` each time this line's sequence entry comes round (change emom-progressive-reps). */
  increment?: number;
  /**
   * A MAX line (change max-lines): only last in an interval entry, no increment, `target` 0.
   * Every valid rep of its interval's work time counts toward it, with no limit.
   */
  max?: true;
};

/** A MAX line's segment (change max-distance): its rep description, each valid rep being one segment completed. */
export type Segment = { amount: number; unit: 'm' | 'cal' | 's' };

/** The segment of a MAX line with a rep description; null on any other line. */
export function maxSegment(line: WodLine | undefined): Segment | null {
  return line?.max && line.repDescription ? line.repDescription : null;
}

// ─── Window model (change window-model) ─────────────────────────────────────
//
// A window is how the clock runs plus what is done inside it. A continuous window
// holds one or more parts under its one clock (change shared-clock): `rounds` parts
// (1 round is a buy-in, cash-out or chipper), and optionally a final `cycle` — which
// needs a limit, counted from the window's start. Each interval entry holds exactly
// one `once`. `buildWodConfig` rejects anything else.

/** A clock that runs once: `limitSeconds` is a For Time's cap or an AMRAP's duration. */
export type ContinuousClock = { kind: 'continuous'; limitSeconds?: number };

/** Every `everySeconds` (10–600), `count` times; optional work time per interval and stop at the first miss. */
export type IntervalClock = {
  kind: 'intervals';
  everySeconds: number;
  count: number;
  /** Work time per interval in seconds; the rest of each interval is rest (change rest-steps). */
  workSeconds?: number;
  /** The window ends at its first missed interval (change emom-progressive-reps). */
  stopOnMiss?: boolean;
};

export type Structure =
  /** One entry per round, each its lines (Chipper: one round, each line a station); optional rest between rounds (change rest-steps). */
  | { kind: 'rounds'; rounds: WodLine[][]; restSeconds?: number }
  /** The same lines round after round until the clock ends it (AMRAP). */
  | { kind: 'cycle'; lines: WodLine[] }
  /** Lines done once, in order; the last takes any extra reps (an EMOM interval). */
  | { kind: 'once'; lines: WodLine[] };

export type ContinuousWindow = { clock: ContinuousClock; structures: Structure[] };
/** `intervals`: the rotating sequence, interval m doing entry m % length. */
export type IntervalWindow = { clock: IntervalClock; intervals: Structure[][] };
export type Window = ContinuousWindow | IntervalWindow;

export function isIntervalWindow(window: Window): window is IntervalWindow {
  return window.clock.kind === 'intervals';
}

/**
 * How a window behaves, derived from its clock and content: 'perInterval' for an
 * interval window, 'cycle' for a continuous one ending in a cycle (an AMRAP, with any
 * parts before it), 'rounds' otherwise. The engine's rules are written per shape
 * (they are the v1 rules per format).
 */
export type Shape = 'rounds' | 'cycle' | 'perInterval';

function windowShape(window: Window): Shape {
  if (isIntervalWindow(window)) return 'perInterval';
  return window.structures[window.structures.length - 1].kind === 'cycle' ? 'cycle' : 'rounds';
}

export function shapeOf(config: WodConfig): Shape {
  return windowShape(config.window);
}

// A continuous window is read as a path (change shared-clock): the rounds of its
// `rounds` parts one after another (the prefix), then its cycle if it has one. A
// position's `roundIdx` runs along it — through the prefix, then on into the cycle
// (prefix length + k for the cycle's k-th round), while `completedRounds` counts
// cycle rounds only. A one-part window's path is its rounds, or just its cycle, so
// its positions are the ones it always had.

/** The prefix: every round of the window's `rounds` parts, in order (a 'rounds' window's rounds). */
function roundsOf(window: Window): WodLine[][] {
  if (isIntervalWindow(window)) return [];
  return window.structures.flatMap((s) => (s.kind === 'rounds' ? s.rounds : []));
}

/** The lines of a window's final cycle, empty when it has none. */
function cycleOf(window: Window): WodLine[] {
  if (isIntervalWindow(window)) return [];
  const last = window.structures[window.structures.length - 1];
  return last?.kind === 'cycle' ? last.lines : [];
}

/** How many parts the window has: its structures, 1 for an interval window. */
function partCountOf(window: Window): number {
  return isIntervalWindow(window) ? 1 : window.structures.length;
}

/**
 * The part a path round is in (change shared-clock): its index, the round within it,
 * and the part's round count (null for the cycle). Past the end of a window without a
 * cycle — only ever asked for by a completion check — the last part, counting on.
 */
function partAtRound(window: ContinuousWindow, roundIdx: number): { partIdx: number; round: number; rounds: number | null } {
  let before = 0;
  for (let i = 0; i < window.structures.length; i++) {
    const s = window.structures[i];
    if (s.kind === 'cycle') return { partIdx: i, round: roundIdx - before, rounds: null };
    if (s.kind !== 'rounds') continue;
    if (roundIdx < before + s.rounds.length || i === window.structures.length - 1) {
      return { partIdx: i, round: roundIdx - before, rounds: s.rounds.length };
    }
    before += s.rounds.length;
  }
  return { partIdx: 0, round: roundIdx, rounds: null };
}

/** The prefix's length: the path rounds before a cycle (all of a 'rounds' window's). */
export function prefixLength(config: WodConfig): number {
  return roundsOf(config.window).length;
}

/** The number of parts of a one-window config (1 for an EMOM and for every pre-shared-clock shape). */
export function partCount(config: WodConfig): number {
  return partCountOf(config.window);
}

/** The part index of path round `roundIdx` (0 on an interval window). */
export function partIndexAt(config: WodConfig, roundIdx: number): number {
  return isIntervalWindow(config.window) ? 0 : partAtRound(config.window, roundIdx).partIdx;
}

/** An interval window's sequence: each entry's lines, done in order. */
function sequenceOf(window: Window): WodLine[][] {
  if (!isIntervalWindow(window)) return [];
  return window.intervals.map((entry) => (entry[0]?.kind === 'once' ? entry[0].lines : []));
}

/** Every line list of the window: its rounds, its cycle, or its interval sequence. */
function lineLists(window: Window): WodLine[][] {
  const shape = windowShape(window);
  return shape === 'rounds' ? roundsOf(window) : shape === 'cycle' ? [cycleOf(window)] : sequenceOf(window);
}

/** The window's length in seconds: the continuous limit (cap or duration), or count × interval; 0 for none. */
function windowSeconds(window: Window): number {
  if (isIntervalWindow(window)) return window.clock.count * window.clock.everySeconds;
  return window.clock.limitSeconds ?? 0;
}

/** A one-part 'rounds' window's rest between rounds — what its description and duration line show. */
function restBetweenRounds(window: Window): number | undefined {
  if (isIntervalWindow(window) || window.structures.length !== 1) return undefined;
  const s = window.structures[0];
  return s.kind === 'rounds' ? s.restSeconds : undefined;
}

/**
 * The rest before path round `roundIdx` starts (change rest-steps): its part's rest
 * between rounds, when it isn't the part's first round — none between parts (change shared-clock).
 */
function restBefore(window: Window, roundIdx: number): number | undefined {
  if (isIntervalWindow(window) || roundIdx >= roundsOf(window).length) return undefined;
  const { partIdx, round } = partAtRound(window, roundIdx);
  const s = window.structures[partIdx];
  return s.kind === 'rounds' && round > 0 ? s.restSeconds : undefined;
}

function workOf(window: Window): number | undefined {
  return isIntervalWindow(window) ? window.clock.workSeconds : undefined;
}

/** Whether the window stops at its first missed interval (change emom-progressive-reps). */
export function stopsOnMiss(config: WodConfig): boolean {
  return isIntervalWindow(config.window) && config.window.clock.stopOnMiss === true;
}

// The shapes allowed so far (see the section comment); a throw is a bug.
function checkWindow(window: Window): void {
  if (isIntervalWindow(window)) {
    if (window.intervals.length === 0 || window.intervals.some((e) => e.length !== 1 || e[0].kind !== 'once')) {
      throw new Error('An interval window needs entries of exactly one "once" structure');
    }
    // A MAX line only last in its interval, with no increment (change max-lines).
    for (const [entry] of window.intervals) {
      const lines = entry.kind === 'once' ? entry.lines : [];
      if (lines.some((l, i) => l.max && i !== lines.length - 1)) throw new Error('A MAX line can only be last in its interval');
      if (lines.some((l) => l.max && l.increment)) throw new Error('A MAX line has no increment');
    }
    return;
  }
  const { structures } = window;
  if (structures.length === 0) throw new Error('A continuous window needs at least one structure');
  structures.forEach((s, i) => {
    if (s.kind === 'once') throw new Error('A continuous window holds "rounds" and "cycle" structures only');
    if (s.kind === 'rounds' && (s.rounds.length === 0 || s.rounds.some((r) => r.length === 0))) throw new Error('A "rounds" structure needs non-empty rounds');
    if (s.kind === 'cycle' && s.lines.length === 0) throw new Error('A "cycle" needs lines');
    if (s.kind === 'cycle' && i !== structures.length - 1) throw new Error('A "cycle" can only be the last structure');
  });
  if (cycleOf(window).length > 0 && !window.clock.limitSeconds) throw new Error('A "cycle" needs a time limit');
  if (lineLists(window).flat().some((l) => l.max)) throw new Error('A continuous window holds no MAX line');
}

// ─── Interpreter ────────────────────────────────────────────────────────────

// A single rep with a rep description ("1 rep of 500 m") reads as the description alone.
function describedOnly(line: WodLine): boolean {
  return line.repDescription != null && line.target === 1;
}

// How much a line asks for: "21 reps", or "500 m" for a described single rep.
function amountOf(line: WodLine): string {
  return describedOnly(line) ? `${line.repDescription!.amount} ${line.repDescription!.unit}` : `${line.target} reps`;
}

// The rep description (unless it already is the amount) and the load, joined with " · ".
function lineNote(line: WodLine | undefined): string | undefined {
  if (!line) return undefined;
  const parts: string[] = [];
  if (line.repDescription && !describedOnly(line)) parts.push(`${line.repDescription.amount} ${line.repDescription.unit}`);
  if (line.load) parts.push(line.load);
  return parts.length > 0 ? parts.join(' · ') : undefined;
}

// A window's interval length in seconds (60 unless an interval window sets one).
function windowInterval(window: Window): number {
  return isIntervalWindow(window) ? window.clock.everySeconds : 60;
}

// A length as m:ss ("1:30"), unlike formatTime's clock-like "01:30".
function formatLength(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

// More than one round, all identical: "5 rounds of the same", shown once instead of per round.
function sameEveryRound(rounds: WodLine[][]): boolean {
  const [first = []] = rounds;
  return rounds.length > 1 && rounds.every((round) => round.every((l, i) => l.target === first[i]?.target));
}

// A window of several parts, one part at a time (change shared-clock): each part on
// its own, as a one-part window under the same clock.
function partWindows(window: ContinuousWindow): ContinuousWindow[] {
  return window.structures.map((s) => ({ clock: window.clock, structures: [s] }));
}

function severalParts(window: Window): window is ContinuousWindow {
  return !isIntervalWindow(window) && window.structures.length > 1;
}

function sectionsOf(window: ContinuousWindow): WodSection[] {
  return partWindows(window).map((part, i) => {
    const s = part.structures[0];
    const kind =
      s.kind === 'cycle' ? ' · AMRAP' :
      s.kind === 'rounds' && s.rounds.length > 1 ? ` · ${s.rounds.length} ROUNDS${s.restSeconds ? ` · ${s.restSeconds} s REST` : ''}` : '';
    return { title: `PART ${i + 1}${kind}`, exercises: summarize(part) };
  });
}

// How a part reads in a description of several parts: a 1-round part as its lines
// ("15 ring muscle-ups", "500 m row"), several rounds as a For Time's scheme, a cycle as "amrap · names".
function describePart(part: ContinuousWindow): string {
  const s = part.structures[0];
  if (s.kind === 'cycle') return `amrap · ${joinNames(part)}`;
  if (s.kind === 'rounds' && s.rounds.length === 1) {
    return s.rounds[0].map((l) => `${describedOnly(l) ? amountOf(l) : l.target} ${l.exercise.toLowerCase()}`).join(', ');
  }
  return describeScheme(part) + (s.kind === 'rounds' && s.restSeconds ? ` · ${s.restSeconds} s rest` : '');
}

function summarize(window: Window): WodExercise[] {
  if (severalParts(window)) return sectionsOf(window).flatMap((section) => section.exercises);
  const shape = windowShape(window);
  const rounds = roundsOf(window);
  if (shape === 'rounds' && (rounds.length === 1 || sameEveryRound(rounds))) {
    // Chipper (each line is its own station), or rounds that all repeat the first.
    return rounds[0].map((l) => ({ name: l.exercise, detail: amountOf(l), note: lineNote(l) }));
  }
  if (shape === 'rounds') {
    // For Time: a fixed exercise order repeated every round, reps vary per round.
    const firstRound = rounds[0];
    return firstRound.map((_, exIdx) => ({
      name: firstRound[exIdx].exercise,
      detail: rounds.map((round) => round[exIdx]?.target ?? 0).join(' · '),
      note: lineNote(firstRound[exIdx]),
    }));
  }
  if (shape === 'cycle') {
    // AMRAP: a single template, reps fixed every round.
    return cycleOf(window).map((l) => ({ name: l.exercise, detail: amountOf(l), note: lineNote(l) }));
  }
  // perInterval: one row per interval of the sequence, its exercises joined by " + ".
  const per = windowInterval(window) === 60 ? 'min' : 'interval';
  return sequenceOf(window).map((interval) => {
    const notes = interval.map(lineNote).filter((n): n is string => n != null);
    return {
      name: interval.map((l) => l.exercise).join(' + '),
      detail: `${interval.map((l) => `${l.max ? 'MAX' : describedOnly(l) ? amountOf(l) : l.target}${l.increment ? ` (+${l.increment})` : ''}`).join(' + ')} / ${per}`,
      note: notes.length > 0 ? notes.join(' · ') : undefined,
    };
  });
}

// Distinct exercise names in first-seen order, lowercased: "a + b" for two, "a, b, c" for more.
function joinNames(window: Window): string {
  const names = [...new Set(lineLists(window).flat().map((l) => l.exercise.toLowerCase()))];
  return names.join(names.length === 2 ? ' + ' : ', ');
}

function describeMode(window: Window): string {
  const shape = windowShape(window);
  if (shape === 'rounds' && severalParts(window)) return 'FOR TIME';
  if (shape === 'rounds') {
    const rounds = roundsOf(window);
    return sameEveryRound(rounds) ? `${rounds.length} ROUNDS FOR TIME` : 'FOR TIME';
  }
  if (shape === 'cycle') return `${windowSeconds(window) / 60}-MIN AMRAP`;
  const interval = windowInterval(window);
  const prefix = interval === 60 ? 'EMOM' : interval % 60 === 0 ? `E${interval / 60}MOM` : `EVERY ${formatLength(interval)}`;
  return `${prefix} · ${isIntervalWindow(window) ? window.clock.count : 0}`;
}

function describeContent(window: Window): string {
  const shape = windowShape(window);
  // A For Time's limit is its time cap (change for-time-cap).
  const cap = shape === 'rounds' && windowSeconds(window) ? ` · ${windowSeconds(window) / 60} min cap` : '';
  // Several parts: each part's own reading, joined (change shared-clock).
  if (severalParts(window)) return partWindows(window).map(describePart).join(' → ') + cap;
  // A stopping EMOM (change emom-progressive-reps).
  const untilFailure = isIntervalWindow(window) && window.clock.stopOnMiss ? ' · until failure' : '';
  // Rest between rounds, or work time per interval (change rest-steps).
  const restSeconds = restBetweenRounds(window);
  const rest = restSeconds ? ` · ${restSeconds} s rest` : '';
  const workSeconds = workOf(window);
  const work = workSeconds ? ` · ${workSeconds} s work` : '';
  return describeScheme(window) + rest + work + cap + untilFailure;
}

function describeScheme(window: Window): string {
  const shape = windowShape(window);
  const rounds = roundsOf(window);
  if (shape === 'rounds' && rounds.length === 1) {
    const lines = rounds[0] ?? [];
    const targets = new Set(lines.map((l) => l.target));
    return targets.size === 1
      ? `${lines.length} stations · ${lines[0].target} reps each`
      : `${lines.length} stations`;
  }
  if (shape === 'rounds' && sameEveryRound(rounds)) return `${rounds.length} rounds · ${joinNames(window)}`;
  if (shape === 'rounds') {
    const uniform = rounds.every((round) => round.every((l) => l.target === round[0]?.target));
    const scheme = uniform ? rounds.map((round) => round[0]?.target ?? 0).join('-') : `${rounds.length} rounds`;
    return `${scheme} · ${joinNames(window)}`;
  }
  if (isIntervalWindow(window) && windowInterval(window) !== 60) {
    return `${window.clock.count} × ${formatLength(windowInterval(window))} · ${joinNames(window)}`;
  }
  return `${windowSeconds(window) / 60} min · ${joinNames(window)}`;
}

/** A one-window config. Timer, advance and totals come from the window's shape. */
export function buildWodConfig(name: string, window: Window): WodConfig {
  checkWindow(window);
  const shape = windowShape(window);
  return {
    mode: describeMode(window),
    name,
    description: describeContent(window),
    timerMode: shape === 'rounds' ? 'elapsed' : shape === 'cycle' ? 'remaining' : 'minLeft',
    totalSeconds: windowSeconds(window),
    advanceMode: shape === 'perInterval' ? 'onClock' : 'onTarget',
    engineVersion: ENGINE_VERSION,
    exercises: summarize(window),
    ...(severalParts(window) ? { sections: sectionsOf(window) } : {}),
    window,
  };
}

/**
 * A workout of several blocks (change multi-block-workouts): the scoring part's
 * mode with " · N BLOCKS", the parts' descriptions joined with " → ".
 */
export function buildSequenceConfig(name: string, parts: WodConfig[], restAfter: number[], scoringBlock: number): SequenceConfig {
  const scoring = parts[scoringBlock];
  return {
    ...scoring,
    // Each block keeps its own sections; the sequence shows them per block.
    sections: undefined,
    name,
    mode: `${scoring.mode} · ${parts.length} BLOCKS`,
    description: parts.map((p) => p.description).join(' → '),
    exercises: parts.flatMap((p) => p.exercises),
    parts,
    restAfter: parts.map((_, i) => (i < parts.length - 1 ? restAfter[i] ?? 0 : 0)),
    scoringBlock,
  };
}

// ─── Positions ──────────────────────────────────────────────────────────────
//
// A position is a WodSession (round/line for onTarget, interval for perInterval).
// Pure functions of the window — the engine and the result labels read them.

/** An interval window's interval length in seconds (change emom-interval-length); 60 for a continuous one. */
export function intervalSeconds(config: WodConfig): number {
  return windowInterval(config.window);
}

/** What an EMOM's intervals are called: 'minute' with 60-second intervals, 'interval' otherwise. */
export function intervalUnit(config: WodConfig): 'minute' | 'interval' {
  return intervalSeconds(config) === 60 ? 'minute' : 'interval';
}

export const START_POSITION: WodSession = { roundIdx: 0, exIdx: 0, completedRounds: 0, minuteIdx: 0 };

function lineAt(config: WodConfig, pos: WodSession): WodLine | undefined {
  const shape = shapeOf(config);
  if (shape !== 'perInterval') {
    const prefix = roundsOf(config.window);
    return pos.roundIdx < prefix.length || shape === 'rounds' ? prefix[pos.roundIdx]?.[pos.exIdx] : cycleOf(config.window)[pos.exIdx];
  }
  const sequence = sequenceOf(config.window);
  return sequence[pos.minuteIdx % sequence.length]?.[pos.exIdx];
}

/** perInterval: the lines of interval `intervalIdx`, done in order. */
export function intervalLines(config: WodConfig, intervalIdx: number): WodLine[] {
  const sequence = sequenceOf(config.window);
  return sequence[intervalIdx % sequence.length] ?? [];
}

/**
 * EMOM: the line of interval `intervalIdx` that its `k`-th valid rep (0-based)
 * counts toward. Lines fill in order up to their targets and the last one takes
 * any extra reps — the rule `apply` follows live (change
 * emom-multi-exercise-intervals) — the pure statement of that rule, tested against `apply`.
 */
export function intervalLineAt(config: WodConfig, intervalIdx: number, k: number): number {
  const lines = intervalLines(config, intervalIdx);
  let before = 0;
  for (let i = 0; i < lines.length - 1; i++) {
    before += targetAt(config, { ...START_POSITION, minuteIdx: intervalIdx, exIdx: i });
    if (k < before) return i;
  }
  return Math.max(0, lines.length - 1);
}

export function targetAt(config: WodConfig, pos: WodSession): number {
  const line = lineAt(config, pos);
  if (!line) return 0;
  // A MAX line has no target (change max-lines).
  if (line.max) return 0;
  if (shapeOf(config) !== 'perInterval' || !line.increment) return line.target;
  // Progressive EMOM (change emom-progressive-reps): + increment per repetition of the sequence.
  return line.target + line.increment * Math.floor(pos.minuteIdx / sequenceOf(config.window).length);
}

export function exerciseNameAt(config: WodConfig, pos: WodSession): string {
  return lineAt(config, pos)?.exercise ?? 'DONE';
}

export function kpiAt(config: WodConfig, pos: WodSession): WodKpi {
  const { window } = config;
  if (!isIntervalWindow(window)) {
    // The current part's progress (change shared-clock); a one-part window's as always.
    const { partIdx, round, rounds } = partAtRound(window, pos.roundIdx);
    if (rounds == null) return { label: 'rounds', current: pos.completedRounds, total: null };
    if (rounds === 1) {
      const part = window.structures[partIdx];
      const total = part.kind === 'rounds' ? part.rounds[0]?.length ?? 0 : 0;
      return { label: 'station', current: Math.min(pos.exIdx + 1, total), total };
    }
    return { label: 'round', current: Math.min(round + 1, rounds), total: rounds };
  }
  const total = isIntervalWindow(window) ? window.clock.count : 0;
  return { label: intervalUnit(config), current: Math.min(pos.minuteIdx + 1, total), total };
}

// onTarget only: the next line along the path, wrapping into the next round — the
// prefix's next round (entering the cycle after its last, change shared-clock), or the
// cycle's again, which tallies a completed round.
function nextPosition(config: WodConfig, pos: WodSession): WodSession {
  const prefix = roundsOf(config.window);
  const inCycle = shapeOf(config) === 'cycle' && pos.roundIdx >= prefix.length;
  const roundLines = (inCycle ? cycleOf(config.window) : prefix[pos.roundIdx])?.length ?? 0;
  const nextEx = pos.exIdx + 1;
  if (nextEx < roundLines) return { ...pos, exIdx: nextEx };
  return inCycle
    ? { ...pos, exIdx: 0, roundIdx: pos.roundIdx + 1, completedRounds: pos.completedRounds + 1 }
    : { ...pos, roundIdx: pos.roundIdx + 1, exIdx: 0 };
}

// AMRAP never completes on reps; it ends on the clock. A 'rounds' window completes past its prefix.
function isCompleteAt(config: WodConfig, pos: WodSession): boolean {
  return shapeOf(config) === 'rounds' && pos.roundIdx >= roundsOf(config.window).length;
}

/**
 * EMOM: whether the state's current interval is short of its targets. Earlier lines
 * of an interval were left only on reaching their target, so it is missed unless
 * it's on its last line with that line's target reached (change emom-progressive-reps).
 */
function intervalMissed(config: WodConfig, state: EngineState): boolean {
  const { pos } = state;
  return pos.exIdx < intervalLines(config, pos.minuteIdx).length - 1 || state.raw < targetAt(config, pos);
}

/**
 * A For Time / Chipper time cap in seconds, or null (change for-time-cap): a
 * 'rounds' window's limit. Code that means "cap" asks this rather than reading
 * `totalSeconds` on a 'rounds' config.
 */
export function capSeconds(config: WodConfig): number | null {
  return shapeOf(config) === 'rounds' && config.totalSeconds > 0 ? config.totalSeconds : null;
}

/**
 * The workout detail's and pre-start summary's duration line, or null when there is
 * nothing to say: "12 min", "10 min cap" (change for-time-cap), "30 min max · until
 * failure" (change emom-progressive-reps), plus the rest (change rest-steps):
 * "60 s rest between rounds" or "20 s work / 10 s rest".
 */
export function durationLine(config: WodConfig): string | null {
  // Each block of a sequence has its own line (change multi-block-workouts).
  if (isSequence(config)) return null;
  const parts: string[] = [];
  const m = Math.floor(config.totalSeconds / 60);
  if (config.totalSeconds > 0) {
    parts.push(capSeconds(config) != null ? `${m} min cap` : stopsOnMiss(config) ? `${m} min max · until failure` : `${m} min`);
  }
  const rest = restBetweenRounds(config.window);
  if (rest) parts.push(`${rest} s rest between rounds`);
  const work = workOf(config.window);
  if (work) parts.push(`${work} s work / ${intervalSeconds(config) - work} s rest`);
  return parts.length > 0 ? parts.join(' · ') : null;
}

/**
 * Whether every position was completed — false for a For Time that ended at its
 * cap, and always for AMRAP/EMOM. A completed For Time stays on its last position
 * with the final count (see `apply`), so that is what's checked.
 */
export function isComplete(config: WodConfig, state: EngineState): boolean {
  if (isSequence(config)) {
    const seq = state.seq!;
    const last = config.parts.length - 1;
    return state.finished && seq.idx === last && isComplete(config.parts[last], seq.inner);
  }
  return (
    shapeOf(config) === 'rounds' &&
    isCompleteAt(config, nextPosition(config, state.pos)) &&
    state.done >= targetAt(config, state.pos)
  );
}

// ─── Engine (incremental fold) ──────────────────────────────────────────────
//
// One engine for live judging and for results: live judging calls `apply` on
// each gesture and `advanceTo` on each clock tick; a result is `fold` over the
// stored events with the very same functions. Rules are the ones engineVersion 1
// pins (tests/__goldens__), per window shape (`shapeOf`, the v1 rules per format):
//   rounds      — finishes on the last rep, or at its cap when it has one (change
//                 for-time-cap: an event at the cap or later is ignored); later events ignored
//   cycle       — finishes at its duration, but still counts events after it (v1)
//   perInterval — the clock sets the interval; within it, lines advance on target
//                 (intervalLineAt); reps beyond the last line's target count (raw)
//                 but the live count is capped; events at/after the last interval ignored

/** `id`: the event's index in the stored log, carried into its tag (change no-rep-review). */
export type EngineEvent = { t: number; ok: boolean; id?: number };

export type TaggedEvent = {
  t: number;
  ok: boolean;
  /** The position the event was applied at, fixed by the original WOD (adjustments never re-flow it). */
  pos: WodSession;
  /** That position's target when the event was applied. */
  target: number;
  /** Whether it counted as a valid rep (no-reps and ignored events don't). */
  counted: boolean;
  /**
   * Whether it was applied while its block was running — it would have counted had
   * it been a rep (change no-rep-review: the no-reps the judge can review). For a rep, `counted === inPlay`.
   */
  inPlay: boolean;
  /** The event's `id` (its index in the stored log), when it had one. */
  id?: number;
  /** Workouts of several blocks: the block it was applied in; absent between blocks and on one-block workouts. */
  block?: number;
};

export type EngineState = {
  pos: WodSession;
  /** Live count on the current position (capped at the target for perInterval). */
  done: number;
  /** Uncapped valid reps on the current perInterval line (its interval's line in progress). */
  raw: number;
  finished: boolean;
  /** Session-clock ms reached so far (frozen at the finishing instant). */
  t: number;
  tagged: TaggedEvent[];
  /** 'rounds' with rest: session-clock ms the current rest ends at, null when not resting (change rest-steps). */
  restUntil: number | null;
  /** Workouts of several blocks only (change multi-block-workouts); `pos`/`done`/`raw` then mirror `seq.inner`. */
  seq?: SequenceState;
};

/**
 * Where a workout of several blocks is: block `idx`, started at `start` on the
 * session clock, whose own engine state `inner` runs on the block-local clock
 * `t - start`; `restUntil` is the end of the rest after it, and `ends` each
 * finished block's end time.
 */
export type SequenceState = { idx: number; start: number; inner: EngineState; restUntil: number | null; ends: number[] };

export function formatTime(seconds: number): string {
  const s = Math.abs(seconds);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function totalIntervals(config: WodConfig): number {
  return Math.ceil(config.totalSeconds / intervalSeconds(config));
}

export function initial(config: WodConfig): EngineState {
  if (isSequence(config)) {
    const inner = initial(config.parts[0]);
    return { ...inner, seq: { idx: 0, start: 0, inner, restUntil: null, ends: [] } };
  }
  return { pos: START_POSITION, done: 0, raw: 0, finished: false, t: 0, tagged: [], restUntil: null };
}

export function advanceTo(config: WodConfig, state: EngineState, t: number): EngineState {
  if (isSequence(config)) return advanceSequence(config, state, t);
  if (state.finished || t <= state.t) return state;
  const repeat = shapeOf(config);
  if (repeat === 'cycle') {
    const end = config.totalSeconds * 1000;
    if (t >= end) return { ...state, t: end, finished: true };
    // A rest between rounds of a part before the cycle is over (change shared-clock).
    if (state.restUntil != null && t >= state.restUntil) return { ...state, t, restUntil: null };
    return { ...state, t };
  }
  if (repeat === 'perInterval') {
    const total = totalIntervals(config);
    const intervalMs = intervalSeconds(config) * 1000;
    const minuteIdx = Math.floor(t / intervalMs);
    // Where interval m's counting ends: its work time, or the whole interval (change rest-steps).
    const missEnd = (m: number) => m * intervalMs + (workOf(config.window) ?? intervalSeconds(config)) * 1000;
    if (stopsOnMiss(config) && t >= missEnd(state.pos.minuteIdx)) {
      // Stopping EMOM (change emom-progressive-reps): end at the first missed interval.
      const m = state.pos.minuteIdx;
      if (intervalMissed(config, state)) return { ...state, t: missEnd(m), finished: true };
      // The clock skipped a whole interval, which had no reps: that one is missed (targets are ≥ 1),
      // unless it starts on a MAX line, reached at once (change max-lines).
      if (t >= missEnd(m + 1) && m + 1 < total && !intervalLines(config, m + 1)[0]?.max) {
        return { ...state, pos: { ...state.pos, minuteIdx: m + 1, exIdx: 0 }, done: 0, raw: 0, t: missEnd(m + 1), finished: true };
      }
    }
    // Move to the interval `t` falls in (at most the last one), so a jump over
    // several intervals ends where stepping through them would.
    const current = Math.min(minuteIdx, total - 1);
    const moved = current === state.pos.minuteIdx
      ? state
      : { ...state, pos: { ...state.pos, minuteIdx: current, exIdx: 0 }, done: 0, raw: 0 };
    // Last interval ended: finish keeping its partial count, on its position.
    if (minuteIdx >= total) return { ...moved, t: total * intervalMs, finished: true };
    return { ...moved, t };
  }
  const cap = capSeconds(config);
  if (cap != null && t >= cap * 1000) return { ...state, t: cap * 1000, finished: true };
  // The rest between rounds is over (change rest-steps); the cap above comes first.
  if (state.restUntil != null && t >= state.restUntil) return { ...state, t, restUntil: null };
  return { ...state, t };
}

/** EMOM with a work time: whether session-clock `t` falls in an interval's rest (change rest-steps). */
function inIntervalRest(config: WodConfig, t: number): boolean {
  const work = workOf(config.window);
  return shapeOf(config) === 'perInterval' && work != null && t % (intervalSeconds(config) * 1000) >= work * 1000;
}

/**
 * Whether the state is in a rest (change rest-steps): a For Time between rounds, or
 * an EMOM past its interval's work time. Never once finished. Gestures in a rest
 * are dropped live, and `apply` doesn't count them.
 */
export function isResting(config: WodConfig, state: EngineState): boolean {
  if (state.finished) return false;
  if (isSequence(config)) {
    const seq = state.seq!;
    return seq.restUntil != null || isResting(config.parts[seq.idx], seq.inner);
  }
  return state.restUntil != null || inIntervalRest(config, state.t);
}

/** Seconds left in the current rest (0 when not resting). */
export function restLeftSeconds(config: WodConfig, state: EngineState): number {
  if (!isResting(config, state)) return 0;
  if (isSequence(config)) {
    const seq = state.seq!;
    if (seq.restUntil == null) return restLeftSeconds(config.parts[seq.idx], seq.inner);
    return Math.max(0, Math.ceil((seq.restUntil - state.t) / 1000));
  }
  const end = state.restUntil ?? (Math.floor(state.t / (intervalSeconds(config) * 1000)) + 1) * intervalSeconds(config) * 1000;
  return Math.max(0, Math.ceil((end - state.t) / 1000));
}

// Only an event that has an id gives its tag one, so tags without ids stay as they were.
function idOf(event: EngineEvent): { id?: number } {
  return event.id != null ? { id: event.id } : {};
}

export function apply(config: WodConfig, state: EngineState, event: EngineEvent): EngineState {
  if (isSequence(config)) return applySequence(config, state, event);
  const repeat = shapeOf(config);
  const s = advanceTo(config, state, event.t);
  const target = targetAt(config, s.pos);
  const inPlay = !((s.finished && repeat !== 'cycle') || isResting(config, s));
  const ignored = !event.ok || !inPlay;
  const tag: TaggedEvent = { t: event.t, ok: event.ok, pos: s.pos, target, counted: !ignored, inPlay, ...idOf(event) };
  const tagged = [...s.tagged, tag];
  if (ignored) return { ...s, tagged };

  if (repeat === 'perInterval') {
    const raw = s.raw + 1;
    // Within the interval, a reached target moves on to its next line; the last
    // line keeps counting extra reps (raw) with the live count capped.
    if (raw >= target && s.pos.exIdx < intervalLines(config, s.pos.minuteIdx).length - 1) {
      return { ...s, tagged, pos: { ...s.pos, exIdx: s.pos.exIdx + 1 }, done: 0, raw: 0 };
    }
    // A MAX line's count has no cap (change max-lines).
    return { ...s, tagged, raw, done: lineAt(config, s.pos)?.max ? raw : Math.min(raw, target) };
  }

  const done = s.done + 1;
  if (done >= target && !isCompleteAt(config, s.pos)) {
    const next = nextPosition(config, s.pos);
    if (isCompleteAt(config, next)) {
      // Last rep of the WOD: stay on the final position with its final count.
      return { ...s, tagged, done, finished: true };
    }
    // A new round starts after the rest between rounds, if any (change rest-steps) —
    // within a part only, never between parts (change shared-clock).
    const rest = next.roundIdx > s.pos.roundIdx ? restBefore(config.window, next.roundIdx) : undefined;
    return { ...s, tagged, pos: next, done: 0, restUntil: rest ? event.t + rest * 1000 : s.restUntil };
  }
  return { ...s, tagged, done: Math.min(done, target) };
}

/** Result side: the same functions, over the stored events in time order, then the clock up to `endT`. */
export function fold(config: WodConfig, events: EngineEvent[], endT: number): EngineState {
  const sorted = [...events].sort((a, b) => a.t - b.t);
  const state = sorted.reduce((st, e) => apply(config, st, e), initial(config));
  return advanceTo(config, state, endT);
}

// ─── Workouts of several blocks (change multi-block-workouts) ───────────────
//
// Each block runs on its own engine, untouched, on the block-local clock
// `t - start`; this layer only routes the clock and the events to the current
// block and moves on when it finishes (after its rest, if any). The session
// clock never stops, and `t`, `finished` and `tagged` stay global.

/** The current block's index, 0 for a one-block workout (the cue on a block change reads it). */
export function blockIndexOf(state: EngineState): number {
  return state.seq?.idx ?? 0;
}

// The top-level position and counts mirror the current block's.
function withSequence(state: EngineState, seq: SequenceState): EngineState {
  return { ...state, pos: seq.inner.pos, done: seq.inner.done, raw: seq.inner.raw, seq };
}

// Block `seq.idx` ended at session-clock `end`: the workout finishes, its rest starts, or the next block does.
function endBlock(config: SequenceConfig, seq: SequenceState, end: number): { seq: SequenceState; finished: boolean } {
  const ends = [...seq.ends, end];
  if (seq.idx === config.parts.length - 1) return { seq: { ...seq, ends }, finished: true };
  const rest = config.restAfter[seq.idx] ?? 0;
  if (rest > 0) return { seq: { ...seq, ends, restUntil: end + rest * 1000 }, finished: false };
  const idx = seq.idx + 1;
  return { seq: { idx, start: end, inner: initial(config.parts[idx]), restUntil: null, ends }, finished: false };
}

function advanceSequence(config: SequenceConfig, state: EngineState, t: number): EngineState {
  if (state.finished || t <= state.t) return state;
  let seq = state.seq!;
  // A loop: one jump of the clock can cross several blocks and rests.
  for (;;) {
    if (seq.restUntil != null) {
      if (t < seq.restUntil) break;
      const idx = seq.idx + 1;
      seq = { ...seq, idx, start: seq.restUntil, inner: initial(config.parts[idx]), restUntil: null };
      continue;
    }
    const inner = advanceTo(config.parts[seq.idx], seq.inner, t - seq.start);
    seq = { ...seq, inner };
    if (!inner.finished) break;
    const end = seq.start + inner.t;
    const next = endBlock(config, seq, end);
    if (next.finished) return { ...withSequence(state, next.seq), t: end, finished: true };
    seq = next.seq;
  }
  return { ...withSequence(state, seq), t };
}

function applySequence(config: SequenceConfig, state: EngineState, event: EngineEvent): EngineState {
  const s = advanceTo(config, state, event.t);
  const seq = s.seq!;
  if (s.finished || seq.restUntil != null) {
    // After the end or between blocks: recorded nowhere, never counted.
    return { ...s, tagged: [...s.tagged, { t: event.t, ok: event.ok, pos: s.pos, target: 0, counted: false, inPlay: false, ...idOf(event) }] };
  }
  const inner = apply(config.parts[seq.idx], seq.inner, { t: event.t - seq.start, ok: event.ok, ...idOf(event) });
  const own = inner.tagged[inner.tagged.length - 1];
  const tagged = [...s.tagged, { t: event.t, ok: event.ok, pos: own.pos, target: own.target, counted: own.counted, inPlay: own.inPlay, block: seq.idx, ...idOf(event) }];
  let next: SequenceState = { ...seq, inner };
  if (inner.finished && !seq.inner.finished) {
    // The block ended on this event (a For Time's last rep).
    const ended = endBlock(config, next, event.t);
    if (ended.finished) return { ...withSequence(s, ended.seq), tagged, finished: true };
    next = ended.seq;
  }
  return { ...withSequence(s, next), tagged };
}

function viewSequence(config: SequenceConfig, state: EngineState) {
  const seq = state.seq!;
  const count = config.parts.length;
  if (seq.restUntil != null && !state.finished) {
    // Between blocks: REST, with the next block's start shown below it.
    const next = config.parts[seq.idx + 1];
    const left = restLeftSeconds(config, state);
    return {
      ...view(next, initial(next)),
      exerciseName: `REST ${formatTime(left)}`,
      timerStr: formatTime(left),
      timerLabel: 'rest left',
      blockLabel: `BLOCK ${seq.idx + 2}/${count}`,
      partLabel: undefined,
      max: undefined,
      segment: undefined,
    };
  }
  return { ...view(config.parts[seq.idx], seq.inner), blockLabel: `BLOCK ${seq.idx + 1}/${count}` };
}

export function view(config: WodConfig, state: EngineState): {
  exerciseName: string;
  target: number;
  done: number;
  kpi: WodKpi;
  timerStr: string;
  timerLabel: string;
  /** "BLOCK n/N" on a workout of several blocks, null otherwise. */
  blockLabel: string | null;
  /** "PART n/N" in a block of several parts (change shared-clock); absent otherwise, so one-part views are unchanged. */
  partLabel?: string;
  /** True while the current line is a MAX line (change max-lines); absent otherwise, so other views are unchanged. */
  max?: true;
  /** The current MAX line's segment (change max-distance); absent otherwise, so other views are unchanged. */
  segment?: Segment;
} {
  if (isSequence(config)) return viewSequence(config, state);
  const elapsed = Math.floor(state.t / 1000);
  const interval = intervalSeconds(config);
  const work = workOf(config.window);
  const resting = isResting(config, state);
  // An EMOM with a work time counts down its current phase (change rest-steps).
  const phased = config.timerMode === 'minLeft' && work != null;
  const timerStr =
    config.timerMode === 'remaining' ? formatTime(Math.max(0, config.totalSeconds - elapsed)) :
    phased                           ? formatTime(Math.max(0, (resting ? interval : work) - (elapsed % interval))) :
    config.timerMode === 'minLeft'   ? formatTime(Math.max(0, interval - (elapsed % interval))) :
    formatTime(elapsed);
  const timerLabel =
    config.timerMode === 'remaining' ? 'remaining' :
    phased                           ? (resting ? 'rest left' : 'work left') :
    config.timerMode === 'minLeft'   ? (interval === 60 ? 'min left' : 'interval left') : 'elapsed';
  const cap = capSeconds(config);
  return {
    exerciseName: state.finished ? 'DONE' : resting ? `REST ${formatTime(restLeftSeconds(config, state))}` : exerciseNameAt(config, state.pos),
    target: targetAt(config, state.pos),
    done: state.done,
    kpi: kpiAt(config, state.pos),
    timerStr,
    timerLabel: cap != null ? `${timerLabel} · cap ${formatTime(cap)}` : timerLabel,
    blockLabel: null,
    ...(partCount(config) > 1 ? { partLabel: `PART ${partIndexAt(config, state.pos.roundIdx) + 1}/${partCount(config)}` } : {}),
    ...(!state.finished && lineAt(config, state.pos)?.max ? { max: true as const } : {}),
    ...(!state.finished && maxSegment(lineAt(config, state.pos)) ? { segment: maxSegment(lineAt(config, state.pos))! } : {}),
  };
}
