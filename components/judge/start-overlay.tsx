import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
import { router } from 'expo-router';
import { colors, fonts } from '@/constants/theme';
import { WorkoutBreakdown } from '@/components/workout-breakdown';
import { WodConfig, durationLine } from '@/constants/wod-engine';
import { useSoundCue } from '@/hooks/use-sound-cue';

type Props = {
  config: WodConfig;
  athleteAlias?: string | null;
  role?: 'judge' | 'judged';
  onDone: () => void;
};

export function StartOverlay({ config, athleteAlias, role = 'judge', onDone }: Props) {
  const judgingLabel = role === 'judged'
    ? (athleteAlias ? `Judged by ${athleteAlias}` : 'Judged by anonymous')
    : (athleteAlias ? `Judging ${athleteAlias}` : 'Judging anonymous');
  const [phase, setPhase] = useState<'ready' | 'countdown'>('ready');
  const [count, setCount] = useState(10);
  const onDoneRef = useRef(onDone);
  const playTick = useSoundCue(require('@/assets/sounds/tick.wav'));
  const playGo = useSoundCue(require('@/assets/sounds/go.wav'));

  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (phase !== 'countdown') return;
    const id = setInterval(() => setCount((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'countdown') return;
    if (count > 0) playTick();
    else playGo();
  }, [phase, count, playTick, playGo]);

  useEffect(() => {
    if (phase !== 'countdown' || count > 0) return;
    const id = setTimeout(() => onDoneRef.current(), 500);
    return () => clearTimeout(id);
  }, [phase, count]);

  if (phase === 'countdown') {
    return (
      <View style={styles.root}>
        <View style={styles.countdownHeader}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.mode}>{config.mode}</Text>
              <Text style={styles.name}>{config.name}</Text>
              <Text style={styles.judging}>{judgingLabel}</Text>
            </View>
          </View>
        </View>
        <View style={styles.countdownCenter}>
          <Text style={styles.countdownNumber}>{count === 0 ? 'GO!' : count}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* WOD header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.mode}>{config.mode}</Text>
            <Text style={styles.name}>{config.name}</Text>
            {durationLine(config) != null && (
              <Text style={styles.duration}>{durationLine(config)}</Text>
            )}
            <Text style={styles.judging}>{judgingLabel}</Text>
          </View>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, pressed && styles.backBtnPressed]}
            hitSlop={12}
          >
            <Text style={styles.backBtnText}>✕</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Exercise list */}
      <ScrollView
        style={styles.exerciseList}
        contentContainerStyle={styles.exerciseListContent}
        scrollIndicatorInsets={{ right: 1 }}
      >
        <WorkoutBreakdown config={config} />
      </ScrollView>

      <View style={styles.divider} />

      {/* Start button */}
      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
          onPress={() => setPhase('countdown')}
        >
          <Text style={styles.btnText}>START</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  // ── Ready: header ──────────────────────────────────────────────────────────
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
  },
  backBtn: {
    marginLeft: 16,
    marginTop: 2,
  },
  backBtnPressed: {
    opacity: 0.4,
  },
  backBtnText: {
    fontFamily: fonts.ui,
    fontSize: 18,
    color: colors.muted,
    lineHeight: 22,
  },
  mode: {
    fontFamily: fonts.ui,
    fontSize: 10,
    color: colors.accent,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  name: {
    fontFamily: fonts.display,
    fontSize: 42,
    color: colors.ink,
    letterSpacing: 3,
    textTransform: 'uppercase',
    lineHeight: 42,
  },
  duration: {
    fontFamily: fonts.ui,
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 8,
  },
  judging: {
    fontFamily: fonts.ui,
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 1,
    marginTop: 8,
  },

  divider: {
    height: 1,
    backgroundColor: colors.hairline,
    marginHorizontal: 24,
  },

  // ── Ready: exercise list ───────────────────────────────────────────────────
  exerciseList: {
    flex: 1,
  },
  exerciseListContent: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },

  // ── Ready: footer button ───────────────────────────────────────────────────
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
  },
  btn: {
    borderWidth: 1.5,
    borderColor: colors.accent,
    paddingHorizontal: 52,
    paddingVertical: 16,
  },
  btnPressed: {
    opacity: 0.55,
  },
  btnText: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.accent,
    letterSpacing: 5,
    textTransform: 'uppercase',
  },

  // ── Countdown ──────────────────────────────────────────────────────────────
  countdownHeader: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  countdownCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownNumber: {
    fontFamily: fonts.display,
    fontSize: 140,
    color: colors.ink,
    letterSpacing: -4,
    lineHeight: 140,
  },
});
