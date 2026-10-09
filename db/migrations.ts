import { SQLiteDatabase } from 'expo-sqlite';

// Schema v1 (docs/ROADMAP.md → Storage & persistence). Only `sessions` has a
// consumer today (B15); `device`, `athlete_profile`, `formats`, `exercises`
// and `workouts` are created empty, ahead of B18/B19. `sessions.wodId` has no
// `REFERENCES workouts(id)` yet, since `workouts` stays empty until B18 seeds
// it — add the FK once that migration lands.
const DATABASE_VERSION = 1;

export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;
  if (version >= DATABASE_VERSION) return;

  if (version === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = 'wal';

      CREATE TABLE device (
        deviceId TEXT PRIMARY KEY
      );

      CREATE TABLE athlete_profile (
        id TEXT PRIMARY KEY,
        alias TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        accountId TEXT
      );

      CREATE TABLE formats (
        id TEXT PRIMARY KEY,
        version INTEGER NOT NULL,
        definition TEXT NOT NULL,
        engineVersion INTEGER NOT NULL,
        origin TEXT NOT NULL
      );

      CREATE TABLE exercises (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        origin TEXT NOT NULL,
        ownerId TEXT,
        derivedFrom TEXT,
        archivedAt INTEGER,
        createdAt INTEGER NOT NULL
      );

      CREATE TABLE workouts (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        blocks TEXT NOT NULL,
        scoringBlock INTEGER NOT NULL,
        origin TEXT NOT NULL,
        ownerId TEXT,
        derivedFrom TEXT,
        archivedAt INTEGER,
        createdAt INTEGER NOT NULL
      );

      CREATE TABLE sessions (
        id TEXT PRIMARY KEY,
        wodId TEXT NOT NULL,
        engineVersion INTEGER NOT NULL,
        judgedAthleteId TEXT NOT NULL,
        judgedAlias TEXT NOT NULL,
        judgeId TEXT,
        verification TEXT NOT NULL,
        startedAt INTEGER NOT NULL,
        endT INTEGER NOT NULL,
        events TEXT NOT NULL,
        createdAt INTEGER NOT NULL
      );

      CREATE TABLE session_adjustments (
        id TEXT PRIMARY KEY,
        sessionId TEXT NOT NULL REFERENCES sessions(id),
        seq INTEGER NOT NULL,
        changes TEXT NOT NULL,
        approvedBy TEXT NOT NULL,
        approvedAt INTEGER NOT NULL,
        UNIQUE(sessionId, seq)
      );
    `);
    version = 1;
  }

  await db.execAsync(`PRAGMA user_version = ${version}`);
}
