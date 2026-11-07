import { SQLiteDatabase } from 'expo-sqlite';
import { makeId } from './sessions';

/**
 * One accepted no-rep (change no-rep-review): `eventIdx` is its index in the
 * session's stored `events` (the `LogEntry.id` screens give it). Accepting is
 * final — packages only add acceptances, so their order doesn't matter.
 */
export type AdjustmentChange = { type: 'acceptNoRep'; eventIdx: number };

export type SessionAdjustment = {
  id: string;
  sessionId: string;
  seq: number; // 1..3
  changes: AdjustmentChange[];
  approvedBy: string;
  approvedAt: number;
};

export async function getAdjustments(db: SQLiteDatabase, sessionId: string): Promise<SessionAdjustment[]> {
  const rows = await db.getAllAsync<Omit<SessionAdjustment, 'changes'> & { changes: string }>(
    'SELECT id, sessionId, seq, changes, approvedBy, approvedAt FROM session_adjustments WHERE sessionId = ? ORDER BY seq',
    [sessionId],
  );
  return rows.map((r) => ({ ...r, changes: JSON.parse(r.changes) }));
}

// Max 3 per session, append-only (docs/ROADMAP.md → WOD hierarchy). Not
// enforced by the schema (no CHECK on `seq`) — the UI disables the control
// first, and this throw is just the safety net.
export async function addAdjustment(
  db: SQLiteDatabase,
  sessionId: string,
  changes: AdjustmentChange[],
  approvedBy: string,
): Promise<SessionAdjustment> {
  const id = makeId();
  const approvedAt = Date.now();
  let seq = 0;
  await db.withTransactionAsync(async () => {
    const existing = await db.getAllAsync<{ seq: number }>(
      'SELECT seq FROM session_adjustments WHERE sessionId = ?',
      [sessionId],
    );
    if (existing.length >= 3) {
      throw new Error('A session accepts at most 3 adjustment packages');
    }
    seq = existing.length + 1;
    await db.runAsync(
      'INSERT INTO session_adjustments (id, sessionId, seq, changes, approvedBy, approvedAt) VALUES (?, ?, ?, ?, ?, ?)',
      [id, sessionId, seq, JSON.stringify(changes), approvedBy, approvedAt],
    );
  });
  return { id, sessionId, seq, changes, approvedBy, approvedAt };
}
