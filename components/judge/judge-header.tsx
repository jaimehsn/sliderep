import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
import { colors, fonts } from '@/constants/theme';
import { WodKpi } from '@/constants/wod-engine';
import { MAX_PIPS, RoundPips } from './round-pips';

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
        style={({ pressed }) => [styles.timerBlock, pressed && styles.timerPressed]}
      >
        {/* One line each, shrinking if needed, so a long cap label or a 100:00+ timer never pushes the KPI out. */}
        <Text style={[styles.tag, styles.timerTag]} numberOfLines={1}>{timerLabel}</Text>
        <Text style={styles.time} allowFontScaling={false} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
          {timerStr}
        </Text>
      </Pressable>
      <View style={styles.right}>
        <Text style={[styles.tag, styles.kpiTag]} numberOfLines={1}>{kpi.label}</Text>
        <Text style={styles.value} numberOfLines={1}>
          {kpi.current}
          {kpi.total != null && <Text style={styles.total}>/{kpi.total}</Text>}
        </Text>
        {/* Past MAX_PIPS the squares no longer fit beside the timer; "N/total" says the same. */}
        {kpi.total != null && kpi.total <= MAX_PIPS && (
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
    fontFamily: fonts.ui,
    fontSize: 9,
    color: colors.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  timerBlock: {
    flexShrink: 1,
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
    fontFamily: fonts.ui,
    fontSize: 52,
    lineHeight: 52,
    letterSpacing: -2,
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  right: {
    alignItems: 'flex-end',
    flexShrink: 1,
    marginLeft: 16,
  },
  value: {
    fontFamily: fonts.display,
    fontSize: 34,
    lineHeight: 36,
    color: colors.ink,
    textTransform: 'uppercase',
    fontVariant: ['tabular-nums'],
  },
  total: {
    fontSize: 20,
    color: colors.muted,
  },
  pips: {
    marginTop: 8,
  },
});
