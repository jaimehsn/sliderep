import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import {
  Easing,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { WodType, getWodConfig } from '@/constants/wods';
import { HF } from '@/constants/hf';
import { judgeReducer, makeInitial, formatTime } from '@/components/judge/reducer';

export function useJudge(wodType: WodType) {
  const config = useMemo(() => getWodConfig(wodType), [wodType]);

  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [dropKey, setDropKey] = useState(0);
  const [lastKind, setLastKind] = useState<'rep' | 'noRep' | null>(null);

  const [judgeState, dispatch] = useReducer(judgeReducer, config, makeInitial);
  const judgeStateRef = useRef(judgeState);
  judgeStateRef.current = judgeState;

  const counterScale = useSharedValue(1);
  const crosshairWidth = useSharedValue(40);
  const invalidProgress = useSharedValue(0);

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  useEffect(() => {
    if (wodType !== 'emom' || !isRunning) return;
    const id = setInterval(() => {
      const prev = judgeStateRef.current;
      dispatch({ type: 'RESET', initial: {
        session: config.advance(prev.session),
        done: 0,
        log: prev.log,
        invalidSticky: false,
      }});
    }, 60_000);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  const handleRep = useCallback(() => {
    dispatch({ type: 'REP', config });
    setLastKind('rep');
    setDropKey((k) => k + 1);
    counterScale.value = withSequence(
      withTiming(1.08, { duration: 40, easing: Easing.out(Easing.quad) }),
      withSpring(1, { damping: 15, stiffness: 200 }),
    );
    crosshairWidth.value = withSequence(
      withTiming(120, { duration: 80 }),
      withTiming(40, { duration: 200 }),
    );
    invalidProgress.value = withTiming(0, { duration: 240 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [config, counterScale, crosshairWidth, invalidProgress]);

  const handleNoRep = useCallback(() => {
    dispatch({ type: 'NO_REP' });
    setLastKind('noRep');
    setDropKey((k) => k + 1);
    counterScale.value = withSequence(
      withTiming(1.05, { duration: 60 }),
      withSpring(1, { damping: 10, stiffness: 200 }),
    );
    invalidProgress.value = withTiming(1, { duration: 100 });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, [counterScale, invalidProgress]);

  const pan = Gesture.Pan().onEnd((evt) => {
    'worklet';
    if (evt.translationX < -20) {
      runOnJS(handleNoRep)();
    } else {
      runOnJS(handleRep)();
    }
  });

  const { session, done, log, invalidSticky } = judgeState;
  const target = config.getTarget(session);
  const exerciseName = config.getExerciseName(session);
  const kpi = config.getKpi(session);
  const sectionLabel = config.getSectionLabel(session);
  const segments = config.getSegments(session, done);
  const hint = config.getHint(session, done);
  const repsCount = log.filter((e) => e.ok).length;
  const noRepsCount = log.filter((e) => !e.ok).length;

  const timerStr = useMemo(() => {
    if (config.timerMode === 'remaining') return formatTime(Math.max(0, config.totalSeconds - elapsed));
    if (config.timerMode === 'minLeft') return formatTime(Math.max(0, 60 - (elapsed % 60)));
    return formatTime(elapsed);
  }, [config, elapsed]);

  const timerLabel =
    config.timerMode === 'remaining' ? 'remaining' :
    config.timerMode === 'minLeft'   ? 'min left'  : 'elapsed';

  const counterStyle = useAnimatedStyle(() => ({
    transform: [{ scale: counterScale.value }],
    color: interpolateColor(invalidProgress.value, [0, 1], [HF.ink, HF.accent]),
  }));

  const crosshairStyle = useAnimatedStyle(() => ({ width: crosshairWidth.value }));

  const exerciseNameStyle = useAnimatedStyle(() => ({
    color: interpolateColor(invalidProgress.value, [0, 1], [HF.ink, HF.accent]),
  }));

  const railStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(invalidProgress.value, [0, 1], [HF.hairlineStrong, HF.accent]),
  }));

  return {
    isRunning,
    startTimer: () => setIsRunning(true),
    toggleTimer: () => setIsRunning((r) => !r),
    resetTimer: () => { setElapsed(0); setIsRunning(false); },
    timerStr,
    timerLabel,
    done,
    target,
    exerciseName,
    kpi,
    sectionLabel,
    segments,
    hint,
    invalidSticky,
    log,
    repsCount,
    noRepsCount,
    pan,
    dropKey,
    lastKind,
    counterStyle,
    crosshairStyle,
    exerciseNameStyle,
    railStyle,
  };
}
