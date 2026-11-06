import { Fragment, useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text, TextInput } from '@/components/text';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import {
  useFonts,
  BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold,
} from '@expo-google-fonts/barlow-condensed';
import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
} from '@expo-google-fonts/ibm-plex-mono';

import { HF } from '@/constants/hf';
import { Screen } from '@/components/screen';
import { useProfile } from '@/hooks/use-profile';
import { LogEntry } from '@/components/judge/types';
import { getSession, StoredSession } from '@/db/sessions';
import { Workout, getWorkout } from '@/db/workouts';
import { AdjustmentChange, SessionAdjustment, addAdjustment, getAdjustments } from '@/db/session-adjustments';
import { deriveAdjustedResult } from '@/components/result/adjust';
import { Split } from '@/components/result/replay';
import { capSeconds, intervalSeconds, isSequence } from '@/constants/wod-engine';
import { MAX_REPS } from '@/components/editor/draft';

/** A new target takes as many digits as the reps limit has (change responsive-review). */
const TARGET_DIGITS = String(MAX_REPS).length;

export default function AdjustScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const db = useSQLiteContext();
  const { profile } = useProfile();

  const [fontsLoaded] = useFonts({
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
  });
  const [loaded, setLoaded] = useState(false);
  const [session, setSession] = useState<StoredSession | null>(null);
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [adjustments, setAdjustments] = useState<SessionAdjustment[]>([]);
  const [pending, setPending] = useState<AdjustmentChange[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [durationDraft, setDurationDraft] = useState<string | null>(null);

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
  const approvedChanges = useMemo(() => adjustments.flatMap((a) => a.changes), [adjustments]);
  const previewChanges = useMemo(() => [...approvedChanges, ...pending], [approvedChanges, pending]);
  const result = config ? deriveAdjustedResult(config, log, previewChanges) : null;
  const sequence = config != null && isSequence(config);
  // The duration is the last block's on a workout of several blocks (change multi-block-workouts).
  const durationConfig = config != null && isSequence(config) ? config.parts[config.parts.length - 1] : config;
  const isEmom = durationConfig?.advanceMode === 'onClock';
  // The duration field's unit in seconds: an EMOM's interval (minutes at 60 s), else plain seconds.
  const durationUnit = durationConfig && isEmom ? intervalSeconds(durationConfig) : 1;
  const durationUnitLabel = !isEmom ? 'SEC' : durationUnit === 60 ? 'MIN' : 'INTERVALS';
  const hasDuration = (durationConfig?.totalSeconds ?? 0) > 0;
  const remaining = 3 - adjustments.length;

  if (!fontsLoaded || !loaded || !config || !durationConfig || !result) {
    return <View style={{ flex: 1, backgroundColor: HF.bg }} />;
  }

  const keyOf = (split: Split) => `${split.blockIdx ?? 0}:${split.roundIdx}:${split.exIdx}`;
  const sameTarget = (c: AdjustmentChange, split: Split) =>
    c.type === 'target' && c.roundIdx === split.roundIdx && c.exIdx === split.exIdx && (c.blockIdx ?? 0) === (split.blockIdx ?? 0);

  const startEdit = (split: Split) => {
    setEditingKey(keyOf(split));
    setEditingValue(String(split.target));
  };

  const commitEdit = (split: Split) => {
    const n = parseInt(editingValue, 10);
    setEditingKey(null);
    if (!Number.isFinite(n) || n <= 0 || n > MAX_REPS || n === split.target) return;
    // A workout of several blocks names the block; one block writes the change as before.
    const block = sequence ? { blockIdx: split.blockIdx ?? 0 } : {};
    setPending((prev) => [
      ...prev.filter((c) => !sameTarget(c, split)),
      { type: 'target', roundIdx: split.roundIdx, exIdx: split.exIdx, newTarget: n, ...block },
    ]);
  };

  const currentDurationSeconds = (() => {
    let value = durationConfig.totalSeconds;
    for (const c of previewChanges) if (c.type === 'duration') value = c.newDurationSeconds;
    return value;
  })();
  const durationDisplay = String(Math.round(currentDurationSeconds / durationUnit));

  const commitDuration = () => {
    const raw = durationDraft;
    setDurationDraft(null);
    if (raw == null) return;
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n <= 0) return;
    const newDurationSeconds = n * durationUnit;
    if (newDurationSeconds === currentDurationSeconds) return;
    setPending((prev) => [...prev.filter((c) => c.type !== 'duration'), { type: 'duration', newDurationSeconds }]);
  };

  const savePackage = async () => {
    if (pending.length === 0 || remaining <= 0 || !profile || !sessionId) return;
    await addAdjustment(db, sessionId, pending, profile.id);
    setPending([]);
    setDurationDraft(null);
    await load();
  };

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

      {/* Score, duration and splits scroll as one under the fixed title row (change responsive-review);
          SAVE PACKAGE stays below, outside the scroller. */}
      <ScrollView style={styles.splits} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.scoreBlock}>
          <Text style={styles.scoreLabel}>{result.scoreLabel}</Text>
          <Text style={styles.scoreValue} allowFontScaling={false} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.3}>
            {result.scoreValue}
          </Text>
        </View>

        {hasDuration && (
          <View style={styles.durationRow}>
            <Text style={styles.durationLabel}>
              {sequence ? 'LAST BLOCK ' : ''}
              {capSeconds(durationConfig) != null ? 'TIME CAP' : 'DURATION'} ({durationUnitLabel})
            </Text>
            {durationDraft != null ? (
              <TextInput
                style={styles.durationInput}
                value={durationDraft}
                onChangeText={setDurationDraft}
                keyboardType="number-pad"
                autoFocus
                onBlur={commitDuration}
                onSubmitEditing={commitDuration}
              />
            ) : (
              <Pressable onPress={() => setDurationDraft(durationDisplay)}>
                <Text style={styles.durationValue}>{durationDisplay}</Text>
              </Pressable>
            )}
          </View>
        )}

        <View style={styles.splitsContent}>
          {result.splits.map((split, i) => {
            const key = keyOf(split);
            const editing = editingKey === key;
            return (
              <Fragment key={i}>
                {result.groups != null && split.blockIdx !== result.splits[i - 1]?.blockIdx && (
                  <Text style={styles.groupTitle}>{result.groups[split.blockIdx ?? 0].title}</Text>
                )}
                <Pressable onPress={() => !editing && startEdit(split)} style={styles.splitRow}>
                  <View style={styles.splitLeft}>
                    <Text style={[styles.splitLabel, !split.completed && styles.splitLabelPartial]}>{split.label}</Text>
                    {editing ? (
                      <TextInput
                        style={styles.editInput}
                        value={editingValue}
                        onChangeText={setEditingValue}
                        keyboardType="number-pad"
                        // Android's maxLength also cuts the prefilled value: a target past the limit
                        // (an EMOM increment can reach one) is shown whole, and only a new one is limited.
                        maxLength={split.target <= MAX_REPS ? TARGET_DIGITS : undefined}
                        autoFocus
                        onBlur={() => commitEdit(split)}
                        onSubmitEditing={() => commitEdit(split)}
                      />
                    ) : (
                      <Text style={styles.splitReps}>{split.reps}/{split.target}</Text>
                    )}
                  </View>
                </Pressable>
              </Fragment>
            );
          })}
        </View>
      </ScrollView>

      <Pressable
        onPress={savePackage}
        disabled={pending.length === 0 || remaining <= 0}
        style={({ pressed }) => [
          styles.saveBtn,
          (pending.length === 0 || remaining <= 0) && styles.saveBtnDisabled,
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
    backgroundColor: HF.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  title: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 22,
    color: HF.ink,
    letterSpacing: 2,
  },
  subtitle: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 10,
    color: HF.muted,
    letterSpacing: 1,
    marginTop: 4,
  },
  closeBtnText: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 20,
    color: HF.muted,
  },
  scoreBlock: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  scoreLabel: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 11,
    color: HF.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  scoreValue: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 48,
    color: HF.ink,
    fontVariant: ['tabular-nums'],
    // Full width, so a long score shrinks to the screen instead of wrapping.
    alignSelf: 'stretch',
    textAlign: 'center',
  },
  durationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: HF.hairline,
  },
  durationLabel: {
    flexShrink: 1,
    marginRight: 16,
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 11,
    color: HF.muted,
    letterSpacing: 1.5,
  },
  durationValue: {
    fontFamily: 'IBMPlexMono_500Medium',
    fontSize: 16,
    color: HF.ink,
  },
  durationInput: {
    fontFamily: 'IBMPlexMono_500Medium',
    fontSize: 16,
    color: HF.ink,
    borderBottomWidth: 1,
    borderBottomColor: HF.hairlineStrong,
    minWidth: 60,
    textAlign: 'right',
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
    fontFamily: 'IBMPlexMono_500Medium',
    fontSize: 11,
    color: HF.muted,
    letterSpacing: 1.5,
    paddingTop: 20,
    paddingBottom: 4,
  },
  splitRow: {
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
  editInput: {
    fontFamily: 'IBMPlexMono_500Medium',
    fontSize: 14,
    color: HF.accent,
    borderBottomWidth: 1,
    borderBottomColor: HF.accent,
    marginTop: 2,
    minWidth: 60,
  },
  saveBtn: {
    borderWidth: 1.5,
    borderColor: HF.accent,
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
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 16,
    color: HF.accent,
    letterSpacing: 3,
  },
});
