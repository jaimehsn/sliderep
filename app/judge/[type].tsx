import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
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
import { WodType, getWodConfig } from '@/constants/wods';
import { useJudge } from '@/hooks/use-judge';
import { Screen } from '@/components/screen';
import { StartOverlay } from '@/components/judge/start-overlay';
import { JudgeHeader } from '@/components/judge/judge-header';
import { ExerciseName } from '@/components/judge/exercise-name';
import { SwipeBand } from '@/components/judge/swipe-band';
import { CountReadout } from '@/components/judge/count-readout';
import { SideRails } from '@/components/judge/side-rails';
import { ResultScreen } from '@/components/result/result-screen';

const VALID_TYPES: WodType[] = ['forTime', 'amrap', 'emom', 'chipper'];

export default function JudgeScreen() {
  const { type } = useLocalSearchParams<{ type: string }>();
  const wodType: WodType = VALID_TYPES.includes(type as WodType) ? (type as WodType) : 'forTime';

  const [fontsLoaded] = useFonts({
    BarlowCondensed_400Regular,
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
  });

  const judge = useJudge(wodType);
  const [phase, setPhase] = useState<'ready' | 'judging'>('ready');

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: HF.bg }} />;
  }

  if (phase === 'ready') {
    return (
      <Screen style={styles.root} minBottomPadding={24}>
        <StartOverlay
          config={getWodConfig(wodType)}
          onDone={() => { setPhase('judging'); judge.startTimer(); }}
        />
      </Screen>
    );
  }

  if (judge.finished) {
    return (
      <Screen style={styles.root}>
        <ResultScreen config={getWodConfig(wodType)} log={judge.log} />
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
