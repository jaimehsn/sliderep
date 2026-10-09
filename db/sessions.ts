import { SQLiteDatabase } from 'expo-sqlite';

export type StoredEvent = { t: number; kind: 'rep' | 'noRep' };

export type SaveSessionInput = {
  wodId: string;
  engineVersion: number;
  judgedAthleteId: string;
  judgedAlias: string;
  judgeId: string | null;
  startedAt: number;
  endT: number;
  events: StoredEvent[];
};

// Short local id (timestamp + random base36) — not a real UUID. The ROADMAP
// marks UUIDv7 as an unconfirmed assumption, not a decision; this is just
// text, so it's revisable later without migrating existing rows.
function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function saveSession(db: SQLiteDatabase, input: SaveSessionInput): Promise<void> {
  const id = makeId();
  const createdAt = Date.now();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO sessions
         (id, wodId, engineVersion, judgedAthleteId, judgedAlias, judgeId, verification, startedAt, endT, events, createdAt)
       VALUES (?, ?, ?, ?, ?, ?, 'unverified', ?, ?, ?, ?)`,
      [
        id,
        input.wodId,
        input.engineVersion,
        input.judgedAthleteId,
        input.judgedAlias,
        input.judgeId,
        input.startedAt,
        input.endT,
        JSON.stringify(input.events),
        createdAt,
      ],
    );
  });
}
