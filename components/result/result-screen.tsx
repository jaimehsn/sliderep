import { Fragment, useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { colors, fonts } from '@/constants/theme';
import { WodConfig, formatTime } from '@/constants/wod-engine';
import { LogEntry } from '@/components/judge/types';
import { acceptedIds, deriveAdjustedResult, reviewNoReps } from '@/components/result/adjust';
import { AdjustmentChange, getAdjustments } from '@/db/session-adjustments';

type Props = {
  config: WodConfig;
  log: LogEntry[];
  athleteAlias?: string | null;
  role?: 'judge' | 'judged';
  saved: 'own' | 'foreign' | 'none' | 'saving' | 'failed';
  sessionId?: string | null;
  canAdjust?: boolean;
};

export function ResultScreen({ config, log, athleteAlias, role = 'judge', saved, sessionId = null, canAdjust = false }: Props) {
  const db = useSQLiteContext();
  const [changes, setChanges] = useState<AdjustmentChange[]>([]);
  const [packagesUsed, setPackagesUsed] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (!sessionId) return;
      getAdjustments(db, sessionId).then((rows) => {
        setChanges(rows.flatMap((r) => r.changes));
        setPackagesUsed(rows.length);
      });
    }, [db, sessionId]),
  );

  const result = deriveAdjustedResult(config, log, changes);
  // Change no-rep-review: adjusting is accepting no-reps, so only while one is left to accept.
  const noRepLeft = canAdjust && reviewNoReps(config, log, acceptedIds(changes)).some((n) => n.status === 'open');
  const judgingLabel = role === 'judged'
    ? (athleteAlias ? `Judged by ${athleteAlias}` : 'Judged by anonymous')
    : (athleteAlias ? `Judging ${athleteAlias}` : 'Judging anonymous');
  const savedLabel =
    saved === 'own' ? 'Saved in your history' :
    saved === 'foreign' ? `Saved on this phone — will be delivered to ${athleteAlias} once sync exists` :
    saved === 'saving' ? 'Saving…' :
    saved === 'failed' ? "Couldn't save this session" :
    'Not saved';

  return (
    // Header, score and splits scroll as one (change responsive-review), so a long header can't squeeze the splits.
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.mode}>{config.mode}</Text>
        <Text style={styles.name}>{config.name}</Text>
        <Text style={styles.judging}>{judgingLabel}</Text>
        <Text style={styles.saved}>{savedLabel}</Text>
        {noRepLeft && sessionId != null && packagesUsed < 3 && (
          <Pressable
            onPress={() => router.push({ pathname: '/session/adjust', params: { sessionId } })}
            style={({ pressed }) => [styles.adjustBtn, pressed && styles.adjustBtnPressed]}
          >
            <Text style={styles.adjustBtnText}>ADJUST RESULT</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.scoreBlock}>
        <Text style={styles.scoreLabel}>{result.scoreLabel}</Text>
        <Text style={styles.scoreValue} allowFontScaling={false} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.3}>
          {result.scoreValue}
        </Text>
      </View>

      <View style={styles.splitsContent}>
        {result.splits.map((split, i) => (
          <Fragment key={i}>
            {/* Workouts of several blocks: a header before each block's splits (change multi-block-workouts). */}
            {result.groups != null && split.blockIdx !== result.splits[i - 1]?.blockIdx && (
              <Text style={styles.groupTitle}>{result.groups[split.blockIdx ?? 0].title}</Text>
            )}
            <View style={styles.splitRow}>
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
          </Fragment>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  mode: {
    fontFamily: fonts.ui,
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  name: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.ink,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  judging: {
    fontFamily: fonts.ui,
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 1,
    marginTop: 6,
  },
  saved: {
    fontFamily: fonts.ui,
    fontSize: 11,
    color: colors.accent,
    letterSpacing: 1,
    marginTop: 4,
  },
  adjustBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
  },
  adjustBtnPressed: {
    opacity: 0.5,
  },
  adjustBtnText: {
    fontFamily: fonts.ui,
    fontSize: 10,
    color: colors.inkDim,
    letterSpacing: 1.5,
  },
  scoreBlock: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 24,
  },
  scoreLabel: {
    fontFamily: fonts.ui,
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  scoreValue: {
    fontFamily: fonts.display,
    fontSize: 76,
    lineHeight: 72,
    letterSpacing: -2,
    color: colors.ink,
    fontVariant: ['tabular-nums'],
    // Full width, so a long score shrinks to the screen instead of wrapping.
    alignSelf: 'stretch',
    textAlign: 'center',
  },
  splitsContent: {
    paddingHorizontal: 24,
  },
  groupTitle: {
    fontFamily: fonts.ui,
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 1.5,
    paddingTop: 20,
    paddingBottom: 4,
  },
  splitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  splitLeft: {
    flex: 1,
  },
  splitLabel: {
    fontFamily: fonts.display,
    fontSize: 17,
    color: colors.ink,
    textTransform: 'uppercase',
  },
  splitLabelPartial: {
    color: colors.inkDim,
  },
  splitReps: {
    fontFamily: fonts.ui,
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  splitRight: {
    alignItems: 'flex-end',
  },
  splitCumulative: {
    fontFamily: fonts.ui,
    fontSize: 16,
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  splitLap: {
    fontFamily: fonts.ui,
    fontSize: 11,
    color: colors.muted,
    fontVariant: ['tabular-nums'],
    marginTop: 2,
  },
});
