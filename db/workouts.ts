import { SQLiteDatabase } from 'expo-sqlite';
import { Block, FORMATS, WodConfig, WodLine, buildWodConfig } from '@/constants/wod-engine';

/** A workout ready to run: its stored id plus the config the engine built from it. */
export type Workout = { id: string; config: WodConfig };

type WorkoutRow = { id: string; name: string; blocks: string };

type StoredLine = { exerciseId: string; target: number; repDescription?: WodLine['repDescription'] };
type StoredBlock = {
  formatId: string;
  lines: StoredLine[][];
  rounds?: number;
  durationSeconds?: number;
};

// Strict on purpose: rows this can't read can't exist until engine v2 (change C)
// widens the stored shape, and C widens this parser with it. A throw is a bug.
function toWorkout(row: WorkoutRow, exerciseNames: Map<string, string>): Workout {
  const blocks: StoredBlock[] = JSON.parse(row.blocks);
  if (blocks.length !== 1) throw new Error(`Workout ${row.id}: expected 1 block, got ${blocks.length}`);
  const [stored] = blocks;
  const format = FORMATS[stored.formatId];
  if (!format) throw new Error(`Workout ${row.id}: unknown format ${stored.formatId}`);

  const block: Block = {
    rounds: stored.rounds,
    durationSeconds: stored.durationSeconds,
    lines: stored.lines.map((round) =>
      round.map((line) => {
        const exercise = exerciseNames.get(line.exerciseId);
        if (exercise == null) throw new Error(`Workout ${row.id}: unknown exercise ${line.exerciseId}`);
        return { exercise, target: line.target, repDescription: line.repDescription };
      }),
    ),
  };
  return { id: row.id, config: buildWodConfig({ id: row.id, name: row.name, block }, format) };
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
      'SELECT id, name, blocks FROM workouts WHERE archivedAt IS NULL ORDER BY createdAt, rowid',
    ),
    getExerciseNames(db),
  ]);
  return rows.map((row) => toWorkout(row, names));
}

/** Any workout by id, archived or not — saved sessions must keep resolving theirs. */
export async function getWorkout(db: SQLiteDatabase, id: string): Promise<Workout | null> {
  const [row, names] = await Promise.all([
    db.getFirstAsync<WorkoutRow>('SELECT id, name, blocks FROM workouts WHERE id = ?', [id]),
    getExerciseNames(db),
  ]);
  return row ? toWorkout(row, names) : null;
}
