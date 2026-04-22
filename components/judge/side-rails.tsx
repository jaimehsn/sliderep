import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, { AnimatedStyle } from 'react-native-reanimated';

type Props = {
  railStyle: AnimatedStyle<ViewStyle>;
};

export function SideRails({ railStyle }: Props) {
  return (
    <>
      <Animated.View style={[styles.left, railStyle]} />
      <Animated.View style={[styles.right, railStyle]} />
      {([0, 0.25, 0.5, 0.75, 1] as const).map((p) => (
        <React.Fragment key={p}>
          <Animated.View style={[styles.tickLeft, { top: `${10 + p * 80}%` as `${number}%` }, railStyle]} />
          <Animated.View style={[styles.tickRight, { top: `${10 + p * 80}%` as `${number}%` }, railStyle]} />
        </React.Fragment>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  left: {
    position: 'absolute',
    left: 0,
    top: '10%',
    bottom: '10%',
    width: 1,
  },
  right: {
    position: 'absolute',
    right: 0,
    top: '10%',
    bottom: '10%',
    width: 1,
  },
  tickLeft: {
    position: 'absolute',
    left: 0,
    width: 6,
    height: 1,
  },
  tickRight: {
    position: 'absolute',
    right: 0,
    width: 6,
    height: 1,
  },
});
