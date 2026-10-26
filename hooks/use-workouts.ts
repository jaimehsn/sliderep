import { useCallback, useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { Workout, listWorkouts } from '@/db/workouts';

export function useWorkouts() {
  const db = useSQLiteContext();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Lists stay mounted under the editor and the detail screen, so they call this
  // on focus to pick up workouts created or archived there.
  const refresh = useCallback(async () => {
    setWorkouts(await listWorkouts(db));
    setLoaded(true);
  }, [db]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { workouts, loaded, refresh };
}
