import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import {
  useFonts,
  BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold,
} from '@expo-google-fonts/barlow-condensed';
import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
} from '@expo-google-fonts/ibm-plex-mono';

import { HF } from '@/constants/hf';
import { Screen } from '@/components/screen';
import { ResultScreen } from '@/components/result/result-screen';
import { getSession, deleteSession, StoredSession } from '@/db/sessions';
import { Workout, getWorkout } from '@/db/workouts';

export default function HistoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const [session, setSession] = useState<StoredSession | null | undefined>(undefined);
  const [workout, setWorkout] = useState<Workout | null>(null);

  const [fontsLoaded] = useFonts({
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
  });

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      getSession(db, id).then(async (s) => {
        // A saved session's workout always exists (FK), archived or not.
        if (s) setWorkout(await getWorkout(db, s.wodId));
        setSession(s);
      });
    }, [db, id]),
  );

  useEffect(() => {
    // Not found — already deleted, or a stale link. Nothing to show.
    if (session === null) {
      router.replace('/history');
    }
  }, [session]);

  if (!fontsLoaded || !session || !workout) {
    return <View style={{ flex: 1, backgroundColor: HF.bg }} />;
  }

  const handleDelete = () => {
    Alert.alert(
      'Delete session?',
      'This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteSession(db, session.id);
            router.back();
          },
        },
      ],
    );
  };

  const log = session.events.map((e, i) => ({ id: i, ok: e.kind === 'rep', t: e.t }));

  return (
    <Screen style={styles.root}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
          hitSlop={12}
        >
          <Text style={styles.closeBtnText}>✕</Text>
        </Pressable>
      </View>

      <ResultScreen
        config={workout.config}
        log={log}
        athleteAlias={session.judgeAlias}
        role="judged"
        saved="own"
        sessionId={session.id}
        canAdjust={false}
      />

      <Pressable
        onPress={handleDelete}
        style={({ pressed }) => [styles.deleteBtn, pressed && styles.deleteBtnPressed]}
      >
        <Text style={styles.deleteBtnText}>DELETE SESSION</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: HF.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 12,
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
  deleteBtn: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  deleteBtnPressed: {
    opacity: 0.55,
  },
  deleteBtnText: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 12,
    color: HF.accent,
    letterSpacing: 1.5,
  },
});
