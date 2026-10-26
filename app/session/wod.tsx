import { useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import {
  useFonts,
  BarlowCondensed_400Regular,
  BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold,
} from '@expo-google-fonts/barlow-condensed';
import { IBMPlexMono_400Regular } from '@expo-google-fonts/ibm-plex-mono';

import { Screen } from '@/components/screen';
import { HF } from '@/constants/hf';
import { isOwn } from '@/db/workouts';
import { useProfile } from '@/hooks/use-profile';
import { useSession } from '@/hooks/use-session';
import { useWorkouts } from '@/hooks/use-workouts';

export default function SelectWodScreen() {
  const [fontsLoaded] = useFonts({
    BarlowCondensed_400Regular,
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    IBMPlexMono_400Regular,
  });
  const { workouts, loaded, refresh: refreshWorkouts } = useWorkouts();
  const { profile, refresh: refreshProfile } = useProfile();
  useFocusEffect(
    useCallback(() => {
      refreshWorkouts();
      refreshProfile();
    }, [refreshWorkouts, refreshProfile]),
  );
  const { setWorkout } = useSession();

  if (!fontsLoaded || !loaded) {
    return <View style={{ flex: 1, backgroundColor: HF.bg }} />;
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
    backgroundColor: HF.bg,
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
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 11,
    color: HF.muted,
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
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 18,
    color: HF.muted,
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
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 9,
    color: HF.accent,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  cardTags: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
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
  cardName: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 28,
    color: HF.ink,
    letterSpacing: 2,
    textTransform: 'uppercase',
    lineHeight: 28,
  },
  cardDesc: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 10,
    color: HF.muted,
    letterSpacing: 1,
    marginTop: 4,
  },
  cardArrow: {
    fontFamily: 'BarlowCondensed_400Regular',
    fontSize: 28,
    color: HF.mutedDim,
    marginLeft: 16,
  },
  separator: {
    height: 1,
    backgroundColor: HF.hairline,
  },

  // ── Dividers ───────────────────────────────────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: HF.hairline,
    marginHorizontal: 24,
  },

  // ── New WOD button ─────────────────────────────────────────────────────────
});
