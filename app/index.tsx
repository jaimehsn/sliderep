import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  useFonts,
  BarlowCondensed_400Regular,
  BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold,
} from '@expo-google-fonts/barlow-condensed';
import { IBMPlexMono_400Regular } from '@expo-google-fonts/ibm-plex-mono';

import { HF } from '@/constants/hf';
import { WodType, getWodConfig } from '@/constants/wods';

const WOD_KEYS: WodType[] = ['forTime', 'amrap', 'emom', 'chipper'];

const WOD_DESCRIPTIONS: Record<WodType, string> = {
  forTime: '21-15-9 · thrusters + pull-ups',
  amrap:   '12 min · pull-ups, push-ups, air squats',
  emom:    '10 min · burpees + kb swings',
  chipper: '10 estaciones · 50 reps c/u',
};

export default function WodSelectScreen() {
  const insets = useSafeAreaInsets();

  const [fontsLoaded] = useFonts({
    BarlowCondensed_400Regular,
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    IBMPlexMono_400Regular,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: HF.bg }} />;
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: Math.max(insets.bottom, 24) }]}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.appName}>SLIDEREP</Text>
        <Text style={styles.subtitle}>selecciona un entrenamiento</Text>
      </View>

      <View style={styles.divider} />

      {/* WOD list */}
      <View style={styles.list}>
        {WOD_KEYS.map((key, i) => {
          const config = getWodConfig(key);
          return (
            <View key={key}>
              <Pressable
                onPress={() => router.push(`/judge/${key}`)}
                style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              >
                <View style={styles.cardBody}>
                  <Text style={styles.cardMode}>{config.mode}</Text>
                  <Text style={styles.cardName}>{config.name}</Text>
                  <Text style={styles.cardDesc}>{WOD_DESCRIPTIONS[key]}</Text>
                </View>
                <Text style={styles.cardArrow}>›</Text>
              </Pressable>
              {i < WOD_KEYS.length - 1 && <View style={styles.separator} />}
            </View>
          );
        })}
      </View>

      <View style={styles.divider} />

      {/* New WOD — placeholder para más adelante */}
      <Pressable style={styles.newWodBtn} disabled>
        <View>
          <Text style={styles.newWodLabel}>+ NUEVO ENTRENAMIENTO</Text>
          <Text style={styles.newWodSub}>próximamente</Text>
        </View>
      </Pressable>

    </View>
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
  appName: {
    fontFamily: 'BarlowCondensed_700Bold',
    fontSize: 32,
    color: HF.ink,
    letterSpacing: 6,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 10,
    color: HF.muted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 4,
  },

  // ── WOD list ───────────────────────────────────────────────────────────────
  list: {
    flex: 1,
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
  newWodBtn: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    opacity: 0.3,
  },
  newWodLabel: {
    fontFamily: 'BarlowCondensed_600SemiBold',
    fontSize: 14,
    color: HF.ink,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  newWodSub: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 9,
    color: HF.muted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginTop: 2,
  },
});
