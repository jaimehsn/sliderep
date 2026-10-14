import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { WodId } from '@/constants/wods';
import { LogEntry } from '@/components/judge/types';

export type SessionRole = 'judge' | 'judged';

export type SessionSetup = {
  wodId: WodId;
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
  setup: SessionSetup | null;
  outcome: SessionOutcome | null;
  sessionId: string | null;
  setSetup: (setup: SessionSetup) => void;
  setOutcome: (outcome: SessionOutcome) => void;
  setSessionId: (id: string | null) => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

// Scoped to app/session/_layout.tsx's lifetime: popping out of the whole
// session/ group unmounts this provider, so there's nothing to reset by hand.
export function SessionProvider({ children }: { children: ReactNode }) {
  const [setup, setSetup] = useState<SessionSetup | null>(null);
  const [outcome, setOutcome] = useState<SessionOutcome | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const value = useMemo(
    () => ({ setup, outcome, sessionId, setSetup, setOutcome, setSessionId }),
    [setup, outcome, sessionId],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within a SessionProvider');
  return ctx;
}
