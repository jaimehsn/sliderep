/**
 * The judging screen's rep count size (change responsive-review): the largest size, up to the
 * design's 190, at which the count, the divider and the reps-left column fit their zone. Pure, so
 * it's covered by vitest; `count-readout.tsx` feeds it the zone's measured size.
 *
 * It's sized from the target's digits, not the current count's, so the size never jumps while
 * counting toward one target (99 → 100 of 150 stays put) and only changes with a new target.
 * Every other measure of the readout scales with it, in the design's proportions.
 */

/** The design's size, reached whenever the zone allows. */
export const COUNT_MAX_SIZE = 190;
/** Never smaller than this, even in an unreasonably small zone. */
export const COUNT_MIN_SIZE = 40;

/** Outfit Regular's tabular digit, in em, measured from the font file (the count uses `tabular-nums`). */
const DIGIT_EM = 0.59;
/** Upper bound for a glyph of the small labels (lowercase letters and tabular digits), in em. */
const LABEL_EM = 0.6;
/** The small labels ("left", "of N") follow the system font size up to this (`components/text.tsx`). */
const LABEL_SCALE = 1.3;

/** Design proportions at size 190 (the "Ghost" design). */
const COUNT_LINE = 170 / 190;
const COUNT_TRACKING = -7 / 190;
const LEFT_RATIO = 64 / 190;
const LEFT_LINE = 60 / 64;
const LEFT_TRACKING = -1 / 64;
const DIVIDER_RATIO = 80 / 190;
/** Space between count, divider and column (2 × 22) plus the divider itself. */
const ROW_FIXED = 2 * 22 + 1;
/** Margin kept on each side of the row, clear of the side rails. */
const SIDE_MARGIN = 24;
/** The column's label lines: "left" (10) and "of N" (11), each about 1.3 × its size high, plus 2 × 6 of gap. */
const LABEL_LINES_HEIGHT = (10 + 11) * 1.3 * LABEL_SCALE + 2 * 6;

/** Width, at most, of `chars` characters at `size` with `tracking`, as the labels are drawn. */
function labelWidth(chars: number, size: number, tracking: number): number {
  return chars * (LABEL_EM * size + tracking) * LABEL_SCALE;
}

/** The count's size for a target of `targetDigits` digits in a zone of the given size, in dp. */
export function countFontSize(zoneWidth: number, zoneHeight: number, targetDigits: number): number {
  const digits = Math.max(1, targetDigits);
  const width = zoneWidth - 2 * SIDE_MARGIN - ROW_FIXED;
  const countPerSize = digits * (DIGIT_EM + COUNT_TRACKING);
  const leftPerSize = digits * (DIGIT_EM + LEFT_TRACKING) * LEFT_RATIO;
  const ofWidth = labelWidth(3 + digits, 11, 1.5); // "of " + the target

  const size = Math.min(
    COUNT_MAX_SIZE,
    width / (countPerSize + leftPerSize), // the reps-left number sets the column's width
    (width - ofWidth) / countPerSize, // "of N" sets it
    zoneHeight / COUNT_LINE,
    (zoneHeight - LABEL_LINES_HEIGHT) / (LEFT_RATIO * LEFT_LINE),
  );
  return Math.max(COUNT_MIN_SIZE, Math.floor(size));
}

/** Every measure of the readout at count size `size`, in the design's proportions. */
export function countMetrics(size: number) {
  const left = size * LEFT_RATIO;
  return {
    count: { fontSize: size, lineHeight: size * COUNT_LINE, letterSpacing: size * COUNT_TRACKING },
    left: { fontSize: left, lineHeight: left * LEFT_LINE, letterSpacing: left * LEFT_TRACKING },
    dividerHeight: size * DIVIDER_RATIO,
  };
}

/** Width the row takes at `size` for `targetDigits` digits (count + divider + column), for tests. */
export function countRowWidth(size: number, targetDigits: number): number {
  const digits = Math.max(1, targetDigits);
  const left = digits * (DIGIT_EM + LEFT_TRACKING) * size * LEFT_RATIO;
  return digits * (DIGIT_EM + COUNT_TRACKING) * size + ROW_FIXED + Math.max(left, labelWidth(3 + digits, 11, 1.5));
}

/** The margin `countFontSize` keeps on each side, for tests. */
export const COUNT_SIDE_MARGIN = SIDE_MARGIN;
