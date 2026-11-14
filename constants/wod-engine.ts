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
};

// ─── Window model (change window-model) ─────────────────────────────────────
//
// A window is how the clock runs plus what is done inside it. The shapes allowed
// today are the ones the For Time / AMRAP / EMOM formats had: a continuous window
// holds exactly one `rounds` or `cycle` structure, and each interval entry exactly
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
 * interval window, otherwise the kind of its only structure ('rounds' or 'cycle').
 * The engine's rules are written per shape (they are the v1 rules per format).
 */
export type Shape = 'rounds' | 'cycle' | 'perInterval';

function windowShape(window: Window): Shape {
  if (isIntervalWindow(window)) return 'perInterval';
  return window.structures[0].kind === 'cycle' ? 'cycle' : 'rounds';
}

export function shapeOf(config: WodConfig): Shape {
  return windowShape(config.window);
}

function onlyStructure(window: ContinuousWindow): Structure {
  return window.structures[0];
}

/** The rounds of a 'rounds' window (one entry per round). */
function roundsOf(window: Window): WodLine[][] {
  const s = isIntervalWindow(window) ? null : onlyStructure(window);
  return s?.kind === 'rounds' ? s.rounds : [];
}

/** The lines of a 'cycle' window. */
function cycleOf(window: Window): WodLine[] {
  const s = isIntervalWindow(window) ? null : onlyStructure(window);
  return s?.kind === 'cycle' ? s.lines : [];
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

function restBetweenRounds(window: Window): number | undefined {
  const s = isIntervalWindow(window) ? null : onlyStructure(window);
  return s?.kind === 'rounds' ? s.restSeconds : undefined;
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
    return;
  }
  const [s, ...more] = window.structures;
  if (!s || more.length > 0 || s.kind === 'once') throw new Error('A continuous window needs exactly one "rounds" or "cycle" structure');
  if (s.kind === 'cycle' && !window.clock.limitSeconds) throw new Error('A "cycle" needs a time limit');
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

function summarize(window: Window): WodExercise[] {
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
      detail: `${interval.map((l) => `${describedOnly(l) ? amountOf(l) : l.target}${l.increment ? ` (+${l.increment})` : ''}`).join(' + ')} / ${per}`,
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
  if (shape === 'rounds') return roundsOf(config.window)[pos.roundIdx]?.[pos.exIdx];
  if (shape === 'cycle') return cycleOf(config.window)[pos.exIdx];
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
  if (shapeOf(config) !== 'perInterval' || !line.increment) return line.target;
  // Progressive EMOM (change emom-progressive-reps): + increment per repetition of the sequence.
  return line.target + line.increment * Math.floor(pos.minuteIdx / sequenceOf(config.window).length);
}

export function exerciseNameAt(config: WodConfig, pos: WodSession): string {
  return lineAt(config, pos)?.exercise ?? 'DONE';
}

export function kpiAt(config: WodConfig, pos: WodSession): WodKpi {
  const { window } = config;
  const shape = shapeOf(config);
  if (shape === 'rounds') {
    const rounds = roundsOf(window);
    if (rounds.length === 1) {
      const total = rounds[0]?.length ?? 0;
      return { label: 'station', current: Math.min(pos.exIdx + 1, total), total };
    }
    const total = rounds.length;
    return { label: 'round', current: Math.min(pos.roundIdx + 1, total), total };
  }
  if (shape === 'cycle') return { label: 'rounds', current: pos.completedRounds, total: null };
  const total = isIntervalWindow(window) ? window.clock.count : 0;
  return { label: intervalUnit(config), current: Math.min(pos.minuteIdx + 1, total), total };
}

// onTarget only: the next line, wrapping into the next round (AMRAP also tallies it).
function nextPosition(config: WodConfig, pos: WodSession): WodSession {
  const cycle = shapeOf(config) === 'cycle';
  const roundLines = (cycle ? cycleOf(config.window) : roundsOf(config.window)[pos.roundIdx])?.length ?? 0;
  const nextEx = pos.exIdx + 1;
  if (nextEx < roundLines) return { ...pos, exIdx: nextEx };
  return cycle
    ? { ...pos, exIdx: 0, roundIdx: pos.roundIdx + 1, completedRounds: pos.completedRounds + 1 }
    : { ...pos, roundIdx: pos.roundIdx + 1, exIdx: 0 };
}

// AMRAP never completes on reps; it ends on the clock.
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
    return t >= end ? { ...state, t: end, finished: true } : { ...state, t };
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
      // The clock skipped a whole interval, which had no reps: that one is missed (targets are ≥ 1).
      if (t >= missEnd(m + 1) && m + 1 < total) {
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
    return { ...s, tagged, raw, done: Math.min(raw, target) };
  }

  const done = s.done + 1;
  if (done >= target && !isCompleteAt(config, s.pos)) {
    const next = nextPosition(config, s.pos);
    if (isCompleteAt(config, next)) {
      // Last rep of the WOD: stay on the final position with its final count.
      return { ...s, tagged, done, finished: true };
    }
    // A new round starts after the rest between rounds, if any (change rest-steps).
    const rest = repeat === 'rounds' && next.roundIdx > s.pos.roundIdx ? restBetweenRounds(config.window) : undefined;
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
  };
}
