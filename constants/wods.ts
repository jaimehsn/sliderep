export type WodType = 'forTime' | 'amrap' | 'emom' | 'chipper';

export type SegItem = {
  name: string;
  target: number;
  filled: number;
  isCurrent: boolean;
};

export type WodSession = {
  roundIdx: number;
  exIdx: number;
  completedRounds: number;
  minuteIdx: number;
  stationIdx: number;
};

export type WodConfig = {
  mode: string;
  name: string;
  timerMode: 'elapsed' | 'remaining' | 'minLeft';
  totalSeconds: number;
  initialSession: WodSession;
  getTarget: (s: WodSession) => number;
  getExerciseName: (s: WodSession) => string;
  getKpi: (s: WodSession) => { label: string; value: string; sub: string };
  getSectionLabel: (s: WodSession) => string;
  getSegments: (s: WodSession, done: number) => SegItem[];
  getHint: (s: WodSession, done: number) => string;
  advance: (s: WodSession) => WodSession;
  isComplete: (s: WodSession) => boolean;
};

// ─── For Time: FRAN 21-15-9 ──────────────────────────────────────────────────

const FRAN_ROUNDS = [[21, 21], [15, 15], [9, 9]];
const FRAN_EXERCISES = ['THRUSTERS', 'PULL-UPS'];

const forTimeConfig: WodConfig = {
  mode: 'FOR TIME',
  name: 'FRAN',
  timerMode: 'elapsed',
  totalSeconds: 0,
  initialSession: { roundIdx: 0, exIdx: 0, completedRounds: 0, minuteIdx: 0, stationIdx: 0 },
  getTarget: (s) => FRAN_ROUNDS[s.roundIdx]?.[s.exIdx] ?? 0,
  getExerciseName: (s) => FRAN_EXERCISES[s.exIdx] ?? 'DONE',
  getKpi: (s) => ({
    label: 'round',
    value: `${s.roundIdx + 1}/${FRAN_ROUNDS.length}`,
    sub: 'FRAN',
  }),
  getSectionLabel: (s) => `round ${s.roundIdx + 1} — in progress`,
  getSegments: (s, done) =>
    FRAN_EXERCISES.map((name, i) => ({
      name,
      target: FRAN_ROUNDS[s.roundIdx]?.[i] ?? 0,
      filled: i < s.exIdx ? (FRAN_ROUNDS[s.roundIdx]?.[i] ?? 0) : i === s.exIdx ? done : 0,
      isCurrent: i === s.exIdx,
    })),
  getHint: (s, done) => {
    const target = FRAN_ROUNDS[s.roundIdx]?.[s.exIdx] ?? 0;
    const next = FRAN_EXERCISES[s.exIdx + 1] ?? `round ${s.roundIdx + 2}`;
    return `${Math.max(target - done, 0)} reps to go · next: ${next}`;
  },
  advance: (s) => {
    const nextEx = s.exIdx + 1;
    if (nextEx >= FRAN_EXERCISES.length) {
      return { ...s, roundIdx: s.roundIdx + 1, exIdx: 0 };
    }
    return { ...s, exIdx: nextEx };
  },
  isComplete: (s) => s.roundIdx >= FRAN_ROUNDS.length,
};

// ─── AMRAP: CINDY 12-min ─────────────────────────────────────────────────────

const CINDY_EXERCISES = ['PULL-UPS', 'PUSH-UPS', 'AIR SQUATS'];
const CINDY_REPS = [5, 10, 15];

const amrapConfig: WodConfig = {
  mode: '12-MIN AMRAP',
  name: 'CINDY',
  timerMode: 'remaining',
  totalSeconds: 12 * 60,
  initialSession: { roundIdx: 0, exIdx: 0, completedRounds: 0, minuteIdx: 0, stationIdx: 0 },
  getTarget: (s) => CINDY_REPS[s.exIdx] ?? 0,
  getExerciseName: (s) => CINDY_EXERCISES[s.exIdx] ?? 'DONE',
  getKpi: (s) => ({
    label: 'rounds',
    value: `${s.completedRounds}`,
    sub: 'completed',
  }),
  getSectionLabel: (s) => `round ${s.roundIdx + 1} — in progress`,
  getSegments: (s, done) =>
    CINDY_EXERCISES.map((name, i) => ({
      name,
      target: CINDY_REPS[i],
      filled: i < s.exIdx ? CINDY_REPS[i] : i === s.exIdx ? done : 0,
      isCurrent: i === s.exIdx,
    })),
  getHint: (s, done) => {
    const target = CINDY_REPS[s.exIdx] ?? 0;
    const next = CINDY_EXERCISES[s.exIdx + 1] ?? `round ${s.roundIdx + 2}`;
    return `${Math.max(target - done, 0)} reps to go · next: ${next}`;
  },
  advance: (s) => {
    const nextEx = s.exIdx + 1;
    if (nextEx >= CINDY_EXERCISES.length) {
      return { ...s, exIdx: 0, roundIdx: s.roundIdx + 1, completedRounds: s.completedRounds + 1 };
    }
    return { ...s, exIdx: nextEx };
  },
  isComplete: () => false,
};

// ─── EMOM: 10-min alternating ────────────────────────────────────────────────

const EMOM_MINUTES = [
  { ex: 'BURPEES', target: 10 },
  { ex: 'KB SWINGS', target: 15 },
];
const TOTAL_MINUTES = 10;
const EMOM_WINDOW = 4;

const emomConfig: WodConfig = {
  mode: 'EMOM · 10',
  name: 'EVERY MINUTE',
  timerMode: 'minLeft',
  totalSeconds: 10 * 60,
  initialSession: { roundIdx: 0, exIdx: 0, completedRounds: 0, minuteIdx: 0, stationIdx: 0 },
  getTarget: (s) => EMOM_MINUTES[s.minuteIdx % EMOM_MINUTES.length].target,
  getExerciseName: (s) => EMOM_MINUTES[s.minuteIdx % EMOM_MINUTES.length].ex,
  getKpi: (s) => ({
    label: 'minute',
    value: `${s.minuteIdx + 1}/${TOTAL_MINUTES}`,
    sub: 'every minute',
  }),
  getSectionLabel: (s) => `minute ${s.minuteIdx + 1} — in progress`,
  getSegments: (s, done) =>
    Array.from({ length: EMOM_WINDOW }, (_, k) => {
      const mi = s.minuteIdx + k;
      if (mi >= TOTAL_MINUTES) return null;
      const mEx = EMOM_MINUTES[mi % EMOM_MINUTES.length];
      return {
        name: `M${String(mi + 1).padStart(2, '0')} ${mEx.ex.split(' ')[0]}`,
        target: mEx.target,
        filled: k === 0 ? done : 0,
        isCurrent: k === 0,
      };
    }).filter((x): x is SegItem => x !== null),
  getHint: (s, done) => {
    const target = EMOM_MINUTES[s.minuteIdx % EMOM_MINUTES.length].target;
    const nextEx = EMOM_MINUTES[(s.minuteIdx + 1) % EMOM_MINUTES.length].ex;
    return `${Math.max(target - done, 0)} reps · then ${nextEx}`;
  },
  advance: (s) => ({ ...s, minuteIdx: s.minuteIdx + 1 }),
  isComplete: (s) => s.minuteIdx >= TOTAL_MINUTES,
};

// ─── Chipper: Filthy Fifty ────────────────────────────────────────────────────

const CHIPPER_EXERCISES = [
  { name: 'BOX JUMPS', target: 50 },
  { name: 'JUMPING PULL-UPS', target: 50 },
  { name: 'KB SWINGS', target: 50 },
  { name: 'WALKING LUNGES', target: 50 },
  { name: 'KNEES-TO-ELBOWS', target: 50 },
  { name: 'PUSH PRESS', target: 50 },
  { name: 'BACK EXT.', target: 50 },
  { name: 'WALL BALL', target: 50 },
  { name: 'BURPEES', target: 50 },
  { name: 'DOUBLE UNDERS', target: 50 },
];
const CHIPPER_WINDOW = 3;

const chipperConfig: WodConfig = {
  mode: 'CHIPPER',
  name: 'FILTHY FIFTY',
  timerMode: 'elapsed',
  totalSeconds: 0,
  initialSession: { roundIdx: 0, exIdx: 0, completedRounds: 0, minuteIdx: 0, stationIdx: 0 },
  getTarget: (s) => CHIPPER_EXERCISES[s.stationIdx]?.target ?? 0,
  getExerciseName: (s) => CHIPPER_EXERCISES[s.stationIdx]?.name ?? 'DONE',
  getKpi: (s) => ({
    label: 'station',
    value: `${s.stationIdx + 1}/${CHIPPER_EXERCISES.length}`,
    sub: 'FILTHY FIFTY',
  }),
  getSectionLabel: (s) => `station ${s.stationIdx + 1} — in progress`,
  getSegments: (s, done) =>
    Array.from({ length: CHIPPER_WINDOW }, (_, k) => {
      const i = s.stationIdx + k;
      if (i >= CHIPPER_EXERCISES.length) return null;
      const e = CHIPPER_EXERCISES[i];
      return { name: e.name, target: e.target, filled: k === 0 ? done : 0, isCurrent: k === 0 };
    }).filter((x): x is SegItem => x !== null),
  getHint: (s, done) => {
    const target = CHIPPER_EXERCISES[s.stationIdx]?.target ?? 0;
    const next = CHIPPER_EXERCISES[s.stationIdx + 1]?.name ?? 'complete';
    return `${Math.max(target - done, 0)} reps · then ${next}`;
  },
  advance: (s) => ({ ...s, stationIdx: s.stationIdx + 1 }),
  isComplete: (s) => s.stationIdx >= CHIPPER_EXERCISES.length,
};

// ─── Export ──────────────────────────────────────────────────────────────────

export function getWodConfig(type: WodType): WodConfig {
  switch (type) {
    case 'forTime': return forTimeConfig;
    case 'amrap':   return amrapConfig;
    case 'emom':    return emomConfig;
    case 'chipper': return chipperConfig;
  }
}
