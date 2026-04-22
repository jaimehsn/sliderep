import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { HF } from '@/constants/hf';

export function DropStrip({ kind }: { kind: 'rep' | 'noRep' }) {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    translateX.value = withTiming(kind === 'rep' ? -380 : 380, {
      duration: 420,
      easing: Easing.bezier(0.3, 0.7, 0.3, 1),
    });
    opacity.value = withTiming(0, { duration: 400 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.base,
        kind === 'rep' ? styles.right : styles.left,
        { backgroundColor: kind === 'rep' ? `${HF.rep}70` : `${HF.noRep}70` },
        animStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 36,
  },
  right: { right: 0 },
  left: { left: 0 },
});
