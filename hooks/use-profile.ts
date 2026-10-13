import { useCallback, useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { AthleteProfile, getProfile } from '@/db/profile';

export function useProfile() {
  const db = useSQLiteContext();
  const [profile, setProfile] = useState<AthleteProfile | null>(null);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    setProfile(await getProfile(db));
    setLoaded(true);
  }, [db]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { profile, loaded, refresh };
}
