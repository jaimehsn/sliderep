import type { LogEntry } from '@/components/judge/types';
import { HF } from '@/constants/hf';
import { EngineState, WodConfig, advanceTo, apply, initial, view } from '@/constants/wod-engine';
import { useSoundCue } from '@/hooks/use-sound-cue';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

// Gesture thresholds and dot travel from the "Ghost" design (see docs/ROADMAP.md).
const SWIPE_MIN_DX = 30;
const SWIPE_MAX_MS = 900;
const TAP_MAX_DX = 12;
const TAP_MAX_MS = 500;
const DRAG_MAX = 70;

// Clock tick: only the screen waits for it — every gesture is applied at its own t.
const TICK_MS = 250;

export function useJudge(config: WodConfig) {
  const [isRunning, setIsRunning] = useState(false);
  const [dropKey, setDropKey] = useState(0);
  const [lastKind, setLastKind] = useState<'rep' | 'noRep' | null>(null);

  // Engine state on the session clock (ms since judging started, right after the
  // countdown) — the same t that stamps each event, so live = result by construction.
  const [state, setState] = useState<EngineState>(() => initial(config));
  const stateRef = useRef(state);
  const sessionStartRef = useRef<number | null>(null);
  const getT = () => Date.now() - (sessionStartRef.current ?? Date.now());

  const counterScale = useSharedValue(1);
  const invalidProgress = useSharedValue(0);
  const drag = useSharedValue(0);
  const gestureStart = useSharedValue(0);

  const playMinute = useSoundCue(require('@/assets/sounds/minute.wav'));
  const playEnd = useSoundCue(require('@/assets/sounds/end.wav'));

  // Single entry point for every state change, so sounds and the clock stop
  // follow the transition itself, whichever input caused it.
  const commit = useCallback((next: EngineState) => {
    const prev = stateRef.current;
    if (next === prev) return;
    stateRef.current = next;
    setState(next);
    if (next.finished && !prev.finished) {
      // For Time / Chipper finish silently on the last rep; AMRAP/EMOM on the clock.
      if (config.format.repeat !== 'rounds') playEnd();
      setIsRunning(false);
    } else if (next.pos.minuteIdx > prev.pos.minuteIdx) {
      playMinute();
    }
  }, [config, playMinute, playEnd]);

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => commit(advanceTo(config, stateRef.current, getT())), TICK_MS);
    return () => clearInterval(id);
  }, [isRunning, config, commit]);

  const startTimer = useCallback(() => {
    sessionStartRef.current = Date.now();
    setIsRunning(true);
  }, []);

  // Moves the clock to now first: a gesture after the clock-driven end is ignored
  // (never recorded), even if the next tick hasn't landed yet.
  const record = useCallback((ok: boolean): boolean => {
    const t = getT();
    const clocked = advanceTo(config, stateRef.current, t);
    if (clocked.finished) {
      commit(clocked);
      return false;
    }
    commit(apply(config, clocked, { t, ok }));
    return true;
  }, [config, commit]);

  const handleRep = useCallback(() => {
    if (!record(true)) return;
    setLastKind('rep');
    setDropKey((k) => k + 1);
    counterScale.value = withSequence(
      withTiming(1.045, { duration: 32 }),
      withTiming(1, { duration: 168, easing: Easing.bezier(0.2, 0.8, 0.2, 1) }),
    );
    invalidProgress.value = withTiming(0, { duration: 200 });
    Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Confirm);
  }, [record, counterScale, invalidProgress]);

  const handleNoRep = useCallback(() => {
    if (!record(false)) return;
    setLastKind('noRep');
    setDropKey((k) => k + 1);
    counterScale.value = withSequence(
      withTiming(1.045, { duration: 32 }),
      withTiming(1, { duration: 168, easing: Easing.bezier(0.2, 0.8, 0.2, 1) }),
    );
    invalidProgress.value = withTiming(1, { duration: 200 });
    Haptics.performAndroidHapticsAsync(Haptics.AndroidHaptics.Reject);
  }, [record, counterScale, invalidProgress]);

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

  const { exerciseName, target, done, kpi, timerStr, timerLabel } = view(config, state);
  // The raw input log, as saved: every recorded gesture with its session-clock t.
  const log: LogEntry[] = useMemo(() => state.tagged.map((e, i) => ({ id: i, ok: e.ok, t: e.t })), [state.tagged]);

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
    finished: state.finished,
    log,
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
