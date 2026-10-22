import { SQLiteDatabase } from 'expo-sqlite';

export type ExerciseCategory = 'GYMNASTICS' | 'WEIGHTLIFTING' | 'MONOSTRUCTURAL';

/** Display order for category groups. */
export const EXERCISE_CATEGORIES: ExerciseCategory[] = ['GYMNASTICS', 'WEIGHTLIFTING', 'MONOSTRUCTURAL'];

export type Exercise = { id: string; name: string; category: ExerciseCategory };

// `category` is nullable in SQL (added by v5 with `ADD COLUMN`), but v5 fills it
// for every row and nothing else writes exercises yet — required here.
export async function getExercises(db: SQLiteDatabase): Promise<Exercise[]> {
  return db.getAllAsync<Exercise>(
    'SELECT id, name, category FROM exercises WHERE archivedAt IS NULL ORDER BY name',
  );
}
