import { Pressable, StyleSheet, Text, View } from 'react-native';
import { HF } from '@/constants/hf';
import { WodKpi } from '@/constants/wods';
import { RoundPips } from './round-pips';

type Props = {
  timerLabel: string;
  timerStr: string;
  kpi: WodKpi;
  onAbortPress: () => void;
};

export function JudgeHeader({ timerLabel, timerStr, kpi, onAbortPress }: Props) {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={onAbortPress}
        hitSlop={12}
        style={({ pressed }) => [pressed && styles.timerPressed]}
      >
        <Text style={[styles.tag, styles.timerTag]}>{timerLabel}</Text>
        <Text style={styles.time}>{timerStr}</Text>
      </Pressable>
      <View style={styles.right}>
        <Text style={[styles.tag, styles.kpiTag]}>{kpi.label}</Text>
        <Text style={styles.value}>
          {kpi.current}
          {kpi.total != null && <Text style={styles.total}>/{kpi.total}</Text>}
        </Text>
        {kpi.total != null && (
          <View style={styles.pips}>
            <RoundPips current={kpi.current} total={kpi.total} />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 140,
    paddingTop: 26,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  tag: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 9,
    color: HF.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  timerTag: {
    marginBottom: 4,
  },
  timerPressed: {
    opacity: 0.55,
  },
  kpiTag: {
    marginBottom: 6,
  },
  time: {
    fontFamily: 'IBMPlexMono_500Medium',
    fontSize: 52,
    lineHeight: 52,
    letterSpacing: -2,
    color: HF.ink,
    fontVariant: ['tabular-nums'],
  },
  right: {
    alignItems: 'flex-end',
  },
  value: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 34,
    lineHeight: 36,
    color: HF.ink,
    textTransform: 'uppercase',
  },
  total: {
    fontSize: 20,
    color: HF.muted,
  },
  pips: {
    marginTop: 8,
  },
});
