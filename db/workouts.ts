import type { SQLiteDatabase } from 'expo-sqlite';
import { Block, FORMATS, Format, WodConfig, WodLine, buildSequenceConfig, buildWodConfig } from '@/constants/wod-engine';
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
  target: number;
  repDescription?: WodLine['repDescription'];
  load?: string;
  /** EMOM only: reps added each time the line's interval comes round, absent at 0 (change emom-progressive-reps). */
  increment?: number;
};
export type StoredBlock = {
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

// Strict on purpose: an unknown format or exercise, or a scoring block out of
// range, can't be stored by the app, so a throw is a bug.
// Exported for tests, which build the built-ins from the frozen v2 seed rows.
export function parseWorkoutRow(row: WorkoutRow, exerciseNames: Map<string, string>): Workout {
  const blocks: StoredBlock[] = JSON.parse(row.blocks);
  if (blocks.length === 0) throw new Error(`Workout ${row.id}: no blocks`);
  const parsed = blocks.map((stored) => parseBlock(row.id, stored, exerciseNames));
  // One block: exactly today's config. Several: one config per block, wrapped (change multi-block-workouts).
  const configs = parsed.map(({ block, format }) => buildWodConfig({ id: row.id, name: row.name, block }, format));
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

function parseBlock(id: string, stored: StoredBlock, exerciseNames: Map<string, string>): { block: Block; format: Format } {
  const format = FORMATS[stored.formatId];
  if (!format) throw new Error(`Workout ${id}: unknown format ${stored.formatId}`);

  const block: Block = {
    rounds: stored.rounds,
    durationSeconds: stored.durationSeconds,
    intervalSeconds: stored.intervalSeconds,
    stopOnMiss: stored.stopOnMiss,
    restSeconds: stored.restSeconds,
    workSeconds: stored.workSeconds,
    lines: stored.lines.map((round) =>
      round.map((line) => {
        const exercise = exerciseNames.get(line.exerciseId);
        if (exercise == null) throw new Error(`Workout ${id}: unknown exercise ${line.exerciseId}`);
        return {
          exerciseId: line.exerciseId,
          exercise,
          target: line.target,
          repDescription: line.repDescription,
          load: line.load,
          increment: line.increment,
        };
      }),
    ),
  };
  return { block, format };
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
