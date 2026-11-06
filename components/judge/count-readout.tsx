import { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, TextStyle, View } from 'react-native';
import { Text } from '@/components/text';
import Animated, { AnimatedStyle } from 'react-native-reanimated';
import { HF } from '@/constants/hf';
import { countFontSize, countMetrics } from './count-size';

type Props = {
  done: number;
  target: number;
  /** Animated punch (scale) and colour (ink → accent after a no-rep). */
  counterStyle: AnimatedStyle<TextStyle>;
};

export function CountReadout({ done, target, counterStyle }: Props) {
  const left = Math.max(target - done, 0);
  // The zone's size, measured; the readout renders once it's known so it never shows at the wrong size.
  const [zone, setZone] = useState<{ width: number; height: number } | null>(null);
  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setZone((z) => (z?.width === width && z?.height === height ? z : { width, height }));
  };

  // Sized from the target's digits (change responsive-review), so it holds while counting toward it.
  const digits = String(Math.max(target, done)).length;
  const metrics = zone && countMetrics(countFontSize(zone.width, zone.height, digits));

  return (
    <View style={styles.container} onLayout={onLayout}>
      {metrics && (
        <>
          <Animated.Text style={[styles.count, metrics.count, counterStyle]} allowFontScaling={false}>{done}</Animated.Text>
          <View style={[styles.divider, { height: metrics.dividerHeight }]} />
          <View style={styles.side}>
            <Text style={styles.tag}>left</Text>
            <Text style={[styles.left, metrics.left]} allowFontScaling={false}>{left}</Text>
            <Text style={styles.of}>of {target}</Text>
          </View>
        </>
      )}
    </View>
  );
}

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
    fontFamily: 'BarlowCondensed_700Bold',
    color: HF.ink,
    fontVariant: ['tabular-nums'],
  },
  divider: {
    width: 1,
    backgroundColor: HF.hairlineStrong,
  },
  side: {
    gap: 6,
  },
  tag: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 10,
    color: HF.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  left: {
    fontFamily: 'BarlowCondensed_700Bold',
    color: HF.inkDim,
    fontVariant: ['tabular-nums'],
  },
  of: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 11,
    color: HF.muted,
    letterSpacing: 1.5,
  },
});
