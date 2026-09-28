import { ComponentProps, useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  AnimatedStyle,
  Easing,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { HF } from '@/constants/hf';

type Kind = 'rep' | 'noRep';

type Props = {
  gesture: ComponentProps<typeof GestureDetector>['gesture'];
  /** Horizontal finger offset in px (clamped by the hook); the centre dot follows it. */
  drag: SharedValue<number>;
  /** Animated background colour of the dot (muted → accent after a no-rep). */
  dotColorStyle: AnimatedStyle<ViewStyle>;
  /** Last gesture; `dropKey` changes on every gesture so the travel line restarts. */
  kind: Kind | null;
  dropKey: number;
};

export const BAND_HEIGHT = 220;

/**
 * The only interactive surface of the judging screen. Nearly empty on purpose: edge ticks
 * (no-rep on the left, rep on the right), a breathing dot that follows the finger, and a
 * line that travels toward the side of the last gesture.
 */
export function SwipeBand({ gesture, drag, dotColorStyle, kind, dropKey }: Props) {
  const breathe = useSharedValue(0.3);

  useEffect(() => {
    breathe.value = withRepeat(
      withSequence(withTiming(0.62, { duration: 1300 }), withTiming(0.3, { duration: 1300 })),
      -1,
    );
  }, [breathe]);

  const dotMotionStyle = useAnimatedStyle(() => ({
    opacity: drag.value !== 0 ? 1 : breathe.value,
    transform: [{ translateX: drag.value }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.band}>
        <View style={[styles.mark, styles.markTop]} />
        <View style={[styles.mark, styles.markBottom]} />
        <View style={[styles.edge, styles.edgeLeft]} />
        <View style={[styles.edge, styles.edgeRight]} />
        <Animated.View style={[styles.dot, dotColorStyle, dotMotionStyle]} />
        {kind != null && <TravelLine key={dropKey} kind={kind} />}
      </View>
    </GestureDetector>
  );
}

function TravelLine({ kind }: { kind: Kind }) {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateX.value = withTiming(kind === 'rep' ? 140 : -140, {
      duration: 400,
      easing: Easing.bezier(0.3, 0.7, 0.3, 1),
    });
    opacity.value = withSequence(
      withTiming(1, { duration: 100 }),
      withTiming(0, { duration: 300 }),
    );
  }, [kind, translateX, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.travel,
        { backgroundColor: kind === 'rep' ? HF.rep : HF.noRep },
        animStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  band: {
    height: BAND_HEIGHT,
  },
  mark: {
    position: 'absolute',
    left: '50%',
    marginLeft: -22,
    width: 44,
    height: 1,
    backgroundColor: HF.hairlineStrong,
  },
  markTop: { top: 0 },
  markBottom: { bottom: 0 },
  edge: {
    position: 'absolute',
    top: '50%',
    width: 14,
    height: 1,
    opacity: 0.65,
  },
  edgeLeft: { left: 0, backgroundColor: HF.noRep },
  edgeRight: { right: 0, backgroundColor: HF.rep },
  dot: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -3,
    marginLeft: -3,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  travel: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 120,
    height: 1,
  },
});
