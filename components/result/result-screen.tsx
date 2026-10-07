import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { HF } from '@/constants/hf';
import { WodConfig } from '@/constants/wods';
import { LogEntry } from '@/components/judge/types';
import { formatTime } from '@/components/judge/reducer';
import { deriveResult } from '@/components/result/replay';

type Props = {
  config: WodConfig;
  log: LogEntry[];
};

export function ResultScreen({ config, log }: Props) {
  const result = useMemo(() => deriveResult(config, log), [config, log]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.mode}>{config.mode}</Text>
        <Text style={styles.name}>{config.name}</Text>
      </View>

      <View style={styles.scoreBlock}>
        <Text style={styles.scoreLabel}>{result.scoreLabel}</Text>
        <Text style={styles.scoreValue}>{result.scoreValue}</Text>
      </View>

      <ScrollView style={styles.splits} contentContainerStyle={styles.splitsContent}>
        {result.splits.map((split, i) => (
          <View key={i} style={styles.splitRow}>
            <View style={styles.splitLeft}>
              <Text style={[styles.splitLabel, !split.completed && styles.splitLabelPartial]}>
                {split.label}
              </Text>
              <Text style={styles.splitReps}>{split.reps}/{split.target}</Text>
            </View>
            {split.cumulativeMs != null && (
              <View style={styles.splitRight}>
                <Text style={styles.splitCumulative}>
                  {formatTime(Math.round(split.cumulativeMs / 1000))}
                </Text>
                {split.lapMs != null && (
                  <Text style={styles.splitLap}>+{formatTime(Math.round(split.lapMs / 1000))}</Text>
                )}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  mode: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 11,
    color: HF.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  name: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 28,
    color: HF.ink,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  scoreBlock: {
    alignItems: 'center',
    paddingVertical: 28,
  },
  scoreLabel: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 11,
    color: HF.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  scoreValue: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 76,
    lineHeight: 72,
    letterSpacing: -2,
    color: HF.ink,
    fontVariant: ['tabular-nums'],
  },
  splits: {
    flex: 1,
  },
  splitsContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: HF.hairline,
  },
  splitLeft: {
    flex: 1,
  },
  splitLabel: {
    fontFamily: 'BarlowCondensed_600SemiBold',
    fontSize: 17,
    color: HF.ink,
    textTransform: 'uppercase',
  },
  splitLabelPartial: {
    color: HF.inkDim,
  },
  splitReps: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 11,
    color: HF.muted,
    marginTop: 2,
  },
  splitRight: {
    alignItems: 'flex-end',
  },
  splitCumulative: {
    fontFamily: 'IBMPlexMono_500Medium',
    fontSize: 16,
    color: HF.ink,
    fontVariant: ['tabular-nums'],
  },
  splitLap: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 11,
    color: HF.muted,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
});
