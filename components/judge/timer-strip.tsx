import { Pressable, StyleSheet, Text, View } from 'react-native';
import { HF } from '@/constants/hf';

type Props = {
  timerLabel: string;
  timerStr: string;
  isRunning: boolean;
  kpi: { label: string; value: string; sub: string };
  onPress: () => void;
  onLongPress: () => void;
};

export function TimerStrip({ timerLabel, timerStr, isRunning, kpi, onPress, onLongPress }: Props) {
  return (
    <Pressable onPress={onPress} onLongPress={onLongPress} style={styles.container}>
      <View>
        <Text style={styles.timerLabel}>{timerLabel}</Text>
        <Text style={styles.timerValue}>{timerStr}</Text>
        <Text style={styles.timerHint}>{isRunning ? '● running — tap to pause' : '○ tap to start'}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.kpiLabel}>{kpi.label}</Text>
        <Text style={styles.kpiValue}>{kpi.value}</Text>
        {kpi.sub ? <Text style={styles.kpiSub}>{kpi.sub}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: HF.hairline,
  },
  timerLabel: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 10,
    color: HF.muted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  timerValue: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 38,
    color: HF.ink,
    letterSpacing: -1,
    lineHeight: 38,
  },
  timerHint: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 9,
    color: HF.mutedDim,
    letterSpacing: 1,
    marginTop: 2,
  },
  kpiLabel: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 10,
    color: HF.muted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  kpiValue: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 30,
    color: HF.ink,
    letterSpacing: 1,
    lineHeight: 30,
    textTransform: 'uppercase',
  },
  kpiSub: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 9,
    color: HF.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 2,
  },
});
