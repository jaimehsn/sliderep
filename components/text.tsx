import { ComponentProps } from 'react';
import { Text as RNText, TextInput as RNTextInput } from 'react-native';

/**
 * How far text follows the system font size (change responsive-review): up to 1.3× its base
 * size, then no further. Every screen imports `Text` / `TextInput` from here instead of
 * `react-native` (an ESLint rule enforces it), so the cap holds without setting it per element.
 * A caller may still pass its own `maxFontSizeMultiplier`, or `allowFontScaling={false}` for the
 * large numbers that keep their size (judging timer, rep count, reps left, scores).
 *
 * A thin wrapper rather than `Text.defaultProps`: in RN 0.88 with React 19, `Text` is a function
 * component, whose `defaultProps` are no longer supported.
 */
export const MAX_FONT_SCALE = 1.3;

export function Text(props: ComponentProps<typeof RNText>) {
  return <RNText maxFontSizeMultiplier={MAX_FONT_SCALE} {...props} />;
}

export function TextInput(props: ComponentProps<typeof RNTextInput>) {
  return <RNTextInput maxFontSizeMultiplier={MAX_FONT_SCALE} {...props} />;
}
