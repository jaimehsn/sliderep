import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import {
  useFonts,
  BarlowCondensed_400Regular,
  BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold,
} from '@expo-google-fonts/barlow-condensed';
import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
} from '@expo-google-fonts/ibm-plex-mono';

import { HF } from '@/constants/hf';
import { WodId, WOD_IDS, getWodConfig } from '@/constants/wods';
import { STUB_PROFILE } from '@/constants/profile';
import { useJudge } from '@/hooks/use-judge';
import { Screen } from '@/components/screen';
import { StartOverlay } from '@/components/judge/start-overlay';
import { JudgeHeader } from '@/components/judge/judge-header';
import { ExerciseName } from '@/components/judge/exercise-name';
import { SwipeBand } from '@/components/judge/swipe-band';
import { CountReadout } from '@/components/judge/count-readout';
import { SideRails } from '@/components/judge/side-rails';
import { ResultScreen } from '@/components/result/result-screen';
import { saveSession } from '@/db/sessions';

export default function JudgeScreen() {
  const { id, role, otherId, otherAlias } = useLocalSearchParams<{
    id: string;
    role?: string;
    otherId?: string;
    otherAlias?: string;
  }>();
  const wodId: WodId = WOD_IDS.includes(id as WodId) ? (id as WodId) : 'fran';
  const resolvedRole: 'judge' | 'judged' = role === 'judged' ? 'judged' : 'judge';
  const otherIdResolved = otherId ? otherId : null;
  const otherAliasResolved = otherAlias ? otherAlias : null;
  const needsSetup = role !== 'judge' && role !== 'judged';

  const judgedAthleteId = resolvedRole === 'judge' ? otherIdResolved : STUB_PROFILE.athleteId;
  const judgedAlias = resolvedRole === 'judge' ? (otherAliasResolved ?? '') : STUB_PROFILE.alias;
  const judgeId = resolvedRole === 'judge' ? STUB_PROFILE.athleteId : otherIdResolved;
  const savedState: 'own' | 'foreign' | 'none' =
    judgedAthleteId == null ? 'none' : judgedAthleteId === STUB_PROFILE.athleteId ? 'own' : 'foreign';

  const [fontsLoaded] = useFonts({
    BarlowCondensed_400Regular,
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
  });

  const db = useSQLiteContext();
  const judge = useJudge(wodId);
  const [phase, setPhase] = useState<'ready' | 'judging'>('ready');
  const startedAtRef = useRef<number | null>(null);
  const savedRef = useRef(false);

  useEffect(() => {
    if (needsSetup) {
      router.replace({ pathname: '/session/setup', params: { wodId: id } });
    }
  }, [needsSetup, id]);

  useEffect(() => {
    if (!judge.finished || savedRef.current || judgedAthleteId == null) return;
    savedRef.current = true;
    saveSession(db, {
      wodId,
      engineVersion: getWodConfig(wodId).engineVersion,
      judgedAthleteId,
      judgedAlias,
      judgeId,
      startedAt: startedAtRef.current ?? Date.now(),
      endT: judge.log.at(-1)?.t ?? 0,
      events: judge.log.map((e) => ({ t: e.t, kind: e.ok ? 'rep' as const : 'noRep' as const })),
    }).catch((err) => console.error('Failed to save session', err));
  }, [judge.finished, judgedAthleteId, judgedAlias, judgeId, wodId, judge.log, db]);

  if (!fontsLoaded || needsSetup) {
    return <View style={{ flex: 1, backgroundColor: HF.bg }} />;
  }

  if (phase === 'ready') {
    return (
      <Screen style={styles.root} minBottomPadding={24}>
        <StartOverlay
          config={getWodConfig(wodId)}
          athleteAlias={otherAliasResolved}
          role={resolvedRole}
          onDone={() => { startedAtRef.current = Date.now(); setPhase('judging'); judge.startTimer(); }}
        />
      </Screen>
    );
  }

  if (judge.finished) {
    return (
      <Screen style={styles.root}>
        <ResultScreen
          config={getWodConfig(wodId)}
          log={judge.log}
          athleteAlias={otherAliasResolved}
          role={resolvedRole}
          saved={savedState}
        />
      </Screen>
    );
  }

  return (
    <Screen style={styles.root}>
      <SideRails railStyle={judge.railStyle} kind={judge.lastKind} dropKey={judge.dropKey} />

      <JudgeHeader timerLabel={judge.timerLabel} timerStr={judge.timerStr} kpi={judge.kpi} />

      <Pressable style={styles.exerciseZone} onPress={judge.confirmFinish}>
        <ExerciseName name={judge.exerciseName} animatedStyle={judge.exerciseNameStyle} />
      </Pressable>

      <SwipeBand
        gesture={judge.gesture}
        drag={judge.drag}
        dotColorStyle={judge.dotStyle}
        kind={judge.lastKind}
        dropKey={judge.dropKey}
      />

      <View style={styles.countZone}>
        <CountReadout done={judge.done} target={judge.target} counterStyle={judge.counterStyle} />
      </View>
    </Screen>
  );
}

// Proportions of the "Ghost" design (360×740): header 140 · exercise 92 · band 220 · count 288.
// Header and band are fixed; the two zones around the band share the rest of the height.
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: HF.bg,
  },
  exerciseZone: {
    flex: 92,
  },
  countZone: {
    flex: 288,
  },
});
