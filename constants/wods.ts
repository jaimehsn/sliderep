export type WodType = 'forTime' | 'amrap' | 'emom' | 'chipper';

/** Header progress: `current` of `total` (e.g. round 2/3), or just `current` when there is no total (AMRAP). */
export type WodKpi = { label: string; current: number; total: number | null };

export type WodSession = {
  roundIdx: number;
  exIdx: number;
  completedRounds: number;
  minuteIdx: number;
  stationIdx: number;
};

export type WodExercise = { name: string; detail: string };

export type WodConfig = {
  mode: string;
  name: string;
  timerMode: 'elapsed' | 'remaining' | 'minLeft';
  totalSeconds: number;
  /** onTarget: advance() fires as soon as the target is reached. onClock: only the clock advances (extra reps are ignored). */
  advanceMode: 'onTarget' | 'onClock';
  exercises: WodExercise[];
  initialSession: WodSession;
  getTarget: (s: WodSession) => number;
  getExerciseName: (s: WodSession) => string;
  getKpi: (s: WodSession) => WodKpi;
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
  advanceMode: 'onTarget',
  exercises: [
    { name: 'THRUSTERS', detail: '21 · 15 · 9' },
    { name: 'PULL-UPS',  detail: '21 · 15 · 9' },
  ],
  initialSession: { roundIdx: 0, exIdx: 0, completedRounds: 0, minuteIdx: 0, stationIdx: 0 },
  getTarget: (s) => FRAN_ROUNDS[s.roundIdx]?.[s.exIdx] ?? 0,
  getExerciseName: (s) => FRAN_EXERCISES[s.exIdx] ?? 'DONE',
  getKpi: (s) => ({
    label: 'round',
    current: Math.min(s.roundIdx + 1, FRAN_ROUNDS.length),
    total: FRAN_ROUNDS.length,
  }),
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
  advanceMode: 'onTarget',
  exercises: [
    { name: 'PULL-UPS',   detail: '5 reps' },
    { name: 'PUSH-UPS',   detail: '10 reps' },
    { name: 'AIR SQUATS', detail: '15 reps' },
  ],
  initialSession: { roundIdx: 0, exIdx: 0, completedRounds: 0, minuteIdx: 0, stationIdx: 0 },
  getTarget: (s) => CINDY_REPS[s.exIdx] ?? 0,
  getExerciseName: (s) => CINDY_EXERCISES[s.exIdx] ?? 'DONE',
  getKpi: (s) => ({ label: 'rounds', current: s.completedRounds, total: null }),
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

const emomConfig: WodConfig = {
  mode: 'EMOM · 10',
  name: 'EVERY MINUTE',
  timerMode: 'minLeft',
  totalSeconds: 10 * 60,
  advanceMode: 'onClock',
  exercises: [
    { name: 'BURPEES',   detail: '10 / min' },
    { name: 'KB SWINGS', detail: '15 / min' },
  ],
  initialSession: { roundIdx: 0, exIdx: 0, completedRounds: 0, minuteIdx: 0, stationIdx: 0 },
  getTarget: (s) => EMOM_MINUTES[s.minuteIdx % EMOM_MINUTES.length].target,
  getExerciseName: (s) => EMOM_MINUTES[s.minuteIdx % EMOM_MINUTES.length].ex,
  getKpi: (s) => ({
    label: 'minute',
    current: Math.min(s.minuteIdx + 1, TOTAL_MINUTES),
    total: TOTAL_MINUTES,
  }),
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

const chipperConfig: WodConfig = {
  mode: 'CHIPPER',
  name: 'FILTHY FIFTY',
  timerMode: 'elapsed',
  totalSeconds: 0,
  advanceMode: 'onTarget',
  exercises: CHIPPER_EXERCISES.map((e) => ({ name: e.name, detail: '50 reps' })),
  initialSession: { roundIdx: 0, exIdx: 0, completedRounds: 0, minuteIdx: 0, stationIdx: 0 },
  getTarget: (s) => CHIPPER_EXERCISES[s.stationIdx]?.target ?? 0,
  getExerciseName: (s) => CHIPPER_EXERCISES[s.stationIdx]?.name ?? 'DONE',
  getKpi: (s) => ({
    label: 'station',
    current: Math.min(s.stationIdx + 1, CHIPPER_EXERCISES.length),
    total: CHIPPER_EXERCISES.length,
  }),
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
