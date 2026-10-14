import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, BackHandler, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
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
import { useJudge } from '@/hooks/use-judge';
import { useSession } from '@/hooks/use-session';
import { Screen } from '@/components/screen';
import { StartOverlay } from '@/components/judge/start-overlay';
import { JudgeHeader } from '@/components/judge/judge-header';
import { ExerciseName } from '@/components/judge/exercise-name';
import { SwipeBand } from '@/components/judge/swipe-band';
import { CountReadout } from '@/components/judge/count-readout';
import { SideRails } from '@/components/judge/side-rails';

export default function RunScreen() {
  const { setup, setOutcome } = useSession();

  const [fontsLoaded] = useFonts({
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
  });

  const judge = useJudge(setup?.wodId ?? 'fran');
  const [phase, setPhase] = useState<'ready' | 'judging'>('ready');
  const startedAtRef = useRef<number | null>(null);
  const outcomeSetRef = useRef(false);

  const handleAbort = useCallback(() => {
    Alert.alert(
      'Abort session?',
      'Data will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Abort', style: 'destructive', onPress: () => router.back() },
      ],
    );
  }, []);

  useEffect(() => {
    if (!setup) {
      router.replace('/session/wod');
    }
  }, [setup]);

  useEffect(() => {
    if (phase !== 'judging' || judge.finished) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleAbort();
      return true;
    });
    return () => sub.remove();
  }, [phase, judge.finished, handleAbort]);

  useEffect(() => {
    if (!judge.finished || outcomeSetRef.current) return;
    outcomeSetRef.current = true;
    setOutcome({
      log: judge.log,
      startedAt: startedAtRef.current ?? Date.now(),
      endT: judge.log.at(-1)?.t ?? 0,
    });
    router.replace('/session/result');
  }, [judge.finished, judge.log, setOutcome]);

  if (!fontsLoaded || !setup) {
    return <View style={{ flex: 1, backgroundColor: HF.bg }} />;
  }

  const config = getWodConfig(setup.wodId);

  if (phase === 'ready') {
    return (
      <Screen style={styles.root} minBottomPadding={24}>
        <StartOverlay
          config={config}
          athleteAlias={setup.otherAlias}
          role={setup.role}
          onDone={() => { startedAtRef.current = Date.now(); setPhase('judging'); judge.startTimer(); }}
        />
      </Screen>
    );
  }

  return (
    <Screen style={styles.root}>
      <SideRails railStyle={judge.railStyle} kind={judge.lastKind} dropKey={judge.dropKey} />

      <JudgeHeader
        timerLabel={judge.timerLabel}
        timerStr={judge.timerStr}
        kpi={judge.kpi}
        onAbortPress={handleAbort}
      />

      <View style={styles.exerciseZone}>
        <ExerciseName name={judge.exerciseName} animatedStyle={judge.exerciseNameStyle} />
      </View>

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
