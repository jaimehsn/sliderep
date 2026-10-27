// The interpreter: turns a declarative WodDefinition + Format into a WodConfig
// (structure + presentation), and runs it as one incremental engine for both
// live judging and results (see the Engine section).
// "Format = behavior, WOD = content" (docs/ROADMAP.md → WOD format as data).
//
// Scope: only the primitives today's 4 built-in WODs actually need. Rest steps,
// multi-block WODs (buy-in/cash-out), progressive per-interval reps and time caps
// are not implemented — add them when a real WOD needs them.

export type WodSession = {
  roundIdx: number;
  exIdx: number;
  completedRounds: number;
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
};

export type Block = {
  /**
   * One entry per round/interval; each entry is that round/interval's line(s).
   * 'rounds': one entry per round (For Time: N entries, possibly varying reps; Chipper: 1 entry of many lines).
   * 'cycle': exactly 1 entry, reused every round (AMRAP).
   * 'perInterval': one entry per distinct interval exercise, cycled by index % length (EMOM).
   */
  lines: WodLine[][];
  /** 'rounds': round count (Chipper = 1). 'perInterval': total intervals. */
  rounds?: number;
  /** 'cycle' / 'perInterval': total WOD duration. */
  durationSeconds?: number;
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
  // perInterval: each entry is its own interval's exercise.
  return block.lines.map(([line]) => ({
    name: line.exercise,
    detail: `${describedOnly(line) ? amountOf(line) : line.target} / min`,
    note: lineNote(line),
  }));
}

// Distinct exercise names in first-seen order, lowercased: "a + b" for two, "a, b, c" for more.
function joinNames(block: Block): string {
  const names = [...new Set(block.lines.flat().map((l) => l.exercise.toLowerCase()))];
  return names.join(names.length === 2 ? ' + ' : ', ');
}

function describeMode(format: Format, block: Block): string {
  if (format.repeat === 'rounds') return sameEveryRound(block) ? `${block.lines.length} ROUNDS FOR TIME` : 'FOR TIME';
  if (format.repeat === 'cycle') return `${(block.durationSeconds ?? 0) / 60}-MIN AMRAP`;
  return `EMOM · ${block.rounds ?? 0}`;
}

function describeContent(format: Format, block: Block): string {
  // A For Time's durationSeconds is its time cap (change for-time-cap).
  const cap = format.repeat === 'rounds' && block.durationSeconds ? ` · ${block.durationSeconds / 60} min cap` : '';
  return describeScheme(format, block) + cap;
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
// A position is a WodSession (round/line for onTarget, minute for perInterval).
// Pure functions of the format + block — the engine and the result labels read them.

export const START_POSITION: WodSession = { roundIdx: 0, exIdx: 0, completedRounds: 0, minuteIdx: 0 };

function lineAt(config: WodConfig, pos: WodSession): WodLine | undefined {
  const { lines } = config.block;
  if (config.format.repeat === 'rounds') return lines[pos.roundIdx]?.[pos.exIdx];
  if (config.format.repeat === 'cycle') return lines[0]?.[pos.exIdx];
  return lines[pos.minuteIdx % lines.length]?.[0];
}

export function targetAt(config: WodConfig, pos: WodSession): number {
  return lineAt(config, pos)?.target ?? 0;
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
  return { label: 'minute', current: Math.min(pos.minuteIdx + 1, total), total };
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
export function capSeconds(config: WodConfig): number | null {
  return config.format.repeat === 'rounds' && config.totalSeconds > 0 ? config.totalSeconds : null;
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
//   perInterval — the clock sets the interval; reps beyond the target count (raw)
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
  /** Uncapped valid reps in the current perInterval interval. */
  raw: number;
  finished: boolean;
  /** Session-clock ms reached so far (frozen at the finishing instant). */
  t: number;
  tagged: TaggedEvent[];
};

export function formatTime(seconds: number): string {
  const s = Math.abs(seconds);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function totalIntervals(config: WodConfig): number {
  return Math.ceil(config.totalSeconds / 60);
}

export function initial(config: WodConfig): EngineState {
  return { pos: START_POSITION, done: 0, raw: 0, finished: false, t: 0, tagged: [] };
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
    const minuteIdx = Math.floor(t / 60000);
    // Move to the interval `t` falls in (at most the last one), so a jump over
    // several intervals ends where stepping through them would.
    const current = Math.min(minuteIdx, total - 1);
    const moved = current === state.pos.minuteIdx
      ? state
      : { ...state, pos: { ...state.pos, minuteIdx: current }, done: 0, raw: 0 };
    // Last interval ended: finish keeping its partial count, on its position.
    if (minuteIdx >= total) return { ...moved, t: total * 60000, finished: true };
    return { ...moved, t };
  }
  const cap = capSeconds(config);
  if (cap != null && t >= cap * 1000) return { ...state, t: cap * 1000, finished: true };
  return { ...state, t };
}

export function apply(config: WodConfig, state: EngineState, event: EngineEvent): EngineState {
  const { repeat } = config.format;
  const s = advanceTo(config, state, event.t);
  const target = targetAt(config, s.pos);
  const ignored = !event.ok || (s.finished && repeat !== 'cycle');
  const tag: TaggedEvent = { t: event.t, ok: event.ok, pos: s.pos, target, counted: !ignored };
  const tagged = [...s.tagged, tag];
  if (ignored) return { ...s, tagged };

  if (repeat === 'perInterval') {
    const raw = s.raw + 1;
    return { ...s, tagged, raw, done: Math.min(raw, target) };
  }

  const done = s.done + 1;
  if (done >= target && !isCompleteAt(config, s.pos)) {
    const next = nextPosition(config, s.pos);
    if (isCompleteAt(config, next)) {
      // Last rep of the WOD: stay on the final position with its final count.
      return { ...s, tagged, done, finished: true };
    }
    return { ...s, tagged, pos: next, done: 0 };
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
  const timerStr =
    config.timerMode === 'remaining' ? formatTime(Math.max(0, config.totalSeconds - elapsed)) :
    config.timerMode === 'minLeft'   ? formatTime(Math.max(0, 60 - (elapsed % 60))) :
    formatTime(elapsed);
  const timerLabel =
    config.timerMode === 'remaining' ? 'remaining' :
    config.timerMode === 'minLeft'   ? 'min left'  : 'elapsed';
  const cap = capSeconds(config);
  return {
    exerciseName: state.finished ? 'DONE' : exerciseNameAt(config, state.pos),
    target: targetAt(config, state.pos),
    done: state.done,
    kpi: kpiAt(config, state.pos),
    timerStr,
    timerLabel: cap != null ? `${timerLabel} · cap ${formatTime(cap)}` : timerLabel,
  };
}
