import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
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
import { useSession } from '@/hooks/use-session';
import { useProfile } from '@/hooks/use-profile';
import { Screen } from '@/components/screen';
import { ResultScreen } from '@/components/result/result-screen';
import { saveSession } from '@/db/sessions';

export default function ResultRouteScreen() {
  const { workout, setup, outcome, sessionId, setSessionId } = useSession();
  const { profile, loaded: profileLoaded } = useProfile();
  const db = useSQLiteContext();
  const savedRef = useRef(false);
  const [saveStatus, setSaveStatus] = useState<'pending' | 'saved' | 'failed'>('pending');

  const [fontsLoaded] = useFonts({
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
  });

  useEffect(() => {
    if (!workout || !setup || !outcome) {
      router.replace('/session/wod');
    }
  }, [workout, setup, outcome]);

  const judgedAthleteId = setup == null ? null : setup.role === 'judge' ? setup.otherId : (profile?.id ?? null);
  const judgedAlias = setup == null ? '' : setup.role === 'judge' ? (setup.otherAlias ?? '') : (profile?.alias ?? '');
  const judgeId = setup == null ? null : setup.role === 'judge' ? (profile?.id ?? null) : setup.otherId;
  const judgeAlias = setup == null ? null : setup.role === 'judge' ? (profile?.alias ?? null) : setup.otherAlias;
  // The banner follows the real save outcome: an anonymous judged athlete is
  // never saved ('none'), otherwise it waits for saveSession to settle.
  const savedState: 'own' | 'foreign' | 'none' | 'saving' | 'failed' =
    judgedAthleteId == null ? 'none' :
    saveStatus === 'pending' ? 'saving' :
    saveStatus === 'failed' ? 'failed' :
    judgedAthleteId === profile?.id ? 'own' : 'foreign';
  const canAdjust = setup?.role === 'judge' && judgeId != null;

  useEffect(() => {
    if (!workout || !setup || !outcome || !profileLoaded || savedRef.current || judgedAthleteId == null) return;
    savedRef.current = true;
    saveSession(db, {
      wodId: workout.id,
      engineVersion: workout.config.engineVersion,
      judgedAthleteId,
      judgedAlias,
      judgeId,
      judgeAlias,
      startedAt: outcome.startedAt,
      endT: outcome.endT,
      events: outcome.log.map((e) => ({ t: e.t, kind: e.ok ? 'rep' as const : 'noRep' as const })),
    })
      .then((id) => {
        setSessionId(id);
        setSaveStatus('saved');
      })
      .catch((err) => {
        console.error('Failed to save session', err);
        setSaveStatus('failed');
      });
  }, [workout, setup, outcome, profileLoaded, judgedAthleteId, judgedAlias, judgeId, judgeAlias, db, setSessionId]);

  if (!fontsLoaded || !profileLoaded || !workout || !setup || !outcome) {
    return <View style={{ flex: 1, backgroundColor: HF.bg }} />;
  }

  return (
    <Screen style={styles.root}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.dismissTo('/')}
          style={({ pressed }) => [styles.closeBtn, pressed && styles.closeBtnPressed]}
          hitSlop={12}
        >
          <Text style={styles.closeBtnText}>✕</Text>
        </Pressable>
      </View>
      <ResultScreen
        config={workout.config}
        log={outcome.log}
        athleteAlias={setup.otherAlias}
        role={setup.role}
        saved={savedState}
        sessionId={sessionId}
        canAdjust={canAdjust}
      />
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
});
