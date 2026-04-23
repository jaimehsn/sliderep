import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { HF } from '@/constants/hf';
import { WodConfig } from '@/constants/wods';

type Props = {
  config: WodConfig;
  onDone: () => void;
};

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  return `${m} min`;
}

export function StartOverlay({ config, onDone }: Props) {
  const [phase, setPhase] = useState<'ready' | 'countdown'>('ready');
  const [count, setCount] = useState(10);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (phase !== 'countdown') return;
    const id = setInterval(() => setCount((c) => c - 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

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
            {config.totalSeconds > 0 && (
              <Text style={styles.duration}>{formatDuration(config.totalSeconds)}</Text>
            )}
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
        {config.exercises.map((ex, i) => (
          <View key={i} style={styles.exerciseRow}>
            <Text style={styles.exerciseName}>{ex.name}</Text>
            <Text style={styles.exerciseDetail}>{ex.detail}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.divider} />

      {/* Start button */}
      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
          onPress={() => setPhase('countdown')}
        >
          <Text style={styles.btnText}>COMENZAR</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: HF.bg,
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
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 18,
    color: HF.muted,
    lineHeight: 22,
  },
  mode: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 10,
    color: HF.accent,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  name: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 42,
    color: HF.ink,
    letterSpacing: 3,
    textTransform: 'uppercase',
    lineHeight: 42,
  },
  duration: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 11,
    color: HF.muted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 8,
  },

  divider: {
    height: 1,
    backgroundColor: HF.hairline,
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
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: HF.hairline,
  },
  exerciseName: {
    fontFamily: 'BarlowCondensed_600SemiBold',
    fontSize: 20,
    color: HF.ink,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  exerciseDetail: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 12,
    color: HF.muted,
    letterSpacing: 1,
  },

  // ── Ready: footer button ───────────────────────────────────────────────────
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
  },
  btn: {
    borderWidth: 1.5,
    borderColor: HF.accent,
    paddingHorizontal: 52,
    paddingVertical: 16,
  },
  btnPressed: {
    opacity: 0.55,
  },
  btnText: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 20,
    color: HF.accent,
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
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 140,
    color: HF.ink,
    letterSpacing: -4,
    lineHeight: 140,
  },
});
