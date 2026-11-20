import { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, TextStyle, View } from 'react-native';
import { Text } from '@/components/text';
import Animated, { AnimatedStyle } from 'react-native-reanimated';
import { colors, fonts } from '@/constants/theme';
import type { Segment } from '@/constants/wod-engine';
import { countFontSize, countMetrics } from './count-size';

type Props = {
  done: number;
  target: number;
  /** A MAX line (change max-lines): no target, so "MAX" in place of the reps left and "of N". */
  max?: boolean;
  /** A MAX line's segment (change max-distance): the count shows `done × amount`, and the unit in place of "MAX". */
  segment?: Segment;
  /** Animated punch (scale) and colour (ink → accent after a no-rep). */
  counterStyle: AnimatedStyle<TextStyle>;
};

export function CountReadout({ done, target, max = false, segment, counterStyle }: Props) {
  const left = Math.max(target - done, 0);
  // The zone's size, measured; the readout renders once it's known so it never shows at the wrong size.
  const [zone, setZone] = useState<{ width: number; height: number } | null>(null);
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setZone((z) => (z?.width === width && z?.height === height ? z : { width, height }));
  };

  // Sized from the target's digits (change responsive-review), so it holds while counting toward it;
  // a MAX line has none, so three digits, as at the most reps a line can have (change max-lines).
  // A segment's total keeps three digits up to 999, and grows past them only beyond (change max-distance).
  const shown = segment ? done * segment.amount : done;
  const digits = max ? Math.max(3, String(shown).length) : String(Math.max(target, done)).length;
  const metrics = zone && countMetrics(countFontSize(zone.width, zone.height, digits));

  return (
    <View style={styles.container} onLayout={onLayout}>
      {metrics && (
        <>
          <Animated.Text style={[styles.count, metrics.count, counterStyle]} allowFontScaling={false}>{shown}</Animated.Text>
          <View style={[styles.divider, { height: metrics.dividerHeight }]} />
          {max ? (
            // "MAX" (or the segment's unit, change max-distance) at 0.8 of the reps-left size:
            // about 1.7 em at most, within the three digits' width the size allows.
            <View style={styles.side}>
              <Text style={[styles.left, metrics.left, { fontSize: metrics.left.fontSize * MAX_RATIO }]} allowFontScaling={false}>{segment ? segment.unit : 'MAX'}</Text>
            </View>
          ) : (
            <View style={styles.side}>
              <Text style={styles.tag}>left</Text>
              <Text style={[styles.left, metrics.left]} allowFontScaling={false}>{left}</Text>
              <Text style={styles.of}>of {target}</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const MAX_RATIO = 0.8;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 22,
  },
  // Sizes (font, line height, tracking, divider height) come from countMetrics, scaled from the design's 190.
  count: {
    fontFamily: fonts.display,
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  divider: {
    width: 1,
    backgroundColor: colors.hairlineStrong,
  },
  side: {
    gap: 6,
  },
  tag: {
    fontFamily: fonts.ui,
    fontSize: 10,
    color: colors.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  left: {
    fontFamily: fonts.display,
    color: colors.inkDim,
    fontVariant: ['tabular-nums'],
  },
  of: {
    fontFamily: fonts.ui,
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 1.5,
  },
});
