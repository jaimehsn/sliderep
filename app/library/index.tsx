import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
import { router, useFocusEffect } from 'expo-router';

import { withProfile } from '@/components/editor/profile-gate';
import { Screen } from '@/components/screen';
import { colors, fonts } from '@/constants/theme';
import { EXERCISE_CATEGORIES } from '@/db/exercises';
import { isOwn } from '@/db/workouts';
import { useExercises } from '@/hooks/use-exercises';
import { useProfile } from '@/hooks/use-profile';
import { useWorkouts } from '@/hooks/use-workouts';

export default function LibraryIndexScreen() {
  const { workouts, loaded: workoutsLoaded, refresh: refreshWorkouts } = useWorkouts();
  const { profile, refresh: refreshProfile } = useProfile();
  useFocusEffect(
    useCallback(() => {
      refreshWorkouts();
      refreshProfile();
    }, [refreshWorkouts, refreshProfile]),
  );
  const { exercises, loaded: exercisesLoaded } = useExercises();

  if (!workoutsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return (
    <Screen style={styles.root} minBottomPadding={24}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>LIBRARY</Text>
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

      {/* Workouts */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        scrollIndicatorInsets={{ right: 1 }}
      >
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>WORKOUTS</Text>
          <Pressable
            onPress={() => withProfile(profile, () => router.push('/library/new'))}
            style={({ pressed }) => [styles.newBtn, pressed && styles.cardPressed]}
            hitSlop={8}
          >
            <Text style={styles.newBtnText}>+ NEW</Text>
          </Pressable>
        </View>
        {workouts.map((workout, i) => {
          const { id, config } = workout;
          return (
            <View key={id}>
              <Pressable
                onPress={() => router.push({ pathname: '/library/[id]', params: { id } })}
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              >
                <View style={styles.cardBody}>
                  <View style={styles.cardTags}>
                    <Text style={styles.cardMode}>{config.mode}</Text>
                    {isOwn(workout, profile?.id) && <Text style={styles.mineTag}>MINE</Text>}
                  </View>
                  <Text style={styles.cardName}>{config.name}</Text>
                  <Text style={styles.cardDesc}>{config.description}</Text>
                </View>
                <Text style={styles.cardArrow}>›</Text>
              </Pressable>
              {i < workouts.length - 1 && <View style={styles.separator} />}
            </View>
          );
        })}

        {exercisesLoaded && (
          <>
            <Text style={[styles.sectionLabel, styles.exercisesLabel]}>EXERCISES</Text>
            {EXERCISE_CATEGORIES.map((category) => {
              const group = exercises.filter((e) => e.category === category);
              if (group.length === 0) return null;
              return (
                <View key={category}>
                  <Text style={styles.categoryLabel}>{category}</Text>
                  {group.map((exercise, i) => (
                    <View key={exercise.id}>
                      <View style={styles.exerciseRow}>
                        <Text style={styles.exerciseName}>{exercise.name}</Text>
                      </View>
                      {i < group.length - 1 && <View style={styles.separator} />}
                    </View>
                  ))}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>

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
    paddingTop: 20,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: fonts.ui,
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  closeBtn: {
    marginLeft: 16,
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

  // ── Dividers ───────────────────────────────────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: colors.hairline,
    marginHorizontal: 24,
  },

  // ── Lists ──────────────────────────────────────────────────────────────────
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  sectionLabel: {
    fontFamily: fonts.ui,
    fontSize: 10,
    color: colors.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  newBtn: {
    borderWidth: 1,
    borderColor: colors.hairlineStrong,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  newBtnText: {
    fontFamily: fonts.ui,
    fontSize: 10,
    color: colors.inkDim,
    letterSpacing: 1.5,
  },
  cardTags: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
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
    exercisesLabel: {
    marginTop: 24,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  cardPressed: {
    opacity: 0.5,
  },
  cardBody: {
    flex: 1,
  },
  cardMode: {
    fontFamily: fonts.ui,
    fontSize: 9,
    color: colors.accent,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  cardName: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.ink,
    letterSpacing: 2,
    textTransform: 'uppercase',
    lineHeight: 28,
  },
  cardDesc: {
    fontFamily: fonts.ui,
    fontSize: 10,
    color: colors.muted,
    letterSpacing: 1,
    marginTop: 4,
  },
  cardArrow: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.mutedDim,
    marginLeft: 16,
  },
  categoryLabel: {
    fontFamily: fonts.ui,
    fontSize: 9,
    color: colors.accent,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 2,
  },
  exerciseRow: {
    paddingVertical: 14,
  },
  exerciseName: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.ink,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  separator: {
    height: 1,
    backgroundColor: colors.hairline,
  },
});
