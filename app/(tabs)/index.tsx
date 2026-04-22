import React, { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import {
  useFonts,
  BarlowCondensed_400Regular,
  BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold,
} from '@expo-google-fonts/barlow-condensed';
import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
} from '@expo-google-fonts/ibm-plex-mono';

import { HF } from '@/constants/hf';
import { WodType, WodConfig, WodSession, SegItem, getWodConfig } from '@/constants/wods';

// ─── Types ───────────────────────────────────────────────────────────────────

type LogEntry = { id: number; ok: boolean };

type JudgeState = {
  session: WodSession;
  done: number;
  log: LogEntry[];
  invalidSticky: boolean;
};

type JudgeAction =
  | { type: 'REP'; config: WodConfig }
  | { type: 'NO_REP' }
  | { type: 'RESET'; initial: JudgeState };

// ─── Reducer ─────────────────────────────────────────────────────────────────

function judgeReducer(state: JudgeState, action: JudgeAction): JudgeState {
  switch (action.type) {
    case 'REP': {
      const target = action.config.getTarget(state.session);
      const newDone = state.done + 1;
      const newLog: LogEntry[] = [...state.log, { id: Date.now() + Math.random(), ok: true }];
      if (newDone >= target && !action.config.isComplete(state.session)) {
        return { session: action.config.advance(state.session), done: 0, log: newLog, invalidSticky: false };
      }
      return { ...state, done: Math.min(newDone, target), log: newLog, invalidSticky: false };
    }
    case 'NO_REP':
      return { ...state, log: [...state.log, { id: Date.now() + Math.random(), ok: false }], invalidSticky: true };
    case 'RESET':
      return action.initial;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTime(seconds: number): string {
  const s = Math.abs(seconds);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function makeInitial(config: WodConfig): JudgeState {
  return { session: config.initialSession, done: 0, log: [], invalidSticky: false };
}

const WOD_TYPES: { key: WodType; label: string }[] = [
  { key: 'forTime', label: 'FOR TIME' },
  { key: 'amrap',   label: 'AMRAP' },
  { key: 'emom',    label: 'EMOM' },
  { key: 'chipper', label: 'CHIPPER' },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function SegBar({ items }: { items: SegItem[] }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {items.map((item, i) => {
        const pct = Math.min(100, (item.filled / item.target) * 100);
        return (
          <View key={i} style={{ flex: 1 }}>
            <View style={styles.segLabelRow}>
              <Text numberOfLines={1} style={[styles.segName, { color: item.isCurrent ? HF.ink : HF.muted }]}>
                {item.name}
              </Text>
              <Text style={[styles.segCount, { color: item.isCurrent ? HF.ink : HF.muted }]}>
                {item.filled}/{item.target}
              </Text>
            </View>
            <View style={styles.segTrack}>
              <View style={[styles.segFill, {
                width: `${pct}%` as `${number}%`,
                backgroundColor: item.isCurrent ? HF.accent : HF.inkDim,
              }]} />
            </View>
          </View>
        );
      })}
    </View>
  );
}

function DotTrail({ log }: { log: LogEntry[] }) {
  return (
    <View style={styles.dotTrail}>
      {log.map((entry) =>
        entry.ok ? (
          <View key={entry.id} style={styles.dotRep} />
        ) : (
          <Text key={entry.id} style={styles.dotNoRep}>✕</Text>
        )
      )}
    </View>
  );
}

function DropStrip({ kind }: { kind: 'rep' | 'noRep' }) {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    translateX.value = withTiming(kind === 'rep' ? -380 : 380, {
      duration: 420,
      easing: Easing.bezier(0.3, 0.7, 0.3, 1),
    });
    opacity.value = withTiming(0, { duration: 400 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.dropBase,
        kind === 'rep' ? styles.dropRight : styles.dropLeft,
        { backgroundColor: kind === 'rep' ? `${HF.rep}70` : `${HF.noRep}70` },
        animStyle,
      ]}
    />
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function JudgeScreen() {
  const insets = useSafeAreaInsets();

  const [fontsLoaded] = useFonts({
    BarlowCondensed_400Regular,
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
  });

  const [wodType, setWodType] = useState<WodType>('forTime');
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [dropKey, setDropKey] = useState(0);
  const [lastKind, setLastKind] = useState<'rep' | 'noRep' | null>(null);

  const config = useMemo(() => getWodConfig(wodType), [wodType]);
  const [judgeState, dispatch] = useReducer(judgeReducer, config, makeInitial);
  const judgeStateRef = React.useRef(judgeState);
  judgeStateRef.current = judgeState;

  const counterScale = useSharedValue(1);
  const crosshairWidth = useSharedValue(40);
  const invalidProgress = useSharedValue(0);

  // Reset on WOD type change
  useEffect(() => {
    const newConfig = getWodConfig(wodType);
    dispatch({ type: 'RESET', initial: makeInitial(newConfig) });
    setElapsed(0);
    setIsRunning(false);
    setLastKind(null);
    invalidProgress.value = withTiming(0, { duration: 200 });
    counterScale.value = 1;
    crosshairWidth.value = 40;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wodType]);

  // Timer
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  // EMOM: auto-advance minute on the timer every 60 s
  useEffect(() => {
    if (wodType !== 'emom' || !isRunning) return;
    const id = setInterval(() => {
      const prev = judgeStateRef.current;
      dispatch({ type: 'RESET', initial: {
        session: config.advance(prev.session),
        done: 0,
        log: prev.log,
        invalidSticky: false,
      }});
    }, 60_000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wodType, isRunning]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleRep = useCallback(() => {
    dispatch({ type: 'REP', config });
    setLastKind('rep');
    setDropKey((k) => k + 1);

    counterScale.value = withSequence(
      withTiming(1.08, { duration: 40, easing: Easing.out(Easing.quad) }),
      withSpring(1, { damping: 15, stiffness: 200 }),
    );
    crosshairWidth.value = withSequence(
      withTiming(120, { duration: 80 }),
      withTiming(40, { duration: 200 }),
    );
    invalidProgress.value = withTiming(0, { duration: 240 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [config, counterScale, crosshairWidth, invalidProgress]);

  const handleNoRep = useCallback(() => {
    dispatch({ type: 'NO_REP' });
    setLastKind('noRep');
    setDropKey((k) => k + 1);

    counterScale.value = withSequence(
      withTiming(1.05, { duration: 60 }),
      withSpring(1, { damping: 10, stiffness: 200 }),
    );
    invalidProgress.value = withTiming(1, { duration: 100 });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, [counterScale, invalidProgress]);

  // ─── Gestures ──────────────────────────────────────────────────────────────

  const pan = Gesture.Pan().onEnd((evt) => {
    'worklet';
    if (evt.translationX < -20) {
      runOnJS(handleNoRep)();
    } else {
      runOnJS(handleRep)();
    }
  });

  // ─── Derived display ───────────────────────────────────────────────────────

  const { session, done, log, invalidSticky } = judgeState;
  const target = config.getTarget(session);
  const exerciseName = config.getExerciseName(session);
  const kpi = config.getKpi(session);
  const sectionLabel = config.getSectionLabel(session);
  const segments = config.getSegments(session, done);
  const hint = config.getHint(session, done);
  const repsCount = log.filter((e) => e.ok).length;
  const noRepsCount = log.filter((e) => !e.ok).length;

  const timerStr = useMemo(() => {
    if (config.timerMode === 'remaining') return formatTime(Math.max(0, config.totalSeconds - elapsed));
    if (config.timerMode === 'minLeft') return formatTime(Math.max(0, 60 - (elapsed % 60)));
    return formatTime(elapsed);
  }, [config, elapsed]);

  const timerLabel =
    config.timerMode === 'remaining' ? 'remaining' :
    config.timerMode === 'minLeft'   ? 'min left'  : 'elapsed';

  // ─── Animated styles ───────────────────────────────────────────────────────

  const counterStyle = useAnimatedStyle(() => ({
    transform: [{ scale: counterScale.value }],
    color: interpolateColor(invalidProgress.value, [0, 1], [HF.ink, HF.accent]),
  }));

  const crosshairStyle = useAnimatedStyle(() => ({ width: crosshairWidth.value }));

  const exerciseNameStyle = useAnimatedStyle(() => ({
    color: interpolateColor(invalidProgress.value, [0, 1], [HF.ink, HF.accent]),
  }));

  const railStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(invalidProgress.value, [0, 1], [HF.hairlineStrong, HF.accent]),
  }));

  // ─── Render ────────────────────────────────────────────────────────────────

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: HF.bg }} />;
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>

      {/* Top strip — tap to start/stop, long-press to reset */}
      <Pressable
        onPress={() => setIsRunning((r) => !r)}
        onLongPress={() => { setElapsed(0); setIsRunning(false); }}
        style={styles.topStrip}
      >
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

      {/* Gesture zone */}
      <GestureDetector gesture={pan}>
        <View style={styles.gestureArea}>

          {/* Side rails (FX H HUD) */}
          <Animated.View style={[styles.railLeft, railStyle]} />
          <Animated.View style={[styles.railRight, railStyle]} />
          {([0, 0.25, 0.5, 0.75, 1] as const).map((p) => (
            <React.Fragment key={p}>
              <Animated.View style={[styles.tickLeft, { top: `${10 + p * 80}%` as `${number}%` }, railStyle]} />
              <Animated.View style={[styles.tickRight, { top: `${10 + p * 80}%` as `${number}%` }, railStyle]} />
            </React.Fragment>
          ))}

          {/* Drop animation (FX H) — remounts on each event to re-trigger */}
          {lastKind != null && <DropStrip key={dropKey} kind={lastKind} />}

          {/* Section label */}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionLabelText}>{sectionLabel}</Text>
          </View>

          {/* Segmented progress bar */}
          <View style={styles.segBarWrap}>
            <SegBar items={segments} />
          </View>

          {/* Hero counter */}
          <View style={styles.heroArea}>
            <Animated.Text style={[styles.exerciseName, exerciseNameStyle]}>
              {exerciseName}
            </Animated.Text>
            <Animated.View style={[styles.crosshair, crosshairStyle]} />
            <Animated.Text style={[styles.counterHero, counterStyle]}>
              {done}
            </Animated.Text>
            <Text style={styles.targetText}>/ {target}</Text>
            <Text style={styles.hintText} numberOfLines={1}>{hint}</Text>
          </View>

          {/* Invalid sticky badge */}
          {invalidSticky && (
            <View style={styles.invalidBadge}>
              <Text style={styles.invalidX}>✕</Text>
              <Text style={styles.invalidLabel}>invalid · retry</Text>
            </View>
          )}

          {/* Event log */}
          <View style={styles.logSection}>
            <View style={styles.logHeader}>
              <Text style={styles.tagText}>event log</Text>
              <Text style={styles.tagText}>
                <Text style={{ color: HF.rep }}>{repsCount}</Text>
                <Text style={{ color: HF.muted }}> · </Text>
                <Text style={{ color: HF.noRep }}>{noRepsCount}✕</Text>
              </Text>
            </View>
            <DotTrail log={log.slice(-40)} />
          </View>

          {/* Footer gesture hints */}
          <View style={styles.footer}>
            <Text style={[styles.gestureHint, { color: HF.noRep }]}>← ✕ no rep</Text>
            <Text style={[styles.gestureHint, { color: HF.mutedDim }]}>tap = rep</Text>
            <Text style={[styles.gestureHint, { color: HF.rep }]}>rep ■ →</Text>
          </View>

        </View>
      </GestureDetector>

      {/* WOD type picker */}
      <View style={[styles.wodPicker, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {WOD_TYPES.map(({ key, label }) => (
          <Pressable
            key={key}
            onPress={() => setWodType(key)}
            style={[styles.wodBtn, key === wodType && styles.wodBtnActive]}
          >
            <Text style={[styles.wodBtnText, key === wodType && styles.wodBtnTextActive]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: HF.bg,
  },

  // ── Top strip ──────────────────────────────────────────────────────────────
  topStrip: {
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

  // ── Gesture area ───────────────────────────────────────────────────────────
  gestureArea: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },

  // Side rails
  railLeft: {
    position: 'absolute',
    left: 0,
    top: '10%',
    bottom: '10%',
    width: 1,
  },
  railRight: {
    position: 'absolute',
    right: 0,
    top: '10%',
    bottom: '10%',
    width: 1,
  },
  tickLeft: {
    position: 'absolute',
    left: 0,
    width: 6,
    height: 1,
  },
  tickRight: {
    position: 'absolute',
    right: 0,
    width: 6,
    height: 1,
  },

  // Drop strip
  dropBase: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 36,
  },
  dropRight: { right: 0 },
  dropLeft: { left: 0 },

  // ── Section label + seg bar ────────────────────────────────────────────────
  sectionRow: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  sectionLabelText: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 10,
    color: HF.muted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  segBarWrap: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  segLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 6,
  },
  segName: {
    fontFamily: 'BarlowCondensed_600SemiBold',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    flex: 1,
  },
  segCount: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 10,
    marginLeft: 4,
  },
  segTrack: {
    height: 3,
    backgroundColor: HF.hairlineStrong,
  },
  segFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
  },

  // ── Hero counter ───────────────────────────────────────────────────────────
  heroArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  exerciseName: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 22,
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  crosshair: {
    height: 1,
    backgroundColor: HF.accent,
    marginBottom: 10,
  },
  counterHero: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 164,
    lineHeight: 148,
    letterSpacing: -4,
    textAlign: 'center',
  },
  targetText: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 18,
    color: HF.muted,
    letterSpacing: 3,
    marginTop: 8,
  },
  hintText: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 10,
    color: HF.muted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 8,
  },

  // ── Invalid badge ──────────────────────────────────────────────────────────
  invalidBadge: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: HF.accent,
    backgroundColor: '#1a0d08',
    marginBottom: 6,
  },
  invalidX: {
    fontFamily: 'IBMPlexMono_500Medium',
    fontSize: 11,
    color: HF.accent,
  },
  invalidLabel: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 10,
    color: HF.accent,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },

  // ── Event log ──────────────────────────────────────────────────────────────
  logSection: {
    paddingHorizontal: 20,
    paddingBottom: 6,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  tagText: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 10,
    color: HF.muted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  dotTrail: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: HF.hairline,
    backgroundColor: HF.surface,
    minHeight: 30,
  },
  dotRep: {
    width: 8,
    height: 8,
    backgroundColor: HF.rep,
  },
  dotNoRep: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 11,
    color: HF.noRep,
    fontWeight: '700',
    lineHeight: 12,
    width: 10,
    height: 10,
    textAlign: 'center',
  },

  // ── Footer ─────────────────────────────────────────────────────────────────
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
    paddingTop: 4,
  },
  gestureHint: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 10,
    letterSpacing: 2,
  },

  // ── WOD picker ─────────────────────────────────────────────────────────────
  wodPicker: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: HF.hairline,
  },
  wodBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  wodBtnActive: {
    borderTopWidth: 1,
    borderTopColor: HF.accent,
    marginTop: -1,
  },
  wodBtnText: {
    fontFamily: 'BarlowCondensed_600SemiBold',
    fontSize: 11,
    color: HF.muted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  wodBtnTextActive: {
    color: HF.ink,
  },
});
