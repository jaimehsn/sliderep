// The interpreter: turns a declarative WodDefinition + Format into a WodConfig.
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

export type WodExercise = { name: string; detail: string };

export type WodConfig = {
  mode: string;
  name: string;
  timerMode: 'elapsed' | 'remaining' | 'minLeft';
  totalSeconds: number;
  /** onTarget: advance() fires as soon as the target is reached. onClock: only the clock advances (extra reps are ignored). */
  advanceMode: 'onTarget' | 'onClock';
  /** The built-in Format's version — stored on a saved session so replay always uses the pinned engine semantics. */
  engineVersion: number;
  exercises: WodExercise[];
  initialSession: WodSession;
  getTarget: (s: WodSession) => number;
  getExerciseName: (s: WodSession) => string;
  getKpi: (s: WodSession) => WodKpi;
  advance: (s: WodSession) => WodSession;
  isComplete: (s: WodSession) => boolean;
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

// ─── WOD content ────────────────────────────────────────────────────────────

export type WodLine = {
  exercise: string;
  /** Always reps (see docs/ROADMAP.md → WOD hierarchy). Purely descriptive, never computed on. */
  target: number;
  repDescription?: { amount: number; unit: 'm' | 'cal' | 's' };
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
  mode: string;
  block: Block;
};

// ─── Interpreter ────────────────────────────────────────────────────────────

function summarize(format: Format, block: Block): WodExercise[] {
  if (format.repeat === 'rounds' && block.rounds === 1) {
    // Chipper: each line is its own station.
    return block.lines[0].map((l) => ({ name: l.exercise, detail: `${l.target} reps` }));
  }
  if (format.repeat === 'rounds') {
    // For Time: a fixed exercise order repeated every round, reps vary per round.
    const firstRound = block.lines[0];
    return firstRound.map((_, exIdx) => ({
      name: firstRound[exIdx].exercise,
      detail: block.lines.map((round) => round[exIdx]?.target ?? 0).join(' · '),
    }));
  }
  if (format.repeat === 'cycle') {
    // AMRAP: a single template, reps fixed every round.
    return block.lines[0].map((l) => ({ name: l.exercise, detail: `${l.target} reps` }));
  }
  // perInterval: each entry is its own interval's exercise.
  return block.lines.map((roundLines) => ({ name: roundLines[0].exercise, detail: `${roundLines[0].target} / min` }));
}

export function buildWodConfig(definition: WodDefinition, format: Format): WodConfig {
  const { block } = definition;

  const timerMode: WodConfig['timerMode'] =
    format.timer === 'elapsed' ? 'elapsed' : format.timer === 'countdown' ? 'remaining' : 'minLeft';

  let getTarget: WodConfig['getTarget'];
  let getExerciseName: WodConfig['getExerciseName'];
  let getKpi: WodConfig['getKpi'];
  let advance: WodConfig['advance'];
  let isComplete: WodConfig['isComplete'];

  if (format.repeat === 'rounds') {
    getTarget = (s) => block.lines[s.roundIdx]?.[s.exIdx]?.target ?? 0;
    getExerciseName = (s) => block.lines[s.roundIdx]?.[s.exIdx]?.exercise ?? 'DONE';
    advance = (s) => {
      const roundLines = block.lines[s.roundIdx]?.length ?? 0;
      const nextEx = s.exIdx + 1;
      return nextEx >= roundLines ? { ...s, roundIdx: s.roundIdx + 1, exIdx: 0 } : { ...s, exIdx: nextEx };
    };
    isComplete = (s) => s.roundIdx >= (block.rounds ?? 0);
    getKpi = (s) => {
      if (block.rounds === 1) {
        const total = block.lines[0]?.length ?? 0;
        return { label: 'station', current: Math.min(s.exIdx + 1, total), total };
      }
      const total = block.rounds ?? 0;
      return { label: 'round', current: Math.min(s.roundIdx + 1, total), total };
    };
  } else if (format.repeat === 'cycle') {
    getTarget = (s) => block.lines[0]?.[s.exIdx]?.target ?? 0;
    getExerciseName = (s) => block.lines[0]?.[s.exIdx]?.exercise ?? 'DONE';
    advance = (s) => {
      const roundLines = block.lines[0]?.length ?? 0;
      const nextEx = s.exIdx + 1;
      return nextEx >= roundLines
        ? { ...s, exIdx: 0, roundIdx: s.roundIdx + 1, completedRounds: s.completedRounds + 1 }
        : { ...s, exIdx: nextEx };
    };
    isComplete = () => false;
    getKpi = (s) => ({ label: 'rounds', current: s.completedRounds, total: null });
  } else {
    // 'perInterval'
    getTarget = (s) => block.lines[s.minuteIdx % block.lines.length]?.[0]?.target ?? 0;
    getExerciseName = (s) => block.lines[s.minuteIdx % block.lines.length]?.[0]?.exercise ?? 'DONE';
    advance = (s) => ({ ...s, minuteIdx: s.minuteIdx + 1 });
    isComplete = (s) => s.minuteIdx >= (block.rounds ?? 0);
    getKpi = (s) => {
      const total = block.rounds ?? 0;
      return { label: 'minute', current: Math.min(s.minuteIdx + 1, total), total };
    };
  }

  return {
    mode: definition.mode,
    name: definition.name,
    timerMode,
    totalSeconds: block.durationSeconds ?? 0,
    advanceMode: format.advance,
    engineVersion: format.version,
    exercises: summarize(format, block),
    initialSession: { roundIdx: 0, exIdx: 0, completedRounds: 0, minuteIdx: 0 },
    getTarget,
    getExerciseName,
    getKpi,
    advance,
    isComplete,
  };
}
