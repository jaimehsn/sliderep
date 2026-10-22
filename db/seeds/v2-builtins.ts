// Migration snapshot for schema v2 (B18) — NEVER EDIT.
//
// These are exactly the rows `buildBuiltinSeed` (since removed) derived from
// `constants/wods.ts` when v2 shipped. Frozen as literals so later changes to
// the constants can't alter what a fresh install seeds. A change to built-in
// content is a new migration with its own seed file, never an edit here.
// `createdAt` is supplied by the migration at run time.

export type V2FormatRow = { id: string; version: number; definition: string; engineVersion: number; origin: string };
export type V2ExerciseRow = { id: string; name: string; origin: string };
export type V2WorkoutRow = { id: string; name: string; blocks: string; scoringBlock: number; origin: string };

export const V2_FORMATS: V2FormatRow[] = [
  {
    id: 'forTime',
    version: 1,
    definition: '{"id":"forTime","version":1,"repeat":"rounds","advance":"onTarget","timer":"elapsed","stop":"whenAllDone","score":"time"}',
    engineVersion: 1,
    origin: 'builtin',
  },
  {
    id: 'amrap',
    version: 1,
    definition: '{"id":"amrap","version":1,"repeat":"cycle","advance":"onTarget","timer":"countdown","stop":"atDuration","score":"roundsPlusReps"}',
    engineVersion: 1,
    origin: 'builtin',
  },
  {
    id: 'emom',
    version: 1,
    definition: '{"id":"emom","version":1,"repeat":"perInterval","advance":"onClock","timer":"intervalCountdown","stop":"afterIntervals","score":"intervalsPlusReps"}',
    engineVersion: 1,
    origin: 'builtin',
  },
];

export const V2_EXERCISES: V2ExerciseRow[] = [
  { id: 'thrusters', name: 'THRUSTERS', origin: 'builtin' },
  { id: 'pull-ups', name: 'PULL-UPS', origin: 'builtin' },
  { id: 'push-ups', name: 'PUSH-UPS', origin: 'builtin' },
  { id: 'air-squats', name: 'AIR SQUATS', origin: 'builtin' },
  { id: 'burpees', name: 'BURPEES', origin: 'builtin' },
  { id: 'kb-swings', name: 'KB SWINGS', origin: 'builtin' },
  { id: 'box-jumps', name: 'BOX JUMPS', origin: 'builtin' },
  { id: 'jumping-pull-ups', name: 'JUMPING PULL-UPS', origin: 'builtin' },
  { id: 'walking-lunges', name: 'WALKING LUNGES', origin: 'builtin' },
  { id: 'knees-to-elbows', name: 'KNEES-TO-ELBOWS', origin: 'builtin' },
  { id: 'push-press', name: 'PUSH PRESS', origin: 'builtin' },
  { id: 'back-ext', name: 'BACK EXT.', origin: 'builtin' },
  { id: 'wall-ball', name: 'WALL BALL', origin: 'builtin' },
  { id: 'double-unders', name: 'DOUBLE UNDERS', origin: 'builtin' },
];

export const V2_WORKOUTS: V2WorkoutRow[] = [
  {
    id: 'fran',
    name: 'FRAN',
    blocks: '[{"formatId":"forTime","lines":[[{"exerciseId":"thrusters","target":21},{"exerciseId":"pull-ups","target":21}],[{"exerciseId":"thrusters","target":15},{"exerciseId":"pull-ups","target":15}],[{"exerciseId":"thrusters","target":9},{"exerciseId":"pull-ups","target":9}]],"rounds":3}]',
    scoringBlock: 0,
    origin: 'builtin',
  },
  {
    id: 'cindy',
    name: 'CINDY',
    blocks: '[{"formatId":"amrap","lines":[[{"exerciseId":"pull-ups","target":5},{"exerciseId":"push-ups","target":10},{"exerciseId":"air-squats","target":15}]],"durationSeconds":720}]',
    scoringBlock: 0,
    origin: 'builtin',
  },
  {
    id: 'everyMinute',
    name: 'EVERY MINUTE',
    blocks: '[{"formatId":"emom","lines":[[{"exerciseId":"burpees","target":10}],[{"exerciseId":"kb-swings","target":15}]],"rounds":10,"durationSeconds":600}]',
    scoringBlock: 0,
    origin: 'builtin',
  },
  {
    id: 'filthyFifty',
    name: 'FILTHY FIFTY',
    blocks: '[{"formatId":"forTime","lines":[[{"exerciseId":"box-jumps","target":50},{"exerciseId":"jumping-pull-ups","target":50},{"exerciseId":"kb-swings","target":50},{"exerciseId":"walking-lunges","target":50},{"exerciseId":"knees-to-elbows","target":50},{"exerciseId":"push-press","target":50},{"exerciseId":"back-ext","target":50},{"exerciseId":"wall-ball","target":50},{"exerciseId":"burpees","target":50},{"exerciseId":"double-unders","target":50}]],"rounds":1}]',
    scoringBlock: 0,
    origin: 'builtin',
  },
];
