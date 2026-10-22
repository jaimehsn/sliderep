import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import {
  useFonts,
  BarlowCondensed_400Regular,
  BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold,
} from '@expo-google-fonts/barlow-condensed';
import { IBMPlexMono_400Regular } from '@expo-google-fonts/ibm-plex-mono';

import { Screen } from '@/components/screen';
import { HF } from '@/constants/hf';
import { WOD_IDS, WOD_DESCRIPTIONS, getWodConfig } from '@/constants/wods';
import { EXERCISE_CATEGORIES } from '@/db/exercises';
import { useExercises } from '@/hooks/use-exercises';

export default function LibraryIndexScreen() {
  const [fontsLoaded] = useFonts({
    BarlowCondensed_400Regular,
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    IBMPlexMono_400Regular,
  });
  const { exercises, loaded: exercisesLoaded } = useExercises();

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: HF.bg }} />;
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
        <Text style={styles.sectionLabel}>WORKOUTS</Text>
        {WOD_IDS.map((id, i) => {
          const config = getWodConfig(id);
          return (
            <View key={id}>
              <Pressable
                onPress={() => router.push({ pathname: '/library/[id]', params: { id } })}
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              >
                <View style={styles.cardBody}>
                  <Text style={styles.cardMode}>{config.mode}</Text>
                  <Text style={styles.cardName}>{config.name}</Text>
                  <Text style={styles.cardDesc}>{WOD_DESCRIPTIONS[id]}</Text>
                </View>
                <Text style={styles.cardArrow}>›</Text>
              </Pressable>
              {i < WOD_IDS.length - 1 && <View style={styles.separator} />}
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

  // ── Dividers ───────────────────────────────────────────────────────────────
  divider: {
    height: 1,
    backgroundColor: HF.hairline,
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
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 10,
    color: HF.muted,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
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
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 9,
    color: HF.accent,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
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
  categoryLabel: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 9,
    color: HF.accent,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 2,
  },
  exerciseRow: {
    paddingVertical: 14,
  },
  exerciseName: {
    fontFamily: 'BarlowCondensed_600SemiBold',
    fontSize: 18,
    color: HF.ink,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  separator: {
    height: 1,
    backgroundColor: HF.hairline,
  },
});
