import type { SQLiteDatabase } from 'expo-sqlite';
import { Structure, Window, WodConfig, WodLine, buildSequenceConfig, buildWodConfig } from '@/constants/wod-engine';
import { makeId } from '@/db/sessions';

/**
 * A workout ready to run: its stored id, who it belongs to (`builtin` rows have
 * no owner; a `user` row's owner is null only once its profile was deleted while
 * a kept session still used it), and the config the engine built from it.
 */
export type Workout = { id: string; origin: 'builtin' | 'user'; ownerId: string | null; config: WodConfig };

/** `scoringBlock`: the index of the block that scores, 0 when absent (change multi-block-workouts). */
export type WorkoutRow = { id: string; name: string; blocks: string; scoringBlock?: number; origin?: string; ownerId?: string | null };

export type StoredLine = {
  exerciseId: string;
  /** Absent only on a MAX line. */
  target?: number;
  repDescription?: WodLine['repDescription'];
  load?: string;
  /** EMOM only: reps added each time the line's interval comes round, absent at 0 (change emom-progressive-reps). */
  increment?: number;
  /** A MAX line (change max-lines): window-shaped interval blocks only, with no target or increment. */
  max?: true;
};
/** The layout every block had before change shared-clock: the built-ins' and older own workouts'. Still read, no longer written. */
export type LegacyStoredBlock = {
  formatId: string;
  lines: StoredLine[][];
  rounds?: number;
  durationSeconds?: number;
  /** EMOM only: interval length in seconds, absent at the default 60 (change emom-interval-length). */
  intervalSeconds?: number;
  /** EMOM only: stop at the first missed interval, absent when off (change emom-progressive-reps). */
  stopOnMiss?: boolean;
  /** For Time only: rest between rounds in seconds, absent when none (change rest-steps). */
  restSeconds?: number;
  /** EMOM only: work time per interval in seconds, the rest of it is rest; absent when none (change rest-steps). */
  workSeconds?: number;
  /** Every block but the last: rest after it in seconds, absent when none (change multi-block-workouts). */
  restAfterSeconds?: number;
};

/** A stored part of a continuous window (change shared-clock): rounds (one entry per round), or a final cycle. */
export type StoredStructure =
  | { kind: 'rounds'; rounds: StoredLine[][]; restSeconds?: number }
  | { kind: 'cycle'; lines: StoredLine[] };

/**
 * The layout the editor writes since change shared-clock: the window itself — a clock
 * plus its parts, or an interval clock plus its sequence (each entry's lines). Optional
 * fields are stored only when set.
 */
export type StoredWindowBlock = (
  | { clock: { kind: 'continuous'; limitSeconds?: number }; structures: StoredStructure[] }
  | { clock: { kind: 'intervals'; everySeconds: number; count: number; workSeconds?: number; stopOnMiss?: boolean }; intervals: StoredLine[][] }
) & { restAfterSeconds?: number };

/** Either layout, told apart by `clock` (change shared-clock): both are read, only the window one is written. */
export type StoredBlock = LegacyStoredBlock | StoredWindowBlock;

export function isWindowBlock(block: StoredBlock): block is StoredWindowBlock {
  return 'clock' in block;
}

// Strict on purpose: an unknown format or exercise, a block breaking the
// invariants below, or a scoring block out of range can't be stored by the app,
// so a throw is a bug.
// Exported for tests, which build the built-ins from the frozen v2 seed rows.
export function parseWorkoutRow(row: WorkoutRow, exerciseNames: Map<string, string>): Workout {
  const blocks: StoredBlock[] = JSON.parse(row.blocks);
  if (blocks.length === 0) throw new Error(`Workout ${row.id}: no blocks`);
  // One block: one window's config. Several: one config per block, wrapped (change multi-block-workouts).
  const configs = blocks.map((stored) => buildWodConfig(row.name, windowFromStored(row.id, stored, exerciseNames)));
  let config = configs[0];
  if (configs.length > 1) {
    const scoringBlock = row.scoringBlock ?? 0;
    if (scoringBlock < 0 || scoringBlock >= configs.length) throw new Error(`Workout ${row.id}: no block ${scoringBlock} to score`);
    config = buildSequenceConfig(row.name, configs, blocks.map((b) => b.restAfterSeconds ?? 0), scoringBlock);
  }
  return {
    id: row.id,
    origin: row.origin === 'user' ? 'user' : 'builtin',
    ownerId: row.ownerId ?? null,
    config,
  };
}

/**
 * A stored block as a window (change window-model): the stored layout stays the
 * editor's and the seed's, translated on read.
 *   forTime → continuous (cap = `durationSeconds`) holding `rounds` (one `lines` entry per round, `rounds` of them)
 *   amrap   → continuous (limit = `durationSeconds`) holding `cycle` (exactly one `lines` entry)
 *   emom    → intervals of `intervalSeconds ?? 60`, `rounds` of them (`durationSeconds` = their total),
 *             each `lines` entry one `once` of the rotating sequence
 */
function windowFromStored(id: string, stored: StoredBlock, exerciseNames: Map<string, string>): Window {
  const fail = (why: string): never => {
    throw new Error(`Workout ${id}: ${why}`);
  };
  if (isWindowBlock(stored)) return windowFromWindowBlock(id, stored, exerciseNames);
  const lines = stored.lines.map((round) => round.map((line) => parseLine(id, line, exerciseNames, false)));
  if (stored.formatId === 'forTime') {
    if (lines.length === 0 || stored.rounds !== lines.length) fail(`For Time with ${stored.rounds} rounds and ${lines.length} round entries`);
    const rounds: Structure = { kind: 'rounds', rounds: lines, ...(stored.restSeconds != null ? { restSeconds: stored.restSeconds } : {}) };
    return { clock: { kind: 'continuous', ...(stored.durationSeconds ? { limitSeconds: stored.durationSeconds } : {}) }, structures: [rounds] };
  }
  if (stored.formatId === 'amrap') {
    if (lines.length !== 1) fail(`AMRAP with ${lines.length} line entries`);
    if (!stored.durationSeconds) fail('AMRAP without a duration');
    return { clock: { kind: 'continuous', limitSeconds: stored.durationSeconds }, structures: [{ kind: 'cycle', lines: lines[0] }] };
  }
  if (stored.formatId === 'emom') {
    const every = stored.intervalSeconds ?? 60;
    const count = stored.rounds ?? 0;
    if (lines.length === 0 || count < 1) fail('EMOM without intervals');
    if (stored.durationSeconds !== count * every) fail(`EMOM of ${count} × ${every} s lasting ${stored.durationSeconds} s`);
    return {
      clock: {
        kind: 'intervals',
        everySeconds: every,
        count,
        ...(stored.workSeconds != null ? { workSeconds: stored.workSeconds } : {}),
        ...(stored.stopOnMiss ? { stopOnMiss: true } : {}),
      },
      intervals: lines.map((entry) => [{ kind: 'once', lines: entry }]),
    };
  }
  return fail(`unknown format ${stored.formatId}`);
}

/**
 * A stored window block (change shared-clock): mirrors the window one-to-one, so only
 * the exercise names are resolved and the limits checked; the window's own shape
 * rules (a cycle only last and with a limit, no empty part) are `buildWodConfig`'s.
 */
function windowFromWindowBlock(id: string, stored: StoredWindowBlock, exerciseNames: Map<string, string>): Window {
  const fail = (why: string): never => {
    throw new Error(`Workout ${id}: ${why}`);
  };
  const toLines = (lines: StoredLine[]) => lines.map((line) => parseLine(id, line, exerciseNames, false));
  const toIntervalLines = (lines: StoredLine[]) => lines.map((line) => parseLine(id, line, exerciseNames, true));
  if ('intervals' in stored) {
    const { everySeconds, count, workSeconds, stopOnMiss } = stored.clock as Extract<StoredWindowBlock, { intervals: unknown }>['clock'];
    if (!(everySeconds >= 10 && everySeconds <= 600)) fail(`interval of ${everySeconds} s`);
    if (!(count >= 1)) fail('no intervals');
    if (workSeconds != null && !(workSeconds >= 1 && workSeconds < everySeconds)) fail(`work time of ${workSeconds} s`);
    if (stored.intervals.length === 0 || stored.intervals.some((entry) => entry.length === 0)) fail('an empty interval');
    return {
      clock: {
        kind: 'intervals',
        everySeconds,
        count,
        ...(workSeconds != null ? { workSeconds } : {}),
        ...(stopOnMiss ? { stopOnMiss: true } : {}),
      },
      intervals: stored.intervals.map((entry) => [{ kind: 'once', lines: toIntervalLines(entry) }]),
    };
  }
  if (stored.clock.kind !== 'continuous') fail(`unknown clock ${stored.clock.kind}`);
  const { limitSeconds } = stored.clock as { limitSeconds?: number };
  if (limitSeconds != null && !(limitSeconds > 0)) fail(`time limit of ${limitSeconds} s`);
  const structures: Structure[] = stored.structures.map((s) => {
    if (s.kind === 'rounds') {
      return { kind: 'rounds', rounds: s.rounds.map(toLines), ...(s.restSeconds != null ? { restSeconds: s.restSeconds } : {}) };
    }
    if (s.kind === 'cycle') return { kind: 'cycle', lines: toLines(s.lines) };
    return fail(`unknown structure ${(s as { kind: string }).kind}`);
  });
  return { clock: { kind: 'continuous', ...(limitSeconds != null ? { limitSeconds } : {}) }, structures };
}

// `maxAllowed`: a window-shaped interval block's line, the only place a MAX line is stored (change max-lines).
function parseLine(id: string, line: StoredLine, exerciseNames: Map<string, string>, maxAllowed: boolean): WodLine {
  const exercise = exerciseNames.get(line.exerciseId);
  if (exercise == null) throw new Error(`Workout ${id}: unknown exercise ${line.exerciseId}`);
  if (line.max) {
    if (!maxAllowed) throw new Error(`Workout ${id}: a MAX line outside an interval block`);
    if (line.target != null || line.increment != null) throw new Error(`Workout ${id}: a MAX line with reps or an increment`);
    return { exerciseId: line.exerciseId, exercise, target: 0, repDescription: line.repDescription, load: line.load, max: true };
  }
  if (typeof line.target !== 'number') throw new Error(`Workout ${id}: a line without reps`);
  return {
    exerciseId: line.exerciseId,
    exercise,
    target: line.target,
    repDescription: line.repDescription,
    load: line.load,
    increment: line.increment,
  };
}

// Unfiltered on purpose (unlike db/exercises.ts's getExercises): an archived
// exercise must still name itself inside the workouts that use it.
async function getExerciseNames(db: SQLiteDatabase): Promise<Map<string, string>> {
  const rows = await db.getAllAsync<{ id: string; name: string }>('SELECT id, name FROM exercises');
  return new Map(rows.map((r) => [r.id, r.name]));
}

/** Workouts that can be picked: non-archived, in insertion order (rowid breaks the v2 seed's shared createdAt). */
export async function listWorkouts(db: SQLiteDatabase): Promise<Workout[]> {
  const [rows, names] = await Promise.all([
    db.getAllAsync<WorkoutRow>(
      'SELECT id, name, blocks, scoringBlock, origin, ownerId FROM workouts WHERE archivedAt IS NULL ORDER BY createdAt, rowid',
    ),
    getExerciseNames(db),
  ]);
  return rows.map((row) => parseWorkoutRow(row, names));
}

/** Any workout by id, archived or not — saved sessions must keep resolving theirs. */
export async function getWorkout(db: SQLiteDatabase, id: string): Promise<Workout | null> {
  const [row, names] = await Promise.all([
    db.getFirstAsync<WorkoutRow>('SELECT id, name, blocks, scoringBlock, origin, ownerId FROM workouts WHERE id = ?', [id]),
    getExerciseNames(db),
  ]);
  return row ? parseWorkoutRow(row, names) : null;
}

/** True when the workout belongs to this profile — the only workouts that can be archived. */
export function isOwn(workout: Workout, profileId: string | null | undefined): boolean {
  return workout.origin === 'user' && profileId != null && workout.ownerId === profileId;
}

/** `blocks`: one or more; `scoringBlock`: the index of the block that scores (change multi-block-workouts). */
export type NewWorkout = { name: string; blocks: StoredBlock[]; scoringBlock: number; ownerId: string; derivedFrom: string | null };

/** Inserts a new user workout and returns its id. Never touches an existing row. */
export async function createWorkout(db: SQLiteDatabase, input: NewWorkout): Promise<string> {
  const id = makeId();
  await db.runAsync(
    `INSERT INTO workouts (id, name, blocks, scoringBlock, origin, ownerId, derivedFrom, createdAt)
     VALUES (?, ?, ?, ?, 'user', ?, ?, ?)`,
    [id, input.name, JSON.stringify(input.blocks), input.scoringBlock, input.ownerId, input.derivedFrom, Date.now()],
  );
  return id;
}

/** Archives one of the owner's workouts. Built-ins and other owners' rows never match. */
export async function archiveWorkout(db: SQLiteDatabase, id: string, ownerId: string): Promise<void> {
  await db.runAsync(
    `UPDATE workouts SET archivedAt = ? WHERE id = ? AND origin = 'user' AND ownerId = ? AND archivedAt IS NULL`,
    [Date.now(), id, ownerId],
  );
}
