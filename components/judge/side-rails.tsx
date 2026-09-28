import { useEffect } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import Animated, {
  AnimatedStyle,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { HF } from '@/constants/hf';

type Kind = 'rep' | 'noRep';

type Props = {
  /** Animated colour of the two 1px lines (hairline → accent after a no-rep). */
  railStyle: AnimatedStyle<ViewStyle>;
  /** Last gesture; `dropKey` changes on every gesture so the sweep restarts. */
  kind: Kind | null;
  dropKey: number;
};

/** Full-height overlay: two 1px edge lines plus a strip that sweeps inward after each rep / no-rep. */
export function SideRails({ railStyle, kind, dropKey }: Props) {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[styles.line, styles.left, railStyle]} />
      <Animated.View style={[styles.line, styles.right, railStyle]} />
      {kind != null && <Sweep key={dropKey} kind={kind} />}
    </View>
  );
}

function Sweep({ kind }: { kind: Kind }) {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    translateX.value = withTiming(kind === 'rep' ? -340 : 340, {
      duration: 400,
      easing: Easing.bezier(0.3, 0.7, 0.3, 1),
    });
    opacity.value = withTiming(0, { duration: 400 });
  }, [kind, translateX, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.sweep,
        kind === 'rep' ? styles.right : styles.left,
        { backgroundColor: `${kind === 'rep' ? HF.rep : HF.noRep}55` },
        animStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  line: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
  },
  left: { left: 0 },
  right: { right: 0 },
  sweep: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 32,
  },
});
