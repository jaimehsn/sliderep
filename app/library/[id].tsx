import { useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import {
  useFonts,
  BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold,
} from '@expo-google-fonts/barlow-condensed';
import { IBMPlexMono_400Regular } from '@expo-google-fonts/ibm-plex-mono';

import { Screen } from '@/components/screen';
import { HF } from '@/constants/hf';
import { WodId, WOD_IDS, getWodConfig } from '@/constants/wods';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  return `${m} min`;
}

export default function LibraryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const valid = WOD_IDS.includes(id as WodId);

  const [fontsLoaded] = useFonts({
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    IBMPlexMono_400Regular,
  });

  useEffect(() => {
    if (!valid) {
      router.replace('/library');
    }
  }, [valid]);

  if (!fontsLoaded || !valid) {
    return <View style={{ flex: 1, backgroundColor: HF.bg }} />;
  }

  const config = getWodConfig(id as WodId);

  return (
    <Screen style={styles.root}>

      {/* Header */}
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
            style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
            hitSlop={12}
          >
            <Text style={styles.closeBtnText}>✕</Text>
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

    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: HF.bg,
  },

  // ── Header ─────────────────────────────────────────────────────────────────
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
  closeBtn: {
    marginLeft: 16,
    marginTop: 2,
  },
  closeBtnPressed: {
    opacity: 0.4,
  },
  closeBtnText: {
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

  // ── Exercise list ──────────────────────────────────────────────────────────
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
});
