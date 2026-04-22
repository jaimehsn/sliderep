import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureDetector } from 'react-native-gesture-handler';
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
import { WodType } from '@/constants/wods';
import { useJudge } from '@/hooks/use-judge';
import { TimerStrip } from '@/components/judge/timer-strip';
import { SideRails } from '@/components/judge/side-rails';
import { DropStrip } from '@/components/judge/drop-strip';
import { SegBar } from '@/components/judge/seg-bar';
import { HeroCounter } from '@/components/judge/hero-counter';
import { InvalidBadge } from '@/components/judge/invalid-badge';
import { EventLog } from '@/components/judge/event-log';
import { GestureFooter } from '@/components/judge/gesture-footer';

const VALID_TYPES: WodType[] = ['forTime', 'amrap', 'emom', 'chipper'];

export default function JudgeScreen() {
  const insets = useSafeAreaInsets();
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

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: HF.bg }} />;
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>

      <TimerStrip
        timerLabel={judge.timerLabel}
        timerStr={judge.timerStr}
        isRunning={judge.isRunning}
        kpi={judge.kpi}
        onPress={judge.toggleTimer}
        onLongPress={judge.resetTimer}
      />

      <GestureDetector gesture={judge.pan}>
        <View style={styles.gestureArea}>

          <SideRails railStyle={judge.railStyle} />

          {judge.lastKind != null && (
            <DropStrip key={judge.dropKey} kind={judge.lastKind} />
          )}

          <View style={styles.sectionRow}>
            <Text style={styles.sectionLabel}>{judge.sectionLabel}</Text>
          </View>

          <View style={styles.segBarWrap}>
            <SegBar items={judge.segments} />
          </View>

          <HeroCounter
            exerciseName={judge.exerciseName}
            done={judge.done}
            target={judge.target}
            hint={judge.hint}
            counterStyle={judge.counterStyle}
            crosshairStyle={judge.crosshairStyle}
            exerciseNameStyle={judge.exerciseNameStyle}
          />

          {judge.invalidSticky && <InvalidBadge />}

          <EventLog
            log={judge.log}
            repsCount={judge.repsCount}
            noRepsCount={judge.noRepsCount}
          />

          <GestureFooter />

        </View>
      </GestureDetector>

    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: HF.bg,
  },
  gestureArea: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  sectionRow: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  sectionLabel: {
    fontFamily: 'IBMPlexMono_400Regular',
    fontSize: 10,
    color: HF.muted,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  segBarWrap: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
});
