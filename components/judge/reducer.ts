import { WodConfig, WodType } from '@/constants/wods';
import { JudgeAction, JudgeState, LogEntry } from './types';

export function judgeReducer(state: JudgeState, action: JudgeAction): JudgeState {
  switch (action.type) {
    case 'REP': {
      const target = action.config.getTarget(state.session);
      const newDone = state.done + 1;
      const newLog: LogEntry[] = [...state.log, { id: Date.now() + Math.random(), ok: true }];
      if (newDone >= target && !action.config.isComplete(state.session)) {
        return { session: action.config.advance(state.session), done: 0, log: newLog, invalidSticky: false };
      }
      return { ...state, done: Math.min(newDone, target), log: newLog, invalidSticky: false };
    }
    case 'NO_REP':
      return { ...state, log: [...state.log, { id: Date.now() + Math.random(), ok: false }], invalidSticky: true };
    case 'RESET':
      return action.initial;
  }
}

export function makeInitial(config: WodConfig): JudgeState {
  return { session: config.initialSession, done: 0, log: [], invalidSticky: false };
}

export function formatTime(seconds: number): string {
  const s = Math.abs(seconds);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export const WOD_TYPES: { key: WodType; label: string }[] = [
  { key: 'forTime', label: 'FOR TIME' },
  { key: 'amrap',   label: 'AMRAP' },
  { key: 'emom',    label: 'EMOM' },
  { key: 'chipper', label: 'CHIPPER' },
];
