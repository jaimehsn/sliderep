import { Fragment, useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { colors, fonts } from '@/constants/theme';
import { Screen } from '@/components/screen';
import { useProfile } from '@/hooks/use-profile';
import { LogEntry } from '@/components/judge/types';
import { getSession, StoredSession } from '@/db/sessions';
import { Workout, getWorkout } from '@/db/workouts';
import { AdjustmentChange, SessionAdjustment, addAdjustment, getAdjustments } from '@/db/session-adjustments';
import { ReviewNoRep, acceptedIds, deriveAdjustedResult, reviewNoReps } from '@/components/result/adjust';
import { deriveResult, splitLabel } from '@/components/result/replay';
import { START_POSITION, WodConfig, formatTime, isSequence } from '@/constants/wod-engine';

// The no-rep review (change no-rep-review): the judge accepts no-reps they gave, in up
// to 3 packages. Each no-rep is listed under its split; accepting is final.

const toChanges = (ids: Iterable<number>): AdjustmentChange[] => [...ids].map((eventIdx) => ({ type: 'acceptNoRep', eventIdx }));
const positionKey = (blockIdx: number, roundIdx: number, exIdx: number) => `${blockIdx}:${roundIdx}:${exIdx}`;

export default function AdjustScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const db = useSQLiteContext();
  const { profile } = useProfile();

  const [loaded, setLoaded] = useState(false);
  const [session, setSession] = useState<StoredSession | null>(null);
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [adjustments, setAdjustments] = useState<SessionAdjustment[]>([]);
  const [pending, setPending] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    if (!sessionId) return;
    const [s, rows] = await Promise.all([getSession(db, sessionId), getAdjustments(db, sessionId)]);
    if (s) setWorkout(await getWorkout(db, s.wodId));
    setSession(s);
    setAdjustments(rows);
    setLoaded(true);
  }, [db, sessionId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const config = workout?.config ?? null;
  const log: LogEntry[] = useMemo(
    () => session?.events.map((e, i) => ({ id: i, ok: e.kind === 'rep', t: e.t })) ?? [],
    [session],
  );
  const saved = useMemo(() => acceptedIds(adjustments.flatMap((a) => a.changes)), [adjustments]);
  const accepted = useMemo(() => new Set([...saved, ...pending]), [saved, pending]);
  const remaining = 3 - adjustments.length;

  if (!loaded || !config) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  const result = deriveAdjustedResult(config, log, toChanges(accepted));
  const unadjusted = deriveResult(config, log);
  const noReps = reviewNoReps(config, log, accepted);
  const partOf = (blockIdx: number): WodConfig => (isSequence(config) ? config.parts[blockIdx] : config);

  // Each no-rep under its split; a position reached with no-reps only has no split,
  // so its no-reps follow the block's last split under the position's label.
  const splitKeys = new Set(result.splits.map((s) => positionKey(s.blockIdx ?? 0, s.roundIdx, s.exIdx)));
  const underSplit = new Map<string, ReviewNoRep[]>();
  const orphans = new Map<number, ReviewNoRep[]>();
  for (const n of noReps) {
    const key = positionKey(n.blockIdx ?? 0, n.roundIdx, n.exIdx);
    if (splitKeys.has(key)) underSplit.set(key, [...(underSplit.get(key) ?? []), n]);
    else orphans.set(n.blockIdx ?? 0, [...(orphans.get(n.blockIdx ?? 0) ?? []), n]);
  }
  const blocksWithSplits = new Set(result.splits.map((s) => s.blockIdx ?? 0));
  const groupTitle = (blockIdx: number) =>
    result.groups != null && <Text style={styles.groupTitle}>{result.groups[blockIdx].title}</Text>;

  const toggle = (n: ReviewNoRep) => {
    setPending((prev) => {
      const next = new Set(prev);
      if (next.has(n.id)) next.delete(n.id);
      else next.add(n.id);
      return next;
    });
  };

  const savePackage = async () => {
    if (pending.size === 0 || remaining <= 0 || !profile || !sessionId) return;
    await addAdjustment(db, sessionId, toChanges(pending), profile.id);
    setPending(new Set());
    await load();
  };

  const noRepRow = (n: ReviewNoRep) => {
    const locked = n.status === 'surplus' || saved.has(n.id) || remaining <= 0;
    const action =
      n.status === 'surplus' ? 'SURPLUS' : saved.has(n.id) ? 'ACCEPTED' : n.status === 'accepted' ? 'REP' : 'KEEP';
    return (
      <View key={n.id} style={styles.noRepRow}>
        <Text style={styles.noRepTime}>{formatTime(Math.floor(n.t / 1000))}</Text>
        <Text style={styles.noRepLabel}>NO-REP</Text>
        <Pressable onPress={() => toggle(n)} disabled={locked} hitSlop={8}
          style={[styles.toggle, action === 'REP' && styles.toggleRep, locked && styles.toggleLocked]}>
          <Text style={[styles.toggleText, action === 'REP' && styles.toggleTextRep]}>{action}</Text>
        </Pressable>
      </View>
    );
  };

  const orphanRows = (blockIdx: number) => {
    const rows = orphans.get(blockIdx);
    if (!rows) return null;
    const byPosition = new Map<string, ReviewNoRep[]>();
    for (const n of rows) {
      const key = `${n.roundIdx}:${n.exIdx}`;
      byPosition.set(key, [...(byPosition.get(key) ?? []), n]);
    }
    return [...byPosition.values()].map((group) => (
      <Fragment key={`orphan:${blockIdx}:${group[0].roundIdx}:${group[0].exIdx}`}>
        <View style={styles.splitRow}>
          <Text style={[styles.splitLabel, styles.splitLabelPartial]}>
            {splitLabel(partOf(blockIdx), { ...START_POSITION, roundIdx: group[0].roundIdx, exIdx: group[0].exIdx })}
          </Text>
        </View>
        {group.map(noRepRow)}
      </Fragment>
    ));
  };

  const scoreChanged = unadjusted.scoreLabel !== result.scoreLabel || unadjusted.scoreValue !== result.scoreValue;

  return (
    <Screen style={styles.root} minBottomPadding={24}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>ADJUST RESULT</Text>
          <Text style={styles.subtitle}>{adjustments.length} of 3 packages used</Text>
        </View>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.closeBtnText}>✕</Text>
        </Pressable>
      </View>

      {/* Score and splits scroll as one under the fixed title row (change responsive-review);
          SAVE PACKAGE stays below, outside the scroller. */}
      <ScrollView style={styles.splits} contentContainerStyle={styles.scrollContent}>
        <View style={styles.scoreBlock}>
          <Text style={styles.scoreLabel}>{result.scoreLabel}</Text>
          <Text style={styles.scoreValue} allowFontScaling={false} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.3}>
            {result.scoreValue}
          </Text>
          {scoreChanged && (
            <Text style={styles.unadjusted} numberOfLines={1}>
              WITHOUT ADJUSTMENTS {unadjusted.scoreValue}
            </Text>
          )}
        </View>

        <View style={styles.splitsContent}>
          {result.splits.map((split, i) => {
            const blockIdx = split.blockIdx ?? 0;
            const lastOfBlock = (result.splits[i + 1]?.blockIdx ?? 0) !== blockIdx || i === result.splits.length - 1;
            return (
              <Fragment key={i}>
                {i === 0 || result.splits[i - 1].blockIdx !== split.blockIdx ? groupTitle(blockIdx) : null}
                <View style={styles.splitRow}>
                  <Text style={[styles.splitLabel, !split.completed && styles.splitLabelPartial]}>{split.label}</Text>
                  <Text style={styles.splitReps}>{split.reps}/{split.target}</Text>
                </View>
                {(underSplit.get(positionKey(blockIdx, split.roundIdx, split.exIdx)) ?? []).map(noRepRow)}
                {lastOfBlock && orphanRows(blockIdx)}
              </Fragment>
            );
          })}
          {/* A block whose only events were no-reps has no split at all. */}
          {[...orphans.keys()].filter((b) => !blocksWithSplits.has(b)).map((b) => (
            <Fragment key={`block:${b}`}>
              {groupTitle(b)}
              {orphanRows(b)}
            </Fragment>
          ))}
        </View>
      </ScrollView>

      <Pressable
        onPress={savePackage}
        disabled={pending.size === 0 || remaining <= 0}
        style={({ pressed }) => [
          styles.saveBtn,
          (pending.size === 0 || remaining <= 0) && styles.saveBtnDisabled,
          pressed && styles.saveBtnPressed,
        ]}
      >
        <Text style={styles.saveBtnText}>SAVE PACKAGE</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.ink,
    letterSpacing: 2,
  },
  subtitle: {
    fontFamily: fonts.ui,
    fontSize: 10,
    color: colors.muted,
    letterSpacing: 1,
    marginTop: 4,
  },
  closeBtnText: {
    fontFamily: fonts.ui,
    fontSize: 20,
    color: colors.muted,
  },
  scoreBlock: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  scoreLabel: {
    fontFamily: fonts.ui,
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  scoreValue: {
    fontFamily: fonts.display,
    fontSize: 48,
    color: colors.ink,
    fontVariant: ['tabular-nums'],
    // Full width, so a long score shrinks to the screen instead of wrapping.
    alignSelf: 'stretch',
    textAlign: 'center',
  },
  splits: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
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
  noRepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingLeft: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  noRepTime: {
    fontFamily: fonts.ui,
    fontSize: 12,
    color: colors.inkDim,
    marginRight: 12,
    fontVariant: ['tabular-nums'],
  },
  noRepLabel: {
    flex: 1,
    fontFamily: fonts.ui,
    fontSize: 11,
    color: colors.noRep,
    letterSpacing: 1,
  },
  toggle: {
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    paddingVertical: 6,
    minWidth: 92,
    alignItems: 'center',
  },
  toggleRep: {
    borderColor: colors.accent,
  },
  toggleLocked: {
    borderColor: colors.hairline,
    opacity: 0.6,
  },
  toggleText: {
    fontFamily: fonts.ui,
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 1.5,
  },
  toggleTextRep: {
    color: colors.accent,
  },
  unadjusted: {
    fontFamily: fonts.ui,
    fontSize: 10,
    color: colors.muted,
    letterSpacing: 1,
    marginTop: 4,
  },
  splitReps: {
    fontFamily: fonts.ui,
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  saveBtn: {
    borderWidth: 1.5,
    borderColor: colors.accent,
    marginHorizontal: 24,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.3,
  },
  saveBtnPressed: {
    opacity: 0.55,
  },
  saveBtnText: {
    fontFamily: fonts.display,
    fontSize: 16,
    color: colors.accent,
    letterSpacing: 3,
  },
});
