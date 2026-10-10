import { SQLiteDatabase } from 'expo-sqlite';
import { buildBuiltinSeed } from './seed-builtins';

// Schema v1 (docs/ROADMAP.md → Storage & persistence): `device`, `athlete_profile`,
// `formats`, `exercises`, `workouts` are created empty, ahead of B18/B19.
// Schema v2 (B18): seeds the 4 built-in WODs into `formats`/`exercises`/`workouts`,
// then rebuilds `sessions` to add the `wodId -> workouts(id)` FK that v1 couldn't
// declare yet (workouts was still empty).
const DATABASE_VERSION = 2;

export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;

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
    await db.execAsync(`PRAGMA user_version = ${version}`);
  }

  if (version === 1) {
    const { formats, exercises, workouts } = buildBuiltinSeed(Date.now());

    // foreign_keys can't be toggled mid-transaction, and rebuilding `sessions`
    // (SQLite has no ALTER TABLE ADD CONSTRAINT) needs it off meanwhile.
    await db.execAsync('PRAGMA foreign_keys = OFF;');
    await db.withTransactionAsync(async () => {
      for (const f of formats) {
        await db.runAsync(
          'INSERT INTO formats (id, version, definition, engineVersion, origin) VALUES (?, ?, ?, ?, ?)',
          [f.id, f.version, f.definition, f.engineVersion, f.origin],
        );
      }
      for (const e of exercises) {
        await db.runAsync(
          'INSERT INTO exercises (id, name, origin, createdAt) VALUES (?, ?, ?, ?)',
          [e.id, e.name, e.origin, e.createdAt],
        );
      }
      for (const w of workouts) {
        await db.runAsync(
          'INSERT INTO workouts (id, name, blocks, scoringBlock, origin, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
          [w.id, w.name, w.blocks, w.scoringBlock, w.origin, w.createdAt],
        );
      }

      // Rebuild `sessions` to add the wodId -> workouts(id) FK, now that
      // workouts has rows; preserves any session saved under schema v1.
      await db.execAsync(`
        CREATE TABLE sessions_new (
          id TEXT PRIMARY KEY,
          wodId TEXT NOT NULL REFERENCES workouts(id),
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
        INSERT INTO sessions_new SELECT * FROM sessions;
        DROP TABLE sessions;
        ALTER TABLE sessions_new RENAME TO sessions;
      `);
    });
    await db.execAsync('PRAGMA foreign_keys = ON;');

    version = 2;
    await db.execAsync(`PRAGMA user_version = ${version}`);
  }

  await db.execAsync('PRAGMA foreign_keys = ON;');
}
