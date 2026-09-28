import { StyleSheet, View } from 'react-native';
import { HF } from '@/constants/hf';

type Props = {
  /** 1-based position of the current step. */
  current: number;
  total: number;
};

/** Filled = done, ink outline = current, hairline outline = pending. Smaller when there are many. */
export function RoundPips({ current, total }: Props) {
  const many = total > 5;
  const size = many ? 6 : 10;
  const gap = many ? 4 : 7;
  return (
    <View style={[styles.row, { gap }]}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={{
            width: size,
            height: size,
            backgroundColor: i < current - 1 ? HF.ink : 'transparent',
            borderWidth: many ? 1 : 1.5,
            borderColor: i <= current - 1 ? HF.ink : HF.hairlineStrong,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
