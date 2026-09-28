import { StyleSheet, TextStyle, View } from 'react-native';
import Animated, { AnimatedStyle } from 'react-native-reanimated';

type Props = {
  name: string;
  /** Animated colour: ink normally, accent after a no-rep. */
  animatedStyle: AnimatedStyle<TextStyle>;
};

export function ExerciseName({ name, animatedStyle }: Props) {
  return (
    <View style={styles.container}>
      <Animated.Text
        style={[styles.name, animatedStyle]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
      >
        {name}
      </Animated.Text>
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
  name: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: 6,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
});
