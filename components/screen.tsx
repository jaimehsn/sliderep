import { ReactNode } from 'react';
import { KeyboardAvoidingView, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Floor for the bottom padding, for screens whose last element needs breathing room even with no inset. */
  minBottomPadding?: number;
};

/**
 * Root wrapper that pads for the device's safe area (status bar, notch, gesture bar). Use on every top-level screen.
 * It also shrinks above the on-screen keyboard: with edge-to-edge, Android no longer resizes the window for it,
 * so without this a text field in the lower half ends up under the keyboard.
 */
export function Screen({ children, style, minBottomPadding = 0 }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView behavior="padding" style={styles.root}>
      <View
        style={[
          styles.root,
          {
            paddingTop: insets.top,
            paddingBottom: Math.max(insets.bottom, minBottomPadding),
            paddingLeft: insets.left,
            paddingRight: insets.right,
          },
          style,
        ]}
      >
        {children}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
