import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  useFonts,
  BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold,
} from '@expo-google-fonts/barlow-condensed';
import { IBMPlexMono_400Regular } from '@expo-google-fonts/ibm-plex-mono';
import { useSQLiteContext } from 'expo-sqlite';

import { withProfile } from '@/components/editor/profile-gate';
import { Screen } from '@/components/screen';
import { HF } from '@/constants/hf';
import { Workout, archiveWorkout, getWorkout, isOwn } from '@/db/workouts';
import { useProfile } from '@/hooks/use-profile';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  return `${m} min`;
}

export default function LibraryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const { profile, refresh: refreshProfile } = useProfile();

  // A profile created from the DUPLICATE gate shows up on return.
  useFocusEffect(
    useCallback(() => {
      refreshProfile();
    }, [refreshProfile]),
  );

  const [fontsLoaded] = useFonts({
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    IBMPlexMono_400Regular,
  });

  useEffect(() => {
    getWorkout(db, id).then((w) => {
      setWorkout(w);
      if (!w) router.replace('/library');
    });
  }, [db, id]);

  if (!fontsLoaded || !workout) {
    return <View style={{ flex: 1, backgroundColor: HF.bg }} />;
  }

  const { config } = workout;
  const own = isOwn(workout, profile?.id);

  const confirmArchive = () => {
    if (!profile) return;
    Alert.alert('Archive workout?', `${config.name} will no longer be listed. Saved sessions keep showing it.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Archive',
        style: 'destructive',
        onPress: async () => {
          await archiveWorkout(db, workout.id, profile.id);
          router.dismissTo('/library');
        },
      },
    ]);
  };

  return (
    <Screen style={styles.root}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <View style={styles.tags}>
              <Text style={styles.mode}>{config.mode}</Text>
              {own && <Text style={styles.mineTag}>MINE</Text>}
            </View>
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
            <View style={styles.exerciseText}>
              <Text style={styles.exerciseName}>{ex.name}</Text>
              {ex.note != null && <Text style={styles.exerciseNote}>{ex.note}</Text>}
            </View>
            <Text style={styles.exerciseDetail}>{ex.detail}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Actions — no START here: judging starts only from workout selection */}
      <View style={styles.actions}>
        <Pressable
          onPress={() => withProfile(profile, () => router.push({ pathname: '/library/new', params: { from: workout.id } }))}
          style={({ pressed }) => [styles.actionBtn, pressed && styles.closeBtnPressed]}
        >
          <Text style={styles.actionText}>DUPLICATE</Text>
        </Pressable>
        {own && (
          <Pressable
            onPress={confirmArchive}
            style={({ pressed }) => [styles.actionBtn, styles.actionGap, pressed && styles.closeBtnPressed]}
          >
            <Text style={[styles.actionText, styles.archiveText]}>ARCHIVE</Text>
          </Pressable>
        )}
      </View>

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
  },
  tags: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  mineTag: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 9,
    color: HF.inkDim,
    letterSpacing: 2,
    borderWidth: 1,
    borderColor: HF.hairlineStrong,
    paddingHorizontal: 4,
    marginLeft: 8,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  actionBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: HF.hairlineStrong,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionGap: {
    marginLeft: 12,
  },
  actionText: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 11,
    color: HF.inkDim,
    letterSpacing: 2,
  },
  archiveText: {
    color: HF.accent,
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
  exerciseText: {
    flex: 1,
    marginRight: 12,
  },
  exerciseNote: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 11,
    color: HF.muted,
    letterSpacing: 1,
    marginTop: 2,
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
