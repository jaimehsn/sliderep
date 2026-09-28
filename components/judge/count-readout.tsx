import { StyleSheet, Text, TextStyle, View } from 'react-native';
import Animated, { AnimatedStyle } from 'react-native-reanimated';
import { HF } from '@/constants/hf';

type Props = {
  done: number;
  target: number;
  /** Animated punch (scale) and colour (ink → accent after a no-rep). */
  counterStyle: AnimatedStyle<TextStyle>;
};

export function CountReadout({ done, target, counterStyle }: Props) {
  const left = Math.max(target - done, 0);
  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.count, counterStyle]}>{done}</Animated.Text>
      <View style={styles.divider} />
      <View style={styles.side}>
        <Text style={styles.tag}>left</Text>
        <Text style={styles.left}>{left}</Text>
        <Text style={styles.of}>of {target}</Text>
      </View>
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
  count: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 190,
    lineHeight: 170,
    letterSpacing: -7,
    color: HF.ink,
    fontVariant: ['tabular-nums'],
  },
  divider: {
    width: 1,
    height: 80,
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
    fontSize: 64,
    lineHeight: 60,
    letterSpacing: -1,
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
