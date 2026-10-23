import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import {
  useFonts,
  BarlowCondensed_400Regular,
  BarlowCondensed_700Bold,
} from '@expo-google-fonts/barlow-condensed';
import { IBMPlexMono_400Regular } from '@expo-google-fonts/ibm-plex-mono';

import { Screen } from '@/components/screen';
import { HF } from '@/constants/hf';
import { useProfile } from '@/hooks/use-profile';
import { WodConfig } from '@/constants/wod-engine';
import { getWorkout } from '@/db/workouts';
import { getOwnSessions, StoredSession } from '@/db/sessions';
import { deriveResult } from '@/components/result/replay';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function formatDate(ms: number): string {
  const d = new Date(ms);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} · ${hh}:${mm}`;
}

export default function HistoryIndexScreen() {
  const [fontsLoaded] = useFonts({
    BarlowCondensed_400Regular,
    BarlowCondensed_700Bold,
    IBMPlexMono_400Regular,
  });
  const db = useSQLiteContext();
  const { profile, loaded: profileLoaded } = useProfile();
  const [sessions, setSessions] = useState<StoredSession[] | null>(null);
  const [configs, setConfigs] = useState<Map<string, WodConfig>>(new Map());

  useFocusEffect(
    useCallback(() => {
      if (!profileLoaded) return;
      if (!profile) {
        setSessions([]);
        return;
      }
      getOwnSessions(db, profile.id).then(async (rows) => {
        // One load per distinct workout; every saved session's workout exists (FK).
        const ids = [...new Set(rows.map((r) => r.wodId))];
        const workouts = await Promise.all(ids.map((wodId) => getWorkout(db, wodId)));
        setConfigs(new Map(workouts.flatMap((w) => (w ? [[w.id, w.config] as const] : []))));
        setSessions(rows);
      });
    }, [db, profile, profileLoaded]),
  );

  if (!fontsLoaded || !profileLoaded || sessions == null) {
    return <View style={{ flex: 1, backgroundColor: HF.bg }} />;
  }

  return (
    <Screen style={styles.root} minBottomPadding={24}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>HISTORY</Text>
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

      {sessions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No sessions yet</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {sessions.map((session, i) => {
            const config = configs.get(session.wodId);
            if (!config) return null;
            const log = session.events.map((e, idx) => ({ id: idx, ok: e.kind === 'rep', t: e.t }));
            const result = deriveResult(config, log);
            return (
              <View key={session.id}>
                <Pressable
                  onPress={() => router.push({ pathname: '/history/[id]', params: { id: session.id } })}
                  style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
                >
                  <View style={styles.cardBody}>
                    <Text style={styles.cardMode}>{config.mode}</Text>
                    <Text style={styles.cardName}>{config.name}</Text>
                    <Text style={styles.cardDesc}>{formatDate(session.createdAt)}</Text>
                  </View>
                  <View style={styles.cardRight}>
                    <Text style={styles.cardScore}>{result.scoreValue}</Text>
                    <Text style={styles.cardArrow}>›</Text>
                  </View>
                </Pressable>
                {i < sessions.length - 1 && <View style={styles.separator} />}
              </View>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: HF.bg,
  },
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
  divider: {
    height: 1,
    backgroundColor: HF.hairline,
    marginHorizontal: 24,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 11,
    color: HF.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
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
  cardRight: {
    alignItems: 'flex-end',
  },
  cardScore: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 13,
    color: HF.inkDim,
    fontVariant: ['tabular-nums'],
  },
  cardArrow: {
    fontFamily: 'BarlowCondensed_400Regular',
    fontSize: 28,
    color: HF.mutedDim,
    marginLeft: 16,
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: HF.hairline,
  },
});
