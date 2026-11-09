import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { withProfile } from '@/components/editor/profile-gate';
import { Screen } from '@/components/screen';
import { colors, fonts } from '@/constants/theme';
import { WorkoutBreakdown } from '@/components/workout-breakdown';
import { durationLine } from '@/constants/wod-engine';
import { Workout, archiveWorkout, getWorkout, isOwn } from '@/db/workouts';
import { useProfile } from '@/hooks/use-profile';

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

  useEffect(() => {
    getWorkout(db, id).then((w) => {
      setWorkout(w);
      if (!w) router.replace('/library');
    });
  }, [db, id]);

  if (!workout) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
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
            {durationLine(config) != null && (
              <Text style={styles.duration}>{durationLine(config)}</Text>
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
        <WorkoutBreakdown config={config} />
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
    backgroundColor: colors.bg,
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
  },
  tags: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  mineTag: {
    fontFamily: fonts.ui,
    fontSize: 9,
    color: colors.inkDim,
    letterSpacing: 2,
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
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
    borderColor: colors.hairlineStrong,
    paddingVertical: 14,
    alignItems: 'center',
  },
  actionGap: {
    marginLeft: 12,
  },
  actionText: {
    fontFamily: fonts.ui,
    fontSize: 11,
    color: colors.inkDim,
    letterSpacing: 2,
  },
  archiveText: {
    color: colors.accent,
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

  divider: {
    height: 1,
    backgroundColor: colors.hairline,
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
});
