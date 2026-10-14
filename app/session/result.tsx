import { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
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
import { getWodConfig } from '@/constants/wods';
import { useSession } from '@/hooks/use-session';
import { useProfile } from '@/hooks/use-profile';
import { Screen } from '@/components/screen';
import { ResultScreen } from '@/components/result/result-screen';
import { saveSession } from '@/db/sessions';

export default function ResultRouteScreen() {
  const { setup, outcome, sessionId, setSessionId } = useSession();
  const { profile, loaded: profileLoaded } = useProfile();
  const db = useSQLiteContext();
  const savedRef = useRef(false);

  const [fontsLoaded] = useFonts({
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
  });

  useEffect(() => {
    if (!setup || !outcome) {
      router.replace('/session/wod');
    }
  }, [setup, outcome]);

  const judgedAthleteId = setup == null ? null : setup.role === 'judge' ? setup.otherId : (profile?.id ?? null);
  const judgedAlias = setup == null ? '' : setup.role === 'judge' ? (setup.otherAlias ?? '') : (profile?.alias ?? '');
  const judgeId = setup == null ? null : setup.role === 'judge' ? (profile?.id ?? null) : setup.otherId;
  const judgeAlias = setup == null ? null : setup.role === 'judge' ? (profile?.alias ?? null) : setup.otherAlias;
  const savedState: 'own' | 'foreign' | 'none' =
    judgedAthleteId == null ? 'none' : judgedAthleteId === profile?.id ? 'own' : 'foreign';
  const canAdjust = setup?.role === 'judge' && judgeId != null;

  useEffect(() => {
    if (!setup || !outcome || !profileLoaded || savedRef.current || judgedAthleteId == null) return;
    savedRef.current = true;
    saveSession(db, {
      wodId: setup.wodId,
      engineVersion: getWodConfig(setup.wodId).engineVersion,
      judgedAthleteId,
      judgedAlias,
      judgeId,
      judgeAlias,
      startedAt: outcome.startedAt,
      endT: outcome.endT,
      events: outcome.log.map((e) => ({ t: e.t, kind: e.ok ? 'rep' as const : 'noRep' as const })),
    }).then(setSessionId).catch((err) => console.error('Failed to save session', err));
  }, [setup, outcome, profileLoaded, judgedAthleteId, judgedAlias, judgeId, judgeAlias, db, setSessionId]);

  if (!fontsLoaded || !profileLoaded || !setup || !outcome) {
    return <View style={{ flex: 1, backgroundColor: HF.bg }} />;
  }

  return (
    <Screen style={styles.root}>
      <ResultScreen
        config={getWodConfig(setup.wodId)}
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
});
