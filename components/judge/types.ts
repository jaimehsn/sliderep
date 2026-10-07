import { WodConfig, WodSession } from '@/constants/wods';

export type LogEntry = { id: number; ok: boolean; t: number };

export type JudgeState = {
  session: WodSession;
  done: number;
  log: LogEntry[];
  invalidSticky: boolean;
  finished: boolean;
};

export type JudgeAction =
  | { type: 'REP'; config: WodConfig; t: number }
  | { type: 'NO_REP'; t: number }
  | { type: 'FINISH' }
  | { type: 'RESET'; initial: JudgeState };
