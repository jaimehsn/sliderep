import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import * as Haptics from 'expo-haptics';
import { WodId, getWodConfig } from '@/constants/wods';
import { HF } from '@/constants/hf';
import { judgeReducer, makeInitial, formatTime } from '@/components/judge/reducer';
import { useSoundCue } from '@/hooks/use-sound-cue';

// Gesture thresholds and dot travel from the "Ghost" design (see docs/ROADMAP.md).
const SWIPE_MIN_DX = 30;
const SWIPE_MAX_MS = 900;
const TAP_MAX_DX = 12;
const TAP_MAX_MS = 500;
const DRAG_MAX = 70;

export function useJudge(wodId: WodId) {
  const config = useMemo(() => getWodConfig(wodId), [wodId]);

  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [dropKey, setDropKey] = useState(0);
  const [lastKind, setLastKind] = useState<'rep' | 'noRep' | null>(null);
  const [awaitingFinish, setAwaitingFinish] = useState(false);

  const [judgeState, dispatch] = useReducer(judgeReducer, config, makeInitial);
  const judgeStateRef = useRef(judgeState);
  judgeStateRef.current = judgeState;

  // Session clock: ms since judging started (right after the countdown), independent
  // of the second-granularity `elapsed` counter used for the visible timer.
  const sessionStartRef = useRef<number | null>(null);
  const getT = () => Date.now() - (sessionStartRef.current ?? Date.now());

  const counterScale = useSharedValue(1);
  const invalidProgress = useSharedValue(0);
  const drag = useSharedValue(0);
  const gestureStart = useSharedValue(0);

  const playMinute = useSoundCue(require('@/assets/sounds/minute.wav'));
  const playEnd = useSoundCue(require('@/assets/sounds/end.wav'));

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  useEffect(() => {
    if (config.advanceMode !== 'onClock' || awaitingFinish || judgeState.finished) return;
    const totalMinutes = Math.ceil(config.totalSeconds / 60);
    const minuteIdx = Math.min(Math.floor(elapsed / 60), totalMinutes);
    const prev = judgeStateRef.current;
    if (minuteIdx === prev.session.minuteIdx) return;
    if (minuteIdx >= totalMinutes) {
      // Last minute just ended: freeze and wait for the judge to confirm,
      // keeping this minute's partial reps instead of resetting done to 0.
      playEnd();
      setIsRunning(false);
      setAwaitingFinish(true);
      return;
    }
    playMinute();
    dispatch({
      type: 'RESET',
      initial: {
        session: { ...prev.session, minuteIdx },
        done: 0,
        log: prev.log,
        invalidSticky: false,
        finished: false,
      },
    });
  }, [elapsed, config, playMinute, playEnd, awaitingFinish, judgeState.finished]);

  useEffect(() => {
    if (config.timerMode !== 'remaining' || config.totalSeconds <= 0) return;
    if (elapsed !== config.totalSeconds) return;
    playEnd();
    setIsRunning(false);
    setAwaitingFinish(true);
  }, [elapsed, config, playEnd]);

  // For Time / Chipper finish on the last rep (see reducer); freeze the clock there too.
  useEffect(() => {
    if (judgeState.finished) setIsRunning(false);
  }, [judgeState.finished]);

  const startTimer = useCallback(() => {
    sessionStartRef.current = Date.now();
    setIsRunning(true);
  }, []);

  const confirmFinish = useCallback(() => {
    if (!awaitingFinish) return;
    dispatch({ type: 'FINISH' });
    setAwaitingFinish(false);
  }, [awaitingFinish]);

  const handleRep = useCallback(() => {
    if (judgeStateRef.current.finished) return;
    dispatch({ type: 'REP', config, t: getT() });
    setLastKind('rep');
    setDropKey((k) => k + 1);
    counterScale.value = withSequence(
      withTiming(1.045, { duration: 32 }),
      withTiming(1, { duration: 168, easing: Easing.bezier(0.2, 0.8, 0.2, 1) }),
    );
    invalidProgress.value = withTiming(0, { duration: 200 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [config, counterScale, invalidProgress]);

  const handleNoRep = useCallback(() => {
    if (judgeStateRef.current.finished) return;
    dispatch({ type: 'NO_REP', t: getT() });
    setLastKind('noRep');
    setDropKey((k) => k + 1);
    counterScale.value = withSequence(
      withTiming(1.045, { duration: 32 }),
      withTiming(1, { duration: 168, easing: Easing.bezier(0.2, 0.8, 0.2, 1) }),
    );
    invalidProgress.value = withTiming(1, { duration: 200 });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, [counterScale, invalidProgress]);

  // Swipe right = rep, swipe left = no-rep, quick tap = rep; anything slower or shorter is ignored.
  const pan = Gesture.Pan()
    .onBegin(() => {
      'worklet';
      gestureStart.value = Date.now();
    })
    .onUpdate((evt) => {
      'worklet';
      drag.value = Math.max(-DRAG_MAX, Math.min(DRAG_MAX, evt.translationX));
    })
    .onEnd((evt) => {
      'worklet';
      if (Date.now() - gestureStart.value >= SWIPE_MAX_MS) return;
      if (evt.translationX < -SWIPE_MIN_DX) scheduleOnRN(handleNoRep);
      else if (evt.translationX > SWIPE_MIN_DX) scheduleOnRN(handleRep);
    })
    .onFinalize(() => {
      'worklet';
      drag.value = withTiming(0, { duration: 300, easing: Easing.bezier(0.2, 0.8, 0.2, 1) });
    });

  const tap = Gesture.Tap()
    .maxDuration(TAP_MAX_MS)
    .maxDistance(TAP_MAX_DX)
    .onEnd((_evt, success) => {
      'worklet';
      if (success) scheduleOnRN(handleRep);
    });

  const gesture = Gesture.Exclusive(pan, tap);

  const { session, done } = judgeState;
  const target = config.getTarget(session);
  const exerciseName = judgeState.finished
    ? 'DONE'
    : awaitingFinish
      ? 'TIME'
      : config.getExerciseName(session);
  const kpi = config.getKpi(session);

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

  const exerciseNameStyle = useAnimatedStyle(() => ({
    color: interpolateColor(invalidProgress.value, [0, 1], [HF.ink, HF.accent]),
  }));

  const railStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(invalidProgress.value, [0, 1], [HF.hairlineStrong, HF.accent]),
  }));

  const dotStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(invalidProgress.value, [0, 1], [HF.muted, HF.accent]),
  }));

  return {
    startTimer,
    timerStr,
    timerLabel,
    done,
    target,
    exerciseName,
    kpi,
    finished: judgeState.finished,
    confirmFinish,
    log: judgeState.log,
    gesture,
    drag,
    dropKey,
    lastKind,
    counterStyle,
    exerciseNameStyle,
    railStyle,
    dotStyle,
  };
}
