// The no-rep review list (change no-rep-review, design.md decision 3): which no-reps
// the judge can accept, and their open / accepted / surplus status.
import { describe, expect, it } from 'vitest';
import type { LogEntry } from '@/components/judge/types';
import { reviewNoReps } from '@/components/result/adjust';
import { builtin, workout } from './fixtures';

/** Events in the given order, `R` a rep and `N` a no-rep, 1 s apart from `from`; ids are their index. */
function log(pattern: string, from = 1000): LogEntry[] {
  return [...pattern].map((c, i) => ({ id: i, ok: c === 'R', t: from + i * 1000 }));
}

const fran = builtin('fran');
const none = new Set<number>();

describe('reviewNoReps', () => {
  it('lists a no-rep as open, with its position and time', () => {
    expect(reviewNoReps(fran, log('RRNRR'), none)).toEqual([{ id: 2, roundIdx: 0, exIdx: 0, t: 3000, status: 'open' }]);
  });

  it('shows an accepted no-rep as accepted', () => {
    expect(reviewNoReps(fran, log('RRNRR'), new Set([2]))[0].status).toBe('accepted');
  });

  // Round 1 THRUSTERS (21): a no-rep, 20 reps, a no-rep, the 21st rep.
  const thrusters = log('N' + 'R'.repeat(20) + 'NR');

  it('makes a later no-rep of the same position surplus', () => {
    expect(reviewNoReps(fran, thrusters, new Set([0])).map((n) => [n.id, n.status])).toEqual([[0, 'accepted'], [21, 'surplus']]);
  });

  it('lets surplus win over an acceptance', () => {
    expect(reviewNoReps(fran, thrusters, new Set([0, 21])).map((n) => n.status)).toEqual(['accepted', 'surplus']);
  });

  it("doesn't touch another position's no-reps", () => {
    // The 21 THRUSTERS, then a no-rep in PULL-UPS: nothing is surplus there.
    const twoPositions = log('N' + 'R'.repeat(21) + 'NR');
    expect(reviewNoReps(fran, twoPositions, new Set([0])).map((n) => [n.id, n.status])).toEqual([[0, 'accepted'], [22, 'open']]);
  });

  it('leaves out no-reps after a For Time end and during a rest', () => {
    expect(reviewNoReps(fran, log('R'.repeat(90) + 'N'), none)).toEqual([]);
    // RESTED: 5 BURPEES, then a no-rep inside the 60 s rest.
    expect(reviewNoReps(workout('rested'), log('RRRRRN'), none)).toEqual([]);
  });

  it("never makes an EMOM interval's last line surplus", () => {
    // EVERY MINUTE minute 1, BURPEES 10: 5 reps, a no-rep, 5 reps, then a no-rep.
    const minute = log('RRRRRNRRRRRN');
    expect(reviewNoReps(builtin('everyMinute'), minute, new Set([5])).map((n) => n.status)).toEqual(['accepted', 'open']);
  });

  it("makes an EMOM interval's first line surplus, by interval and line", () => {
    // EMOM PAIR minute 1, 5 PULL-UPS + 10 PUSH-UPS: 4 PULL-UPS, two no-reps, the 5th
    // PULL-UP, then a no-rep of PUSH-UPS. Accepting the first makes the second and the
    // 5th PULL-UP surplus (the rep isn't a review row), and leaves PUSH-UPS alone.
    const minute = log('RRRRNNRN');
    expect(reviewNoReps(workout('emomPair'), minute, none).map((n) => [n.id, n.exIdx])).toEqual([[4, 0], [5, 0], [7, 1]]);
    expect(reviewNoReps(workout('emomPair'), minute, new Set([4]))).toEqual([
      { id: 4, roundIdx: 0, exIdx: 0, t: 5000, status: 'accepted' },
      { id: 5, roundIdx: 0, exIdx: 0, t: 6000, status: 'surplus' },
      { id: 7, roundIdx: 0, exIdx: 1, t: 8000, status: 'open' },
    ]);
  });

  it('gives a sequence no-rep its block and its block-local time', () => {
    // BUY-IN AMRAP: BURPEES 20 (block 1 ends on its 20th rep, at 20 s), then a no-rep 5 s into the AMRAP.
    const buyIn = [...log('R'.repeat(20)), { id: 20, ok: false, t: 25000 }];
    expect(reviewNoReps(workout('buyInAmrap'), buyIn, none)).toEqual([{ id: 20, blockIdx: 1, roundIdx: 0, exIdx: 0, t: 5000, status: 'open' }]);
  });
});
