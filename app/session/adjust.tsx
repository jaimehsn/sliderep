import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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
import { WodId, getWodConfig } from '@/constants/wods';
import { Screen } from '@/components/screen';
import { useProfile } from '@/hooks/use-profile';
import { LogEntry } from '@/components/judge/types';
import { getSession, StoredSession } from '@/db/sessions';
import { AdjustmentChange, SessionAdjustment, addAdjustment, getAdjustments } from '@/db/session-adjustments';
import { deriveAdjustedResult } from '@/components/result/adjust';
import { Split } from '@/components/result/replay';

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
  const [adjustments, setAdjustments] = useState<SessionAdjustment[]>([]);
  const [pending, setPending] = useState<AdjustmentChange[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [durationDraft, setDurationDraft] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!sessionId) return;
    const [s, rows] = await Promise.all([getSession(db, sessionId), getAdjustments(db, sessionId)]);
    setSession(s);
    setAdjustments(rows);
    setLoaded(true);
  }, [db, sessionId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const config = useMemo(() => (session ? getWodConfig(session.wodId as WodId) : null), [session]);
  const log: LogEntry[] = useMemo(
    () => session?.events.map((e, i) => ({ id: i, ok: e.kind === 'rep', t: e.t })) ?? [],
    [session],
  );
  const approvedChanges = useMemo(() => adjustments.flatMap((a) => a.changes), [adjustments]);
  const previewChanges = useMemo(() => [...approvedChanges, ...pending], [approvedChanges, pending]);
  const result = config ? deriveAdjustedResult(config, log, previewChanges) : null;
  const isEmom = config?.advanceMode === 'onClock';
  const hasDuration = (config?.totalSeconds ?? 0) > 0;
  const remaining = 3 - adjustments.length;

  if (!fontsLoaded || !loaded || !config || !result) {
    return <View style={{ flex: 1, backgroundColor: HF.bg }} />;
  }

  const keyOf = (split: Split) => `${split.roundIdx}:${split.exIdx}`;

  const startEdit = (split: Split) => {
    setEditingKey(keyOf(split));
    setEditingValue(String(split.target));
  };

  const commitEdit = (split: Split) => {
    const n = parseInt(editingValue, 10);
    setEditingKey(null);
    if (!Number.isFinite(n) || n <= 0 || n === split.target) return;
    setPending((prev) => [
      ...prev.filter((c) => !(c.type === 'target' && c.roundIdx === split.roundIdx && c.exIdx === split.exIdx)),
      { type: 'target', roundIdx: split.roundIdx, exIdx: split.exIdx, newTarget: n },
    ]);
  };

  const currentDurationSeconds = (() => {
    let value = config.totalSeconds;
    for (const c of previewChanges) if (c.type === 'duration') value = c.newDurationSeconds;
    return value;
  })();
  const durationDisplay = isEmom ? String(Math.round(currentDurationSeconds / 60)) : String(currentDurationSeconds);

  const commitDuration = () => {
    const raw = durationDraft;
    setDurationDraft(null);
    if (raw == null) return;
    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n <= 0) return;
    const newDurationSeconds = isEmom ? n * 60 : n;
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

      <View style={styles.scoreBlock}>
        <Text style={styles.scoreLabel}>{result.scoreLabel}</Text>
        <Text style={styles.scoreValue}>{result.scoreValue}</Text>
      </View>

      {hasDuration && (
        <View style={styles.durationRow}>
          <Text style={styles.durationLabel}>DURATION ({isEmom ? 'MIN' : 'SEC'})</Text>
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

      <ScrollView style={styles.splits} contentContainerStyle={styles.splitsContent}>
        {result.splits.map((split, i) => {
          const key = keyOf(split);
          const editing = editingKey === key;
          return (
            <Pressable key={i} onPress={() => !editing && startEdit(split)} style={styles.splitRow}>
              <View style={styles.splitLeft}>
                <Text style={[styles.splitLabel, !split.completed && styles.splitLabelPartial]}>{split.label}</Text>
                {editing ? (
                  <TextInput
                    style={styles.editInput}
                    value={editingValue}
                    onChangeText={setEditingValue}
                    keyboardType="number-pad"
                    autoFocus
                    onBlur={() => commitEdit(split)}
                    onSubmitEditing={() => commitEdit(split)}
                  />
                ) : (
                  <Text style={styles.splitReps}>{split.reps}/{split.target}</Text>
                )}
              </View>
            </Pressable>
          );
        })}
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
  splitsContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
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
