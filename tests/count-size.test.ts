import { describe, expect, it } from 'vitest';
import {
  COUNT_MAX_SIZE,
  COUNT_SIDE_MARGIN,
  countFontSize,
  countMetrics,
  countRowWidth,
} from '@/components/judge/count-size';

// Count zones of the judging screen: about 160 dp high on a 360 × 640 phone, far more on a 412 × 915 one.
const LARGE = { w: 412, h: 400 };
const SMALL = { w: 360, h: 160 };

const fits = (w: number, size: number, digits: number) => countRowWidth(size, digits) <= w - 2 * COUNT_SIDE_MARGIN;

describe('rep count size (change responsive-review)', () => {
  it('keeps the design size for two digits in a large zone', () => {
    expect(countFontSize(LARGE.w, LARGE.h, 1)).toBe(COUNT_MAX_SIZE);
    expect(countFontSize(LARGE.w, LARGE.h, 2)).toBe(COUNT_MAX_SIZE);
  });

  it('gets smaller with each extra digit, and the row still fits', () => {
    const sizes = [2, 3, 4].map((d) => countFontSize(SMALL.w, 400, d));
    expect(sizes[1]).toBeLessThan(sizes[0]);
    expect(sizes[2]).toBeLessThan(sizes[1]);
    [2, 3, 4].forEach((d, i) => expect(fits(SMALL.w, sizes[i], d)).toBe(true));
  });

  it('fits three digits on a 360 dp wide phone', () => {
    const size = countFontSize(SMALL.w, SMALL.h, 3);
    expect(fits(SMALL.w, size, 3)).toBe(true);
    expect(countMetrics(size).count.lineHeight).toBeLessThanOrEqual(SMALL.h);
  });

  it('is limited by height in a short zone', () => {
    const size = countFontSize(LARGE.w, SMALL.h, 2);
    expect(size).toBeLessThan(COUNT_MAX_SIZE);
    expect(countMetrics(size).count.lineHeight).toBeLessThanOrEqual(SMALL.h);
    expect(countFontSize(LARGE.w, SMALL.h - 40, 2)).toBeLessThan(size);
  });

  it('fits four digits, which an EMOM increment can reach', () => {
    const size = countFontSize(SMALL.w, SMALL.h, 4);
    expect(fits(SMALL.w, size, 4)).toBe(true);
  });

  it('depends only on the target, so counting toward it never changes it', () => {
    // CountReadout passes the target's digits: 99 and 100 of a 150 target share one size.
    expect(countFontSize(SMALL.w, SMALL.h, String(150).length)).toBe(countFontSize(SMALL.w, SMALL.h, 3));
  });

  it('scales every measure with the size', () => {
    const full = countMetrics(COUNT_MAX_SIZE);
    const design = [
      [full.count.fontSize, 190], [full.count.lineHeight, 170], [full.count.letterSpacing, -7],
      [full.left.fontSize, 64], [full.left.lineHeight, 60], [full.left.letterSpacing, -1],
      [full.dividerHeight, 80],
    ];
    for (const [actual, expected] of design) expect(actual).toBeCloseTo(expected, 6);
  });
});
