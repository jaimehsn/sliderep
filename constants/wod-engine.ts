// The interpreter: turns a declarative WodDefinition + Format into a WodConfig
// (structure + presentation), and runs it as one incremental engine for both
// live judging and results (see the Engine section).
// "Format = behavior, WOD = content" (docs/ROADMAP.md → WOD format as data).
//
// Scope: only the primitives today's 4 built-in WODs actually need, plus a For
// Time cap (change for-time-cap) and an EMOM interval length (change
// emom-interval-length), several exercises per EMOM interval (change
// emom-multi-exercise-intervals), progressive EMOM reps and the stop (change
// emom-progressive-reps), and rest between For Time rounds or within EMOM
// intervals (change rest-steps). Multi-block WODs (buy-in/cash-out) are not
// implemented yet.

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

export type WodConfig = {
  /** Derived from format + content (e.g. "12-MIN AMRAP"), never hand-written. */
  mode: string;
  name: string;
  /** One-line card description, derived from content (e.g. "21-15-9 · thrusters + pull-ups"). */
  description: string;
  timerMode: 'elapsed' | 'remaining' | 'minLeft';
  totalSeconds: number;
  /** onTarget: the position advances as soon as its target is reached. onClock: only the clock advances it. Plain data (read by session/adjust.tsx). */
  advanceMode: 'onTarget' | 'onClock';
  /** The built-in Format's version — stored on a saved session so replay always uses the pinned engine semantics. */
  engineVersion: number;
  exercises: WodExercise[];
  /** The data the engine interprets (see the engine section below). */
  format: Format;
  block: Block;
};

// ─── Format primitives ──────────────────────────────────────────────────────

export type RepeatKind = 'rounds' | 'cycle' | 'perInterval';
export type AdvanceKind = 'onTarget' | 'onClock';
export type TimerKind = 'elapsed' | 'countdown' | 'intervalCountdown';
export type StopKind = 'whenAllDone' | 'atDuration' | 'afterIntervals';
export type ScoreKind = 'time' | 'roundsPlusReps' | 'intervalsPlusReps';

export type Format = {
  id: string;
  version: number;
  repeat: RepeatKind;
  advance: AdvanceKind;
  timer: TimerKind;
  stop: StopKind;
  score: ScoreKind;
};

export const FOR_TIME_FORMAT: Format = {
  id: 'forTime', version: 1, repeat: 'rounds', advance: 'onTarget', timer: 'elapsed', stop: 'whenAllDone', score: 'time',
};

export const AMRAP_FORMAT: Format = {
  id: 'amrap', version: 1, repeat: 'cycle', advance: 'onTarget', timer: 'countdown', stop: 'atDuration', score: 'roundsPlusReps',
};

export const EMOM_FORMAT: Format = {
  id: 'emom', version: 1, repeat: 'perInterval', advance: 'onClock', timer: 'intervalCountdown', stop: 'afterIntervals', score: 'intervalsPlusReps',
};

/** Built-in formats by id — what a stored block's `formatId` resolves to. */
export const FORMATS: Record<string, Format> = {
  [FOR_TIME_FORMAT.id]: FOR_TIME_FORMAT,
  [AMRAP_FORMAT.id]: AMRAP_FORMAT,
  [EMOM_FORMAT.id]: EMOM_FORMAT,
};

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
  /** perInterval: reps added to `target` each time this line's sequence entry comes round (change emom-progressive-reps). */
  increment?: number;
};

export type Block = {
  /**
   * One entry per round/interval; each entry is that round/interval's line(s).
   * 'rounds': one entry per round (For Time: N entries, possibly varying reps; Chipper: 1 entry of many lines).
   * 'cycle': exactly 1 entry, reused every round (AMRAP).
   * 'perInterval': one entry per interval of the sequence, cycled by index % length (EMOM); an entry's lines are done in order within the interval.
   */
  lines: WodLine[][];
  /** 'rounds': round count (Chipper = 1). 'perInterval': total intervals. */
  rounds?: number;
  /** 'cycle' / 'perInterval': total WOD duration (perInterval: rounds × interval). 'rounds': the time cap. */
  durationSeconds?: number;
  /** 'perInterval': interval length in seconds (10–600), 60 when absent (change emom-interval-length). */
  intervalSeconds?: number;
  /** 'perInterval': the workout ends at its first missed interval (change emom-progressive-reps). */
  stopOnMiss?: boolean;
  /** 'rounds': rest between rounds in seconds, none after the last (change rest-steps). */
  restSeconds?: number;
  /** 'perInterval': work time per interval in seconds; the rest of each interval is rest (change rest-steps). */
  workSeconds?: number;
};

export type WodDefinition = {
  id: string;
  name: string;
  block: Block;
};

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

// An EMOM block's interval length in seconds (60 unless the block sets one).
function blockInterval(block: Block): number {
  return block.intervalSeconds ?? 60;
}

// A length as m:ss ("1:30"), unlike formatTime's clock-like "01:30".
function formatLength(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

// More than one round, all identical: "5 rounds of the same", shown once instead of per round.
function sameEveryRound(block: Block): boolean {
  const [first = []] = block.lines;
  return block.lines.length > 1 && block.lines.every((round) => round.every((l, i) => l.target === first[i]?.target));
}

function summarize(format: Format, block: Block): WodExercise[] {
  if (format.repeat === 'rounds' && (block.rounds === 1 || sameEveryRound(block))) {
    // Chipper (each line is its own station), or rounds that all repeat the first.
    return block.lines[0].map((l) => ({ name: l.exercise, detail: amountOf(l), note: lineNote(l) }));
  }
  if (format.repeat === 'rounds') {
    // For Time: a fixed exercise order repeated every round, reps vary per round.
    const firstRound = block.lines[0];
    return firstRound.map((_, exIdx) => ({
      name: firstRound[exIdx].exercise,
      detail: block.lines.map((round) => round[exIdx]?.target ?? 0).join(' · '),
      note: lineNote(firstRound[exIdx]),
    }));
  }
  if (format.repeat === 'cycle') {
    // AMRAP: a single template, reps fixed every round.
    return block.lines[0].map((l) => ({ name: l.exercise, detail: amountOf(l), note: lineNote(l) }));
  }
  // perInterval: one row per interval of the sequence, its exercises joined by " + ".
  const per = blockInterval(block) === 60 ? 'min' : 'interval';
  return block.lines.map((interval) => {
    const notes = interval.map(lineNote).filter((n): n is string => n != null);
    return {
      name: interval.map((l) => l.exercise).join(' + '),
      detail: `${interval.map((l) => `${describedOnly(l) ? amountOf(l) : l.target}${l.increment ? ` (+${l.increment})` : ''}`).join(' + ')} / ${per}`,
      note: notes.length > 0 ? notes.join(' · ') : undefined,
    };
  });
}

// Distinct exercise names in first-seen order, lowercased: "a + b" for two, "a, b, c" for more.
function joinNames(block: Block): string {
  const names = [...new Set(block.lines.flat().map((l) => l.exercise.toLowerCase()))];
  return names.join(names.length === 2 ? ' + ' : ', ');
}

function describeMode(format: Format, block: Block): string {
  if (format.repeat === 'rounds') return sameEveryRound(block) ? `${block.lines.length} ROUNDS FOR TIME` : 'FOR TIME';
  if (format.repeat === 'cycle') return `${(block.durationSeconds ?? 0) / 60}-MIN AMRAP`;
  const interval = blockInterval(block);
  const prefix = interval === 60 ? 'EMOM' : interval % 60 === 0 ? `E${interval / 60}MOM` : `EVERY ${formatLength(interval)}`;
  return `${prefix} · ${block.rounds ?? 0}`;
}

function describeContent(format: Format, block: Block): string {
  // A For Time's durationSeconds is its time cap (change for-time-cap).
  const cap = format.repeat === 'rounds' && block.durationSeconds ? ` · ${block.durationSeconds / 60} min cap` : '';
  // A stopping EMOM (change emom-progressive-reps).
  const untilFailure = format.repeat === 'perInterval' && block.stopOnMiss ? ' · until failure' : '';
  // Rest between rounds, or work time per interval (change rest-steps).
  const rest = format.repeat === 'rounds' && block.restSeconds ? ` · ${block.restSeconds} s rest` : '';
  const work = format.repeat === 'perInterval' && block.workSeconds ? ` · ${block.workSeconds} s work` : '';
  return describeScheme(format, block) + rest + work + cap + untilFailure;
}

function describeScheme(format: Format, block: Block): string {
  if (format.repeat === 'rounds' && block.rounds === 1) {
    const lines = block.lines[0] ?? [];
    const targets = new Set(lines.map((l) => l.target));
    return targets.size === 1
      ? `${lines.length} stations · ${lines[0].target} reps each`
      : `${lines.length} stations`;
  }
  if (format.repeat === 'rounds' && sameEveryRound(block)) return `${block.lines.length} rounds · ${joinNames(block)}`;
  if (format.repeat === 'rounds') {
    const uniform = block.lines.every((round) => round.every((l) => l.target === round[0]?.target));
    const scheme = uniform ? block.lines.map((round) => round[0]?.target ?? 0).join('-') : `${block.rounds ?? 0} rounds`;
    return `${scheme} · ${joinNames(block)}`;
  }
  if (format.repeat === 'perInterval' && blockInterval(block) !== 60) {
    return `${block.rounds ?? 0} × ${formatLength(blockInterval(block))} · ${joinNames(block)}`;
  }
  return `${(block.durationSeconds ?? 0) / 60} min · ${joinNames(block)}`;
}

export function buildWodConfig(definition: WodDefinition, format: Format): WodConfig {
  const { block } = definition;

  const timerMode: WodConfig['timerMode'] =
    format.timer === 'elapsed' ? 'elapsed' : format.timer === 'countdown' ? 'remaining' : 'minLeft';

  return {
    mode: describeMode(format, block),
    name: definition.name,
    description: describeContent(format, block),
    timerMode,
    totalSeconds: block.durationSeconds ?? 0,
    advanceMode: format.advance,
    engineVersion: format.version,
    exercises: summarize(format, block),
    format,
    block,
  };
}

// ─── Positions ──────────────────────────────────────────────────────────────
//
// A position is a WodSession (round/line for onTarget, interval for perInterval).
// Pure functions of the format + block — the engine and the result labels read them.

/** An EMOM's interval length in seconds: the block's `intervalSeconds`, or 60 (change emom-interval-length). */
export function intervalSeconds(config: WodConfig): number {
  return blockInterval(config.block);
}

/** What an EMOM's intervals are called: 'minute' with 60-second intervals, 'interval' otherwise. */
export function intervalUnit(config: WodConfig): 'minute' | 'interval' {
  return intervalSeconds(config) === 60 ? 'minute' : 'interval';
}

export const START_POSITION: WodSession = { roundIdx: 0, exIdx: 0, completedRounds: 0, minuteIdx: 0 };

function lineAt(config: WodConfig, pos: WodSession): WodLine | undefined {
  const { lines } = config.block;
  if (config.format.repeat === 'rounds') return lines[pos.roundIdx]?.[pos.exIdx];
  if (config.format.repeat === 'cycle') return lines[0]?.[pos.exIdx];
  return lines[pos.minuteIdx % lines.length]?.[pos.exIdx];
}

/** perInterval: the lines of interval `intervalIdx`, done in order. */
export function intervalLines(config: WodConfig, intervalIdx: number): WodLine[] {
  const { lines } = config.block;
  return lines[intervalIdx % lines.length] ?? [];
}

/**
 * EMOM: the line of interval `intervalIdx` that its `k`-th valid rep (0-based)
 * counts toward. Lines fill in order up to their targets and the last one takes
 * any extra reps — the rule `apply` follows live (change
 * emom-multi-exercise-intervals), shared with adjustments so both place a rep alike.
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
  if (config.format.repeat !== 'perInterval' || !line.increment) return line.target;
  // Progressive EMOM (change emom-progressive-reps): + increment per repetition of the sequence.
  return line.target + line.increment * Math.floor(pos.minuteIdx / config.block.lines.length);
}

export function exerciseNameAt(config: WodConfig, pos: WodSession): string {
  return lineAt(config, pos)?.exercise ?? 'DONE';
}

export function kpiAt(config: WodConfig, pos: WodSession): WodKpi {
  const { block } = config;
  if (config.format.repeat === 'rounds') {
    if (block.rounds === 1) {
      const total = block.lines[0]?.length ?? 0;
      return { label: 'station', current: Math.min(pos.exIdx + 1, total), total };
    }
    const total = block.rounds ?? 0;
    return { label: 'round', current: Math.min(pos.roundIdx + 1, total), total };
  }
  if (config.format.repeat === 'cycle') return { label: 'rounds', current: pos.completedRounds, total: null };
  const total = block.rounds ?? 0;
  return { label: intervalUnit(config), current: Math.min(pos.minuteIdx + 1, total), total };
}

// onTarget only: the next line, wrapping into the next round (AMRAP also tallies it).
function nextPosition(config: WodConfig, pos: WodSession): WodSession {
  const { block } = config;
  const cycle = config.format.repeat === 'cycle';
  const roundLines = block.lines[cycle ? 0 : pos.roundIdx]?.length ?? 0;
  const nextEx = pos.exIdx + 1;
  if (nextEx < roundLines) return { ...pos, exIdx: nextEx };
  return cycle
    ? { ...pos, exIdx: 0, roundIdx: pos.roundIdx + 1, completedRounds: pos.completedRounds + 1 }
    : { ...pos, roundIdx: pos.roundIdx + 1, exIdx: 0 };
}

// AMRAP never completes on reps; it ends on the clock.
function isCompleteAt(config: WodConfig, pos: WodSession): boolean {
  return config.format.repeat === 'rounds' && pos.roundIdx >= (config.block.rounds ?? 0);
}

/**
 * A For Time / Chipper time cap in seconds, or null (change for-time-cap). It is
 * the block's `durationSeconds`, which only AMRAP and EMOM had before; code that
 * means "cap" asks this rather than reading `totalSeconds` on a `rounds` config.
 */
/**
 * EMOM: whether the state's current interval is short of its targets. Earlier lines
 * of an interval were left only on reaching their target, so it is missed unless
 * it's on its last line with that line's target reached (change emom-progressive-reps).
 */
function intervalMissed(config: WodConfig, state: EngineState): boolean {
  const { pos } = state;
  return pos.exIdx < intervalLines(config, pos.minuteIdx).length - 1 || state.raw < targetAt(config, pos);
}

export function capSeconds(config: WodConfig): number | null {
  return config.format.repeat === 'rounds' && config.totalSeconds > 0 ? config.totalSeconds : null;
}

/**
 * The workout detail's and pre-start summary's duration line, or null when there is
 * nothing to say: "12 min", "10 min cap" (change for-time-cap), "30 min max · until
 * failure" (change emom-progressive-reps), plus the rest (change rest-steps):
 * "60 s rest between rounds" or "20 s work / 10 s rest".
 */
export function durationLine(config: WodConfig): string | null {
  const { block } = config;
  const parts: string[] = [];
  const m = Math.floor(config.totalSeconds / 60);
  if (config.totalSeconds > 0) {
    parts.push(capSeconds(config) != null ? `${m} min cap` : block.stopOnMiss ? `${m} min max · until failure` : `${m} min`);
  }
  if (config.format.repeat === 'rounds' && block.restSeconds) parts.push(`${block.restSeconds} s rest between rounds`);
  if (config.format.repeat === 'perInterval' && block.workSeconds) {
    parts.push(`${block.workSeconds} s work / ${intervalSeconds(config) - block.workSeconds} s rest`);
  }
  return parts.length > 0 ? parts.join(' · ') : null;
}

/**
 * Whether every position was completed — false for a For Time that ended at its
 * cap, and always for AMRAP/EMOM. A completed For Time stays on its last position
 * with the final count (see `apply`), so that is what's checked.
 */
export function isComplete(config: WodConfig, state: EngineState): boolean {
  return (
    config.format.repeat === 'rounds' &&
    isCompleteAt(config, nextPosition(config, state.pos)) &&
    state.done >= targetAt(config, state.pos)
  );
}

// ─── Engine (incremental fold) ──────────────────────────────────────────────
//
// One engine for live judging and for results: live judging calls `apply` on
// each gesture and `advanceTo` on each clock tick; a result is `fold` over the
// stored events with the very same functions. Rules are the ones engineVersion 1
// pins (tests/__goldens__), per `format.repeat`:
//   rounds      — finishes on the last rep, or at its cap when it has one (change
//                 for-time-cap: an event at the cap or later is ignored); later events ignored
//   cycle       — finishes at its duration, but still counts events after it (v1)
//   perInterval — the clock sets the interval; within it, lines advance on target
//                 (intervalLineAt); reps beyond the last line's target count (raw)
//                 but the live count is capped; events at/after the last interval ignored

export type EngineEvent = { t: number; ok: boolean };

export type TaggedEvent = {
  t: number;
  ok: boolean;
  /** The position the event was applied at, fixed by the original WOD (adjustments never re-flow it). */
  pos: WodSession;
  /** That position's target when the event was applied. */
  target: number;
  /** Whether it counted as a valid rep (no-reps and ignored events don't). */
  counted: boolean;
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
};

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
  return { pos: START_POSITION, done: 0, raw: 0, finished: false, t: 0, tagged: [], restUntil: null };
}

export function advanceTo(config: WodConfig, state: EngineState, t: number): EngineState {
  if (state.finished || t <= state.t) return state;
  const { repeat } = config.format;
  if (repeat === 'cycle') {
    const end = config.totalSeconds * 1000;
    return t >= end ? { ...state, t: end, finished: true } : { ...state, t };
  }
  if (repeat === 'perInterval') {
    const total = totalIntervals(config);
    const intervalMs = intervalSeconds(config) * 1000;
    const minuteIdx = Math.floor(t / intervalMs);
    // Where interval m's counting ends: its work time, or the whole interval (change rest-steps).
    const missEnd = (m: number) => m * intervalMs + (config.block.workSeconds ?? intervalSeconds(config)) * 1000;
    if (config.block.stopOnMiss && t >= missEnd(state.pos.minuteIdx)) {
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
  const work = config.block.workSeconds;
  return config.format.repeat === 'perInterval' && work != null && t % (intervalSeconds(config) * 1000) >= work * 1000;
}

/**
 * Whether the state is in a rest (change rest-steps): a For Time between rounds, or
 * an EMOM past its interval's work time. Never once finished. Gestures in a rest
 * are dropped live, and `apply` doesn't count them.
 */
export function isResting(config: WodConfig, state: EngineState): boolean {
  if (state.finished) return false;
  return state.restUntil != null || inIntervalRest(config, state.t);
}

/** Seconds left in the current rest (0 when not resting). */
export function restLeftSeconds(config: WodConfig, state: EngineState): number {
  if (!isResting(config, state)) return 0;
  const end = state.restUntil ?? (Math.floor(state.t / (intervalSeconds(config) * 1000)) + 1) * intervalSeconds(config) * 1000;
  return Math.max(0, Math.ceil((end - state.t) / 1000));
}

export function apply(config: WodConfig, state: EngineState, event: EngineEvent): EngineState {
  const { repeat } = config.format;
  const s = advanceTo(config, state, event.t);
  const target = targetAt(config, s.pos);
  const ignored = !event.ok || (s.finished && repeat !== 'cycle') || isResting(config, s);
  const tag: TaggedEvent = { t: event.t, ok: event.ok, pos: s.pos, target, counted: !ignored };
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
    const rest = repeat === 'rounds' && next.roundIdx > s.pos.roundIdx ? config.block.restSeconds : undefined;
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

export function view(config: WodConfig, state: EngineState) {
  const elapsed = Math.floor(state.t / 1000);
  const interval = intervalSeconds(config);
  const work = config.block.workSeconds;
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
  };
}
