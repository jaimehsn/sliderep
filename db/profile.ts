import { SQLiteDatabase } from 'expo-sqlite';
import { makeId } from './sessions';

export type AthleteProfile = { id: string; alias: string; createdAt: number };

// `athlete_profile` is a 0-or-1-row table: no local account system, just
// whether this device has created a profile yet.
export async function getProfile(db: SQLiteDatabase): Promise<AthleteProfile | null> {
  const row = await db.getFirstAsync<AthleteProfile>(
    'SELECT id, alias, createdAt FROM athlete_profile LIMIT 1',
  );
  return row ?? null;
}

export async function createProfile(db: SQLiteDatabase, alias: string): Promise<AthleteProfile> {
  const id = makeId();
  const createdAt = Date.now();
  await db.runAsync('INSERT INTO athlete_profile (id, alias, createdAt) VALUES (?, ?, ?)', [id, alias, createdAt]);
  return { id, alias, createdAt };
}

export async function updateAlias(db: SQLiteDatabase, id: string, alias: string): Promise<void> {
  await db.runAsync('UPDATE athlete_profile SET alias = ? WHERE id = ?', [alias, id]);
}

// Retention rule (Storage & persistence, decided): deleting the profile removes
// its own sessions (judgedAthleteId == id); foreign sessions — where this
// device's owner was the judge, not the judged athlete — are kept until
// delivered. Its own workouts are removed too, except ones a kept session
// still references (see below).
export async function deleteProfile(db: SQLiteDatabase, id: string): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'DELETE FROM session_adjustments WHERE sessionId IN (SELECT id FROM sessions WHERE judgedAthleteId = ?)',
      [id],
    );
    await db.runAsync('DELETE FROM sessions WHERE judgedAthleteId = ?', [id]);
    // Own workouts go too, except those a kept (foreign) session still uses:
    // those stay archived and owner-less so the session keeps resolving them.
    // Own sessions are already gone here, so only foreign ones can match.
    await db.runAsync(
      `UPDATE workouts SET ownerId = NULL, archivedAt = COALESCE(archivedAt, ?)
       WHERE ownerId = ? AND id IN (SELECT wodId FROM sessions)`,
      [Date.now(), id],
    );
    await db.runAsync('DELETE FROM workouts WHERE ownerId = ?', [id]);
    await db.runAsync('DELETE FROM athlete_profile WHERE id = ?', [id]);
  });
}
