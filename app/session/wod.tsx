import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/text';
import { router, useFocusEffect } from 'expo-router';

import { Screen } from '@/components/screen';
import { colors, fonts } from '@/constants/theme';
import { isOwn } from '@/db/workouts';
import { useProfile } from '@/hooks/use-profile';
import { useSession } from '@/hooks/use-session';
import { useWorkouts } from '@/hooks/use-workouts';

export default function SelectWodScreen() {
  const { workouts, loaded, refresh: refreshWorkouts } = useWorkouts();
  const { profile, refresh: refreshProfile } = useProfile();
  useFocusEffect(
    useCallback(() => {
      refreshWorkouts();
      refreshProfile();
    }, [refreshWorkouts, refreshProfile]),
  );
  const { setWorkout } = useSession();

  if (!loaded) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return (
    <Screen style={styles.root} minBottomPadding={24}>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>SELECT WORKOUT</Text>
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

      {/* WOD list */}
      <ScrollView style={styles.list} contentContainerStyle={styles.listContent} scrollIndicatorInsets={{ right: 1 }}>
        {workouts.map((workout, i) => {
          const { config } = workout;
          return (
            <View key={workout.id}>
              <Pressable
                onPress={() => {
                  setWorkout(workout);
                  router.push('/session/setup');
                }}
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

  // ── WOD list ───────────────────────────────────────────────────────────────
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
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
  separator: {
    height: 1,
    backgroundColor: colors.hairline,
  },

  // ── Dividers ───────────────────────────────────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: colors.hairline,
    marginHorizontal: 24,
  },

  // ── New WOD button ─────────────────────────────────────────────────────────
});
