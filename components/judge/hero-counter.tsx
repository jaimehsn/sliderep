import { StyleSheet, Text, View } from 'react-native';
import Animated, { AnimatedStyle } from 'react-native-reanimated';
import { TextStyle, ViewStyle } from 'react-native';
import { HF } from '@/constants/hf';

type Props = {
  exerciseName: string;
  done: number;
  target: number;
  hint: string;
  counterStyle: AnimatedStyle<TextStyle>;
  crosshairStyle: AnimatedStyle<ViewStyle>;
  exerciseNameStyle: AnimatedStyle<TextStyle>;
};

export function HeroCounter({ exerciseName, done, target, hint, counterStyle, crosshairStyle, exerciseNameStyle }: Props) {
  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.exerciseName, exerciseNameStyle]}>
        {exerciseName}
      </Animated.Text>
      <Animated.View style={[styles.crosshair, crosshairStyle]} />
      <Animated.Text style={[styles.counter, counterStyle]}>
        {done}
      </Animated.Text>
      <Text style={styles.target}>/ {target}</Text>
      <Text style={styles.hint} numberOfLines={1}>{hint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  exerciseName: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 22,
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  crosshair: {
    height: 1,
    backgroundColor: HF.accent,
    marginBottom: 10,
  },
  counter: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 164,
    lineHeight: 148,
    letterSpacing: -4,
    textAlign: 'center',
  },
  target: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 18,
    color: HF.muted,
    letterSpacing: 3,
    marginTop: 8,
  },
  hint: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 10,
    color: HF.muted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 8,
  },
});
