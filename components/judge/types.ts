import { WodConfig, WodSession } from '@/constants/wods';

export type LogEntry = { id: number; ok: boolean };

export type JudgeState = {
  session: WodSession;
  done: number;
  log: LogEntry[];
  invalidSticky: boolean;
};

export type JudgeAction =
  | { type: 'REP'; config: WodConfig }
  | { type: 'NO_REP' }
  | { type: 'RESET'; initial: JudgeState };
