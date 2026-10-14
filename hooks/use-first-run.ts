import { useCallback, useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { getFirstRunDone, setFirstRunDone } from '@/db/app-state';

export function useFirstRun() {
  const db = useSQLiteContext();
  const [done, setDone] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getFirstRunDone(db).then((value) => {
      setDone(value);
      setLoaded(true);
    });
  }, [db]);

  const markDone = useCallback(async () => {
    await setFirstRunDone(db);
    setDone(true);
  }, [db]);

  return { done, loaded, markDone };
}
