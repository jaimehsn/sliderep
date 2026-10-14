import { SQLiteDatabase } from 'expo-sqlite';

// `app_state` is a single-row table (row id always 1), same convention as
// `athlete_profile` — a no-row read means "not done yet" rather than needing
// a seeded default row.
export async function getFirstRunDone(db: SQLiteDatabase): Promise<boolean> {
  const row = await db.getFirstAsync<{ firstRunDone: number }>(
    'SELECT firstRunDone FROM app_state WHERE id = 1',
  );
  return row?.firstRunDone === 1;
}

export async function setFirstRunDone(db: SQLiteDatabase): Promise<void> {
  await db.runAsync('INSERT OR REPLACE INTO app_state (id, firstRunDone) VALUES (1, 1)');
}
