import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { LogEntry } from '@/components/judge/types';
import { Workout } from '@/db/workouts';

export type SessionRole = 'judge' | 'judged';

export type SessionSetup = {
  role: SessionRole;
  otherId: string | null;
  otherAlias: string | null;
};

export type SessionOutcome = {
  log: LogEntry[];
  startedAt: number;
  endT: number;
};

type SessionContextValue = {
  /** Written by the picker (session/wod.tsx); workouts are immutable, so this snapshot can't go stale. */
  workout: Workout | null;
  setup: SessionSetup | null;
  outcome: SessionOutcome | null;
  sessionId: string | null;
  setWorkout: (workout: Workout) => void;
  setSetup: (setup: SessionSetup) => void;
  setOutcome: (outcome: SessionOutcome) => void;
  setSessionId: (id: string | null) => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

// Scoped to app/session/_layout.tsx's lifetime: popping out of the whole
// session/ group unmounts this provider, so there's nothing to reset by hand.
export function SessionProvider({ children }: { children: ReactNode }) {
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [setup, setSetup] = useState<SessionSetup | null>(null);
  const [outcome, setOutcome] = useState<SessionOutcome | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const value = useMemo(
    () => ({ workout, setup, outcome, sessionId, setWorkout, setSetup, setOutcome, setSessionId }),
    [workout, setup, outcome, sessionId],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within a SessionProvider');
  return ctx;
}
